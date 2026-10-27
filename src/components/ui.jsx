import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

export const fmtDate = (d) => {
  const [y, m, dd] = d.split('-').map(Number);
  const w = '일월화수목금토'[new Date(y, m - 1, dd).getDay()];
  return `${y}. ${m}. ${dd}. (${w})`;
};
export const shortDate = (d) => { const [, m, dd] = d.split('-').map(Number); return `${m}. ${dd}.`; };
export const num = (n) => n.toLocaleString('ko-KR');

const HUES = ['blue', 'green', 'orange', 'purple', 'yellow', 'pink', 'sky'];
export function Avatar({ name, size = 36 }) {
  const h = HUES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
  return <span className={`avatar avatar--${h}`} style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden>{name.replace(/^익명의\s*/, '').slice(0, 1)}</span>;
}

export function PageHead({ code, title, desc, children, crumbs }) {
  return (
    <header className="pagehead">
      {crumbs && <nav className="crumbs" aria-label="현재 위치">{crumbs.map((c, i) => <span key={i}>{c}</span>)}</nav>}
      <div className="pagehead__row">
        <div>
          {code && <span className="mono pagehead__code">{code}</span>}
          <h1>{title}</h1>
          {desc && <p className="pagehead__desc">{desc}</p>}
        </div>
        {children && <div className="pagehead__actions">{children}</div>}
      </div>
    </header>
  );
}

export function Panel({ title, code, desc, more, icon, tone, children, className = '', dark }) {
  return (
    <section className={`panel ${dark ? 'panel--dark' : ''} ${tone ? `panel--${tone}` : ''} ${className}`}>
      {(title || more) && (
        <div className="panel__head">
          <div className="panel__title">
            {icon && <span className={`panel__icon tone-${tone ?? 'ink'}`}><Icon name={icon} size={20} /></span>}
            <div>
              {code && <span className="panel__kicker">{code}</span>}
              <h2>{title}</h2>
              {desc && <p className="panel__desc">{desc}</p>}
            </div>
          </div>
          {more && <Link className="more" to={more}>더보기 <Icon name="right" size={14} /></Link>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Tabs({ value, onChange, items, size, className = '' }) {
  return (
    <div className={`tabs ${size === 'sm' ? 'tabs--sm' : ''} ${className}`} role="tablist">
      {items.map((it) => {
        const v = typeof it === 'string' ? it : it.value;
        const label = typeof it === 'string' ? it : it.label;
        return (
          <button key={v} role="tab" aria-selected={value === v} className={`tab ${value === v ? 'is-on' : ''}`} onClick={() => onChange(v)}>
            {it.icon && <Icon name={it.icon} size={15} />}
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({ children, tone = 'ink', solid }) {
  return <span className={`chip chip--${tone} ${solid ? 'chip--solid' : ''}`}>{children}</span>;
}

export function Progress({ value, tone = 'orange' }) {
  return <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><span className={`bg-${tone}`} style={{ width: `${value}%` }} /></div>;
}

export function Empty({ icon = 'leaf', text, children }) {
  return <div className="empty"><Icon name={icon} size={28} /><p>{text}</p>{children}</div>;
}

export function Modal({ open, onClose, title, children, wide, footer }) {
  const box = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && close.current();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    box.current?.focus();
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal__box ${wide ? 'modal__box--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={box}>
        <div className="modal__head">
          <h3>{title}</h3>
          <button className="iconbtn" onClick={onClose} aria-label="닫기"><Icon name="x" /></button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}

export function Stat({ label, value, unit, tone }) {
  return (
    <div className="stat">
      <span className="mono stat__label">{label}</span>
      <span className={`stat__value ${tone ? `c-${tone}` : ''}`}>{value}{unit && <small>{unit}</small>}</span>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="searchbox">
      <Icon name="search" size={17} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {value && <button className="iconbtn iconbtn--sm" onClick={() => onChange('')} aria-label="검색어 지우기"><Icon name="x" size={14} /></button>}
    </div>
  );
}

export function Select({ value, onChange, options, label, size }) {
  return (
    <label className={`select ${size === 'sm' ? 'select--sm' : ''}`}>
      <span className="sr">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <Icon name="down" size={14} />
    </label>
  );
}

// 누르면 설명이 뜨는 뱃지. 카드의 overflow 에 잘리지 않게 body 로 옮겨 fixed 로 띄우고,
// 화면 가장자리에서는 안쪽으로 당기며 아래 공간이 모자라면 위로 뒤집는다.
export function InfoPop({ label, title, children, className = '' }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btn = useRef(null);
  const box = useRef(null);
  const place = useCallback(() => {
    const a = btn.current?.getBoundingClientRect();
    const m = box.current;
    if (!a || !m) return;
    const W = document.documentElement.clientWidth, H = document.documentElement.clientHeight, gap = 8, edge = 12;
    const w = m.offsetWidth, h = m.offsetHeight;
    let top = a.bottom + gap;
    if (top + h > H - edge && a.top - gap - h >= edge) top = a.top - gap - h;
    top = Math.max(edge, Math.min(top, H - h - edge));
    const left = Math.max(edge, Math.min(a.left, W - w - edge));
    setPos({ top, left });
  }, []);
  useLayoutEffect(() => {
    if (!open) { setPos(null); return undefined; }
    place();
    const raf = requestAnimationFrame(place);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onDown = (e) => { if (!btn.current?.contains(e.target) && !box.current?.contains(e.target)) setOpen(false); };
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open, place]);
  return (
    <>
      <button ref={btn} type="button" className={`infopop ${className}`} aria-expanded={open} aria-haspopup="dialog" onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}>
        {label}<Icon name="info" size={12} stroke={2} />
      </button>
      {open && createPortal(
        <div ref={box} role="dialog" aria-label={title} className="popbox" style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0, visibility: 'hidden' }}>
          <b>{title}</b>
          <p>{children}</p>
        </div>,
        document.body,
      )}
    </>
  );
}
