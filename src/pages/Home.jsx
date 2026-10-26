import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CommunityCard, MaterialCard, OpenClassModal, RoomRow, TrainingModal, TrainingRow } from '../components/cards.jsx';
import { GyeonggiMap } from '../components/charts.jsx';
import Icon from '../components/Icon.jsx';
import { Avatar, Chip, Panel, Tabs, num, shortDate } from '../components/ui.jsx';
import { BADGES, COMMUNITIES, LEVELS, MATERIALS, ME, OPEN_CLASSES, ROOMS, TODAY, TRAININGS, WORRIES, WORRY_TAGS } from '../data/seed.js';
import { uid, useStore } from '../store.jsx';

export function BadgeHex({ name, stage, got = true, size = 64 }) {
  const tone = { 배움: 'blue', 나눔: 'orange', 동행: 'green' }[stage] ?? 'ink';
  const icon = { 배움: 'book', 나눔: 'heart', 동행: 'users' }[stage] ?? 'award';
  return (
    <figure className={`hex ${got ? '' : 'is-locked'}`} title={name}>
      <svg viewBox="0 0 64 70" width={size} height={size * 70 / 64} aria-hidden>
        <path d="M32 3 59 18.5v33L32 67 5 51.5v-33Z" className={`hex__bg fill-${got ? tone : 'locked'}`} />
        <path d="M32 9.5 53.5 22v26L32 60.5 10.5 48V22Z" className="hex__inner" />
      </svg>
      <span className="hex__icon"><Icon name={got ? icon : 'lock'} size={size * 0.34} stroke={2} /></span>
      <figcaption>{name}</figcaption>
    </figure>
  );
}

function HomeWorry({ w }) {
  const st = useStore();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const list = [...w.comments, ...(st.s.worryComments[w.id] ?? [])];
  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    st.patch((s) => ({ worryComments: { ...s.worryComments, [w.id]: [...(s.worryComments[w.id] ?? []), { id: uid('k'), author: ME.name, date: TODAY, body: text.trim(), helpful: 0 }] } }));
    st.award('상호작용', 5, '고민에 답변 남김');
    setText('');
    st.toast('답변을 남겼어요');
  };
  return (
    <div className={`hworry ${open ? 'is-open' : ''}`}>
      <button className="hworry__row" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Avatar name={w.author} size={34} />
        <span className="hworry__main">
          <span className="hworry__title"><b>{w.title}</b><Chip tone={w.solved ? 'green' : 'orange'}>{w.solved ? '해결됨' : `답변 ${list.length}`}</Chip></span>
          <span className="hworry__text">{w.body}</span>
          <span className="hworry__meta"><Icon name="heart" size={13} />{w.likes} <Icon name="message" size={13} />{list.length} <i /> {shortDate(w.date)}</span>
        </span>
        <Icon name="down" size={16} className="hworry__chev" />
      </button>
      {open && (
        <div className="hworry__thread">
          {list.slice(-2).map((c) => (
            <div key={c.id} className="hworry__c"><b>{c.author}{c.badge && <Chip tone="purple">{c.badge}</Chip>}</b><span>{c.body}</span></div>
          ))}
          <form onSubmit={send} className="inline-form">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="따뜻한 한마디를 남겨 주세요" aria-label="답변 입력" />
            <button className="btn btn--sm btn--green" type="submit"><Icon name="send" size={14} />답변</button>
          </form>
          <Link className="more" to={`/together/worries/${w.id}`}>전체 답변 보기 <Icon name="right" size={13} /></Link>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const st = useStore();
  const { s } = st;
  const [lvl, setLvl] = useState('전체');
  const [sel, setSel] = useState(null);
  const [cls, setCls] = useState(null);
  const [tkind, setTkind] = useState('교육청');
  const [tOpen, setTOpen] = useState(null);
  const [rc, setRc] = useState('room');
  const [msort, setMsort] = useState('좋아요 순');
  const [wtag, setWtag] = useState(null);
  const [draft, setDraft] = useState('');

  const classes = OPEN_CLASSES.filter((o) => o.date >= TODAY && (lvl === '전체' || o.level === lvl));
  const trainings = useMemo(() => {
    if (tkind === '신청한') return TRAININGS.filter((t) => s.applied[t.id]);
    return TRAININGS.filter((t) => t.kind === tkind);
  }, [tkind, s.applied]);
  const appliedN = TRAININGS.filter((t) => s.applied[t.id]).length;
  const allMats = [...s.myMaterials, ...MATERIALS];
  const mats = [...allMats].sort((a, b) => (msort === '좋아요 순' ? b.likes - a.likes : msort === '최신 등록순' ? b.date.localeCompare(a.date) : b.views - a.views)).slice(0, 4);
  const worries = [...s.myWorries, ...WORRIES].filter((w) => !wtag || w.tag === wtag).slice(0, 3);
  const comms = [...s.myComms, ...COMMUNITIES];
  const badgeGot = BADGES.filter((b) => b.got).length;

  const post = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const w = { id: uid('w'), tag: wtag ?? '기타', title: draft.trim().slice(0, 40), body: draft.trim(), author: ME.name, date: TODAY, likes: 0, solved: false, mine: true, comments: [] };
    st.patch((x) => ({ myWorries: [w, ...x.myWorries] }));
    st.award('활동', 5, '고민 남기기');
    setDraft('');
    st.toast('고민을 남겼어요 · 동료 선생님들의 답변을 기다려 보세요');
  };

  return (
    <div className="container home">
      <div className="home__grid">
        <Panel className="hp hp--map" tone="pink" icon="calendar" title="수업 공개 현황" code="나눔 · 3.1" desc="공개수업 정보를 지도로 한눈에 확인하세요." more="/share/classes">
          <Tabs size="sm" value={lvl} onChange={(v) => { setLvl(v); setSel(null); }} items={['전체', ...LEVELS]} />
          <GyeonggiMap compact items={classes} selected={sel} onSelect={setSel} onOpen={setCls} />
          <p className="hp__foot mono">이번 달 이후 공개수업 {classes.length}건</p>
        </Panel>

        <Panel className="hp" tone="blue" icon="school" title="교육청/지원청 연수 신청" code="배움 · 2.1" desc="교육청 · 지원청 연수 정보를 확인하고 신청하세요." more="/learn/trainings">
          <Tabs size="sm" value={tkind} onChange={setTkind} items={[
            { value: '교육청', label: `교육청 연수 (${TRAININGS.filter((t) => t.kind === '교육청').length})` },
            { value: '지원청', label: `지원청 연수 (${TRAININGS.filter((t) => t.kind === '지원청').length})` },
            { value: '신청한', label: `신청한 연수 (${appliedN})` },
          ]} />
          <div className="tlist">
            {trainings.slice(0, 5).map((t) => <TrainingRow key={t.id} t={t} onOpen={setTOpen} />)}
            {!trainings.length && <p className="empty-line">아직 신청한 연수가 없어요.</p>}
          </div>
        </Panel>

        <Panel className="hp" tone="green" icon="award" title="포트폴리오" code="성장 · 1.2" desc="나의 수업과 성장을 기록하고 뱃지와 포인트를 확인하세요." more="/growth/journey">
          <div className="pf">
            <div className="pf__me">
              <Avatar name={ME.name} size={64} />
              <div>
                <strong>{ME.name} 선생님</strong>
                <span>{ME.school} · {ME.role}</span>
                <Link to="/growth/journey" className="chip chip--ink"><Icon name="edit" size={12} /> 프로필 수정</Link>
              </div>
            </div>
            <div className="pf__nums">
              <div><Icon name="star" size={20} className="c-yellow" /><b>{num(st.totalPoints)}P</b><span>누적 포인트</span></div>
              <div><Icon name="award" size={20} className="c-orange" /><b>{badgeGot}개</b><span>획득 뱃지</span></div>
            </div>
          </div>
          <div className="pf__badges">
            {['수업 나눔', 'AI 활용', '공동체 활동', '자료 공유', '멘토링'].map((n) => { const b = BADGES.find((x) => x.name === n); return <BadgeHex key={n} name={n} stage={b.stage} got={b.got} size={52} />; })}
          </div>
          <div className="pf__recent">
            <p><b>최근 활동 요약</b> <span className="mono">최근 3개월</span></p>
            <ul>
              <li><Icon name="book" size={16} className="c-blue" /><span>수업기록</span><b>24건</b></li>
              <li><Icon name="upload" size={16} className="c-yellow" /><span>자료 업로드</span><b>{18 + s.myMaterials.length}건</b></li>
              <li><Icon name="users" size={16} className="c-purple" /><span>공동체 활동</span><b>{3 + Object.keys(s.joinedComms).length + s.myComms.length}건</b></li>
              <li><Icon name="heart" size={16} className="c-pink" /><span>좋아요 받은 수</span><b>32건</b></li>
            </ul>
          </div>
          <Link to="/growth/journey" className="btn btn--green btn--block">내 포트폴리오 보러가기 <Icon name="arrow" size={16} /></Link>
        </Panel>

        <Panel className="hp" tone="orange" icon="users" title="학습방/공동체 통합" code="배움 2.3 · 나눔 3.2" desc="학습방과 공동체 활동을 함께 확인하세요." more={rc === 'room' ? '/learn/rooms' : '/share/communities'}>
          <div className="toggle2" role="tablist">
            <button role="tab" aria-selected={rc === 'room'} className={rc === 'room' ? 'is-on' : ''} onClick={() => setRc('room')}>학습방 목록 ({ROOMS.filter((r) => !r.done).length})</button>
            <button role="tab" aria-selected={rc === 'comm'} className={rc === 'comm' ? 'is-on' : ''} onClick={() => setRc('comm')}>공동체 목록 ({comms.length})</button>
          </div>
          <div className="rlist">
            {rc === 'room'
              ? ROOMS.filter((r) => !r.done).slice(0, 4).map((r) => <RoomRow key={r.id} r={r} />)
              : comms.slice(0, 3).map((c) => <CommunityCard key={c.id} c={c} compact />)}
          </div>
        </Panel>

        <Panel className="hp" tone="blue" icon="layers" title="교육 자료 추천" code="배움 · 2.2" desc="선생님들이 추천한 교육자료를 만나보세요." more="/learn/materials">
          <Tabs size="sm" value={msort} onChange={setMsort} items={['좋아요 순', '최신 등록순', '조회수 순']} />
          <div className="mlist">{mats.map((m) => <MaterialCard key={m.id} m={m} compact />)}</div>
        </Panel>

        <Panel className="hp" tone="purple" icon="message" title="고민 남기기" code="동행 · 4.1" desc="교육 현장의 고민을 남기고, 함께 해결해요." more="/together/worries">
          <form className="hp__ask" onSubmit={post}>
            <Avatar name={ME.name} size={36} />
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={'교육 현장의 고민을 남겨주세요.\n선생님들의 따뜻한 답변이 큰 힘이 됩니다.'} rows={2} aria-label="고민 입력" />
            <button className="btn btn--green btn--sm" type="submit">등록하기</button>
          </form>
          <div className="chips chips--scroll">
            {WORRY_TAGS.slice(0, 5).map((t) => <button key={t} className={`chip chip--btn ${wtag === t ? 'is-on' : ''}`} onClick={() => setWtag(wtag === t ? null : t)}>#{t}</button>)}
          </div>
          <div className="hworries">{worries.map((w) => <HomeWorry key={w.id} w={w} />)}</div>
        </Panel>
      </div>

      <section className="vision">
        <div className="vision__copy">
          <span className="mono c-orange">VISION · 2026</span>
          <h2>교사 주도의 자발적 성찰과 동행으로<br />함께 성장하는 경기교육 공동체</h2>
          <div className="vision__strip">
            {[['성장', '성찰로 설계하는 나의 성장', '/growth/design', 'green'], ['배움', '맞춤 연수와 모듈', '/learn/trainings', 'blue'], ['나눔', '수업과 실천을 나누는 문화', '/share/classes', 'pink'], ['동행', '누구나 멘토이자 멘티', '/together/mentors', 'purple']].map(([k, d, to, c]) => (
              <Link key={k} to={to} className="vision__item"><span className={`mono c-${c}`}>{k}</span><b>{d}</b><Icon name="arrow" size={16} /></Link>
            ))}
          </div>
        </div>
        <div className="vision__art" aria-hidden>
          <span className="pill pill-1" /><span className="pill pill-2" /><span className="pill pill-3" /><span className="pill pill-4" /><span className="pill pill-5"><span className="checker" /></span>
        </div>
      </section>

      <OpenClassModal o={cls} onClose={() => setCls(null)} />
      <TrainingModal t={tOpen} onClose={() => setTOpen(null)} />
    </div>
  );
}
