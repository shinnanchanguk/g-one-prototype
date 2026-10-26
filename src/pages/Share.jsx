import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CommunityCard, OpenClassModal } from '../components/cards.jsx';
import { GyeonggiMap, MonthCalendar } from '../components/charts.jsx';
import Icon from '../components/Icon.jsx';
import { Avatar, Chip, Empty, Field, Modal, PageHead, Panel, SearchBox, Select, Tabs, fmtDate, num, shortDate } from '../components/ui.jsx';
import { BOARD_TABS, COMM_POSTS, COMM_TYPES, COMMUNITIES, LEVEL_COLOR, LEVELS, ME, OFFICES, OPEN_CLASSES, OUTCOMES, TODAY } from '../data/seed.js';
import { uid, useStore } from '../store.jsx';

export function OpenClasses() {
  const st = useStore();
  const [view, setView] = useState('cal');
  const [tab, setTab] = useState('explore');
  const [ym, setYm] = useState([2026, 11]);
  const [scope, setScope] = useState('전체');
  const [lvl, setLvl] = useState('전체');
  const [sel, setSel] = useState(null);
  const [open, setOpen] = useState(null);
  const [f, setF] = useState({ date: '2026-12-02', time: '10:40~11:20', subject: '', topic: '', grade: '', scope: '지원청', cap: 20 });
  const all = [...st.s.myClasses, ...OPEN_CLASSES];
  const list = all.filter((o) => (scope === '전체' || o.scope === scope) && (lvl === '전체' || o.level === lvl));
  const move = (d) => setYm(([y, m]) => { const n = m + d; return n < 1 ? [y - 1, 12] : n > 12 ? [y + 1, 1] : [y, n]; });
  const mine = OPEN_CLASSES.filter((o) => st.s.classApps[o.id]);

  const submit = (e) => {
    e.preventDefault();
    if (!f.subject.trim() || !f.topic.trim()) { st.toast('과목과 수업 주제를 적어 주세요', 'warn'); return; }
    const o = { id: uid('o'), ...f, city: '수원시', school: ME.school, level: '초등학교', teacher: ME.name, applied: 0, mode: '대면', office: f.scope === '도' ? '경기도교육청' : ME.office, cap: Number(f.cap), mine: true };
    st.patch((s) => ({ myClasses: [o, ...s.myClasses] }));
    st.award('활동', 50, `수업 공개 등록: ${o.topic}`);
    st.toast('공개수업을 등록했어요 · 달력과 지도에 바로 보여요');
    setTab('explore'); setYm([Number(f.date.slice(0, 4)), Number(f.date.slice(5, 7))]);
  };

  return (
    <div className="container">
      <PageHead crumbs={['나눔', '공개수업']} code="3.1 · 공개하기 · 참관하기 · 신청 현황" title="공개수업" desc="경기도 안의 모든 공개수업을 월별 달력과 지도로 찾아보고, 참관을 신청해 성장 여정에 연결합니다." />
      <Tabs value={tab} onChange={setTab} className="tabs--page" items={[{ value: 'explore', label: '참관하기', icon: 'eye' }, { value: 'open', label: '공개하기', icon: 'video' }, { value: 'status', label: `신청 현황 (${mine.length})`, icon: 'list' }]} />

      {tab === 'explore' && (
        <>
          <div className="filters">
            <div className="seg" role="tablist" aria-label="보기 방식">
              <button role="tab" aria-selected={view === 'cal'} className={view === 'cal' ? 'is-on' : ''} onClick={() => setView('cal')}><Icon name="calendar" size={16} />달력형</button>
              <button role="tab" aria-selected={view === 'map'} className={view === 'map' ? 'is-on' : ''} onClick={() => setView('map')}><Icon name="map" size={16} />지도형</button>
            </div>
            <Tabs size="sm" value={scope} onChange={setScope} items={[{ value: '전체', label: '전체' }, { value: '도', label: '도 단위' }, { value: '지원청', label: '지원청 단위' }]} />
            <Select label="학교급" value={lvl} onChange={setLvl} options={['전체', ...LEVELS]} />
          </div>
          {view === 'cal' ? (
            <Panel>
              <MonthCalendar year={ym[0]} month={ym[1]} items={list} onOpen={setOpen} onMove={move} />
              <ul className="legend"><li><span className="dot bg-orange" />도 단위 공개</li><li><span className="dot bg-blue" />지원청 단위 공개</li></ul>
            </Panel>
          ) : (
            <div className="mapwrap">
              <Panel className="mapwrap__map"><GyeonggiMap items={list.filter((o) => o.date >= TODAY)} selected={sel} onSelect={setSel} onOpen={setOpen} /></Panel>
              <Panel className="mapwrap__list" title="다가오는 공개수업" code={`${list.filter((o) => o.date >= TODAY).length}건`}>
                <ul className="olist">
                  {list.filter((o) => o.date >= TODAY).sort((a, b) => a.date.localeCompare(b.date)).map((o) => (
                    <li key={o.id} className={sel === o.id ? 'is-sel' : ''}>
                      <button onClick={() => setSel(o.id)}>
                        <span className={`dot bg-${LEVEL_COLOR[o.level]}`} />
                        <span><b>{o.subject} · {o.topic}</b><small>{shortDate(o.date)} {o.time} · {o.school} · {o.scope === '도' ? '도 단위' : o.office.replace('교육지원청', '')}</small></span>
                        {st.s.classApps[o.id] && <Chip tone="blue">신청함</Chip>}
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          )}
        </>
      )}

      {tab === 'open' && (
        <form className="grid2" onSubmit={submit}>
          <Panel title="내 수업 공개하기" desc="공개 범위를 고르면 도 단위 또는 지원청 달력에 올라갑니다.">
            <div className="row2">
              <Field label="날짜"><input className="input" type="date" value={f.date} min={TODAY} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
              <Field label="시간"><input className="input" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
            </div>
            <div className="row2">
              <Field label="과목"><input className="input" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="수학" /></Field>
              <Field label="학년·반"><input className="input" value={f.grade} onChange={(e) => setF({ ...f, grade: e.target.value })} placeholder="6학년 3반" /></Field>
            </div>
            <Field label="수업 주제"><input className="input" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} placeholder="예) 비례식을 생활 문제로 풀기" /></Field>
            <div className="row2">
              <Field label="공개 범위"><select className="input" value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })}><option value="지원청">지원청 단위 ({ME.office})</option><option value="도">도 단위</option></select></Field>
              <Field label="참관 정원"><input className="input" type="number" min={1} max={60} value={f.cap} onChange={(e) => setF({ ...f, cap: e.target.value })} /></Field>
            </div>
            <button className="btn btn--dark" type="submit"><Icon name="video" size={16} />공개수업 등록</button>
          </Panel>
          <Panel dark title="공개하면 이렇게 연결돼요">
            <ul className="flow">
              <li><span className="mono">01</span>달력과 지도에 바로 표시</li>
              <li><span className="mono">02</span>참관 신청이 오면 알림</li>
              <li><span className="mono">03</span>수업 뒤 협의회 자료 공유</li>
              <li><span className="mono">04</span>성장 여정에 수업 나눔 1회 기록 · 활동 포인트 +50</li>
            </ul>
          </Panel>
        </form>
      )}

      {tab === 'status' && (
        <Panel title="참관 신청 현황" desc="신청 현황은 성장 > 성장 여정에 함께 기록됩니다.">
          {mine.length ? <ul className="olist">{mine.map((o) => (
            <li key={o.id}><button onClick={() => setOpen(o)}>
              <span className={`dot bg-${LEVEL_COLOR[o.level]}`} />
              <span><b>{o.subject} · {o.topic}</b><small>{fmtDate(o.date)} {o.time} · {o.school} · 신청일 {st.s.classApps[o.id]}</small></span>
              <Chip tone={o.date < TODAY ? 'ink' : 'green'}>{o.date < TODAY ? '참관 완료' : '참관 예정'}</Chip>
            </button></li>
          ))}</ul> : <Empty text="아직 참관 신청이 없어요" />}
          {st.s.myClasses.length > 0 && <>
            <p className="field__label mt">내가 공개한 수업</p>
            <ul className="olist">{st.s.myClasses.map((o) => <li key={o.id}><button onClick={() => setOpen(o)}><span className="dot bg-orange" /><span><b>{o.subject} · {o.topic}</b><small>{fmtDate(o.date)} {o.time} · {o.scope === '도' ? '도 단위' : '지원청 단위'}</small></span><Chip tone="orange">공개 예정</Chip></button></li>)}</ul>
          </>}
        </Panel>
      )}

      <OpenClassModal o={open} onClose={() => setOpen(null)} />
    </div>
  );
}

export function Communities() {
  const st = useStore();
  const [tab, setTab] = useState('find');
  const [q, setQ] = useState('');
  const [type, setType] = useState('전체');
  const [region, setRegion] = useState('전체 지역');
  const [f, setF] = useState({ type: '전문적학습공동체', name: '', desc: '', region: '수원', tags: '' });
  const all = [...st.s.myComms, ...COMMUNITIES];
  const list = all.filter((c) => (type === '전체' || c.type === type) && (region === '전체 지역' || c.region === region || c.region === '도 단위') && (!q || (c.name + c.desc + c.tags.join(' ')).includes(q)));
  const mine = all.filter((c) => c.mine || st.s.joinedComms[c.id]);
  const make = (e) => {
    e.preventDefault();
    if (!f.name.trim() || !f.desc.trim()) { st.toast('공동체 이름과 소개를 적어 주세요', 'warn'); return; }
    const c = { id: uid('c'), type: f.type, name: f.name.trim(), desc: f.desc.trim(), members: 1, region: f.region, level: '전체', leader: ME.name, since: '2026', tags: f.tags.split(/[,\s]+/).filter(Boolean).slice(0, 4), mine: true };
    st.patch((s) => ({ myComms: [c, ...s.myComms] }));
    st.award('활동', 30, `공동체 만들기: ${c.name}`);
    st.toast('공동체를 만들었어요');
    setTab('mine');
  };
  return (
    <div className="container">
      <PageHead crumbs={['나눔', '공동체']} code="3.2 · 공동체 찾기 · 공동체 만들기 · 나의 공동체" title="공동체" desc="연구회, 전문적학습공동체, 교원 자율 동호회를 한곳에서 찾고, 실천 사례와 자료를 나누며 활동을 성장 여정에 연결합니다." />
      <Tabs value={tab} onChange={setTab} className="tabs--page" items={[{ value: 'find', label: `공동체 찾기 (${all.length})`, icon: 'search' }, { value: 'mine', label: `나의 공동체 (${mine.length})`, icon: 'heart' }, { value: 'make', label: '공동체 만들기', icon: 'plus' }]} />
      {tab === 'find' && <>
        <div className="filters">
          <SearchBox value={q} onChange={setQ} placeholder="이름, 주제, 태그로 찾기" />
          <Select label="지역" value={region} onChange={setRegion} options={['전체 지역', ...OFFICES.map((o) => o.short)]} />
        </div>
        <div className="typebar">
          {['전체', ...Object.keys(COMM_TYPES)].map((t) => (
            <button key={t} className={`typebar__b ${type === t ? 'is-on' : ''} ${t !== '전체' ? `typebar__b--${COMM_TYPES[t]}` : ''}`} onClick={() => setType(t)}>
              {t !== '전체' && <span className={`dot bg-${COMM_TYPES[t]}`} />}{t}<span className="mono">{all.filter((c) => t === '전체' || c.type === t).length}</span>
            </button>
          ))}
        </div>
        {(type === '전체' ? Object.keys(COMM_TYPES) : [type]).map((t) => {
          const sub = list.filter((c) => c.type === t);
          if (!sub.length) return null;
          return (
            <section key={t} className={`cgroup cgroup--${COMM_TYPES[t]}`}>
              <h2 className="cgroup__title"><span className={`dot bg-${COMM_TYPES[t]}`} />{t}<span className="mono">{sub.length}</span></h2>
              <div className="cgrid">{sub.map((c) => <CommunityCard key={c.id} c={c} />)}</div>
            </section>
          );
        })}
        {!list.length && <Empty text="조건에 맞는 공동체가 없어요. 직접 만들어 보세요." ><button className="btn btn--dark" onClick={() => setTab('make')}>공동체 만들기</button></Empty>}
      </>}
      {tab === 'mine' && <div className="cgrid">{mine.map((c) => <CommunityCard key={c.id} c={c} />)}</div>}
      {tab === 'make' && (
        <form className="grid2" onSubmit={make}>
          <Panel title="새 공동체 만들기">
            <Field label="유형">
              <div className="seg seg--full">{Object.keys(COMM_TYPES).map((t) => <button type="button" key={t} className={f.type === t ? 'is-on' : ''} onClick={() => setF({ ...f, type: t })}><span className={`dot bg-${COMM_TYPES[t]}`} />{t}</button>)}</div>
            </Field>
            <Field label="이름"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="예) 수원 초등 질문수업 모임" /></Field>
            <Field label="소개"><textarea className="ta" rows={3} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} /></Field>
            <div className="row2">
              <Field label="활동 지역"><select className="input" value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })}>{['도 단위', ...OFFICES.map((o) => o.short)].map((r) => <option key={r}>{r}</option>)}</select></Field>
              <Field label="태그" hint="쉼표로 나눠요"><input className="input" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} placeholder="수학, 질문" /></Field>
            </div>
            <button className="btn btn--dark" type="submit"><Icon name="plus" size={16} />만들기</button>
          </Panel>
          <Panel dark title="공동체 게시판은 이렇게 열려요">
            <div className="chips">{BOARD_TABS.map((b) => <span key={b} className="chip chip--glass">{b}</span>)}</div>
            <p className="lead">일정과 공지, 자료나눔, 실천 성찰, 함께 연구, 사진·영상까지 일곱 개 게시판이 자동으로 만들어집니다.</p>
          </Panel>
        </form>
      )}
    </div>
  );
}

export function CommunityDetail() {
  const { id } = useParams();
  const st = useStore();
  const c = [...st.s.myComms, ...COMMUNITIES].find((x) => x.id === id);
  const [board, setBoard] = useState('전체 활동');
  const [writing, setWriting] = useState(false);
  const [f, setF] = useState({ board: '자료나눔', title: '', body: '' });
  const [openPost, setOpenPost] = useState(null);
  if (!c) return <div className="container"><Empty text="공동체를 찾을 수 없어요"><Link className="btn btn--line" to="/share/communities">목록으로</Link></Empty></div>;
  const joined = c.mine || !!st.s.joinedComms[c.id];
  const posts = [...(st.s.commPosts[c.id] ?? []), ...(COMM_POSTS[c.id] ?? [])];
  const shown = posts.filter((p) => board === '전체 활동' || p.board === board);
  const write = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    const p = { id: uid('p'), ...f, title: f.title.trim(), author: ME.name, date: TODAY, comments: 0 };
    st.patch((s) => ({ commPosts: { ...s.commPosts, [c.id]: [p, ...(s.commPosts[c.id] ?? [])] } }));
    st.award('활동', f.board === '실천 성찰' ? 15 : 10, `공동체 글: ${p.title}`);
    st.toast('글을 올렸어요');
    setWriting(false); setF({ board: '자료나눔', title: '', body: '' }); setBoard(p.board);
  };
  return (
    <div className="container">
      <div className={`chero chero--${COMM_TYPES[c.type]}`}>
        <Link to="/share/communities" className="linkbtn"><Icon name="left" size={14} /> 공동체 목록</Link>
        <span className="mono">{c.type} · {c.region} · {c.since}년부터</span>
        <h1>{c.name}</h1>
        <p>{c.desc}</p>
        <div className="chero__foot">
          <span><Icon name="users" size={15} /> 멤버 {num(c.members + (st.s.joinedComms[c.id] ? 1 : 0))}명 · 대표 {c.leader}</span>
          <div className="row-end">
            {!c.mine && <button className={`btn ${joined ? 'btn--line' : 'btn--light'}`} onClick={() => { st.toggle('joinedComms', c.id); st.toast(joined ? '공동체에서 나왔어요' : '공동체에 함께해요'); }}>{joined ? '참여 중' : '가입 신청'}</button>}
            <button className="btn btn--light" disabled={!joined} onClick={() => setWriting(true)}><Icon name="edit" size={15} />글쓰기</button>
          </div>
        </div>
      </div>
      <Tabs value={board} onChange={setBoard} className="tabs--page" items={BOARD_TABS.map((b) => ({ value: b, label: `${b}${b === '전체 활동' ? ` (${posts.length})` : ''}` }))} />
      <Panel>
        {shown.length ? (
          <ul className="board">
            {shown.map((p) => (
              <li key={p.id}><button onClick={() => setOpenPost(p)}>
                <Chip tone={{ 공지사항: 'orange', 일정: 'blue', 자료나눔: 'purple', '실천 성찰': 'green', '함께 연구': 'sky', '사진·영상': 'pink' }[p.board]}>{p.board}</Chip>
                <b>{p.title}</b>
                <span className="board__meta">{p.author} · {shortDate(p.date)} · 댓글 {p.comments}</span>
              </button></li>
            ))}
          </ul>
        ) : <Empty text={joined ? '첫 글을 남겨 보세요' : '가입하면 글을 쓸 수 있어요'} />}
      </Panel>
      <Modal open={writing} onClose={() => setWriting(false)} title="공동체에 글쓰기" footer={<button className="btn btn--dark" onClick={write}>올리기</button>}>
        <form onSubmit={write} className="form">
          <Field label="게시판"><select className="input" value={f.board} onChange={(e) => setF({ ...f, board: e.target.value })}>{BOARD_TABS.slice(1).map((b) => <option key={b}>{b}</option>)}</select></Field>
          <Field label="제목"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="내용"><textarea className="ta" rows={5} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
        </form>
      </Modal>
      <Modal open={!!openPost} onClose={() => setOpenPost(null)} title={openPost?.title}>
        {openPost && <><div className="detail-meta"><Avatar name={openPost.author} size={36} /><div><b>{openPost.author}</b><span>{fmtDate(openPost.date)} · {openPost.board}</span></div></div><p className="lead">{openPost.body || '내용이 없습니다.'}</p></>}
      </Modal>
    </div>
  );
}

export function Outcomes() {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('전체');
  const [year, setYear] = useState('전체 연도');
  const [open, setOpen] = useState(null);
  const list = OUTCOMES.filter((o) => (kind === '전체' || o.kind === kind) && (year === '전체 연도' || String(o.year) === year) && (!q || (o.title + o.summary + o.school + o.tags.join(' ')).includes(q)));
  const tone = { 선도학교: 'blue', 실천학교: 'green', 연구년제: 'purple' };
  return (
    <div className="container">
      <PageHead crumbs={['나눔', '성과나눔']} code="3.3 · 성과 나누기 · 살펴보기" title="성과나눔" desc="선도학교, 실천학교, 연구년제의 사례를 한 번에 검색해 찾아봅니다." />
      <div className="filters">
        <SearchBox value={q} onChange={setQ} placeholder="주제, 학교, 태그로 통합 검색" />
        <Select label="연도" value={year} onChange={setYear} options={['전체 연도', '2026', '2025']} />
      </div>
      <Tabs size="sm" value={kind} onChange={setKind} items={['전체', '선도학교', '실천학교', '연구년제'].map((k) => ({ value: k, label: `${k} (${OUTCOMES.filter((o) => k === '전체' || o.kind === k).length})` }))} />
      <div className="ogrid">
        {list.map((o) => (
          <button key={o.id} className={`ocard ocard--${tone[o.kind]}`} onClick={() => setOpen(o)}>
            <span className="ocard__band"><span className="mono">{o.kind}</span><span className="mono">{o.year}</span></span>
            <b>{o.title}</b>
            <span className="ocard__school">{o.school} · {o.region}</span>
            <span className="ocard__sum">{o.summary}</span>
            <span className="chips">{o.tags.map((t) => <Chip key={t}>#{t}</Chip>)}</span>
            <span className="mono ocard__views"><Icon name="eye" size={13} /> {num(o.views)}</span>
          </button>
        ))}
      </div>
      {!list.length && <Empty text="검색 결과가 없어요" />}
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title} footer={<button className="btn btn--line" onClick={() => setOpen(null)}>닫기</button>}>
        {open && <><div className="chips"><Chip tone={tone[open.kind]} solid>{open.kind}</Chip><Chip>{open.year}년</Chip><Chip>{open.level}</Chip></div>
          <dl className="dl"><dt>학교·기관</dt><dd>{open.school}</dd><dt>지역</dt><dd>{open.region}</dd><dt>조회</dt><dd>{num(open.views)}</dd></dl>
          <p className="lead">{open.summary}</p>
          <ul className="files"><li><Icon name="file" size={18} /><span>{open.title}_보고서.pdf</span></li><li><Icon name="image" size={18} /><span>운영 사진 모음</span></li></ul></>}
      </Modal>
    </div>
  );
}
