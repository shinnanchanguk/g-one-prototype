import Icon from './Icon.jsx';

// ── 레이더 차트: 성장 출발점 10개 영역, 여러 시점 겹쳐 보기 ─────────────────
const SERIES_COLORS = ['#b9b2a6', '#5692f0', '#ed5a14'];
export function Radar({ areas, series, size = 340 }) {
  const c = size / 2, R = size / 2 - 52, n = areas.length;
  const pt = (i, v) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + Math.cos(a) * R * (v / 4), c + Math.sin(a) * R * (v / 4)];
  };
  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="10개 영역 성장 출발점 차트">
      {[1, 2, 3, 4].map((lv) => (
        <polygon key={lv} points={areas.map((_, i) => pt(i, lv).join(',')).join(' ')} className="radar__ring" />
      ))}
      {areas.map((a, i) => {
        const [x, y] = pt(i, 4);
        const [lx, ly] = pt(i, 4.62);
        return (
          <g key={a.key}>
            <line x1={c} y1={c} x2={x} y2={y} className="radar__axis" />
            <text x={lx} y={ly} textAnchor={lx < c - 4 ? 'end' : lx > c + 4 ? 'start' : 'middle'} dominantBaseline="middle" className="radar__label">{a.short}</text>
          </g>
        );
      })}
      {series.map((s, si) => {
        const col = s.color ?? SERIES_COLORS[(SERIES_COLORS.length - series.length + si) % SERIES_COLORS.length];
        return (
          <g key={s.label}>
            <polygon points={areas.map((a, i) => pt(i, s.scores[a.key] ?? 0).join(',')).join(' ')} fill={col} fillOpacity={si === series.length - 1 ? 0.22 : 0.08} stroke={col} strokeWidth={si === series.length - 1 ? 2.5 : 1.5} strokeDasharray={si === series.length - 1 ? undefined : '4 4'} />
            {si === series.length - 1 && areas.map((a, i) => { const [x, y] = pt(i, s.scores[a.key] ?? 0); return <circle key={a.key} cx={x} cy={y} r={3.5} fill={col} />; })}
          </g>
        );
      })}
    </svg>
  );
}
export const radarColor = (i, total) => SERIES_COLORS[(SERIES_COLORS.length - total + i) % SERIES_COLORS.length];

// ── 월간 달력 ─────────────────────────────────────────
// 칸에는 두 건까지만 보이고 나머지는 +n. 날짜 숫자가 아니라 그날 칸 어디를 눌러도 onPick 으로 그날을 고른다.
// 공개수업 칩은 넓은 화면에서 상세 창도 바로 연다(좁은 화면에서는 칩이 작아 칸 누르기로만 쓴다).
export function MonthCalendar({ year, month, items, onOpen, onMove, selected, onPick, max = 2 }) {
  const first = new Date(year, month - 1, 1).getDay();
  const days = new Date(year, month, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const key = (d) => `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return (
    <div className="cal">
      <div className="cal__bar">
        <button className="iconbtn" onClick={() => onMove(-1)} aria-label="이전 달"><Icon name="left" /></button>
        <strong>{year}년 {month}월</strong>
        <button className="iconbtn" onClick={() => onMove(1)} aria-label="다음 달"><Icon name="right" /></button>
      </div>
      <div className="cal__grid">
        {'일월화수목금토'.split('').map((w, i) => <div key={w} className={`cal__dow ${i === 0 ? 'c-orange' : i === 6 ? 'c-blue' : ''}`}>{w}</div>)}
        {cells.map((d, i) => {
          const list = d ? items.filter((it) => it.date === key(d)) : [];
          const k = d ? key(d) : '';
          return (
            <div key={i} className={`cal__cell ${d ? '' : 'is-blank'} ${d && onPick ? 'cal__cell--pick' : ''} ${d && k === '2026-10-26' ? 'is-today' : ''} ${d && k === selected ? 'is-sel' : ''}`} onClick={d && onPick ? () => onPick(k) : undefined}>
              {d && (onPick
                ? <button className="cal__day cal__day--btn" aria-pressed={k === selected} aria-label={`${month}월 ${d}일 공개수업 ${list.length}건 보기`}>{d}{list.length > 0 && <span className="cal__n">{list.length}</span>}</button>
                : <span className="cal__day">{d}</span>)}
              {list.slice(0, max).map((it) => (
                <button key={it.id} className={`cal__ev ev--${{ 도: 'do', 지원청: 'office', 학교: 'school' }[it.scope]} ${it.locked ? 'is-locked' : ''}`} onClick={(e) => { if (onPick) { e.stopPropagation(); onPick(k, { scroll: false }); } onOpen(it); }} title={`${it.school} ${it.topic}`}>
                  <span className="cal__ev-subj">{it.subject}</span> <span className="cal__ev-school">{it.school.replace(/등학교|학교/, '')}</span>
                </button>
              ))}
              {list.length > max && <button className="cal__more" onClick={onPick ? undefined : () => onOpen(list[max])}>+{list.length - max}건</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
