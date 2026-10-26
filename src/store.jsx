import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DIAG_HISTORY, DIARY, GOALS, MENTORINGS, POINT_LOG, TODAY } from './data/seed.js';

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
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const base = initial();
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return base;
    // 모양이 다른 값(옛 버전·손상)은 버리고 기본값을 쓴다
    for (const [k, v] of Object.entries(parsed)) {
      const d = base[k];
      if (d === undefined) { if (v && typeof v === 'object' && !Array.isArray(v)) base[k] = v; else if (typeof v === 'string') base[k] = v; continue; }
      if (Array.isArray(d) ? Array.isArray(v) : (typeof v === typeof d && v !== null && !Array.isArray(v))) base[k] = v;
    }
    if (typeof base.points.activity !== 'number' || typeof base.points.interaction !== 'number') base.points = initial().points;
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
