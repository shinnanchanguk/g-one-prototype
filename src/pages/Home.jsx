import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AreaLadder, MaterialCard, ModuleCard, TrainingCard, trainingState } from '../components/cards.jsx';
import Icon from '../components/Icon.jsx';
import { Avatar, Chip, Panel, Tabs, num, shortDate } from '../components/ui.jsx';
import { AREA_QUESTIONS, AREAS, BADGE_STAGES, BADGES, MATERIALS, ME, MODULES, SCALE, TODAY, TRAININGS, WORRIES, WORRY_TAGS, badgeOf, expertAreas } from '../data/seed.js';
import { sortByProfile } from '../fit.js';
import { uid, useStore } from '../store.jsx';

// 첫 화면에 들어와 있는 동안 새 글이 올라오는 것처럼 보여 준다(live 표시 글은 잠시 뒤에 나타남).
const doneOf = (a) => BADGE_STAGES.filter((sg) => badgeOf(a.key, sg.key)?.got).length;

function HomeWorry({ w, fresh }) {
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
          <span className="hworry__title">{fresh && <Chip tone="orange" solid>방금</Chip>}<b>{w.title}</b><Chip tone={w.solved ? 'green' : 'orange'}>{w.solved ? '해결됨' : `답변 ${list.length}`}</Chip></span>
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

function useLive(delay = 12000) {
  const [arrived, setArrived] = useState(false);
  useEffect(() => { const t = setTimeout(() => setArrived(true), delay); return () => clearTimeout(t); }, [delay]);
  return arrived;
}

function AskForm() {
  const st = useStore();
  const [draft, setDraft] = useState('');
  const post = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const w = { id: uid('w'), tag: '기타', title: draft.trim().slice(0, 40), body: draft.trim(), author: ME.name, date: TODAY, likes: 0, solved: false, mine: true, comments: [] };
    st.patch((x) => ({ myWorries: [w, ...x.myWorries] }));
    st.award('활동', 5, '고민 남기기');
    setDraft('');
    st.toast('고민을 남겼어요 · 동료 선생님들의 답변을 기다려 보세요');
  };
  return (
    <form className="hp__ask" onSubmit={post}>
      <Avatar name={ME.name} size={34} />
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="교육 현장의 고민을 남겨 주세요." rows={2} aria-label="고민 입력" />
      <button className="btn btn--green btn--sm" type="submit">등록</button>
    </form>
  );
}

function Portfolio() {
  const st = useStore();
  const got = BADGES.filter((b) => b.got).length;
  const experts = expertAreas();
  const next = [...AREAS].filter((a) => doneOf(a) < 3).sort((a, b) => doneOf(b) - doneOf(a))[0];
  return (
    <Panel className="hp" tone="green" icon="award" title="나의 포트폴리오" code="성장 · 1.2" more="/growth/journey">
      <div className="pf__me">
        <Avatar name={ME.name} size={52} />
        <div><strong>{ME.name} 선생님</strong><span>{ME.school} · {ME.role}</span></div>
      </div>
      <div className="pf__nums">
        <div><b>{num(st.totalPoints)}P</b><span>누적 포인트</span></div>
        <div><b>{got}개</b><span>받은 뱃지</span></div>
        <div><b>{experts.length}개</b><span>전문가 영역</span></div>
      </div>
      {experts.map((a) => <p key={a.key} className="pf__expert"><Icon name="shield" size={15} />{a.name} 전문가</p>)}
      <p className="mono">전문가까지 가장 가까운 영역</p>
      <AreaLadder area={next} compact />
      <Link to="/growth/journey" className="btn btn--green btn--block btn--sm">내 성장 여정 자세히 <Icon name="arrow" size={15} /></Link>
    </Panel>
  );
}

function HomeA() {
  const st = useStore();
  const { s } = st;
  const live = useLive();
  const [seen, setSeen] = useState(false);
  const [msort, setMsort] = useState('나에게 맞는 순');
  const [wtag, setWtag] = useState(null);
  const shown = (x) => !x.live || (live && seen);
  const freshW = WORRIES.filter((w) => w.live && shown(w));
  const freshM = MATERIALS.filter((m) => m.live && shown(m));
  const worries = [...freshW, ...s.myWorries, ...WORRIES.filter((w) => !w.live)].filter((w) => !wtag || w.tag === wtag).slice(0, 3);
  const allMats = [...s.myMaterials, ...MATERIALS.filter((m) => !m.live)];
  const sorted = msort === '최신 등록순' ? [...allMats].sort((a, b) => b.date.localeCompare(a.date)) : msort === '좋아요 순' ? [...allMats].sort((a, b) => b.likes - a.likes) : sortByProfile([...allMats].sort((a, b) => b.likes - a.likes), s.profile);
  const mats = [...freshM, ...sorted].slice(0, 3);
  return (
    <div className="home__grid home__grid--a">
      <Portfolio />
      <Panel className="hp" tone="purple" icon="message" title="고민 남기기" code="동행 · 4.1" more="/together/worries">
        <AskForm />
        <div className="chips chips--scroll">
          {WORRY_TAGS.slice(0, 5).map((t) => <button key={t} className={`chip chip--btn ${wtag === t ? 'is-on' : ''}`} onClick={() => setWtag(wtag === t ? null : t)}>#{t}</button>)}
        </div>
        {live && !seen && <button className="newpill" onClick={() => setSeen(true)}><Icon name="refresh" size={14} />새 고민 1개 · 새 자료 1개가 올라왔어요</button>}
        <div className="hworries">{worries.map((w) => <HomeWorry key={w.id} w={w} fresh={!!w.live} />)}</div>
      </Panel>
      <Panel className="hp" tone="blue" icon="layers" title="교육자료 추천" code="배움 · 2.3" more="/learn/materials">
        <Tabs size="sm" value={msort} onChange={setMsort} items={['나에게 맞는 순', '좋아요 순', '최신 등록순']} />
        <div className="mlist">{mats.map((m) => <MaterialCard key={m.id} m={m} compact />)}</div>
      </Panel>
    </div>
  );
}

const GROWTH_CATS = [
  ['수업·평가', '수업', 'teach'], ['생활교육', '생활지도', 'life'], ['디지털·AI', 'AI 디지털 도구', 'change'],
  ['정신건강·자기돌봄', '마음 돌보기', 'self'], ['업무 역량', '업무 효율화', 'pro'], ['진로교육', '진로', 'career'], ['교육과정', '교육과정', 'curr'],
];

function QuickDiag({ areaKey }) {
  const st = useStore();
  const area = AREAS.find((a) => a.key === areaKey);
  const mine = st.s.quickDiag[areaKey];
  const n = Object.keys(st.s.quickDiag).length;
  const answer = (v) => {
    st.patch((s) => ({ quickDiag: { ...s.quickDiag, [areaKey]: v } }));
    st.toast(`${area.name} 영역 답을 성장 설계에 담았어요 · 10개 중 ${mine ? n : n + 1}개`);
  };
  return (
    <div className="qdiag">
      <div className="qdiag__q">
        <span className="mono">한 문항 진단 · {area.name}</span>
        <p>{AREA_QUESTIONS[areaKey]}</p>
      </div>
      <div className="diag__scale" role="radiogroup" aria-label={`${area.name} 진단`}>
        {SCALE.map((lbl, v) => (
          <button key={v} role="radio" aria-checked={mine === v + 1} className={mine === v + 1 ? 'is-on' : ''} onClick={() => answer(v + 1)} title={lbl}>
            <b>{v + 1}</b><span>{lbl.slice(2)}</span>
          </button>
        ))}
      </div>
      <p className="qdiag__foot">10개 영역 중 {n}개 답했어요. 처음부터 열 문항을 다 풀지 않아도 돼요. <Link to="/growth/design" className="linkbtn">성장 설계에서 이어 보기</Link></p>
    </div>
  );
}

function HomeB() {
  const st = useStore();
  const { s } = st;
  const p = s.profile;
  const [cat, setCat] = useState(GROWTH_CATS[0][0]);
  const [wsort, setWsort] = useState('공감 많은 순');
  const areaKey = GROWTH_CATS.find((c) => c[0] === cat)[2];
  const trainings = sortByProfile(TRAININGS.filter((t) => t.cat === cat && trainingState(t, s) !== 'closed'), p).slice(0, 2);
  const canSee = (m) => m.mine || m.share === '전체' || (m.share === '우리 학교' && m.school === p.school);
  const mods = sortByProfile([...s.myModules, ...MODULES].filter((m) => m.cat === cat && canSee(m)), p).slice(0, 1);
  const allW = [...s.myWorries, ...WORRIES];
  const worries = (wsort === '공감 많은 순' ? [...allW].sort((a, b) => b.likes - a.likes) : allW).slice(0, 4);
  return (
    <div className="homeb">
      <section className="homeb__main">
        <div className="homeb__head">
          <div><span className="mono c-blue">배움 · 오늘 선생님께 필요한 성장 콘텐츠</span><h2>무엇을 키워 볼까요?</h2></div>
          <span className="mono">{p.band}{p.subject ? ` · ${p.subject}` : ''} 선생님께 맞는 것부터</span>
        </div>
        <div className="gcats" role="tablist" aria-label="성장 분야">
          {GROWTH_CATS.map(([c, label]) => (
            <button key={c} role="tab" aria-selected={cat === c} className={`gcat ${cat === c ? 'is-on' : ''}`} onClick={() => setCat(c)}>
              <Icon name={{ '수업·평가': 'target', 생활교육: 'heart', '디지털·AI': 'spark', '정신건강·자기돌봄': 'leaf', '업무 역량': 'file', 진로교육: 'compass', 교육과정: 'layers' }[c]} size={18} />
              {label}
              <span className="mono">{TRAININGS.filter((t) => t.cat === c).length + MODULES.filter((m) => m.cat === c).length}</span>
            </button>
          ))}
        </div>
        <QuickDiag areaKey={areaKey} />
        <div className="tcards">{trainings.map((t) => <TrainingCard key={t.id} t={t} compact />)}</div>
        {mods.map((m) => <ModuleCard key={m.id} m={m} />)}
        <div className="row-end"><Link to="/learn/trainings" className="more">연수 더 보기 <Icon name="right" size={13} /></Link><Link to="/learn/modules" className="more">배움 모듈 더 보기 <Icon name="right" size={13} /></Link></div>
      </section>
      <Panel className="hp homeb__side" tone="purple" icon="message" title="공감 많은 고민" code="동행 · 4.1" more="/together/worries">
        <AskForm />
        <Tabs size="sm" value={wsort} onChange={setWsort} items={['공감 많은 순', '최신순']} />
        <div className="hworries">{worries.map((w) => <HomeWorry key={w.id} w={w} />)}</div>
      </Panel>
    </div>
  );
}

export default function Home() {
  const st = useStore();
  const [sp, setSp] = useSearchParams();
  const q = sp.get('home');
  const v = q === 'a' || q === 'b' ? q : st.s.homeVersion;
  const pick = (x) => { st.patch(() => ({ homeVersion: x })); setSp({ home: x }, { replace: true }); };
  return (
    <div className="container home">
      <div className="variantbar">
        <span className="variantbar__k"><Icon name="layers" size={15} />첫 화면 시안</span>
        <div className="seg" role="tablist" aria-label="첫 화면 시안">
          <button role="tab" aria-selected={v === 'a'} className={v === 'a' ? 'is-on' : ''} onClick={() => pick('a')}>A 간결형</button>
          <button role="tab" aria-selected={v === 'b'} className={v === 'b' ? 'is-on' : ''} onClick={() => pick('b')}>B 배움+고민형</button>
        </div>
        <span className="variantbar__note">{v === 'a' ? '자주 바뀌는 포트폴리오 · 고민 · 교육자료 세 칸만 앞에 둔 안' : '분야를 고르면 맞춤 배움과 한 문항 진단이 나오고, 옆에 공감 많은 고민이 보이는 안'}</span>
      </div>
      {v === 'a' ? <HomeA /> : <HomeB />}
    </div>
  );
}
