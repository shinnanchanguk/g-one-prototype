import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radar, radarColor } from '../components/charts.jsx';
import Icon from '../components/Icon.jsx';
import { Chip, PageHead, Panel } from '../components/ui.jsx';
import { AREA_QUESTIONS, AREAS, GROWTH_TYPES, MENTORS, MODULES, ROOMS, SCALE, TODAY, TRAININGS } from '../data/seed.js';
import { trainingState } from '../components/cards.jsx';
import { uid, useStore } from '../store.jsx';

export const AREA_CAT = Object.fromEntries(AREAS.map((a) => [a.key, a.cat]));
const STEPS = ['고민 입력', '성장 출발점 찾기', 'AI 성장 키워드', '도움 찾기', '새 성장 목표'];
const SAMPLE = '수학 시간에 발표하는 아이들이 늘 같아요. 조용한 아이들도 스스로 질문하고 생각을 나누는 수업을 만들고 싶습니다. 요즘은 업무에 지쳐서 수업 준비할 여유도 부족해요.';

function analyze(text, scores) {
  const hits = GROWTH_TYPES.map((g) => ({ g, n: g.words.filter((w) => text.includes(w)).length }));
  const best = hits.sort((a, b) => b.n - a.n)[0];
  const strong = [...AREAS].sort((a, b) => scores[b.key] - scores[a.key])[0];
  const type = best.n ? best.g : GROWTH_TYPES.find((g) => g.area === strong.key) ?? GROWTH_TYPES[0];
  const words = [...new Set(GROWTH_TYPES.flatMap((g) => g.words).filter((w) => text.includes(w)))].slice(0, 6);
  const low = [...AREAS].sort((a, b) => scores[a.key] - scores[b.key]).slice(0, 3);
  return { type, words: words.length ? words : ['성찰', '수업 개선'], low, strong };
}

export default function GrowthDesign() {
  const st = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [text, setText] = useState('');
  const [share, setShare] = useState(true);
  const [scores, setScores] = useState({});
  const [thinking, setThinking] = useState(false);
  const [compare, setCompare] = useState(true);
  const [need, setNeed] = useState('');
  const [goal, setGoal] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  const filled = AREAS.every((a) => scores[a.key]);
  const res = useMemo(() => (filled ? analyze(text, scores) : null), [filled, text, scores]);
  const history = st.diagAll;

  useEffect(() => {
    if (step !== 2) return;
    setThinking(true);
    const t = setTimeout(() => setThinking(false), 1400);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step === 4 && res && !goal) {
      setGoal(`${res.type.title}로 한 걸음 나아가기`);
      const cat = AREA_CAT[res.low[0].key];
      setTasks([
        { t: `${TRAININGS.find((x) => x.cat === cat)?.title ?? '관련 연수'} 듣기`, kind: '배움', done: false },
        { t: '수업에서 4주 동안 실천하고 기록하기', kind: '배움', done: false },
        { t: '실천 성찰 글을 공동체에 나누기', kind: '나눔', done: false },
        { t: '같은 고민을 가진 동료와 멘토링으로 함께하기', kind: '동행', done: false },
      ]);
    }
  }, [step, res, goal]);

  const recs = res ? res.low.map((a) => ({
    area: a,
    trainings: TRAININGS.filter((t) => t.cat === AREA_CAT[a.key] && trainingState(t, st.s) !== 'closed').slice(0, 2),
    modules: MODULES.filter((m) => m.cat === AREA_CAT[a.key]).slice(0, 1),
    rooms: ROOMS.filter((r) => r.cat === AREA_CAT[a.key] && !r.done).slice(0, 1),
    mentor: MENTORS.find((m) => m.fields.includes(AREA_CAT[a.key])),
  })) : [];

  const save = () => {
    const g = { id: uid('g'), title: goal.trim(), area: res.low[0].key, created: TODAY, tasks };
    st.patch((s) => ({
      goals: [...s.goals, g],
      diagnoses: [...s.diagnoses, { date: TODAY, label: `${TODAY.slice(0, 4)}년 ${Number(TODAY.slice(5, 7))}월 (오늘)`, scores, type: res.type.title, worry: text }],
      myWorries: share && text.trim() ? [{ id: uid('w'), tag: '수업 고민', title: text.trim().slice(0, 36) + (text.length > 36 ? '…' : ''), body: text.trim(), author: '익명의 초등 선생님', date: TODAY, likes: 0, solved: false, mine: true, comments: [] }, ...s.myWorries] : s.myWorries,
    }));
    st.award('활동', 30, '성장 설계 완료');
    st.toast('성장 목표를 저장했어요 · 성장 여정에 연결했어요');
    nav('/growth/journey');
  };

  const canNext = [text.trim().length >= 10, filled, !thinking, true, goal.trim() && tasks.length][step];

  return (
    <div className="container">
      <PageHead crumbs={['성장', '성장 설계']} code="1.1 · 성장 출발점 찾기 · 성장 목표 세우기" title="성장 설계" desc="누가 매기는 평가가 아니라 “어떤 교사가 되고 싶은가”를 스스로 묻고, 지금 서 있는 자리에서 내 경험을 바탕으로 성장을 설계합니다." />

      <ol className="stepper">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? 'is-on' : i < step ? 'is-done' : ''}>
            <button onClick={() => i < step && setStep(i)} disabled={i > step}>
              <span className="mono">STEP {i + 1}</span><b>{s}</b>
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Panel title="가장 깊은 수업 고민이나 도전하고 싶은 배움은 무엇인가요?" code="STEP 1" desc="서술형으로 편하게 적어 주세요. AI가 성장 키워드를 찾아 드려요.">
          <textarea className="ta" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="예) 학생들이 스스로 질문하는 수업을 만들고 싶은데, 어디서부터 바꿔야 할지 모르겠어요." aria-label="고민 서술" />
          <div className="row-between">
            <label className="check"><input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} /> 이 고민을 <b>쫑알쫑알</b>에도 익명으로 올려 동료 의견 받기</label>
            <button className="btn btn--line btn--sm" onClick={() => setText(SAMPLE)}>예시 문장 넣어 보기</button>
          </div>
        </Panel>
      )}

      {step === 1 && (
        <Panel title="성장 출발점 찾기" code="STEP 2" desc="10개 영역마다 지금 내 모습에 가장 가까운 것을 골라 주세요. 있는 그대로가 좋아요.">
          <div className="diag">
            {AREAS.map((a, i) => (
              <div key={a.key} className="diag__q">
                <div className="diag__txt"><span className="mono">{String(i + 1).padStart(2, '0')} · {a.name}</span><p>{AREA_QUESTIONS[a.key]}</p></div>
                <div className="diag__scale" role="radiogroup" aria-label={a.name}>
                  {SCALE.map((lbl, v) => (
                    <button key={v} role="radio" aria-checked={scores[a.key] === v + 1} className={scores[a.key] === v + 1 ? 'is-on' : ''} onClick={() => setScores({ ...scores, [a.key]: v + 1 })} title={lbl.slice(2)}>
                      <span className="lvl" aria-hidden>{SCALE.map((_, j) => <i key={j} className={j <= v ? 'is-on' : ''} />)}</span><span>{lbl.slice(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="row-between">
            <span className="mono">{Object.keys(scores).length} / 10 영역 골랐어요</span>
            <button className="btn btn--line btn--sm" onClick={() => setScores(Object.fromEntries(AREAS.map((a, i) => [a.key, [3, 3, 2, 3, 2, 3, 3, 3, 2, 1][i]])))}>예시 응답 채우기</button>
          </div>
        </Panel>
      )}

      {step === 2 && res && (
        <div className="grid2">
          <Panel dark title="AI 성장 키워드 분석" code="STEP 3">
            {thinking ? (
              <div className="ai-think"><Icon name="spark" size={28} className="spin" /><p>고민 글과 고른 답을 읽고 있어요…</p></div>
            ) : (
              <div className="ai-result">
                <span className="mono c-orange">나의 성장 유형</span>
                <h3>{res.type.title}</h3>
                <p className="mono">찾은 키워드</p>
                <div className="chips">{res.words.map((w) => <span key={w} className="chip chip--glass">#{w}</span>)}</div>
                <p className="mono">강점 영역</p>
                <p>{res.strong.name}</p>
                <p className="mono">함께 키우면 좋을 영역</p>
                <div className="chips">{res.low.map((a) => <span key={a.key} className="chip chip--glass">{a.name}</span>)}</div>
                <p className="ai-note"><Icon name="info" size={14} /> 프로토타입에서는 낱말 규칙으로 흉내 냅니다. 실제 서비스에서는 AI 키워드 추출로 바뀝니다.</p>
              </div>
            )}
          </Panel>
          <Panel title="10개 영역 한눈에 보기" code="나의 성장 출발점">
            <label className="check"><input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> 지난 기록과 겹쳐 보기</label>
            {(() => {
              const series = [...(compare ? history.slice(-2) : []), { label: '오늘', scores }];
              return (
                <>
                  <Radar areas={AREAS} series={series} />
                  <ul className="legend">{series.map((s, i) => <li key={s.label}><span className="dot" style={{ background: radarColor(i, series.length) }} />{s.label}</li>)}</ul>
                </>
              );
            })()}
          </Panel>
        </div>
      )}

      {step === 3 && res && (
        <Panel title="도움 찾기" code="STEP 4" desc="필요한 배움과 동료의 도움을 적으면, 함께 키우면 좋을 영역에 맞춰 배움을 연결해 드려요.">
          <textarea className="ta" rows={3} value={need} onChange={(e) => setNeed(e.target.value)} placeholder="예) 짝 토의 구조를 실제로 써 본 선생님의 수업을 보고 싶어요." aria-label="필요한 도움" />
          <div className="recs">
            {recs.map((r) => (
              <div key={r.area.key} className="rec">
                <p className="rec__head"><span className="mono">함께 키울 영역</span><b>{r.area.name}</b></p>
                <ul>
                  {r.trainings.map((t) => <li key={t.id}><Icon name="school" size={15} className="c-blue" /><Link to={`/learn/trainings?q=${encodeURIComponent(t.title)}`}>{t.title}</Link><span className="mono">{t.type}연수 · {t.hours ? `${t.hours}시간` : '인정시간 없음'}</span></li>)}
                  {r.modules.map((m) => <li key={m.id}><Icon name="layers" size={15} className="c-purple" /><Link to="/learn/modules">{m.title}</Link><span className="mono">배움 모듈</span></li>)}
                  {r.rooms.map((m) => <li key={m.id}><Icon name="book" size={15} className="c-orange" /><Link to="/learn/rooms">{m.title}</Link><span className="mono">학습방</span></li>)}
                  {r.mentor && <li><Icon name="users" size={15} className="c-green" /><Link to={`/together/mentors?m=${r.mentor.id}`}>{r.mentor.name} 멘토 ({r.mentor.verified ?? r.mentor.role})</Link><span className="mono">멘토</span></li>}
                </ul>
              </div>
            ))}
          </div>
          <Link to="/learn/trainings" className="btn btn--dark"><Icon name="book" size={16} />배움 메뉴로 가서 더 찾아보기</Link>
        </Panel>
      )}

      {step === 4 && res && (
        <Panel title="새로운 성장 목표 세우기" code="STEP 5" desc="목표별로 배움·나눔·동행 과제를 연결하면 나의 성장 여정에 쌓여요.">
          <label className="field"><span className="field__label">성장 목표</span><input className="input" value={goal} onChange={(e) => setGoal(e.target.value)} /></label>
          <p className="field__label">실천 과제</p>
          <ul className="tasks">
            {tasks.map((t, i) => (
              <li key={i}><Chip tone={{ 배움: 'blue', 나눔: 'orange', 동행: 'green' }[t.kind]}>{t.kind}</Chip><span>{t.t}</span>
                <button className="iconbtn iconbtn--sm" onClick={() => setTasks(tasks.filter((_, j) => j !== i))} aria-label="과제 삭제"><Icon name="x" size={14} /></button></li>
            ))}
          </ul>
          <form className="inline-form" onSubmit={(e) => { e.preventDefault(); if (newTask.trim()) { setTasks([...tasks, { t: newTask.trim(), kind: '배움', done: false }]); setNewTask(''); } }}>
            <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="과제 더하기 (예: 학생 질문 수 기록하기)" aria-label="과제 추가" />
            <button className="btn btn--sm btn--line" type="submit"><Icon name="plus" size={14} />더하기</button>
          </form>
        </Panel>
      )}

      <div className="stepnav">
        <button className="btn btn--line" disabled={step === 0} onClick={() => setStep(step - 1)}><Icon name="left" size={16} />이전</button>
        {step < 4
          ? <button className="btn btn--dark" disabled={!canNext} onClick={() => setStep(step + 1)}>다음 단계<Icon name="right" size={16} /></button>
          : <button className="btn btn--orange" disabled={!canNext} onClick={save}><Icon name="flag" size={16} />목표 저장하고 성장 여정에 연결</button>}
      </div>

      <Panel title="지난 성장 출발점" code="그때의 고민과 성장 유형" className="mt">
        <div className="hist">
          {history.map((h, i) => (
            <div key={h.date + i} className="hist__item">
              <span className="mono">{h.label}</span>
              <b>{h.type ?? '성장 유형을 아직 찾지 않았어요'}</b>
              {h.worry && <span className="hist__worry">{h.worry}</span>}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
