import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { MentorCard, WorryItem } from '../components/cards.jsx';
import Icon from '../components/Icon.jsx';
import { Avatar, Chip, Empty, Field, Modal, PageHead, Panel, SearchBox, Select, Tabs, fmtDate } from '../components/ui.jsx';
import { LEVELS, ME, MENTOR_FIELDS, MENTORING_STEPS, MENTORS, REGIONS, TODAY, WORRIES, WORRY_TAGS } from '../data/seed.js';
import { uid, useStore } from '../store.jsx';

export function Worries() {
  const st = useStore();
  const [tag, setTag] = useState('전체');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('최신순');
  const [f, setF] = useState({ title: '', body: '', tag: '수업 고민', anon: true });
  const all = [...st.s.myWorries, ...WORRIES];
  const list = all.filter((w) => (tag === '전체' || (tag === '내 고민' ? w.mine : w.tag === tag)) && (!q || (w.title + w.body).includes(q)))
    .sort((a, b) => (sort === '최신순' ? b.date.localeCompare(a.date) : sort === '공감순' ? b.likes - a.likes : (a.comments.length - b.comments.length)));
  const post = (e) => {
    e.preventDefault();
    if (!f.title.trim() || !f.body.trim()) { st.toast('제목과 내용을 적어 주세요', 'warn'); return; }
    const w = { id: uid('w'), tag: f.tag, title: f.title.trim(), body: f.body.trim(), author: f.anon ? '익명의 초등 선생님' : ME.name, date: TODAY, likes: 0, solved: false, mine: true, comments: [] };
    st.patch((s) => ({ myWorries: [w, ...s.myWorries] }));
    st.award('활동', 5, '고민 남기기');
    st.toast('고민을 남겼어요 · 전체 동료 선생님께 의견을 구했어요');
    setF({ title: '', body: '', tag: '수업 고민', anon: true });
  };
  return (
    <div className="container">
      <PageHead crumbs={['동행', '고민 남기기']} code="4.1 · 고민 남기기" title="고민 남기기" desc="특정 멘토를 정하지 않고, 교직 생활과 수업의 고민을 전체 동료에게 자유롭게 나누는 공간입니다.">
        <Link to="/together/mentors" className="btn btn--line"><Icon name="users" size={16} />멘토 찾아 신청하기</Link>
      </PageHead>
      <div className="grid-side">
        <div>
          <div className="filters">
            <SearchBox value={q} onChange={setQ} placeholder="고민 검색" />
            <Select label="정렬" value={sort} onChange={setSort} options={['최신순', '공감순', '답변 필요순']} />
          </div>
          <div className="chips chips--scroll">{['전체', '내 고민', ...WORRY_TAGS].map((t) => <button key={t} className={`chip chip--btn ${tag === t ? 'is-on' : ''}`} onClick={() => setTag(t)}>{t === '전체' || t === '내 고민' ? t : `#${t}`}</button>)}</div>
          <Panel>
            <div className="wlist">{list.map((w) => <WorryItem key={w.id} w={w} />)}</div>
            {!list.length && <Empty text="해당하는 고민이 없어요" />}
          </Panel>
        </div>
        <Panel className="sticky" title="고민 남기기" desc="멘토를 정하지 않고 모든 선생님께 의견을 구해요.">
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

export function WorryDetail() {
  const { id } = useParams();
  const st = useStore();
  const [text, setText] = useState('');
  const w = [...st.s.myWorries, ...WORRIES].find((x) => x.id === id);
  if (!w) return <div className="container"><Empty text="고민을 찾을 수 없어요"><Link className="btn btn--line" to="/together/worries">목록으로</Link></Empty></div>;
  const comments = [...w.comments, ...(st.s.worryComments[w.id] ?? [])];
  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    st.patch((s) => ({ worryComments: { ...s.worryComments, [w.id]: [...(s.worryComments[w.id] ?? []), { id: uid('k'), author: ME.name, date: TODAY, body: text.trim(), helpful: 0 }] } }));
    st.award('상호작용', 5, '고민에 답변 남김');
    setText(''); st.toast('답변을 남겼어요');
  };
  const liked = !!st.s.worryLikes[w.id];
  return (
    <div className="container narrow">
      <Link to="/together/worries" className="linkbtn"><Icon name="left" size={14} /> 고민 목록</Link>
      <Panel className="mt">
        <div className="detail-meta"><Avatar name={w.author} size={44} /><div><b>{w.author}</b><span>{fmtDate(w.date)} · #{w.tag}</span></div><Chip tone={w.solved ? 'green' : 'orange'}>{w.solved ? '해결됨' : '답변 기다리는 중'}</Chip></div>
        <h1 className="h2">{w.title}</h1>
        <p className="lead">{w.body}</p>
        <div className="row-between">
          <button className={`btn btn--sm ${liked ? 'btn--pink' : 'btn--line'}`} onClick={() => st.toggle('worryLikes', w.id)}><Icon name="heart" size={14} />공감 {w.likes + (liked ? 1 : 0)}</button>
          <Link to={`/together/mentors?field=${encodeURIComponent({ '수업 고민': '수업·평가', 생활지도: '생활교육', '업무 효율화': '업무 역량', '진로/진학': '진로교육', '학부모 소통': '학급경영', '마음 돌봄': '정신건강·자기돌봄' }[w.tag] ?? '')}`} className="btn btn--sm btn--line"><Icon name="users" size={14} />이 분야 멘토 찾기</Link>
        </div>
      </Panel>
      <Panel title={`답변 ${comments.length}`}>
        <ul className="comments">
          {comments.map((c) => {
            const h = !!st.s.helpful[c.id];
            return (
              <li key={c.id}>
                <Avatar name={c.author} size={34} />
                <div>
                  <p className="comments__who"><b>{c.author}</b>{c.badge && <Chip tone="purple" solid><Icon name="shield" size={11} /> {c.badge}</Chip>}<span className="mono">{c.date}</span></p>
                  <p>{c.body}</p>
                  <button className={`likebtn ${h ? 'is-on' : ''}`} onClick={() => { st.toggle('helpful', c.id); if (!h) st.toast('도움됨을 눌렀어요 · 답변한 선생님의 상호작용 포인트가 쌓여요'); }}><Icon name="thumb" size={14} />도움됨 {c.helpful + (h ? 1 : 0)}</button>
                </div>
              </li>
            );
          })}
        </ul>
        {!comments.length && <Empty text="첫 답변을 남겨 주세요" />}
        <form className="inline-form" onSubmit={send}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="경험이나 생각을 나눠 주세요" aria-label="답변 입력" />
          <button className="btn btn--green btn--sm" type="submit"><Icon name="send" size={14} />답변</button>
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
  useEffect(() => { const m = MENTORS.find((x) => x.id === sp.get('m')); if (m) setPick(m); }, [sp]);
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
      <PageHead crumbs={['동행', '멘토 찾기 및 신청']} code="4.1 · 멘토 찾기 및 신청" title="멘토 찾기" desc="누구나 멘토이자 멘티가 됩니다. 수석교사, 각종 지원단, 교권보호지원단처럼 검증된 전문가는 우수멘토로 표시돼요." />
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
                <Chip tone={cur >= 4 ? 'green' : cur === 0 ? 'orange' : 'blue'} solid>{MENTORING_STEPS[cur]}</Chip>
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
