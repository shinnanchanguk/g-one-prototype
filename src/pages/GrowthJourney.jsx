import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Avatar, Chip, Empty, Field, PageHead, Panel, Progress, Stat, Tabs, fmtDate, num, shortDate } from '../components/ui.jsx';
import { AreaLadder, BadgeHex, STAGE_TONE as KIND_TONE } from '../components/cards.jsx';
import { AREAS, BADGE_STAGES, BADGES, COMMUNITIES, EXPERT_RULE, MATERIALS, ME, OPEN_CLASSES, ROOMS, TODAY, TRAININGS, areaOf, badgeOf, expertAreas } from '../data/seed.js';
import { uid, useStore } from '../store.jsx';

const STAGES = BADGE_STAGES.map((sg) => sg.key);
const doneOf = (a) => BADGE_STAGES.filter((sg) => badgeOf(a.key, sg.key)?.got).length;

function Roadmap() {
  const st = useStore();
  const done = st.s.taskDone ?? {};
  const toggle = (gid, i, cur) => {
    st.patch((s) => ({ taskDone: { ...(s.taskDone ?? {}), [`${gid}-${i}`]: !cur } }));
    if (!cur) { st.award('활동', 10, '성장 과제 완료'); st.toast('과제를 마쳤어요 · 활동 포인트 +10'); }
  };
  return (
    <div className="goals">
      {st.goalsAll.map((g) => {
        const states = g.tasks.map((t, i) => done[`${g.id}-${i}`] ?? t.done);
        const pct = Math.round((states.filter(Boolean).length / g.tasks.length) * 100);
        return (
          <article key={g.id} className="goal">
            <div className="goal__head">
              <div><span className="mono">목표 · {shortDate(g.created)} 설계 · {AREAS.find((a) => a.key === g.area)?.name}</span><h3>{g.title}</h3></div>
              <b className="goal__pct">{pct}%</b>
            </div>
            <Progress value={pct} tone="green" />
            <ul className="goal__tasks">
              {g.tasks.map((t, i) => (
                <li key={i} className={states[i] ? 'is-done' : ''}>
                  <button className="checkbtn" onClick={() => toggle(g.id, i, states[i])} aria-pressed={states[i]} aria-label={`${t.t} 완료 표시`}>{states[i] && <Icon name="check" size={14} stroke={2.4} />}</button>
                  <Chip tone={KIND_TONE[t.kind]}>{t.kind}</Chip><span>{t.t}</span>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
      <Link to="/growth/design" className="goal goal--new"><Icon name="plus" size={22} /><b>새 성장 목표 세우기</b><span>성장 설계에서 출발점을 찾고 목표를 더해요</span></Link>
    </div>
  );
}

function StageGuide() {
  return (
    <ol className="sguide">
      {BADGE_STAGES.map((sg) => (
        <li key={sg.key}><span className={`sguide__n tone-${sg.color}`}>{sg.step}</span><div><b>{sg.key}</b><small>{sg.rule}</small></div><Icon name="right" size={16} className="sguide__arr" /></li>
      ))}
      <li className="sguide__end"><span className="sguide__n tone-ink"><Icon name="shield" size={15} /></span><div><b>그 영역 전문가</b><small>멘토 매칭 · 강사 인력풀 추천</small></div></li>
    </ol>
  );
}

function Album() {
  const st = useStore();
  const [view, setView] = useState('area');
  const [year, setYear] = useState(2026);
  const got = BADGES.filter((b) => b.got);
  const experts = expertAreas();
  const areas = [...AREAS].sort((a, b) => doneOf(b) - doneOf(a));
  const byYear = got.filter((b) => b.date.startsWith(String(year)));
  return (
    <div>
      <div className="album-points">
        <div><span className="mono">학습 포인트 · 활동형</span><b>{num(st.s.points.activity)}P</b><small>연수 이수 · 자료 업로드 · 공개수업 · 성장 기록</small></div>
        <div><span className="mono">상호작용 포인트</span><b>{num(st.s.points.interaction)}P</b><small>동료의 좋아요 · 도움됨 · 자료 활용 평가</small></div>
        <div><span className="mono">보유 뱃지</span><b>{got.length}개 · 전문가 {experts.length}개 영역</b><small>{STAGES.map((k) => `${k} ${got.filter((b) => b.stage === k).length}`).join(' · ')}</small></div>
      </div>
      <StageGuide />
      <div className="row-between">
        <Tabs size="sm" value={view} onChange={setView} items={[{ value: 'area', label: '영역별 단계 (10개 영역)' }, { value: 'year', label: '연도별 뱃지' }]} />
        {view === 'year' && <Tabs size="sm" value={year} onChange={setYear} items={[2026, 2025, 2024].map((y) => ({ value: y, label: `${y}년 (${got.filter((b) => b.date.startsWith(String(y))).length})` }))} />}
      </div>
      {view === 'area' ? (
        <div className="ladders">{areas.map((a) => <AreaLadder key={a.key} area={a} />)}</div>
      ) : (
        <div className="ybadges">
          {byYear.map((b) => (
            <div key={b.id} className="ybadge">
              <BadgeHex name={`${b.stage}`} stage={b.stage} got size={50} />
              <div><b>{areaOf(b.area).name} · {b.stage} 단계</b><small>{b.date.replaceAll('-', '. ')}. · {b.how}</small></div>
            </div>
          ))}
          {!byYear.length && <p className="empty-line">이 해에는 받은 뱃지가 없어요</p>}
        </div>
      )}
    </div>
  );
}

function Diary() {
  const st = useStore();
  const [f, setF] = useState({ kind: '배움', title: '', body: '', goal: '' });
  const [filter, setFilter] = useState('전체');
  const add = (e) => {
    e.preventDefault();
    if (!f.title.trim() || !f.body.trim()) { st.toast('제목과 내용을 적어 주세요', 'warn'); return; }
    st.patch((s) => ({ diary: [{ id: uid('d'), date: TODAY, ...f }, ...s.diary] }));
    st.award('활동', 15, `성장 일기: ${f.title}`);
    setF({ kind: '배움', title: '', body: '', goal: '' });
    st.toast('성장 일기를 저장했어요 · 활동 포인트 +15');
  };
  const list = st.diaryAll.filter((d) => filter === '전체' || d.kind === filter);
  return (
    <div className="grid2 grid2--diary">
      <form className="diaryform" onSubmit={add}>
        <p className="mono">오늘의 성장 일기 · {fmtDate(TODAY)}</p>
        <Tabs size="sm" value={f.kind} onChange={(k) => setF({ ...f, kind: k })} items={STAGES} />
        <Field label="제목"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="예) 짝 발표 두 번째 시도" /></Field>
        <Field label="기록"><textarea className="ta" rows={5} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="무엇을 했고, 무엇을 느꼈나요?" /></Field>
        <Field label="연결할 목표">
          <select className="input" value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })}>
            <option value="">선택 안 함</option>
            {st.goalsAll.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </Field>
        <button className="btn btn--dark" type="submit"><Icon name="edit" size={15} />일기 저장</button>
        <p className="field__hint">나이스 연수 기록과 별도로 내가 직접 남기는 기록이에요. 배움(배우고 해 본 것), 나눔(동료와 나눈 것), 동행(함께 도운 것)으로 나눠 쌓여요.</p>
      </form>
      <div>
        <Tabs size="sm" value={filter} onChange={setFilter} items={['전체', ...STAGES]} />
        <ol className="timeline">
          {list.map((d) => (
            <li key={d.id}>
              <span className="mono">{fmtDate(d.date)}</span>
              <div><Chip tone={KIND_TONE[d.kind]}>{d.kind}</Chip><b>{d.title}</b></div>
              <p>{d.body}</p>
              {d.goal && <small className="mono">목표 · {st.goalsAll.find((g) => g.id === d.goal)?.title}</small>}
            </li>
          ))}
          {!list.length && <Empty text="이 분류의 기록이 아직 없어요" />}
        </ol>
      </div>
    </div>
  );
}

function History() {
  const st = useStore();
  const { s } = st;
  const groups = [
    { title: '완료한 학습방', icon: 'book', rows: ROOMS.filter((r) => r.done).map((r) => [r.title, `${r.doneDate} 이수 · ${r.hours}시간`, '/learn/rooms']) },
    { title: '신청한 연수', icon: 'school', rows: TRAININGS.filter((t) => s.applied[t.id]).map((t) => [t.title, `${t.type}연수 · ${t.eduFrom} · ${t.host}`, '/learn/rooms']) },
    { title: '공개수업 참관 신청', icon: 'eye', rows: OPEN_CLASSES.filter((o) => s.classApps[o.id]).map((o) => [`${o.school} ${o.subject} · ${o.topic}`, `${o.date} ${o.time}`, '/share/classes']) },
    { title: '나의 수업 공개', icon: 'video', rows: [['한빛초 6학년 3반 수학 · 분수의 나눗셈, 질문으로 시작하기', '2026-10-27 · 지원청 단위', '/share/classes'], ...s.myClasses.map((o) => [`${o.subject} · ${o.topic}`, `${o.date} · 공개 신청`, '/share/classes'])] },
    { title: '멘토링 과정', icon: 'users', rows: st.mentoringsAll.map((m) => [`${m.role === '멘티' ? `${m.partner} 멘토` : `${m.partner} 멘티`} · ${m.topic}`, `${m.created} 신청`, '/together/mentoring']) },
    { title: '탑재한 교육자료', icon: 'upload', rows: [...s.myMaterials, ...MATERIALS.filter((m) => m.author === ME.name)].map((m) => [m.title, `${m.date} · 좋아요 ${m.likes}`, `/learn/materials/${m.id}`]) },
    { title: '소속 공동체', icon: 'heart', rows: [...s.myComms, ...COMMUNITIES.filter((c) => c.mine || s.joinedComms[c.id])].map((c) => [c.name, c.type, `/share/communities/${c.id}`]) },
  ];
  return (
    <div className="hgrid">
      {groups.map((g) => (
        <div key={g.title} className="hbox">
          <p className="hbox__title"><Icon name={g.icon} size={16} /><b>{g.title}</b><span className="mono">{g.rows.length}</span></p>
          <ul>{g.rows.map((r, i) => <li key={i}><Link to={r[2]}>{r[0]}</Link><span className="mono">{r[1]}</span></li>)}</ul>
          {!g.rows.length && <p className="empty-line">아직 기록이 없어요</p>}
        </div>
      ))}
    </div>
  );
}

// 동료의 추천·도움됨·자료 활용 평가도 함께 본다(보고서 1.2)
const REACTIONS = { mgmt: [228, 44, 4.8], teach: [216, 41, 4.7], change: [172, 18, 4.7], collab: [64, 9, 4.5] };
function Expert() {
  const [all, setAll] = useState(false);
  const sorted = [...AREAS].sort((a, b) => doneOf(b) - doneOf(a));
  const shown = all ? sorted : sorted.slice(0, 4);
  return (
    <div>
      <p className="lead">{EXPERT_RULE} 인증은 세 단계 뱃지로 판정하고, 동료의 추천(좋아요)·멘토링 뒤 도움됨·자료 활용 평가는 멘토 추천 순서에 함께 반영돼요.</p>
      <div className="experts">
        {shown.map((a) => {
          const r = REACTIONS[a.key];
          const step = BADGE_STAGES[doneOf(a)];
          return (
            <div key={a.key} className={`expert ${doneOf(a) === 3 ? 'is-ok' : ''}`}>
              <AreaLadder area={a} compact />
              <p className="expert__foot">{doneOf(a) === 3 ? '인증 완료 · 이 영역 멘토 추천에 이름이 올라가요' : `다음 단계: ${step.key} · ${badgeOf(a.key, step.key)?.how ?? step.rule}`}</p>
              {r && <p className="expert__react"><span className="mono">함께 보는 동료 반응</span>좋아요 {r[0]} · 도움됨 {r[1]} · 자료 활용 평점 {r[2]}</p>}
            </div>
          );
        })}
      </div>
      <button className="more mt" onClick={() => setAll(!all)}>{all ? '접기' : '10개 영역 모두 보기'}</button>
    </div>
  );
}

export default function GrowthJourney() {
  const st = useStore();
  const [tab, setTab] = useState('roadmap');
  const [editing, setEditing] = useState(false);
  const intro = st.s.intro ?? ME.intro;
  const [draft, setDraft] = useState(intro);
  const log = st.pointLogAll;
  const hours = ROOMS.filter((r) => r.done).reduce((a, r) => a + r.hours, 0) + TRAININGS.filter((t) => st.s.applied[t.id] && t.eduTo < TODAY).reduce((a, t) => a + t.hours, 0) + 27;
  const observed = Object.keys(st.s.classApps).length + 5;

  return (
    <div className="container">
      <PageHead crumbs={['성장', '성장 여정']} code="1.2 · 포트폴리오 · 뱃지 앨범" title="나의 성장 여정" desc="연수 이수, 멘토링, 연구 활동이 쌓여 뱃지와 포인트로 기록되는 한눈에 보는 성장 포트폴리오입니다." />

      <div className="journey-top">
        <Panel className="profile">
          <div className="profile__row">
            <Avatar name={ME.name} size={84} />
            <div className="profile__info">
              <h2>{ME.name} 선생님</h2>
              <p>{ME.school} · {ME.role} · {ME.career}</p>
              <p className="mono">{ME.subject}</p>
              <div className="chips">
                {expertAreas().map((a) => <Chip key={a.key} tone="green" solid><Icon name="shield" size={12} />{a.name} 전문가</Chip>)}
                <Chip tone="orange">나눔 단계 뱃지 · {BADGES.filter((b) => b.got && b.stage === '나눔').length}개 영역</Chip>
                <Chip tone="blue">{ME.instructorPool}</Chip>
                <Chip>{ME.office}</Chip>
              </div>
            </div>
          </div>
          {editing ? (
            <div className="inline-form inline-form--col">
              <textarea className="ta" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="소개글" />
              <div className="row-end">
                <button className="btn btn--sm btn--line" onClick={() => { setDraft(intro); setEditing(false); }}>취소</button>
                <button className="btn btn--sm btn--dark" onClick={() => { st.patch(() => ({ intro: draft })); setEditing(false); st.toast('소개글을 바꿨어요'); }}>저장</button>
              </div>
            </div>
          ) : (
            <p className="profile__intro">“{intro}” <button className="linkbtn" onClick={() => setEditing(true)}><Icon name="edit" size={13} /> 고치기</button></p>
          )}
        </Panel>
        <Panel dark className="metrics" title="성장 활동 지표 요약">
          <div className="metrics__grid">
            <Stat label="성장 마일리지" value={num(st.totalPoints)} unit="P" />
            <Stat label="보유 역량 뱃지" value={BADGES.filter((b) => b.got).length} unit="개" />
            <Stat label="연수 이수 시간" value={hours} unit="시간" />
            <Stat label="참관 · 수업 나눔" value={`${observed} · ${3 + st.s.myClasses.length}`} unit="회" />
          </div>
          <div className="points2">
            <div><span className="mono">활동형 포인트</span><b>{num(st.s.points.activity)}P</b><small>연수 · 자료 업로드 · 공개수업 · 기록</small></div>
            <div><span className="mono">상호작용형 포인트</span><b>{num(st.s.points.interaction)}P</b><small>좋아요 · 도움됨 · 자료 활용 평가</small></div>
          </div>
          <div className="pbar"><span style={{ flex: st.s.points.activity }} className="bg-orange" /><span style={{ flex: st.s.points.interaction }} className="bg-sky" /></div>
          <ul className="plog">
            {log.slice(0, 5).map((l, i) => <li key={i}><span className="mono">{shortDate(l.date)}</span><span>{l.what}</span><b className={l.kind === '활동' ? 'c-orange' : 'c-sky'}>+{l.p}</b></li>)}
          </ul>
        </Panel>
      </div>

      <Tabs value={tab} onChange={setTab} className="tabs--page" items={[
        { value: 'roadmap', label: '성장 로드맵', icon: 'route' },
        { value: 'album', label: '뱃지 앨범', icon: 'award' },
        { value: 'diary', label: '성장 일기', icon: 'edit' },
        { value: 'history', label: '활동 이력', icon: 'list' },
        { value: 'expert', label: '전문가 인증', icon: 'shield' },
      ]} />
      <div className="tabpane">
        {tab === 'roadmap' && <Roadmap />}
        {tab === 'album' && <Album />}
        {tab === 'diary' && <Diary />}
        {tab === 'history' && <History />}
        {tab === 'expert' && <Expert />}
      </div>
    </div>
  );
}
