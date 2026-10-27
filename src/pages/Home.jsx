// 첫 화면: 성장 콘텐츠와 고민 나눔을 한눈에(TF 확정안, 개선 제안서 제안 1 시안 응용)
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DELIVERY_LABEL, trainingState } from '../components/cards.jsx';
import Icon from '../components/Icon.jsx';
import { Avatar, Chip, Panel, Tabs, num, shortDate } from '../components/ui.jsx';
import { AREA_QUESTIONS, AREAS, BADGES, MATERIALS, ME, MODULES, SCALE, TODAY, TRAININGS, WORRIES, expertAreas } from '../data/seed.js';
import { sortByProfile } from '../fit.js';
import { matCat, thumbsFor } from '../thumbs.js';
import { uid, useStore } from '../store.jsx';

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

function AskForm({ onPosted }) {
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
    onPosted?.();
  };
  return (
    <form className="hp__ask" onSubmit={post}>
      <Avatar name={ME.name} size={34} />
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="교육 현장의 고민을 남겨 주세요." rows={2} aria-label="고민 입력" />
      <button className="btn btn--green btn--sm" type="submit">등록</button>
    </form>
  );
}

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


// 고민별 입구. 녹음의 "수업, 생활지도, AI 디지털 도구, 마음 돌보기, 업무 효율화"
const LANES = [
  { key: 'teach', label: '수업이 고민일 때', icon: 'target', tone: 'blue', cats: ['수업·평가', '교육과정'] },
  { key: 'life', label: '생활지도·학부모', icon: 'heart', tone: 'pink', cats: ['생활교육', '학급경영'] },
  { key: 'change', label: 'AI·디지털 도구', icon: 'spark', tone: 'purple', cats: ['디지털·AI'] },
  { key: 'self', label: '지친 마음 돌보기', icon: 'leaf', tone: 'green', cats: ['정신건강·자기돌봄'] },
  { key: 'mgmt', label: '업무 효율화', icon: 'clock', tone: 'orange', cats: ['업무 역량'] },
];
const CAT_THUMB = { '수업·평가': 0, 교육과정: 1, 생활교육: 2, 학급경영: 2, '디지털·AI': 3, '정신건강·자기돌봄': 1, '업무 역량': 4, 진로교육: 4 };

// 연수·배움 모듈·교육자료를 '성장 콘텐츠' 한 줄로 모은다. 카드를 누르면 원래 화면으로 간다.
function useContents() {
  const { s } = useStore();
  const p = s.profile;
  const canSee = (m) => m.mine || m.share === '전체' || (m.share === '우리 학교' && m.school === p.school);
  return [
    ...[...s.myModules, ...MODULES].filter(canSee).map((m) => ({ id: `m-${m.id}`, kind: '모듈', icon: 'layers', title: m.title, who: m.author, where: m.school, meta: `${m.weeks}주 과정`, likes: m.likes, users: m.learners, cat: m.cat, level: m.level ?? '전체', subject: m.subject, to: '/learn/modules', share: m.share })),
    ...TRAININGS.filter((t) => trainingState(t, s) !== 'closed').map((t) => ({ id: `t-${t.id}`, kind: '연수', icon: 'school', title: t.title, who: t.host, where: `${t.type === '직무' ? '직무연수' : '자율연수'} · 인정 ${t.hours}시간`, meta: DELIVERY_LABEL[t.delivery], likes: t.reviews, users: t.applied, cat: t.cat, level: t.level, subject: t.subject, to: `/learn/trainings?q=${encodeURIComponent(t.title)}` })),
    ...[...s.myMaterials, ...MATERIALS].filter((m) => !m.live).map((m) => ({ id: `a-${m.id}`, kind: '자료', icon: 'file', title: m.title, who: m.author, where: m.school, meta: m.type, likes: m.likes, users: m.downloads, cat: matCat(m), level: m.level, subject: m.subject, to: `/learn/materials/${m.id}` })),
  ];
}

// 첫 화면 격자: 0번 큰 카드가 왼쪽 두 줄, 1·2번이 윗줄, 3·4번이 아랫줄. [이웃 번호, 겹칠 때 벌점]
const HOME_NEAR = [[], [[0, 100]], [[1, 100], [0, 5]], [[0, 100], [1, 100], [2, 5]], [[3, 100], [2, 100], [1, 5], [0, 5]]];

function ContentCard({ c, big, img }) {
  return (
    <Link to={c.to} className={`fc ${big ? 'fc--big' : ''}`}>
      <div className={`fc__thumb thumb--${CAT_THUMB[c.cat] ?? 0} ${img ? 'has-img' : ''}`}>
        {img ? <img className="thumb__img" src={img} alt="" loading="lazy" decoding="async" /> : <Icon name={c.icon} size={big ? 40 : 28} />}
        <span className="fc__kind">{c.kind}</span>
      </div>
      <div className="fc__body">
        <div className="chips"><Chip>{c.cat}</Chip>{c.share === '우리 학교' && <Chip tone="orange" solid>우리 학교</Chip>}</div>
        <b className="fc__title">{c.title}</b>
        <span className="fc__who"><Avatar name={c.who} size={22} /> {c.who} · {c.where}</span>
        <span className="fc__meta mono"><span className="nowrap"><Icon name="heart" size={13} /> {num(c.likes)}</span><span className="nowrap"><Icon name="users" size={13} /> {num(c.users)}</span><span className="nowrap"><Icon name="clock" size={13} /> {c.meta}</span></span>
      </div>
    </Link>
  );
}

function Worries() {
  const st = useStore();
  const { s } = st;
  const live = useLive();
  const [seen, setSeen] = useState(false);
  const [sort, setSort] = useState('공감 많은 순');
  const fresh = WORRIES.filter((w) => w.live && live && seen);
  const rest = [...s.myWorries, ...WORRIES.filter((w) => !w.live)];
  const list = [...fresh, ...(sort === '공감 많은 순' ? [...rest].sort((a, b) => b.likes - a.likes) : rest)].slice(0, 4);
  return (
    <Panel className="home__side" tone="purple" icon="message" title="고민 나눔" code="동행 · 4.1" more="/together/worries">
      <AskForm onPosted={() => setSort('최신순')} />
      <div className="row-between">
        <Tabs size="sm" value={sort} onChange={setSort} items={['공감 많은 순', '최신순']} />
        {live && !seen && <button className="newpill" onClick={() => { setSeen(true); setSort('최신순'); }}><Icon name="refresh" size={14} />새 고민 1개</button>}
      </div>
      <div className="hworries">{list.map((w) => <HomeWorry key={w.id} w={w} fresh={!!w.live || (w.mine && w.date === TODAY)} />)}</div>
    </Panel>
  );
}

export default function Home() {
  const st = useStore();
  const p = st.s.profile;
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [lane, setLane] = useState(null);
  const [sort, setSort] = useState('나에게 맞는 순');
  const all = useContents();
  const cur = LANES.find((l) => l.key === lane);
  const pool = all.filter((c) => !cur || cur.cats.includes(c.cat));
  const popular = [...pool].sort((a, b) => (b.likes + b.users / 10) - (a.likes + a.users / 10));
  const ranked = sort === '나에게 맞는 순' ? sortByProfile(popular, p) : popular;
  // 모듈·연수·자료가 골고루 보이게 종류별로 번갈아 고른다(원격 연수의 큰 신청자 수가 위를 다 차지하지 않게)
  const byKind = ['모듈', '연수', '자료'].map((k) => ranked.filter((c) => c.kind === k));
  const shown = [];
  for (let i = 0; shown.length < 5 && i < ranked.length; i += 1) byKind.forEach((list) => { if (list[i] && shown.length < 5) shown.push(list[i]); });
  const imgs = thumbsFor(shown, (c) => c.cat, (i) => HOME_NEAR[i] ?? []);
  const got = BADGES.filter((b) => b.got).length;
  const search = (e) => { e.preventDefault(); if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`); };
  return (
    <div className="container home">
      <section className="home__hero">
        <div>
          <span className="mono c-orange">{p.band}{p.subject ? ` · ${p.subject}` : ''} 선생님께 맞춘 성장 콘텐츠</span>
          <h1>오늘은 무엇을 둘러볼까요?</h1>
          <p>설문 없이 바로 보세요. 고민별 입구를 누르면 그때 한 가지만 여쭤볼게요.</p>
        </div>
        <form className="home__search" onSubmit={search} role="search">
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="고민이나 주제로 찾기 (예: 질문 수업, 학부모 상담, 쉼)" aria-label="고민이나 주제로 찾기" />
          <button className="btn btn--dark btn--sm" type="submit">찾기</button>
        </form>
      </section>

      <div className="home__main">
        <section className="home__contents">
          <div className="lanes" role="tablist" aria-label="고민별 입구">
            {LANES.map((l) => {
              const n = all.filter((c) => l.cats.includes(c.cat)).length;
              return (
                <button key={l.key} role="tab" aria-selected={lane === l.key} className={`lane ${lane === l.key ? 'is-on' : ''}`} onClick={() => setLane(lane === l.key ? null : l.key)}>
                  <span className={`lane__icon tone-${l.tone}`}><Icon name={l.icon} size={18} /></span>
                  <b>{l.label}</b>
                  <span className="mono">{n}개 콘텐츠</span>
                </button>
              );
            })}
          </div>
          {cur && <QuickDiag areaKey={cur.key} />}
          <div className="row-between">
            <h2 className="home__h2">{cur ? `${cur.label} · 볼 만한 콘텐츠` : '이번 주 선생님들이 많이 본 성장 콘텐츠'}</h2>
            <Tabs size="sm" value={sort} onChange={setSort} items={['나에게 맞는 순', '인기순']} />
          </div>
          <div className={`fc-grid ${shown.length === 4 ? 'fc-grid--n4' : ''}`}>{shown.map((c, i) => <ContentCard key={c.id} c={c} big={i === 0} img={imgs[i]} />)}</div>
          <div className="row-end"><Link to="/learn/trainings" className="more">연수 더 보기 <Icon name="right" size={13} /></Link><Link to="/learn/modules" className="more">배움 모듈 더 보기 <Icon name="right" size={13} /></Link><Link to="/learn/materials" className="more">교육자료 더 보기 <Icon name="right" size={13} /></Link></div>
        </section>
        <Worries />
      </div>

      <div className="home__soft">
        <span className="home__soft-ic tone-green"><Icon name="compass" size={18} /></span>
        <span>나에게 맞는 성장 컨텐츠를 더 정확히 찾고 싶다면 <b>성장 설계</b>를 해 보세요.</span>
        <Link to="/growth/journey" className="mono home__mine">내 성장 여정 · 뱃지 {got}개 · 전문가 {expertAreas().length}개 영역</Link>
        <Link to="/growth/design" className="btn btn--sm btn--green">3분 성장 설계</Link>
      </div>
    </div>
  );
}
