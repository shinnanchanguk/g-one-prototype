import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { InstructorCard, MentorCard, WorryItem } from '../components/cards.jsx';
import Icon from '../components/Icon.jsx';
import { Avatar, Chip, Empty, Field, Modal, PageHead, Panel, SearchBox, Select, Tabs, fmtDate, shortDate } from '../components/ui.jsx';
import { INSTRUCTOR_TARGETS, INSTRUCTORS, INVITE_STEPS, LEVELS, ME, MENTOR_FIELDS, MENTORING_STEPS, MENTORS, REGIONS, TODAY, WORRIES, WORRY_TAGS, instructorOf } from '../data/seed.js';
import { uid, useStore } from '../store.jsx';

export function Worries() {
  const st = useStore();
  const [tag, setTag] = useState('전체');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('최신순');
  const [f, setF] = useState({ title: '', body: '', tag: '소소한 이야기', anon: true });
  const all = [...st.s.myWorries, ...WORRIES];
  const list = all.filter((w) => (tag === '전체' || (tag === '내 글' ? w.mine : w.tag === tag)) && (!q || (w.title + w.body).includes(q)))
    .sort((a, b) => (sort === '최신순' ? b.date.localeCompare(a.date) : sort === '공감순' ? b.likes - a.likes : ((a.comments.length + (st.s.worryComments[a.id]?.length ?? 0)) - (b.comments.length + (st.s.worryComments[b.id]?.length ?? 0)))));
  const post = (e) => {
    e.preventDefault();
    if (!f.title.trim() || !f.body.trim()) { st.toast('제목과 내용을 적어 주세요', 'warn'); return; }
    const w = { id: uid('w'), tag: f.tag, title: f.title.trim(), body: f.body.trim(), author: f.anon ? '익명의 초등 선생님' : ME.name, date: TODAY, likes: 0, solved: false, mine: true, comments: [] };
    st.patch((s) => ({ myWorries: [w, ...s.myWorries] }));
    st.award('활동', 5, '쫑알쫑알 글 남기기');
    st.toast('글을 남겼어요 · 모든 동료 선생님이 함께 봐요');
    setF({ title: '', body: '', tag: '소소한 이야기', anon: true });
  };
  return (
    <div className="container">
      <PageHead crumbs={['동행', '쫑알쫑알']} code="4.1 · 쫑알쫑알" title="쫑알쫑알" desc="수업 고민부터 교실의 작은 자랑까지, 교직 생활 이야기를 전체 동료와 편하게 나누는 공간입니다. 특정 멘토를 정하지 않아도 됩니다.">
        <Link to="/together/mentors" className="btn btn--line"><Icon name="users" size={16} />멘토 찾아 신청하기</Link>
      </PageHead>
      <div className="grid-side">
        <div>
          <div className="filters">
            <SearchBox value={q} onChange={setQ} placeholder="글 검색" />
            <Select label="정렬" value={sort} onChange={setSort} options={['최신순', '공감순', '댓글 적은 순']} />
          </div>
          <div className="chips chips--scroll">{['전체', '내 글', ...WORRY_TAGS].map((t) => <button key={t} className={`chip chip--btn ${tag === t ? 'is-on' : ''}`} onClick={() => setTag(t)}>{t === '전체' || t === '내 글' ? t : `#${t}`}</button>)}</div>
          <Panel>
            <div className="wlist">{list.map((w) => <WorryItem key={w.id} w={w} />)}</div>
            {!list.length && <Empty text="해당하는 글이 없어요" />}
          </Panel>
        </div>
        <Panel className="sticky" title="글 남기기" desc="고민이 아니어도 괜찮아요. 모든 선생님과 함께 나눠요.">
          <form className="form" onSubmit={post}>
            <Field label="분류"><select className="input" value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })}>{WORRY_TAGS.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="제목"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="한 줄로 적어 주세요" /></Field>
            <Field label="내용"><textarea className="ta" rows={5} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="상황을 편하게 적어 주세요. 학생 이름 같은 개인정보는 빼 주세요." /></Field>
            <label className="check"><input type="checkbox" checked={f.anon} onChange={(e) => setF({ ...f, anon: e.target.checked })} /> 익명으로 남기기 (학교급만 표시)</label>
            <button className="btn btn--green" type="submit"><Icon name="send" size={15} />등록하기</button>
          </form>
        </Panel>
      </div>
    </div>
  );
}

// 글 분류 → 멘토 분야. 소소한 이야기·기타는 맞는 분야가 없어 멘토 찾기 버튼을 감춘다.
const MENTOR_FIELD_OF = { '수업 고민': '수업·평가', 생활지도: '생활교육', '업무 효율화': '업무 역량', '진로/진학': '진로교육', '학부모 소통': '학급경영', '마음 돌봄': '정신건강·자기돌봄' };

export function WorryDetail() {
  const { id } = useParams();
  const st = useStore();
  const [text, setText] = useState('');
  const w = [...st.s.myWorries, ...WORRIES].find((x) => x.id === id);
  if (!w) return <div className="container"><Empty text="글을 찾을 수 없어요"><Link className="btn btn--line" to="/together/worries">목록으로</Link></Empty></div>;
  const comments = [...w.comments, ...(st.s.worryComments[w.id] ?? [])];
  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    st.patch((s) => ({ worryComments: { ...s.worryComments, [w.id]: [...(s.worryComments[w.id] ?? []), { id: uid('k'), author: ME.name, date: TODAY, body: text.trim(), helpful: 0 }] } }));
    st.award('상호작용', 5, '쫑알쫑알 댓글 남김');
    setText(''); st.toast('댓글을 남겼어요');
  };
  const liked = !!st.s.worryLikes[w.id];
  const field = Object.hasOwn(MENTOR_FIELD_OF, w.tag) ? MENTOR_FIELD_OF[w.tag] : null;
  return (
    <div className="container narrow">
      <Link to="/together/worries" className="linkbtn"><Icon name="left" size={14} /> 쫑알쫑알 목록</Link>
      <Panel className="mt">
        <div className="detail-meta"><Avatar name={w.author} size={44} /><div><b>{w.author}</b><span>{fmtDate(w.date)} · #{w.tag}</span></div>{w.solved ? <Chip tone="green">해결됨</Chip> : !comments.length && <Chip tone="orange">첫 댓글을 기다려요</Chip>}</div>
        <h1 className="h2">{w.title}</h1>
        <p className="lead">{w.body}</p>
        <div className="row-between">
          <button className={`btn btn--sm ${liked ? 'btn--pink' : 'btn--line'}`} onClick={() => st.toggle('worryLikes', w.id)}><Icon name="heart" size={14} />공감 {w.likes + (liked ? 1 : 0)}</button>
          {field && <Link to={`/together/mentors?field=${encodeURIComponent(field)}`} className="btn btn--sm btn--line"><Icon name="users" size={14} />이 분야 멘토 찾기</Link>}
        </div>
      </Panel>
      <Panel title={`댓글 ${comments.length}`}>
        <ul className="comments">
          {comments.map((c) => {
            const h = !!st.s.helpful[c.id];
            return (
              <li key={c.id}>
                <Avatar name={c.author} size={34} />
                <div>
                  <p className="comments__who"><b>{c.author}</b>{c.badge && <Chip tone="purple" solid><Icon name="shield" size={11} /> {c.badge}</Chip>}<span className="mono">{c.date}</span></p>
                  <p>{c.body}</p>
                  <button className={`likebtn ${h ? 'is-on' : ''}`} onClick={() => { st.toggle('helpful', c.id); if (!h) st.toast('도움됨을 눌렀어요 · 댓글 단 선생님의 상호작용 포인트가 쌓여요'); }}><Icon name="thumb" size={14} />도움됨 {c.helpful + (h ? 1 : 0)}</button>
                </div>
              </li>
            );
          })}
        </ul>
        {!comments.length && <Empty text="첫 댓글을 남겨 주세요" />}
        <form className="inline-form" onSubmit={send}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="경험이나 생각을 나눠 주세요" aria-label="댓글 입력" />
          <button className="btn btn--green btn--sm" type="submit"><Icon name="send" size={14} />댓글</button>
        </form>
      </Panel>
    </div>
  );
}

export function Mentors() {
  const st = useStore();
  const [sp] = useSearchParams();
  const [field, setField] = useState(sp.get('field') || '전체 분야');
  const [region, setRegion] = useState('전체 권역');
  const [level, setLevel] = useState('전체 학교급');
  const [onlyV, setOnlyV] = useState(false);
  const [q, setQ] = useState('');
  const [pick, setPick] = useState(null);
  const [f, setF] = useState({ topic: '', slot: '', msg: '' });
  useEffect(() => { const m = MENTORS.find((x) => x.id === sp.get('m')); if (m) setPick(m); setField(sp.get('field') || '전체 분야'); }, [sp]);
  const list = MENTORS.filter((m) => (field === '전체 분야' || m.fields.includes(field)) && (region === '전체 권역' || m.region.includes(region)) && (level === '전체 학교급' || m.level === level) && (!onlyV || m.verified) && (!q || (m.name + m.intro + m.school).includes(q)))
    .sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0) || b.rating - a.rating);
  const apply = () => {
    if (!f.topic.trim() || !f.slot) { st.toast('고민 주제와 희망 일정을 골라 주세요', 'warn'); return; }
    const g = { id: uid('g'), role: '멘티', mentorId: pick.id, partner: pick.name, field: pick.fields[0], topic: f.topic.trim(), step: 0, created: TODAY, sessions: [], next: `${pick.name} 멘토님 수락 대기 · 희망 ${f.slot}` };
    st.patch((s) => ({ myMentorings: [g, ...s.myMentorings] }));
    st.award('활동', 10, `멘토링 신청: ${pick.name}`);
    st.toast(`${pick.name} 선생님께 멘토링을 신청했어요 · 멘토링 현황에서 확인하세요`);
    setPick(null); setF({ topic: '', slot: '', msg: '' });
  };
  return (
    <div className="container">
      <PageHead crumbs={['동행', '멘토 찾기 및 신청']} code="4.1 · 멘토 찾기 및 신청" title="멘토 찾기" desc="누구나 멘토이자 멘티가 됩니다. 수석교사, 각종 지원단, 교권보호지원단처럼 검증된 전문가는 우수멘토로 표시되고, 학교 단위 연수 강사 인력풀로도 연결됩니다.">
        <Link to="/together/instructors" className="btn btn--line"><Icon name="school" size={16} />학교 연수 강사 초빙</Link>
      </PageHead>
      <div className="filters">
        <SearchBox value={q} onChange={setQ} placeholder="이름, 학교, 소개로 찾기" />
        <Select label="분야" value={field} onChange={setField} options={['전체 분야', ...MENTOR_FIELDS]} />
        <Select label="권역" value={region} onChange={setRegion} options={['전체 권역', ...REGIONS]} />
        <Select label="학교급" value={level} onChange={setLevel} options={['전체 학교급', ...LEVELS]} />
        <label className="check check--pill"><input type="checkbox" checked={onlyV} onChange={(e) => setOnlyV(e.target.checked)} /><Icon name="shield" size={14} />우수멘토만</label>
      </div>
      <p className="mono">{list.length}명 · 우수멘토 {list.filter((m) => m.verified).length}명</p>
      <div className="mtgrid">{list.map((m) => <MentorCard key={m.id} m={m} onApply={setPick} />)}</div>
      {!list.length && <Empty text="조건에 맞는 멘토가 없어요" />}
      <Modal open={!!pick} onClose={() => setPick(null)} title={pick ? `${pick.name} 선생님` : ''} wide footer={<button className="btn btn--dark" onClick={apply}><Icon name="send" size={15} />멘토링 신청</button>}>
        {pick && (
          <div className="grid2 grid2--modal">
            <div>
              {pick.verified && <p className="vbadge"><Icon name="shield" size={16} /> 우수멘토 · {pick.verified}</p>}
              <div className="detail-meta"><Avatar name={pick.name} size={52} /><div><b>{pick.name} 선생님</b><span>{pick.school} · {pick.role} · 경력 {pick.years}년</span></div></div>
              <p className="lead">{pick.intro}</p>
              <dl className="dl">
                <dt>분야</dt><dd>{pick.fields.join(', ')}</dd>
                <dt>가능 권역</dt><dd>{pick.region.join(', ')}</dd>
                <dt>활동 경험</dt><dd>멘토링 {pick.sessions}회 · 평균 만족 {pick.rating}점</dd>
              </dl>
              {instructorOf(pick.id) && (
                <Link to={`/together/instructors?i=${instructorOf(pick.id).id}`} className="poolbox">
                  <Icon name="school" size={18} />
                  <span><b>학교 연수 강사로도 초빙할 수 있어요</b><small>{instructorOf(pick.id).topics.map((t) => t.title).join(' · ')}</small></span>
                  <Icon name="right" size={16} />
                </Link>
              )}
            </div>
            <div className="form">
              <p className="field__label">가능 일정</p>
              <div className="slots">{pick.slots.map((sl) => <button key={sl} type="button" className={f.slot === sl ? 'is-on' : ''} onClick={() => setF({ ...f, slot: sl })}><Icon name="clock" size={14} />{sl}</button>)}</div>
              <Field label="상담하고 싶은 고민"><input className="input" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} placeholder="예) 조용한 학생 참여 구조" /></Field>
              <Field label="멘토님께 한마디"><textarea className="ta" rows={3} value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} /></Field>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function Mentoring() {
  const st = useStore();
  const [tab, setTab] = useState('전체');
  const [rate, setRate] = useState(null);
  const [score, setScore] = useState(5);
  const all = st.mentoringsAll;
  const stepOv = st.s.mentorStep ?? {};
  const list = all.filter((m) => tab === '전체' || m.role === tab);
  const advance = (m, cur) => {
    if (cur >= 3) { setRate(m); return; }
    st.patch((s) => ({ mentorStep: { ...(s.mentorStep ?? {}), [m.id]: cur + 1 } }));
    st.toast(`${MENTORING_STEPS[cur + 1]} 단계로 넘어갔어요`);
  };
  return (
    <div className="container">
      <PageHead crumbs={['동행', '멘토링 현황']} code="4.2 · 멘토링 과정 살펴보기" title="멘토링 현황" desc="신청한 멘토·멘티 과정과 이력을 한곳에서 관리하고 진행 상태를 따라갑니다." />
      <Tabs value={tab} onChange={setTab} className="tabs--page" items={['전체', '멘티', '멘토'].map((t) => ({ value: t, label: `${t === '전체' ? '전체' : `내가 ${t}`} (${all.filter((m) => t === '전체' || m.role === t).length})` }))} />
      <div className="mentorings">
        {list.map((m) => {
          const cur = Math.min(stepOv[m.id] ?? m.step, 4);
          return (
            <article key={m.id} className="mtr">
              <div className="mtr__head">
                <Avatar name={m.partner} size={44} />
                <div><span className="mono">{m.role === '멘티' ? '나의 멘토' : '나의 멘티'} · {m.field}</span><h3>{m.topic}</h3><p>{m.partner} · 신청 {fmtDate(m.created)}</p></div>
                <Chip tone={cur >= 4 ? 'green' : cur === 0 ? 'orange' : 'ink'} solid>{MENTORING_STEPS[cur]}</Chip>
              </div>
              <ol className="track">
                {MENTORING_STEPS.map((s, i) => <li key={s} className={i < cur ? 'is-done' : i === cur ? 'is-on' : ''}><span className="track__dot">{i < cur && <Icon name="check" size={12} stroke={2.6} />}</span><span>{s}</span></li>)}
              </ol>
              {m.sessions.length > 0 && <ul className="sessions">{m.sessions.map((x, i) => <li key={i}><span className="mono">{x.date}</span>{x.note}</li>)}</ul>}
              <div className="row-between">
                <span className="mono">{cur >= 4 ? (st.s.mentorReview?.[m.id] ? `평가 완료 · ${st.s.mentorReview[m.id]}점` : m.review ?? '완료') : `다음 · ${m.next}`}</span>
                {cur < 4 && <button className="btn btn--sm btn--line" onClick={() => advance(m, cur)}>{cur >= 3 ? '멘토링 마치고 평가하기' : '다음 단계 시연하기'}</button>}
              </div>
            </article>
          );
        })}
        {!list.length && <Empty text="멘토링 기록이 없어요"><Link className="btn btn--dark" to="/together/mentors">멘토 찾기</Link></Empty>}
      </div>
      <Modal open={!!rate} onClose={() => setRate(null)} title="멘토링 도움됨 평가" footer={<button className="btn btn--dark" onClick={() => {
        st.patch((s) => ({ mentorStep: { ...(s.mentorStep ?? {}), [rate.id]: 4 }, mentorReview: { ...(s.mentorReview ?? {}), [rate.id]: score } }));
        st.award('활동', 20, '멘토링 완료');
        st.toast('평가를 남겼어요 · 멘토의 분야별 전문가 인증에 반영돼요');
        setRate(null);
      }}>평가 남기기</button>}>
        <p className="lead">{rate?.partner} 선생님과의 멘토링은 얼마나 도움이 되었나요?</p>
        <div className="stars">{[1, 2, 3, 4, 5].map((n) => <button key={n} className={score >= n ? 'is-on' : ''} onClick={() => setScore(n)} aria-label={`${n}점`}><Icon name="star" size={28} /></button>)}</div>
      </Modal>
    </div>
  );
}

// ── 4.1 강사 인력풀: 검증된 선생님을 학교 연수 강사로 초빙 ─────────────────
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const nextOf = (v, cur, name) => {
  if (cur === 0) return `${name} 선생님의 수락을 기다리고 있어요`;
  if (cur === 1) return '수락했어요 · 날짜와 장소를 함께 정해요';
  if (cur === 2) return v.step === 2 && v.next ? v.next : `${fmtDate(v.date)} ${v.time} · 일정이 정해졌어요`;
  return '연수를 진행하고 있어요';
};

export function Instructors() {
  const st = useStore();
  const [sp, setSp] = useSearchParams();
  const [tab, setTab] = useState('find');
  const [field, setField] = useState('전체 분야');
  const [region, setRegion] = useState('전체 권역');
  const [level, setLevel] = useState('전체 학교급');
  const [format, setFormat] = useState('전체 방식');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('학교 연수 많은 순');
  const [pick, setPick] = useState(null);
  const blank = { topic: '', custom: '', date: '', time: '15:00~16:30', format: '대면', target: INSTRUCTOR_TARGETS[0], count: 30, memo: '' };
  const [f, setF] = useState(blank);
  const [rate, setRate] = useState(null);
  const [score, setScore] = useState(5);
  const mentorOf = (i) => MENTORS.find((x) => x.id === i.mentorId);
  const open = (i) => { setPick(i); setF({ ...blank, topic: i.topics[0].title, format: i.formats[0] }); };
  useEffect(() => { const hit = INSTRUCTORS.find((x) => x.id === sp.get('i')); if (hit) { setTab('find'); open(hit); } }, [sp]); // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => { setPick(null); if (sp.get('i')) setSp({}, { replace: true }); };
  const list = INSTRUCTORS.map((i) => ({ i, m: mentorOf(i) }))
    .filter(({ i, m }) => (field === '전체 분야' || m.fields.includes(field)) && (region === '전체 권역' || m.region.includes(region)) && (level === '전체 학교급' || m.level === level)
      && (format === '전체 방식' || i.formats.includes(format)) && (!q || (m.name + m.school + i.basis.join(' ') + i.topics.map((t) => t.title).join(' ')).includes(q)))
    .sort((a, b) => (sort === '만족도 순' ? b.i.rating - a.i.rating || b.i.talks - a.i.talks : b.i.talks - a.i.talks || b.i.rating - a.i.rating));
  const invites = st.invitesAll;
  const stepOv = st.s.inviteStep;
  const pm = pick ? mentorOf(pick) : null;

  const send = () => {
    const topic = (f.topic === '직접 적기' ? f.custom : f.topic).trim().slice(0, 80);
    if (!topic) { st.toast('연수 주제를 골라 주세요', 'warn'); return; }
    if (!DATE_RE.test(f.date) || f.date < TODAY) { st.toast('희망 날짜를 골라 주세요', 'warn'); return; }
    const count = Math.trunc(Number(f.count));
    if (!(count >= 1 && count <= 300)) { st.toast('예상 인원은 1명에서 300명 사이로 적어 주세요', 'warn'); return; }
    const v = { id: uid('v'), instructorId: pick.id, topic, date: f.date, time: f.time.trim().slice(0, 20) || '시간 협의', format: pick.formats.includes(f.format) ? f.format : pick.formats[0], target: INSTRUCTOR_TARGETS.includes(f.target) ? f.target : INSTRUCTOR_TARGETS[0], count, memo: f.memo.trim().slice(0, 500), step: 0, created: TODAY, next: '' };
    st.patch((s) => ({ invites: [v, ...s.invites] }));
    st.toast(`${pm.name} 선생님께 학교 연수 초빙을 요청했어요 · 초빙 현황에서 이어서 볼 수 있어요`);
    close();
    setTab('status');
  };
  const advance = (v, cur) => {
    if (cur >= 3) { setRate(v); setScore(5); return; }
    st.patch((s) => ({ inviteStep: { ...s.inviteStep, [v.id]: cur + 1 } }));
    st.toast(`${INVITE_STEPS[cur + 1]} 단계로 넘어갔어요`);
  };

  return (
    <div className="container">
      <PageHead crumbs={['동행', '강사 인력풀']} code="4.1 · 멘토 찾기 및 신청 → 강사 인력풀" title="강사 인력풀" desc="수석교사, 각종 지원단, 교권보호지원단, 영역 전문가 인증을 받은 선생님을 학교 연수 강사로 초빙합니다. 아는 사람을 따로 수소문하지 않아도 주제와 지역으로 찾아 바로 요청할 수 있습니다.">
        <Link to="/together/mentors" className="btn btn--line"><Icon name="users" size={16} />1:1 멘토 찾기</Link>
      </PageHead>
      <Tabs value={tab} onChange={setTab} className="tabs--page" items={[{ value: 'find', label: `강사 찾기 (${INSTRUCTORS.length})`, icon: 'search' }, { value: 'status', label: `초빙 현황 (${invites.length})`, icon: 'list' }]} />

      {tab === 'find' && <>
        <div className="filters">
          <SearchBox value={q} onChange={setQ} placeholder="이름, 학교, 강의 주제로 찾기" />
          <Select label="분야" value={field} onChange={setField} options={['전체 분야', ...MENTOR_FIELDS]} />
          <Select label="권역" value={region} onChange={setRegion} options={['전체 권역', ...REGIONS.filter((r) => r !== '온라인 가능')]} />
          <Select label="학교급" value={level} onChange={setLevel} options={['전체 학교급', ...LEVELS]} />
          <Select label="운영 방식" value={format} onChange={setFormat} options={['전체 방식', '대면', '원격']} />
        </div>
        <div className="row-between">
          <p className="mono">{list.length}명 · 학교 연수 {list.reduce((a, x) => a + x.i.talks, 0)}회 진행</p>
          <Tabs size="sm" value={sort} onChange={setSort} items={['학교 연수 많은 순', '만족도 순']} />
        </div>
        <div className="mtgrid">{list.map(({ i, m }) => <InstructorCard key={i.id} i={i} m={m} onInvite={open} />)}</div>
        {!list.length && <Empty text="조건에 맞는 강사가 없어요. 조건을 넓혀 보세요." />}
      </>}

      {tab === 'status' && (
        <div className="mentorings">
          {invites.map((v) => {
            const i = INSTRUCTORS.find((x) => x.id === v.instructorId);
            const m = mentorOf(i);
            const cur = Math.min(stepOv[v.id] ?? v.step, INVITE_STEPS.length - 1);
            const review = st.s.inviteReview[v.id] ?? v.review;
            return (
              <article key={v.id} className="mtr">
                <div className="mtr__head">
                  <Avatar name={m.name} size={44} />
                  <div><span className="mono">학교 연수 초빙 · {v.format} · {v.target} {v.count}명</span><h3>{v.topic}</h3><p>{m.name} 선생님 · 희망 {fmtDate(v.date)} {v.time}</p></div>
                  <Chip tone={cur >= 4 ? 'green' : cur === 0 ? 'orange' : 'ink'} solid>{INVITE_STEPS[cur]}</Chip>
                </div>
                <ol className="track">
                  {INVITE_STEPS.map((x, k) => <li key={x} className={k < cur ? 'is-done' : k === cur ? 'is-on' : ''}><span className="track__dot">{k < cur && <Icon name="check" size={12} stroke={2.6} />}</span><span>{x}</span></li>)}
                </ol>
                {v.memo && <p className="mtr__memo">요청 메모 · {v.memo}</p>}
                <div className="row-between">
                  <span className="mono">{cur >= 4 ? (review ? `후기 남김 · 별 ${review}개` : '후기를 기다려요') : `다음 · ${nextOf(v, cur, m.name)}`}</span>
                  {cur < 4 && <button className="btn btn--sm btn--line" onClick={() => advance(v, cur)}>{cur >= 3 ? '연수 마치고 후기 남기기' : '다음 단계 시연하기'}</button>}
                </div>
              </article>
            );
          })}
          {!invites.length && <Empty text="아직 초빙 요청이 없어요"><button className="btn btn--dark" onClick={() => setTab('find')}>강사 찾기</button></Empty>}
        </div>
      )}

      <Modal open={!!pick} onClose={close} title={pm ? `${pm.name} 선생님 · 학교 연수 초빙` : ''} wide footer={<button className="btn btn--dark" onClick={send}><Icon name="send" size={15} />초빙 요청 보내기</button>}>
        {pick && pm && (
          <div className="grid2 grid2--modal">
            <div>
              <div className="incard__basis">{pick.basis.map((b) => <span key={b} className="vbadge"><Icon name="shield" size={16} />{b}</span>)}</div>
              <div className="detail-meta"><Avatar name={pm.name} size={52} /><div><b>{pm.name} 선생님</b><span>{pm.school} · {pm.role} · 경력 {pm.years}년</span></div></div>
              <p className="lead">{pm.intro}</p>
              <dl className="dl">
                <dt>강의 주제</dt><dd>{pick.topics.map((t) => `${t.title} (${t.mins}분)`).join(', ')}</dd>
                <dt>운영 방식</dt><dd>{pick.formats.join(', ')} · {pm.region.filter((r) => r !== '온라인 가능').join(', ')}</dd>
                <dt>학교 연수</dt><dd>{pick.talks}회 · 평균 만족 {pick.rating}점 · 최근 {shortDate(pick.lastTalk)}</dd>
              </dl>
              <p className="field__label">다녀간 학교의 후기</p>
              <ul className="reviews">{pick.reviews.map((r) => <li key={r.school + r.date}><b>{r.school}</b><span className="mono">{shortDate(r.date)}</span><p>{r.text}</p></li>)}</ul>
            </div>
            <div className="form">
              <div className="field">
                <span className="field__label">연수 주제</span>
                <div className="slots">{[...pick.topics.map((t) => t.title), '직접 적기'].map((t) => <button key={t} type="button" className={f.topic === t ? 'is-on' : ''} aria-pressed={f.topic === t} onClick={() => setF({ ...f, topic: t })}>{t}</button>)}</div>
                {f.topic === '직접 적기' && <input className="input" maxLength={80} value={f.custom} onChange={(e) => setF({ ...f, custom: e.target.value })} placeholder="예) 우리 학교 수업 나눔 협의회 함께 열기" aria-label="연수 주제 직접 적기" />}
              </div>
              <div className="row2">
                <Field label="희망 날짜"><input className="input" type="date" min={TODAY} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
                <Field label="시간"><input className="input" maxLength={20} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
              </div>
              <div className="field">
                <span className="field__label">운영 방식</span>
                <div className="seg seg--full" role="radiogroup" aria-label="운영 방식">{pick.formats.map((x) => <button key={x} type="button" role="radio" aria-checked={f.format === x} className={f.format === x ? 'is-on' : ''} onClick={() => setF({ ...f, format: x })}>{x}</button>)}</div>
              </div>
              <div className="row2">
                <Field label="대상"><select className="input" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })}>{INSTRUCTOR_TARGETS.map((x) => <option key={x}>{x}</option>)}</select></Field>
                <Field label="예상 인원"><input className="input" type="number" min={1} max={300} value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })} /></Field>
              </div>
              <Field label="요청 메모" hint="학교 사정이나 미리 알려 드릴 것을 적어 주세요."><textarea className="ta" rows={3} maxLength={500} value={f.memo} onChange={(e) => setF({ ...f, memo: e.target.value })} /></Field>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!rate} onClose={() => setRate(null)} title="학교 연수 후기" footer={<button className="btn btn--dark" onClick={() => {
        st.patch((s) => ({ inviteStep: { ...s.inviteStep, [rate.id]: 4 }, inviteReview: { ...s.inviteReview, [rate.id]: score } }));
        st.toast('후기를 남겼어요 · 다른 학교가 강사를 고를 때 참고해요');
        setRate(null);
      }}>후기 남기기</button>}>
        <p className="lead">「{rate?.topic}」 연수는 우리 학교에 얼마나 도움이 되었나요?</p>
        <div className="stars">{[1, 2, 3, 4, 5].map((n) => <button key={n} className={score >= n ? 'is-on' : ''} onClick={() => setScore(n)} aria-label={`별 ${n}개`}><Icon name="star" size={28} /></button>)}</div>
      </Modal>
    </div>
  );
}
