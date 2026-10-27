import READY from './thumbs-ready.json';
// 분야별 대표 사진. 무료 로컬 생성(mflux + Z-Image Turbo, _assets_raw/zgen.sh)으로 만든 것만 쓴다.
// 사진 목록은 _assets_raw/publish.sh 가 public/images/contents 를 훑어 thumbs-ready.json 으로 만든다.
// 한 분야에 사진이 여러 장이면 항목마다 돌려 써서 한 화면에 같은 사진이 겹치지 않게 한다.
// 아직 사진이 없는 분야는 지금처럼 색 바탕과 아이콘으로 보인다.
const KEY = { '수업·평가': 'teach', 교육과정: 'curr', 생활교육: 'life', 학급경영: 'mgmt', '디지털·AI': 'digital', '정신건강·자기돌봄': 'care', '업무 역량': 'work', 진로교육: 'career' };
const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const src = (f) => `${import.meta.env.BASE_URL}images/contents/${f}.webp`;
export const thumbOf = (cat, id = '') => {
  const files = READY[KEY[cat]];
  return files?.length ? src(files[hash(id) % files.length]) : null;
};
// 한 화면에 깔리는 목록용: 같은 분야 카드가 여러 장이면 사진을 차례로 돌려 쓰고,
// 이웃 카드에 쓴 사진은 되도록 건너뛴다. near 가 숫자면 바로 앞 near 장(격자 열 수를 주면 위아래까지),
// 함수면 i 번째 카드의 이웃 [앞 카드 번호, 벌점] 목록이다(첫 화면처럼 칸 모양이 고르지 않은 격자용).
export const thumbsFor = (items, catOf, near = 1) => {
  const neighbors = typeof near === 'function' ? near
    : (i) => Array.from({ length: near }, (_, k) => [i - k - 1, k === 0 ? 100 : k === near - 1 ? 10 : 5]);
  const next = {};
  const out = [];
  items.forEach((it) => {
    const cat = catOf(it);
    const files = READY[KEY[cat]];
    if (!files?.length) { out.push(null); return; }
    const start = next[cat] ?? 0;
    const order = files.map((_, k) => (start + k) % files.length);
    // 겹치면 벌점이 붙는다(바로 옆이 가장 크다). 벌점이 가장 낮은 사진을 고른다
    const cost = (j) => neighbors(out.length).reduce((c, [k, w]) => c + (k >= 0 && out[k] === src(files[j]) ? w : 0), 0);
    const pick = order.reduce((best, j) => (cost(j) < cost(best) ? j : best), order[0]);
    next[cat] = pick + 1;
    out.push(src(files[pick]));
  });
  return out;
};
// 교육자료는 분야 대신 유형·제목으로 가장 가까운 분야를 고른다
export const matCat = (m) => (m.type === '생활교육' ? '생활교육' : /AI|디지털/.test(m.title) ? '디지털·AI' : m.type === '진로자료' ? '진로교육' : m.type === '장학자료' ? '업무 역량' : '수업·평가');
