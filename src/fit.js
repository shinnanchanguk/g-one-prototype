// 내 정보(학교급·담당·지원청)에 맞춰 목록을 거르고 정렬한다. 화면 공용.
// 학교급·담당 분류는 도름스 가입 때 받는 체계(유치원·초등학교·중학교·고등학교 + 교과·담당 목록)를 그대로 쓴다.
import { CITIES } from './data/gyeonggiMap.js';
import { DUTY_SUBJECTS, ME, OFFICES, SCHOOL_LEVELS, SUBJECT_ALIAS, bandOf } from './data/seed.js';

// 목록을 맞출 때 쓰는 학교급 묶음: 중·고는 서로 오가며 보니 '중등'으로, 특수교육 선생님은 '특수'로 본다
export const bandFor = (level, subject) => (subject === '특수교육' ? '특수' : { 유치원: '유치원', 초등학교: '초등', 중학교: '중등', 고등학교: '중등' }[level] ?? '초등');
// 프로토타입 샘플: 학교급을 바꾸면 '우리 학교'도 그 학교급의 샘플 학교로 바뀐다
export const SCHOOL_BY_LEVEL = { 유치원: '햇살유치원', 초등학교: ME.school, 중학교: '팔달샘중학교', 고등학교: '매여울고등학교' };
export const schoolFor = (level, subject) => (subject === '특수교육' ? '나래학교' : SCHOOL_BY_LEVEL[level] ?? ME.school);
export const DEFAULT_PROFILE = { level: '초등학교', subject: '', band: '초등', office: ME.office, school: ME.school, city: '수원시', set: false };
export const SUBJECT_MAX = 20;
// 목록에 없는 담당은 직접 적을 수 있다(줄바꿈·제어 문자 없이 짧게)
export const cleanSubject = (v) => {
  if (typeof v !== 'string') return '';
  const t = v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, SUBJECT_MAX);
  return SUBJECT_ALIAS[t] ?? t;
};
// 담당이 특수교육·상담·보건·사서·영양이면 같은 담당 자료를, 아니면 같은 학교급 자료를 먼저 보여 준다
export const sortModeFor = (p) => (DUTY_SUBJECTS.includes(p.subject) ? '교과' : '학교급');

const OLD_BAND_LEVEL = { 유치원: '유치원', 초등: '초등학교', 중등: '중학교', 특수: '초등학교' };
export function cleanProfile(p) {
  const d = DEFAULT_PROFILE;
  if (!p || typeof p !== 'object') return { ...d };
  // 예전 체험판은 학교급 묶음(band)만 저장했다. 특수였으면 담당을 특수교육으로 옮긴다
  const level = SCHOOL_LEVELS.includes(p.level) ? p.level : OLD_BAND_LEVEL[p.band] ?? d.level;
  const subject = cleanSubject(p.subject) || (!p.level && p.band === '특수' ? '특수교육' : '');
  const office = OFFICES.some((o) => o.name === p.office) ? p.office : d.office;
  const cities = OFFICES.find((o) => o.name === office).cities;
  return {
    level,
    subject,
    band: bandFor(level, subject),
    office,
    school: schoolFor(level, subject),
    city: cities.includes(p.city) ? p.city : cities[0],
    set: p.set === true,
  };
}
// 머리말·안내에 쓰는 한 줄 표기: "초등학교 · 보건 · 수원"
export const profileLabel = (p, office) => [p.level, p.subject, office].filter(Boolean).join(' · ');

const bandMatch = (item, band) => {
  if (item.audience && Array.isArray(item.audience)) return item.audience.includes(band);
  return item.level === '전체' || bandOf(item.level) === band;
};
const subjectMatch = (item, subject) => !!subject && (item.subject === subject || (typeof item.audience === 'string' && item.audience.includes(subject)));

// 학교급이 맞는 것, 교과가 맞는 것을 앞으로. 같은 점수면 원래 순서(날짜 등)를 지킨다.
export function sortByProfile(list, p, mode = sortModeFor(p)) {
  const score = (it) => {
    const b = bandMatch(it, p.band) ? 1 : 0;
    const s = subjectMatch(it, p.subject) ? 1 : 0;
    return mode === '교과' ? s * 2 + b : b * 2 + s;
  };
  return list.map((it, i) => [it, score(it), i]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).map(([it]) => it);
}
export const fitsBand = bandMatch;
export const fitsSubject = subjectMatch;

// 공개수업을 볼 수 있는지·신청할 수 있는지
export function classAccess(o, p) {
  if (o.scope === '학교') return o.school === p.school ? 'ok' : 'hidden';
  if (o.scope === '지원청') return o.office === p.office ? 'ok' : 'other';
  return 'ok';
}
export const SCOPE_LABEL = { 학교: '우리 학교', 지원청: '지원청 단위', 도: '도 단위' };
export const SCOPE_HELP = {
  학교: '같은 학교 선생님에게만 보여요. 동료장학처럼 부담 없이 열 수 있어요.',
  지원청: '우리 지원청 선생님이 보고 신청할 수 있어요.',
  도: '경기도 모든 선생님이 보고 신청할 수 있어요.',
};

// 지도 좌표로 잰 시·군 중심 사이 거리(가로 800칸이 약 150km)
const XY = Object.fromEntries(CITIES.map((c) => [c.name, [c.cx, c.cy]]));
const KM = 0.19;
export const distKm = (a, b) => {
  const p = XY[a], q = XY[b];
  if (!p || !q) return 0;
  return Math.round(Math.hypot(p[0] - q[0], p[1] - q[1]) * KM);
};
const officeXY = (name) => {
  const o = OFFICES.find((x) => x.name === name);
  const pts = o.cities.map((c) => XY[c]).filter(Boolean);
  return [pts.reduce((a, q) => a + q[0], 0) / pts.length, pts.reduce((a, q) => a + q[1], 0) / pts.length];
};
export function neighborOffices(office, n = 4) {
  const [x, y] = officeXY(office);
  return OFFICES.filter((o) => o.name !== office)
    .map((o) => { const [a, b] = officeXY(o.name); return [o.name, Math.hypot(a - x, b - y)]; })
    .sort((a, b) => a[1] - b[1]).slice(0, n).map(([nm]) => nm);
}
export const shortOffice = (name) => name.replace('교육지원청', '');
