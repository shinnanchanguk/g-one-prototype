import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CITIES } from './data/gyeonggiMap.js';
import { AREAS, BANDS, DIAG_HISTORY, DIARY, GOALS, LEVELS, ME, MENTORINGS, POINT_LOG, SCALE, SUBJECT_ALIAS, TODAY, bandOf } from './data/seed.js';
import { DEFAULT_PROFILE, cleanProfile } from './fit.js';

// 화면에서 한 모든 일은 이 브라우저(localStorage)에만 남는다.
const KEY = 'g-one-prototype-v1';

const initial = () => ({
  liked: {},
  ratings: {},
  myMaterials: [],
  applied: { t3: '2026-10-12', t7: '2026-10-19' },
  journeyItems: { t3: true },
  feedback: {},
  myModules: [],
  takenModules: { m1: true },
  joinedRooms: {},
  joinedComms: {},
  myComms: [],
  commPosts: {},
  classApps: { o3: '2026-10-14' },
  myClasses: [],
  myWorries: [],
  worryComments: {},
  worryLikes: {},
  helpful: {},
  myMentorings: [],
  diary: [],
  goals: [],
  diagnoses: [],
  points: { activity: 840, interaction: 400 },
  pointLog: [],
  notifRead: false,
  profile: { ...DEFAULT_PROFILE },
  classView: 'feed',
  quickDiag: {},
});

// 단계는 배움·나눔·동행 세 가지로 통일했다. 예전 기록의 실천·성찰은 가까운 단계로 옮긴다.
const STAGE_FIX = { 실천: '배움', 성찰: '나눔' };
const fixKind = (k) => STAGE_FIX[k] ?? (['배움', '나눔', '동행'].includes(k) ? k : '배움');
export const CLASS_VIEWS = ['feed', 'week', 'map', 'cal'];
const SCOPES = ['학교', '지원청', '도'];
const CITY_OK = new Set(CITIES.map((c) => c.name));
const str = (v, n) => String(v ?? '').slice(0, n);
// 예전 체험판의 교과 이름(도덕·정보·진로 등)을 도름스 분류 이름으로 옮긴다
const subj = (v) => (Object.hasOwn(SUBJECT_ALIAS, v) ? SUBJECT_ALIAS[v] : v);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isDate = (v) => { try { return typeof v === 'string' && DATE.test(v) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v; } catch { return false; } };
const obj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const nonneg = (v) => (Number.isFinite(v) && v >= 0 ? Math.trunc(v) : 0);
// 예전 판의 진단 영역 키를 기존 역량진단 10개 영역 키로 옮긴다
const AREA_FIX = { assess: 'teach', digital: 'change', class: 'mgmt', comm: 'collab', care: 'self' };
const areaKey = (k) => { const x = AREA_FIX[k] ?? k; return AREAS.some((a) => a.key === x) ? x : 'teach'; };
const fixScores = (sc) => Object.fromEntries(Object.entries(sc && typeof sc === 'object' ? sc : {}).map(([k, v]) => [AREA_FIX[k] ?? k, Number(v) || 0]).filter(([k]) => AREAS.some((a) => a.key === k)));

// 예전 판에서 저장한 공개수업(참관 대상·지도안 없음)도 새 화면이 그릴 수 있게 모양을 맞춘다
function fixClass(o) {
  const level = LEVELS.includes(o.level) ? o.level : '초등학교';
  const b = bandOf(level);
  const audience = Array.isArray(o.audience) && o.audience.length && o.audience.every((x) => BANDS.includes(x)) ? o.audience : (BANDS.includes(b) ? [b] : [...BANDS]);
  const plan = o.plan && typeof o.plan === 'object' && Array.isArray(o.plan.flow)
    ? { file: str(o.plan.file, 80), goal: str(o.plan.goal, 200), flow: o.plan.flow.map((x) => str(x, 120)).slice(0, 6) }
    : { file: '', goal: str(o.topic, 200), flow: [`전개 · ${str(o.topic, 120)}`] };
  return {
    ...o, audience, plan, level,
    topic: str(o.topic, 80), subject: subj(str(o.subject, 20)), grade: str(o.grade, 20), time: str(o.time, 20), mode: str(o.mode ?? '대면', 10),
    office: typeof o.office === 'string' ? str(o.office, 40) : ME.office,
    teacher: typeof o.teacher === 'string' ? str(o.teacher, 20) : ME.name,
    school: typeof o.school === 'string' ? str(o.school, 40) : ME.school,
    scope: SCOPES.includes(o.scope) ? o.scope : '지원청',
    city: CITY_OK.has(o.city) ? o.city : '수원시',
    cap: Math.max(1, Math.min(60, Math.trunc(Number(o.cap)) || 10)),
    applied: nonneg(o.applied),
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const base = initial();
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return base;
    // 모양이 다른 값(옛 버전·손상)은 버리고 기본값을 쓴다
    for (const [k, v] of Object.entries(parsed)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype' || k === 'homeVersion' || k === 'subjectAlerts') continue;
      const d = base[k];
      if (d === undefined) { if (v && typeof v === 'object' && !Array.isArray(v)) base[k] = v; else if (typeof v === 'string') base[k] = v; continue; }
      if (Array.isArray(d) ? Array.isArray(v) : (typeof v === typeof d && v !== null && !Array.isArray(v))) base[k] = v;
    }
    if (typeof base.points.activity !== 'number' || typeof base.points.interaction !== 'number') base.points = initial().points;
    base.profile = cleanProfile(base.profile);
    if (!CLASS_VIEWS.includes(base.classView)) base.classView = 'feed';
    base.diary = base.diary.filter((d) => obj(d)).map((d) => ({ ...d, title: str(d.title, 80), body: str(d.body, 2000), date: isDate(d.date) ? d.date : TODAY, kind: fixKind(d.kind) }));
    base.goals = base.goals.filter((g) => g && typeof g === 'object' && Array.isArray(g.tasks))
      .map((g) => ({ ...g, id: str(g.id, 40), title: str(g.title, 120), area: areaKey(g.area), created: isDate(g.created) ? g.created : TODAY, tasks: g.tasks.filter((t) => t && typeof t === 'object').map((t) => ({ ...t, t: str(t.t, 120), kind: fixKind(t.kind) })) }));
    base.diagnoses = base.diagnoses.filter((d) => obj(d) && isDate(d.date)).map((d) => ({ ...d, label: str(d.label, 40), scores: fixScores(d.scores) }));
    base.myClasses = base.myClasses.filter((o) => o && typeof o === 'object' && typeof o.id === 'string' && isDate(o.date) && typeof o.time === 'string').map(fixClass);
    // 첫 화면이 읽는 내 자료·모듈·고민도 모양을 맞춘다(손상된 저장값이 첫 화면을 멈추지 않게)
    base.myMaterials = base.myMaterials.filter((m) => obj(m) && typeof m.id === 'string')
      .map((m) => ({ ...m, title: str(m.title, 120), author: str(m.author || ME.name, 30), school: str(m.school, 40), type: str(m.type || '수업자료', 20), level: str(m.level || '전체', 10), subject: subj(str(m.subject, 20)), desc: str(m.desc, 500), date: isDate(m.date) ? m.date : TODAY, likes: nonneg(m.likes), downloads: nonneg(m.downloads), views: nonneg(m.views), rating: Number.isFinite(m.rating) ? m.rating : 0, files: Array.isArray(m.files) ? m.files.map((f) => str(f, 80)) : [] }));
    base.myModules = base.myModules.filter((m) => obj(m) && typeof m.id === 'string')
      .map((m) => ({ ...m, title: str(m.title, 120), author: str(m.author || ME.name, 30), school: str(m.school, 40), cat: str(m.cat || '수업·평가', 30), share: ['전체', '우리 학교', '나만 보기'].includes(m.share) ? m.share : '전체', weeks: nonneg(Number(m.weeks)) || 1, likes: nonneg(m.likes), learners: nonneg(m.learners), items: Array.isArray(m.items) ? m.items.map((x) => str(x, 120)) : [] }));
    base.myWorries = base.myWorries.filter((w) => obj(w) && typeof w.id === 'string')
      .map((w) => ({ ...w, title: str(w.title, 80), body: str(w.body, 2000), author: str(w.author || ME.name, 30), tag: str(w.tag || '기타', 20), date: isDate(w.date) ? w.date : TODAY, likes: nonneg(w.likes), comments: Array.isArray(w.comments) ? w.comments.filter(obj) : [] }));
    base.worryComments = Object.fromEntries(Object.entries(base.worryComments).filter(([, v]) => Array.isArray(v))
      .map(([k, v]) => [k, v.filter(obj).map((c) => ({ ...c, author: str(c.author, 30), body: str(c.body, 1000), date: isDate(c.date) ? c.date : TODAY }))]));
    base.quickDiag = Object.fromEntries(Object.entries(base.quickDiag).filter(([k, v]) => AREAS.some((a) => a.key === k) && Number.isInteger(v) && v >= 1 && v <= SCALE.length));
    return base;
  } catch {
    return initial();
  }
}

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

let seq = 0;
export const uid = (p) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;

export function StoreProvider({ children }) {
  const [s, setS] = useState(load);
  const [toasts, setToasts] = useState([]);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* 저장 못 해도 화면은 동작 */ }
  }, [s]);

  const toast = useCallback((text, tone = 'ok') => {
    const id = uid('t');
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const patch = useCallback((fn) => setS((prev) => ({ ...prev, ...fn(prev) })), []);

  const award = useCallback((kind, p, what) => {
    patch((st) => ({
      points: { ...st.points, [kind === '활동' ? 'activity' : 'interaction']: st.points[kind === '활동' ? 'activity' : 'interaction'] + p },
      pointLog: [{ date: TODAY, kind, what, p }, ...st.pointLog],
    }));
  }, [patch]);

  const api = useMemo(() => ({
    s, toast, patch, award,
    toggle(field, id) {
      patch((st) => {
        const next = { ...st[field] };
        if (next[id]) delete next[id]; else next[id] = TODAY;
        return { [field]: next };
      });
    },
    reset() {
      localStorage.removeItem(KEY);
      setS(initial());
      toast('처음 상태로 되돌렸어요');
    },
    get totalPoints() { return s.points.activity + s.points.interaction; },
    get pointLogAll() { return [...s.pointLog, ...POINT_LOG]; },
    get diaryAll() { return [...s.diary, ...DIARY]; },
    get goalsAll() { return [...GOALS, ...s.goals]; },
    get diagAll() { return [...DIAG_HISTORY, ...s.diagnoses]; },
    get mentoringsAll() { return [...s.myMentorings, ...MENTORINGS]; },
  }), [s, toast, patch, award]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`toast toast--${t.tone}`}>{t.text}</div>)}
      </div>
    </Ctx.Provider>
  );
}
