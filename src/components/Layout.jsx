import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ME, NOTIFS } from '../data/seed.js';
import { useStore } from '../store.jsx';
import Icon from './Icon.jsx';
import { ProfileChip, ProfileModal } from './Profile.jsx';
import { Avatar, num } from './ui.jsx';

export const MENU = [
  { key: 'growth', label: '성장', icon: 'sprout', tone: 'green', sub: '나의 성장을 위한 공간', items: [
    { to: '/growth/design', code: '1.1', label: '성장 설계', desc: '진단하고 목표 세우기' },
    { to: '/growth/journey', code: '1.2', label: '성장 여정', desc: '포트폴리오 · 뱃지 앨범' },
  ] },
  { key: 'learn', label: '배움', icon: 'book', tone: 'blue', sub: '함께 배우는 수업 이야기', items: [
    { to: '/learn/trainings', code: '2.1', label: '연수', desc: '직무·자율 연수 찾기 · 신청' },
    { to: '/learn/modules', code: '2.2', label: '배움 모듈', desc: '추천 모듈 · 나의 모듈 만들기' },
    { to: '/learn/materials', code: '2.3', label: '교육자료', desc: '추천 · 업로드' },
    { to: '/learn/rooms', code: '2.4', label: '학습방', desc: '신청한 연수·모듈 학습' },
  ] },
  { key: 'share', label: '나눔', icon: 'heart', tone: 'pink', sub: '지식과 경험을 나누는 공간', items: [
    { to: '/share/classes', code: '3.1', label: '공개수업', desc: '공개 · 참관 · 신청 현황' },
    { to: '/share/communities', code: '3.2', label: '공동체', desc: '찾기 · 만들기 · 나의 공동체' },
    { to: '/share/outcomes', code: '3.3', label: '성과나눔', desc: '선도 · 실천학교 · 연구년' },
  ] },
  { key: 'together', label: '동행', icon: 'users', tone: 'purple', sub: '함께하는 교육공동체', items: [
    { to: '/together/worries', code: '4.1', label: '고민 남기기', desc: '동료에게 의견 구하기' },
    { to: '/together/mentors', code: '4.1', label: '멘토 찾기', desc: '분야 · 권역별 멘토 신청' },
    { to: '/together/mentoring', code: '4.2', label: '멘토링 현황', desc: '나의 멘토링 과정' },
  ] },
  { key: 'info', label: '안내', icon: 'info', tone: 'orange', sub: '바로 찾는 교육 정보', items: [
    { to: '/info/about', code: '5.1', label: '소개', desc: '플랫폼과 서비스' },
    { to: '/info/notices', code: '5.2', label: '공지사항', desc: '주요 공지와 소식' },
    { to: '/info/faq', code: '5.3', label: 'FAQ', desc: '자주 묻는 질문' },
  ] },
];

function useOutside(ref, on, off) {
  useEffect(() => {
    if (!on) return;
    const h = (e) => ref.current && !ref.current.contains(e.target) && off();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, on, off]);
}

function Bell() {
  const { s, patch } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const nav = useNavigate();
  useOutside(ref, open, () => setOpen(false));
  return (
    <div className="hdr__pop" ref={ref}>
      <button className="iconbtn hdr__bell" aria-label="알림" aria-expanded={open} onClick={() => { setOpen(!open); patch(() => ({ notifRead: true })); }}>
        <Icon name="bell" size={21} />
        {!s.notifRead && <span className="hdr__badge">{NOTIFS.length}</span>}
      </button>
      {open && (
        <div className="drop drop--right">
          <p className="mono drop__title">알림</p>
          {NOTIFS.map((n) => (
            <button key={n.id} className="drop__item" onClick={() => { setOpen(false); nav(n.to); }}>
              <span>{n.text}</span><small className="mono">{n.date}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu({ onProfile }) {
  const st = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, open, () => setOpen(false));
  return (
    <div className="hdr__pop" ref={ref}>
      <button className="hdr__me" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Avatar name={ME.name} size={32} />
        <span className="hdr__me-name">{ME.name} 선생님</span>
        <Icon name="down" size={14} />
      </button>
      {open && (
        <div className="drop drop--right drop--me">
          <div className="drop__me">
            <strong>{ME.name} 선생님</strong>
            <span>{ME.school} · {ME.role}</span>
            <span className="mono">{num(st.totalPoints)}P</span>
          </div>
          <button className="drop__item" onClick={() => { setOpen(false); onProfile(); }}>내 정보 바꾸기 <small>{st.s.profile.band}{st.s.profile.subject ? ` · ${st.s.profile.subject}` : ''} · {st.s.profile.office}</small></button>
          <Link className="drop__item" to="/growth/journey" onClick={() => setOpen(false)}>나의 성장 여정</Link>
          <Link className="drop__item" to="/together/mentoring" onClick={() => setOpen(false)}>나의 멘토링</Link>
          <button className="drop__item" onClick={() => { setOpen(false); st.reset(); }}>체험 기록 처음으로 되돌리기</button>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const st = useStore();
  const [mobile, setMobile] = useState(false);
  const [prof, setProf] = useState(!st.s.profile.set);
  const [q, setQ] = useState('');
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => { setMobile(false); window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => { document.body.style.overflow = mobile ? 'hidden' : ''; }, [mobile]);
  const submit = (e) => { e.preventDefault(); if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`); };

  return (
    <div className="app">
      <div className="proto-bar">
        <Icon name="info" size={14} />
        <span>보고서 「현장친화적 교원 성장 플랫폼 구축 방안」(2026. 10. 21.)을 바탕으로 만든 <b>프로토타입</b>입니다. 사람·학교·수치는 모두 샘플이며, 누른 기록은 이 브라우저에만 남아요.</span>
      </div>
      <header className="hdr">
        <div className="hdr__in">
          <Link to="/" className="logo" aria-label="G-ONE 첫 화면">
            <span className="logo__mark" aria-hidden />
            <span className="logo__text"><b>G-ONE</b><small>경기 교원성장플랫폼</small></span>
          </Link>
          <nav className="gnb" aria-label="주 메뉴">
            {MENU.map((m) => (
              <div key={m.key} className="gnb__item">
                <NavLink to={m.items[0].to} className={({ isActive }) => `gnb__link ${loc.pathname.startsWith(`/${m.key}`) || isActive ? 'is-on' : ''}`}>
                  <span className={`gnb__ico tone-${m.tone}`}><Icon name={m.icon} size={18} /></span>
                  <span className="gnb__txt"><b>{m.label}</b><small>{m.sub}</small></span>
                </NavLink>
                <div className="gnb__mega">
                  {m.items.map((it) => (
                    <NavLink key={it.to} to={it.to} className="gnb__sub">
                      <span className="mono">{it.code}</span>
                      <span><b>{it.label}</b><small>{it.desc}</small></span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="hdr__tools">
            <ProfileChip onOpen={() => setProf(true)} />
            <button className="iconbtn hdr__search-btn" aria-label="검색" onClick={() => nav('/search')}><Icon name="search" size={21} /></button>
            <Bell />
            <UserMenu onProfile={() => setProf(true)} />
            <button className="iconbtn hdr__burger" aria-label="메뉴 열기" onClick={() => setMobile(true)}><Icon name="menu" size={22} /></button>
          </div>
        </div>
      </header>

      {loc.pathname === '/' && (
        <div className="hero-strip">
          <div className="hero-strip__in">
            <p className="hero-strip__copy">함께 배우고, 함께 성장하는 <em>경기교육의 오늘</em>, <span className="nowrap">G-ONE이</span> 함께합니다.</p>
            <form className="hero-strip__search" onSubmit={submit}>
              <Icon name="search" size={18} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="수업자료, 연수, 공동체를 검색해 보세요" aria-label="통합 검색" />
              <button className="btn btn--dark btn--sm" type="submit">검색</button>
            </form>
          </div>
        </div>
      )}

      <main className="main"><Outlet /></main>

      <footer className="foot">
        <div className="foot__in">
          <div>
            <span className="logo"><span className="logo__mark" aria-hidden /><span className="logo__text"><b>G-ONE</b><small>경기 교원성장플랫폼 프로토타입</small></span></span>
            <p>비전 · 교사 주도의 자발적 성찰과 동행으로 함께 성장하는 경기교육 공동체</p>
          </div>
          <div className="foot__links">
            {MENU.map((m) => (
              <div key={m.key}>
                <b>{m.label}</b>
                {m.items.map((it) => <Link key={it.to} to={it.to}>{it.label}</Link>)}
              </div>
            ))}
          </div>
        </div>
        <p className="foot__note mono">PROTOTYPE · SAMPLE DATA · 2026</p>
      </footer>

      <ProfileModal open={prof} onClose={() => setProf(false)} />

      {mobile && (
        <div className="drawer" onMouseDown={(e) => e.target === e.currentTarget && setMobile(false)}>
          <div className="drawer__panel" role="dialog" aria-label="전체 메뉴">
            <div className="drawer__head">
              <span className="logo"><span className="logo__mark" aria-hidden /><span className="logo__text"><b>G-ONE</b><small>경기 교원성장플랫폼</small></span></span>
              <button className="iconbtn" onClick={() => setMobile(false)} aria-label="메뉴 닫기"><Icon name="x" /></button>
            </div>
            <button className="drawer__profile" onClick={() => { setMobile(false); setProf(true); }}><Icon name="user" size={16} /><span><b>내 정보</b> {st.s.profile.band}{st.s.profile.subject ? ` · ${st.s.profile.subject}` : ''} · {st.s.profile.office.replace('교육지원청', '')}</span><Icon name="right" size={14} /></button>
            <form className="searchbox" onSubmit={(e) => { submit(e); setMobile(false); }}>
              <Icon name="search" size={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="통합 검색" aria-label="통합 검색" />
            </form>
            {MENU.map((m) => (
              <div key={m.key} className="drawer__group">
                <p><span className={`gnb__ico tone-${m.tone}`}><Icon name={m.icon} size={16} /></span>{m.label}</p>
                {m.items.map((it) => <NavLink key={it.to} to={it.to} className="drawer__link"><span className="mono">{it.code}</span>{it.label}</NavLink>)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
