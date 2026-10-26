import { useMemo, useState } from 'react';
import { CITIES, MAP_H, MAP_W } from '../data/gyeonggiMap.js';
import { LEVEL_COLOR } from '../data/seed.js';
import Icon from './Icon.jsx';
import { fmtDate } from './ui.jsx';

// ── 레이더 차트: 진단 10개 영역, 여러 시점 겹쳐 보기 ─────────────────
const SERIES_COLORS = ['#b9b2a6', '#5692f0', '#ed5a14'];
export function Radar({ areas, series, size = 340 }) {
  const c = size / 2, R = size / 2 - 52, n = areas.length;
  const pt = (i, v) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + Math.cos(a) * R * (v / 4), c + Math.sin(a) * R * (v / 4)];
  };
  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="성장 진단 레이더 차트">
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

// ── 경기도 지도 + 공개수업 표시 ─────────────────────────────────
const cityByName = Object.fromEntries(CITIES.map((c) => [c.name, c]));
function spread(items) {
  const byCity = {};
  return items.map((it) => {
    const c = cityByName[it.city];
    const k = (byCity[it.city] = (byCity[it.city] ?? -1) + 1);
    const ang = k * 2.4, r = k ? 14 + k * 4 : 0;
    return { ...it, x: c.cx + Math.cos(ang) * r, y: c.cy + Math.sin(ang) * r };
  });
}

export function GyeonggiMap({ items, onOpen, compact, selected, onSelect }) {
  const [zoom, setZoom] = useState(1);
  const pts = useMemo(() => spread(items), [items]);
  const sel = pts.find((p) => p.id === selected);
  const vw = MAP_W / zoom, vh = MAP_H / zoom;
  const fx = sel ? Math.min(Math.max(sel.x - vw / 2, 0), MAP_W - vw) : (MAP_W - vw) / 2;
  const fy = sel ? Math.min(Math.max(sel.y - vh / 2, 0), MAP_H - vh) : (MAP_H - vh) / 2;
  const ms = 15 / Math.sqrt(zoom) * (compact ? 1.5 : 1);
  return (
    <div className={`gmap ${compact ? 'gmap--compact' : ''}`}>
      <svg viewBox={`${fx} ${fy} ${vw} ${vh}`} role="img" aria-label="경기도 공개수업 지도" onClick={() => onSelect?.(null)}>
        {CITIES.map((c) => <path key={c.name} d={c.d} className="gmap__city" />)}
        {CITIES.map((c) => <text key={c.name} x={c.cx} y={c.cy} className="gmap__label" style={{ fontSize: (compact ? 22 : 15) / Math.sqrt(zoom) }}>{c.name.replace(/(시|군)$/, '')}</text>)}
        {pts.map((p) => (
          <g key={p.id} transform={`translate(${p.x},${p.y})`} className={`gmap__pin pin--${LEVEL_COLOR[p.level]} ${p.id === selected ? 'is-sel' : ''}`}
            onClick={(e) => { e.stopPropagation(); onSelect?.(p.id); }} role="button" tabIndex={0} aria-label={`${p.school} ${p.subject} 공개수업`}
            onKeyDown={(e) => e.key === 'Enter' && onSelect?.(p.id)}>
            <path d={`M0 0 C ${-ms * 0.9} ${-ms * 1.1} ${-ms * 0.75} ${-ms * 2.1} 0 ${-ms * 2.1} C ${ms * 0.75} ${-ms * 2.1} ${ms * 0.9} ${-ms * 1.1} 0 0Z`} />
            <circle cy={-ms * 1.45} r={ms * 0.32} className="gmap__pin-dot" />
          </g>
        ))}
      </svg>
      <div className="gmap__zoom">
        <button className="iconbtn" onClick={() => setZoom((z) => Math.min(z * 1.5, 3.4))} aria-label="지도 확대"><Icon name="plus" size={16} /></button>
        <button className="iconbtn" onClick={() => setZoom((z) => Math.max(z / 1.5, 1))} aria-label="지도 축소"><Icon name="minus" size={16} /></button>
      </div>
      <ul className="gmap__legend">
        {Object.entries(LEVEL_COLOR).map(([lv, col]) => <li key={lv}><span className={`dot bg-${col}`} />{lv}</li>)}
      </ul>
      {sel && (
        <div className="gmap__card" onClick={(e) => e.stopPropagation()}>
          <div className={`gmap__card-band bg-${LEVEL_COLOR[sel.level]}`}><Icon name="school" size={22} /><span>{sel.subject}</span></div>
          <div className="gmap__card-body">
            <strong>{sel.topic}</strong>
            <span><Icon name="pin" size={13} /> {sel.school} · {sel.grade}</span>
            <span><Icon name="calendar" size={13} /> {fmtDate(sel.date)} {sel.time}</span>
            <button className="btn btn--sm btn--dark" onClick={() => onOpen(sel)}>상세보기</button>
          </div>
          <button className="iconbtn iconbtn--sm gmap__card-x" onClick={() => onSelect?.(null)} aria-label="닫기"><Icon name="x" size={14} /></button>
        </div>
      )}
    </div>
  );
}

// ── 월간 달력 ─────────────────────────────────────────
export function MonthCalendar({ year, month, items, onOpen, onMove }) {
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
          return (
            <div key={i} className={`cal__cell ${d ? '' : 'is-blank'} ${d && key(d) === '2026-10-26' ? 'is-today' : ''}`}>
              {d && <span className="cal__day">{d}</span>}
              {list.map((it) => (
                <button key={it.id} className={`cal__ev ev--${it.scope === '도' ? 'do' : 'office'}`} onClick={() => onOpen(it)} title={`${it.school} ${it.topic}`}>
                  <span className="cal__ev-subj">{it.subject}</span> <span className="cal__ev-school">{it.school.replace(/등학교|학교/, '')}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
