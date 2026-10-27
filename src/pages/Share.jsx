import { Fragment, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CommunityCard, OpenClassCard, OpenClassModal, ScopeChip } from '../components/cards.jsx';
import { GyeonggiMap, MonthCalendar } from '../components/charts.jsx';
import Icon from '../components/Icon.jsx';
import { Avatar, Chip, Empty, Field, Modal, PageHead, Panel, SearchBox, Select, Tabs, fmtDate, num, shortDate } from '../components/ui.jsx';
import { BANDS, BOARD_TABS, COMM_POSTS, COMM_TYPES, COMMUNITIES, LEVELS, ME, OFFICES, OPEN_CLASSES, OUTCOMES, SUBJECTS, TODAY, officeOf } from '../data/seed.js';
import { SCOPE_HELP, SCOPE_LABEL, classAccess, distKm, neighborOffices, shortOffice } from '../fit.js';
import { uid, useStore } from '../store.jsx';

const VIEWS = [
  { v: 'feed', n: 1, label: '맞춤 피드', icon: 'list', solves: '정보가 너무 많고 범위가 헷갈리는 문제', note: '우리 학교 동료장학, 우리 지원청, 같은 교과, 도 단위 순으로 묶어 내게 맞는 것부터 보여 줘요.' },
  { v: 'week', n: 2, label: '주간 일정표', icon: 'clock', solves: '달력 칸에 정보가 다 안 들어가는 문제', note: '이번 주와 다음 주를 요일과 오전·오후로 나눠 보여 줘요. 내 수업·신청과 겹치는지 바로 보여요.' },
  { v: 'map', n: 3, label: '지도·가까운 순', icon: 'map', solves: '내 지역과 이웃 지역을 골라 보기 어려운 문제', note: '지도에서 시·군을 눌러 지역을 넣고 빼요. 목록은 우리 학교에서 가까운 순이에요.' },
  { v: 'cal', n: 4, label: '한 달 달력', icon: 'calendar', solves: '기존 달력이 복잡한 문제', note: '기존 달력을 고친 안이에요. 날짜를 누르면 그날 수업이 옆에 펼쳐져요.' },
];
const BAND_OPTS = ['전체 학교급', ...BANDS];
const WEEK0 = '2026-10-26';
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

function Group({ title, sub, items, onOpen, max = 4, dist }) {
  const [all, setAll] = useState(false);
  if (!items.length) return null;
  return (
    <section className="ogroup">
      <h3 className="ogroup__title">{title}<span className="mono">{items.length}</span>{sub && <small>{sub}</small>}</h3>
      <div className="oclist">{(all ? items : items.slice(0, max)).map((o) => <OpenClassCard key={o.id} o={o} onOpen={onOpen} showDist={dist?.(o)} />)}</div>
      {items.length > max && <button className="more" onClick={() => setAll(!all)}>{all ? '접기' : `${items.length - max}건 더 보기`}</button>}
    </section>
  );
}

function FeedView({ list, nearExtra, p, band, wide, onOpen }) {
  const b = band === '전체 학교급' ? p.band : band;
  const near = neighborOffices(p.office);
  const used = new Set();
  const take = (f) => list.filter((o) => !used.has(o.id) && f(o)).map((o) => { used.add(o.id); return o; });
  const school = take((o) => o.scope === '학교');
  const mine = take((o) => o.office === p.office);
  const subj = p.subject ? take((o) => o.subject === p.subject && o.scope === '도') : [];
  const doBand = take((o) => o.scope === '도' && o.audience.includes(b));
  const nearby = [...take((o) => near.includes(o.office)), ...nearExtra.filter((o) => !used.has(o.id))];
  const otherOffice = wide ? take((o) => o.locked) : [];
  const rest = take(() => true);
  return (
    <div>
      <Group title="우리 학교 동료장학" sub="같은 학교 선생님에게만 보여요" items={school} onOpen={onOpen} />
      <Group title={`우리 지원청 · ${shortOffice(p.office)}`} sub="지원청 단위와 우리 지역 도 단위 공개" items={mine} onOpen={onOpen} />
      <Group title={`같은 교과 · ${p.subject}`} sub="도 단위 공개" items={subj} onOpen={onOpen} />
      <Group title={`도 단위 · ${b} 대상`} items={doBand} onOpen={onOpen} />
      <Group title="이웃 지원청" sub={`${near.map(shortOffice).join(' · ')} · 지원청 단위는 그 지원청 선생님 대상이라 지도안만 볼 수 있어요`} items={nearby} onOpen={onOpen} />
      <Group title="다른 지원청 공개" sub="그 지원청 선생님 대상이라 신청은 안 되고 지도안을 미리 볼 수 있어요" items={otherOffice} onOpen={onOpen} />
      <Group title={wide ? '다른 학교급·교과·지역' : '그 밖의 공개수업'} items={rest} onOpen={onOpen} max={wide ? 6 : 2} />
      {!list.length && <Empty text="조건에 맞는 공개수업이 없어요. 범위나 지역을 넓혀 보세요." />}
    </div>
  );
}

function WeekView({ list, onOpen }) {
  const st = useStore();
  const [w, setW] = useState(0);
  const start = addDays(WEEK0, w * 7);
  const days = [0, 1, 2, 3, 4].map((i) => addDays(start, i));
  const my = st.s.myClasses.concat(OPEN_CLASSES.filter((o) => o.teacher === ME.name));
  const slot = (o) => (Number(o.time.slice(0, 2)) < 12 ? '오전' : '오후');
  const label = w === 0 ? '이번 주' : w === 1 ? '다음 주' : w === -1 ? '지난주' : `${w}주 뒤`;
  return (
    <Panel>
      <div className="cal__bar">
        <button className="iconbtn" onClick={() => setW(w - 1)} aria-label="이전 주"><Icon name="left" /></button>
        <strong>{label} <span className="mono">{shortDate(days[0])} ~ {shortDate(days[4])}</span></strong>
        <button className="iconbtn" onClick={() => setW(w + 1)} aria-label="다음 주"><Icon name="right" /></button>
      </div>
      <div className="week">
        <div className="week__corner" />
        {days.map((d) => <div key={d} className={`week__day ${d === TODAY ? 'is-today' : ''}`}><b>{'일월화수목금토'[new Date(d).getDay()]}</b><span className="mono">{shortDate(d)}</span></div>)}
        {['오전', '오후'].map((sl) => (
          <Fragment key={sl}>
            <div className="week__slot">{sl}</div>
            {days.map((d) => {
              const here = list.filter((o) => o.date === d && slot(o) === sl);
              const mine = my.filter((o) => o.date === d && slot(o) === sl);
              return (
                <div key={d + sl} className="week__cell">
                  {mine.map((o) => <span key={o.id} className="wk wk--mine"><b>내 수업</b>{o.time} {o.subject}</span>)}
                  {here.filter((o) => !mine.some((x) => x.id === o.id)).map((o) => (
                    <button key={o.id} className={`wk ${st.s.classApps[o.id] ? 'is-applied' : ''} ${o.locked ? 'is-locked' : ''}`} onClick={() => onOpen(o)}>
                      <span className="wk__top"><ScopeChip scope={o.scope} /><span className="mono">{o.time}</span></span>
                      <b>{o.subject} · {o.topic}</b>
                      <small>{o.school} · {shortOffice(o.office)}</small>
                    </button>
                  ))}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
      <ul className="legend"><li><span className="wk wk--mine wk--dot" />내가 여는 수업</li><li><span className="wk is-applied wk--dot" />참관 신청함</li><li><ScopeChip scope="학교" />우리 학교만</li><li><ScopeChip scope="지원청" />지원청 단위</li><li><ScopeChip scope="도" />도 단위</li></ul>
    </Panel>
  );
}

function MapView({ list, p, regions, setRegions, onOpen }) {
  const [sel, setSel] = useState(null);
  const offices = regions === 'all' ? null : regions;
  const regionCities = new Set((offices ?? [p.office, ...neighborOffices(p.office)]).flatMap((n) => OFFICES.find((o) => o.name === n).cities));
  const pick = (city) => {
    const off = officeOf(city);
    const cur = regions === 'all' ? [] : regions;
    const next = cur.includes(off) ? cur.filter((x) => x !== off) : [...cur, off];
    setRegions(next.length ? next : 'all');
  };
  const sorted = [...list].sort((a, b) => distKm(p.city, a.city) - distKm(p.city, b.city) || a.date.localeCompare(b.date));
  return (
    <div className="mapwrap">
      <Panel className="mapwrap__map">
        <p className="note"><Icon name="pin" size={15} />{regions === 'all' ? '진하게 칠한 곳이 우리 지원청과 이웃 지원청이에요. 시·군을 누르면 그 지역만 골라 볼 수 있어요.' : '고른 지역만 보여요. 다시 누르면 빠져요.'}</p>
        <GyeonggiMap items={list} selected={sel} onSelect={setSel} onOpen={onOpen} regionCities={regionCities} homeCity={p.city} focusCity={p.city} onCity={pick} />
      </Panel>
      <Panel className="mapwrap__list" title="우리 학교에서 가까운 순" code={`${sorted.length}건 · 시·군 중심 거리`}>
        <div className="oclist">{sorted.map((o) => <OpenClassCard key={o.id} o={o} onOpen={onOpen} showDist={distKm(p.city, o.city)} />)}</div>
        {!sorted.length && <Empty text="고른 지역에 공개수업이 없어요" />}
      </Panel>
    </div>
  );
}

function CalView({ list, onOpen }) {
  // 오늘 이후 첫 공개수업이 있는 날로 연다
  const first = [...list].filter((o) => o.date >= TODAY).sort((a, b) => a.date.localeCompare(b.date))[0]?.date ?? TODAY;
  const [ym, setYm] = useState([Number(first.slice(0, 4)), Number(first.slice(5, 7))]);
  const [day, setDay] = useState(first);
  const move = (d) => setYm(([y, m]) => { const n = m + d; return n < 1 ? [y - 1, 12] : n > 12 ? [y + 1, 1] : [y, n]; });
  const dayList = list.filter((o) => o.date === day);
  return (
    <div className="calwrap">
      <Panel>
        <MonthCalendar year={ym[0]} month={ym[1]} items={list} onOpen={onOpen} onMove={move} selected={day} onPick={setDay} />
        <ul className="legend"><li><ScopeChip scope="도" />도 단위</li><li><ScopeChip scope="지원청" />지원청 단위</li><li><ScopeChip scope="학교" />우리 학교만</li></ul>
      </Panel>
      <Panel className="calwrap__side" title={fmtDate(day)} code={`그날 공개수업 ${dayList.length}건`}>
        <div className="oclist">{dayList.map((o) => <OpenClassCard key={o.id} o={o} onOpen={onOpen} />)}</div>
        {!dayList.length && <p className="empty-line">이날은 공개수업이 없어요. 달력에서 숫자가 있는 날을 눌러 보세요.</p>}
      </Panel>
    </div>
  );
}

const SCOPES = ['학교', '지원청', '도'];
export function OpenClasses() {
  const st = useStore();
  const p = st.s.profile;
  const [sp, setSp] = useSearchParams();
  const view = [sp.get('v'), st.s.classView].find((x) => VIEWS.some((y) => y.v === x)) ?? 'feed';
  const setView = (v) => { st.patch(() => ({ classView: v })); setSp({ v }, { replace: true }); };
  const [tab, setTab] = useState('explore');
  const [scope, setScope] = useState('전체');
  const [regions, setRegions] = useState('all');
  const [pickRegion, setPickRegion] = useState(false);
  const [band, setBand] = useState(p.band);
  const [subject, setSubject] = useState('전체 교과');
  // 처음에는 내 학교급·지역에 맞춘 것부터, 넓게 찾기를 켜면 다른 학교급·교과·지역까지 모두 보인다
  const [wide, setWide] = useState(false);
  const toggleWide = () => {
    const next = !wide;
    setWide(next);
    setBand(next ? '전체 학교급' : p.band);
    setSubject('전체 교과');
    setRegions('all');
    st.toast(next ? '다른 학교급·교과·지역 공개수업까지 모두 보여 드려요' : '선생님께 맞는 공개수업부터 보여 드려요');
  };
  const [open, setOpen] = useState(null);
  const [f, setF] = useState({ date: '2026-12-02', time: '10:40~11:20', subject: p.subject || '수학', topic: '', grade: '', scope: '학교', cap: 10, audience: [p.band], file: '', goal: '', flow: '' });

  const all = [...st.s.myClasses, ...OPEN_CLASSES];
  // 다른 학교의 '우리 학교' 공개는 아예 안 보이고, 다른 지원청의 지원청 단위는 그 지역을 직접 골랐을 때만 보인다.
  const visible = all.filter((o) => {
    const a = classAccess(o, p);
    if (a === 'hidden') return false;
    if (a === 'other') return wide || (regions !== 'all' && regions.includes(o.office));
    return true;
  }).map((o) => ({ ...o, locked: classAccess(o, p) === 'other' }));
  const filtered = visible.filter((o) =>
    (scope === '전체' || o.scope === scope)
    && (regions === 'all' || regions.includes(o.office))
    && (band === '전체 학교급' || o.audience.includes(band))
    && (subject === '전체 교과' || o.subject === subject));
  const upcoming = filtered.filter((o) => o.date >= TODAY).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const near = neighborOffices(p.office);
  // 피드의 '이웃 지원청' 묶음에는 이웃 지원청의 지원청 단위 공개도 잠금 표시로 함께 보여 준다
  const nearExtra = all.filter((o) => classAccess(o, p) === 'other' && near.includes(o.office) && o.date >= TODAY
    && (band === '전체 학교급' || o.audience.includes(band)) && (subject === '전체 교과' || o.subject === subject) && (scope === '전체' || scope === '지원청'))
    .map((o) => ({ ...o, locked: true }));
  const mine = all.filter((o) => st.s.classApps[o.id]);
  const cur = VIEWS.find((x) => x.v === view);
  const scopeCount = (sc) => visible.filter((o) => o.date >= TODAY && (sc === '전체' || o.scope === sc) && (regions === 'all' || regions.includes(o.office))).length;
  const toggleOffice = (n) => { const c = regions === 'all' ? [] : regions; const next = c.includes(n) ? c.filter((x) => x !== n) : [...c, n]; setRegions(next.length ? next : 'all'); };

  const submit = (e) => {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) { st.toast('공개 날짜를 골라 주세요', 'warn'); return; }
    if (!f.subject || !f.topic.trim()) { st.toast('교과와 수업 주제를 적어 주세요', 'warn'); return; }
    if (!f.file && !f.goal.trim()) { st.toast('지도안 파일을 올리거나 학습 목표를 적어 주세요', 'warn'); return; }
    if (!f.audience.length) { st.toast('참관 대상 학교급을 하나 이상 골라 주세요', 'warn'); return; }
    const flow = f.flow.split('\n').map((x) => x.trim().slice(0, 120)).filter(Boolean).slice(0, 6);
    const o = {
      id: uid('o'), date: f.date, time: f.time, city: p.city, school: p.school, level: p.subject === '특수교육' ? '특수학교' : p.level, grade: f.grade || '학급 미정', subject: f.subject, topic: f.topic.trim(), teacher: ME.name,
      scope: f.scope, cap: Math.max(1, Math.min(60, Number(f.cap) || 1)), applied: 0, mode: '대면', office: p.office, audience: f.audience, mine: true,
      plan: { file: f.file || `지도안_${f.subject}.hwpx`, goal: f.goal.trim() || f.topic.trim(), flow: flow.length ? flow : ['도입 · 생각을 여는 질문', `전개 · ${f.topic.trim()}`, '정리 · 배운 점 나누기'] },
    };
    st.patch((s) => ({ myClasses: [o, ...s.myClasses] }));
    st.award('활동', 50, `수업 공개 등록: ${o.topic}`);
    st.toast(`${SCOPE_LABEL[f.scope]} 공개수업을 등록했어요 · ${f.scope === '학교' ? '우리 학교 선생님에게만 보여요' : '모든 시안에 바로 보여요'}`);
    setTab('explore'); setScope('전체');
  };

  return (
    <div className="container">
      <PageHead crumbs={['나눔', '공개수업']} code="3.1 · 공개하기 · 참관하기 · 신청 현황" title="공개수업" desc="우리 학교 동료장학부터 지원청 단위, 도 단위 공개수업까지 내 학교급과 교과에 맞춰 찾고, 지도안을 미리 보고 참관을 신청합니다." />
      <Tabs value={tab} onChange={setTab} className="tabs--page" items={[{ value: 'explore', label: '참관하기', icon: 'eye' }, { value: 'open', label: '공개하기', icon: 'video' }, { value: 'status', label: `신청 현황 (${mine.length})`, icon: 'list' }]} />

      {tab === 'explore' && (
        <>
          <div className="variantbar variantbar--wrap">
            <span className="variantbar__k"><Icon name="layers" size={15} />화면 시안</span>
            <div className="vpick" role="tablist" aria-label="공개수업 화면 시안">
              {VIEWS.map((x) => (
                <button key={x.v} role="tab" aria-selected={view === x.v} className={view === x.v ? 'is-on' : ''} onClick={() => setView(x.v)}>
                  <span className="vpick__n">{x.n}</span><Icon name={x.icon} size={15} />{x.label}
                </button>
              ))}
            </div>
            <p className="variantbar__note"><b>푸는 문제 · {cur.solves}</b> {cur.note}</p>
          </div>

          <div className="ofilter">
            <button className={`btn btn--sm ${wide ? 'btn--dark' : 'btn--line'}`} onClick={toggleWide} aria-pressed={wide} title="다른 학교급·교과·지역 공개수업도 함께 봅니다">
              <Icon name={wide ? 'check' : 'search'} size={14} />{wide ? '넓게 찾는 중' : '넓게 찾기'}
            </button>
            <Tabs size="sm" value={scope} onChange={setScope} items={[{ value: '전체', label: `전체 ${scopeCount('전체')}` }, ...SCOPES.map((sc) => ({ value: sc, label: `${SCOPE_LABEL[sc]} ${scopeCount(sc)}` }))]} />
            <Select label="참관 대상 학교급" size="sm" value={band} onChange={setBand} options={BAND_OPTS} />
            <Select label="교과" size="sm" value={subject} onChange={setSubject} options={['전체 교과', ...new Set(visible.map((o) => o.subject))]} />
            <button className={`btn btn--sm ${pickRegion ? 'btn--dark' : 'btn--line'}`} onClick={() => setPickRegion(!pickRegion)} aria-expanded={pickRegion}>
              <Icon name="pin" size={14} />지역 · {regions === 'all' ? '경기도 전체' : regions.length === 1 ? shortOffice(regions[0]) : `${shortOffice(regions[0])} 외 ${regions.length - 1}곳`}
            </button>
          </div>
          {pickRegion && (
            <div className="regions">
              <div className="row-between">
                <span className="mono">교육지원청 25곳 · 지원청 단위 공개는 그 지원청 선생님만 신청할 수 있어요</span>
                <div className="row-end">
                  <button className="btn btn--sm btn--line" onClick={() => setRegions([p.office])}>우리 지원청만</button>
                  <button className="btn btn--sm btn--line" onClick={() => setRegions([p.office, ...near])}><Icon name="plus" size={14} />이웃 지원청 더하기</button>
                  <button className="btn btn--sm btn--line" onClick={() => setRegions('all')}>경기도 전체</button>
                </div>
              </div>
              <div className="chips">
                {OFFICES.map((o) => {
                  const on = regions !== 'all' && regions.includes(o.name);
                  return <button key={o.name} className={`chip chip--btn ${on ? 'is-on' : ''}`} onClick={() => toggleOffice(o.name)} aria-pressed={on}>{o.short}{o.name === p.office && <span className="mono">우리</span>}{near.includes(o.name) && <span className="mono">이웃</span>}</button>;
                })}
              </div>
            </div>
          )}

          {view === 'feed' && <FeedView list={upcoming} nearExtra={regions === 'all' && !wide ? nearExtra : []} p={p} band={band} wide={wide} onOpen={setOpen} />}
          {view === 'week' && <WeekView list={filtered} onOpen={setOpen} />}
          {view === 'map' && <MapView list={upcoming} p={p} regions={regions} setRegions={setRegions} onOpen={setOpen} />}
          {view === 'cal' && <CalView list={filtered} onOpen={setOpen} />}
        </>
      )}

      {tab === 'open' && (
        <form className="grid2" onSubmit={submit}>
          <Panel title="내 수업 공개하기" desc="공개 범위를 고르면 그 범위의 선생님에게만 보여요. 지도안을 함께 올리면 미리 보고 신청할 수 있어요.">
            <div className="field">
              <span className="field__label">공개 범위</span>
              <div className="seg seg--full" role="radiogroup" aria-label="공개 범위">
                {SCOPES.map((sc) => <button type="button" key={sc} role="radio" aria-checked={f.scope === sc} className={f.scope === sc ? 'is-on' : ''} onClick={() => setF({ ...f, scope: sc, cap: sc === '학교' ? 10 : sc === '지원청' ? 20 : 30 })}>{sc === '지원청' ? `우리 지원청 (${shortOffice(p.office)})` : SCOPE_LABEL[sc]}</button>)}
              </div>
              <span className="field__hint">{SCOPE_HELP[f.scope]}</span>
            </div>
            <div className="row2">
              <Field label="날짜"><input className="input" type="date" required value={f.date} min={TODAY} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
              <Field label="시간"><input className="input" maxLength={20} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
            </div>
            <div className="row2">
              <Field label="교과"><select className="input" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })}>{SUBJECTS.map((x) => <option key={x}>{x}</option>)}</select></Field>
              <Field label="학년·반"><input className="input" maxLength={20} value={f.grade} onChange={(e) => setF({ ...f, grade: e.target.value })} placeholder="6학년 3반" /></Field>
            </div>
            <Field label="수업 주제"><input className="input" maxLength={80} value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} placeholder="예) 비례식을 생활 문제로 풀기" /></Field>
            <div className="field">
              <span className="field__label">참관 대상 학교급</span>
              <div className="chips">{BANDS.map((b) => { const on = f.audience.includes(b); return <button type="button" key={b} className={`chip chip--btn ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => setF({ ...f, audience: on ? f.audience.filter((x) => x !== b) : [...f.audience, b] })}>{b}</button>; })}</div>
              <span className="field__hint">중학교 수업에 고등학교 선생님도 오실 수 있게 여러 개 고를 수 있어요.</span>
            </div>
            <Field label="참관 정원"><input className="input" type="number" min={1} max={60} value={f.cap} onChange={(e) => setF({ ...f, cap: e.target.value })} /></Field>
          </Panel>
          <Panel title="지도안" code="신청 전에 미리 보여요" desc="파일을 올리거나 학습 목표와 수업 흐름을 적어 주세요.">
            <Field label="지도안 파일" hint="프로토타입이라 파일 이름만 기록하고 실제로 올리지는 않아요."><input className="input" type="file" accept=".hwp,.hwpx,.pdf,.docx" onChange={(e) => setF({ ...f, file: (e.target.files?.[0]?.name ?? '').slice(0, 80) })} /></Field>
            <Field label="학습 목표"><input className="input" maxLength={200} value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })} placeholder="예) 비례식을 세워 생활 속 문제를 푼다." /></Field>
            <Field label="수업 흐름" hint="한 줄에 한 단계씩 적어 주세요."><textarea className="ta" rows={4} maxLength={800} value={f.flow} onChange={(e) => setF({ ...f, flow: e.target.value })} placeholder={'도입 · 장보기 영수증으로 질문 만들기\n전개 · 모둠별 비례식 세우기\n정리 · 다른 모둠 풀이 비교'} /></Field>
            <button className="btn btn--dark" type="submit"><Icon name="video" size={16} />공개수업 등록</button>
            <ul className="flow flow--light">
              <li><span className="mono">01</span>고른 범위의 선생님에게 바로 보여요</li>
              <li><span className="mono">02</span>참관 신청이 오면 알림을 받아요</li>
              <li><span className="mono">03</span>성장 여정에 수업 나눔 1회 기록 · 활동 포인트 +50</li>
            </ul>
          </Panel>
        </form>
      )}

      {tab === 'status' && (
        <Panel title="참관 신청 현황" desc="신청 현황은 성장 메뉴의 성장 여정에 함께 기록됩니다.">
          {mine.length ? <div className="oclist">{mine.map((o) => <OpenClassCard key={o.id} o={o} onOpen={setOpen} />)}</div> : <Empty text="아직 참관 신청이 없어요" />}
          {st.s.myClasses.length > 0 && <>
            <p className="field__label mt">내가 공개한 수업</p>
            <div className="oclist">{st.s.myClasses.map((o) => <OpenClassCard key={o.id} o={o} onOpen={setOpen} />)}</div>
          </>}
        </Panel>
      )}

      <OpenClassModal o={open} onClose={() => setOpen(null)} />
    </div>
  );
}

export function Communities() {
  const st = useStore();
  const [tab, setTab] = useState('find');
  const [q, setQ] = useState('');
  const [type, setType] = useState('전체');
  const [region, setRegion] = useState('전체 지역');
  const [f, setF] = useState({ type: '전문적학습공동체', name: '', desc: '', region: '수원', tags: '' });
  const all = [...st.s.myComms, ...COMMUNITIES];
  const list = all.filter((c) => (type === '전체' || c.type === type) && (region === '전체 지역' || c.region === region || c.region === '도 단위') && (!q || (c.name + c.desc + c.tags.join(' ')).includes(q)));
  const mine = all.filter((c) => c.mine || st.s.joinedComms[c.id]);
  const make = (e) => {
    e.preventDefault();
    if (!f.name.trim() || !f.desc.trim()) { st.toast('공동체 이름과 소개를 적어 주세요', 'warn'); return; }
    const c = { id: uid('c'), type: f.type, name: f.name.trim(), desc: f.desc.trim(), members: 1, region: f.region, level: '전체', leader: ME.name, since: '2026', tags: f.tags.split(/[,\s]+/).filter(Boolean).slice(0, 4), mine: true };
    st.patch((s) => ({ myComms: [c, ...s.myComms] }));
    st.award('활동', 30, `공동체 만들기: ${c.name}`);
    st.toast('공동체를 만들었어요');
    setTab('mine');
  };
  return (
    <div className="container">
      <PageHead crumbs={['나눔', '공동체']} code="3.2 · 공동체 찾기 · 공동체 만들기 · 나의 공동체" title="공동체" desc="연구회, 전문적학습공동체, 교원 자율 동호회를 한곳에서 찾고, 실천 사례와 자료를 나누며 활동을 성장 여정에 연결합니다." />
      <Tabs value={tab} onChange={setTab} className="tabs--page" items={[{ value: 'find', label: `공동체 찾기 (${all.length})`, icon: 'search' }, { value: 'mine', label: `나의 공동체 (${mine.length})`, icon: 'heart' }, { value: 'make', label: '공동체 만들기', icon: 'plus' }]} />
      {tab === 'find' && <>
        <div className="filters">
          <SearchBox value={q} onChange={setQ} placeholder="이름, 주제, 태그로 찾기" />
          <Select label="지역" value={region} onChange={setRegion} options={['전체 지역', ...OFFICES.map((o) => o.short)]} />
        </div>
        <div className="typebar">
          {['전체', ...Object.keys(COMM_TYPES)].map((t) => (
            <button key={t} className={`typebar__b ${type === t ? 'is-on' : ''} ${t !== '전체' ? `typebar__b--${COMM_TYPES[t]}` : ''}`} onClick={() => setType(t)}>
              {t !== '전체' && <span className={`dot bg-${COMM_TYPES[t]}`} />}{t}<span className="mono">{all.filter((c) => t === '전체' || c.type === t).length}</span>
            </button>
          ))}
        </div>
        {(type === '전체' ? Object.keys(COMM_TYPES) : [type]).map((t) => {
          const sub = list.filter((c) => c.type === t);
          if (!sub.length) return null;
          return (
            <section key={t} className={`cgroup cgroup--${COMM_TYPES[t]}`}>
              <h2 className="cgroup__title"><span className={`dot bg-${COMM_TYPES[t]}`} />{t}<span className="mono">{sub.length}</span></h2>
              <div className="cgrid">{sub.map((c) => <CommunityCard key={c.id} c={c} />)}</div>
            </section>
          );
        })}
        {!list.length && <Empty text="조건에 맞는 공동체가 없어요. 직접 만들어 보세요." ><button className="btn btn--dark" onClick={() => setTab('make')}>공동체 만들기</button></Empty>}
      </>}
      {tab === 'mine' && <div className="cgrid">{mine.map((c) => <CommunityCard key={c.id} c={c} />)}</div>}
      {tab === 'make' && (
        <form className="grid2" onSubmit={make}>
          <Panel title="새 공동체 만들기">
            <Field label="유형">
              <div className="seg seg--full">{Object.keys(COMM_TYPES).map((t) => <button type="button" key={t} className={f.type === t ? 'is-on' : ''} onClick={() => setF({ ...f, type: t })}><span className={`dot bg-${COMM_TYPES[t]}`} />{t}</button>)}</div>
            </Field>
            <Field label="이름"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="예) 수원 초등 질문수업 모임" /></Field>
            <Field label="소개"><textarea className="ta" rows={3} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} /></Field>
            <div className="row2">
              <Field label="활동 지역"><select className="input" value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })}>{['도 단위', ...OFFICES.map((o) => o.short)].map((r) => <option key={r}>{r}</option>)}</select></Field>
              <Field label="태그" hint="쉼표로 나눠요"><input className="input" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} placeholder="수학, 질문" /></Field>
            </div>
            <button className="btn btn--dark" type="submit"><Icon name="plus" size={16} />만들기</button>
          </Panel>
          <Panel dark title="공동체 게시판은 이렇게 열려요">
            <div className="chips">{BOARD_TABS.map((b) => <span key={b} className="chip chip--glass">{b}</span>)}</div>
            <p className="lead">일정과 공지, 자료나눔, 실천 성찰, 함께 연구, 사진·영상까지 일곱 개 게시판이 자동으로 만들어집니다.</p>
          </Panel>
        </form>
      )}
    </div>
  );
}

export function CommunityDetail() {
  const { id } = useParams();
  const st = useStore();
  const c = [...st.s.myComms, ...COMMUNITIES].find((x) => x.id === id);
  const [board, setBoard] = useState('전체 활동');
  const [writing, setWriting] = useState(false);
  const [f, setF] = useState({ board: '자료나눔', title: '', body: '' });
  const [openPost, setOpenPost] = useState(null);
  if (!c) return <div className="container"><Empty text="공동체를 찾을 수 없어요"><Link className="btn btn--line" to="/share/communities">목록으로</Link></Empty></div>;
  const joined = c.mine || !!st.s.joinedComms[c.id];
  const posts = [...(st.s.commPosts[c.id] ?? []), ...(COMM_POSTS[c.id] ?? [])];
  const shown = posts.filter((p) => board === '전체 활동' || p.board === board);
  const write = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    const p = { id: uid('p'), ...f, title: f.title.trim(), author: ME.name, date: TODAY, comments: 0 };
    st.patch((s) => ({ commPosts: { ...s.commPosts, [c.id]: [p, ...(s.commPosts[c.id] ?? [])] } }));
    st.award('활동', f.board === '실천 성찰' ? 15 : 10, `공동체 글: ${p.title}`);
    st.toast('글을 올렸어요');
    setWriting(false); setF({ board: '자료나눔', title: '', body: '' }); setBoard(p.board);
  };
  return (
    <div className="container">
      <div className={`chero chero--${COMM_TYPES[c.type]}`}>
        <Link to="/share/communities" className="linkbtn"><Icon name="left" size={14} /> 공동체 목록</Link>
        <span className="mono">{c.type} · {c.region} · {c.since}년부터</span>
        <h1>{c.name}</h1>
        <p>{c.desc}</p>
        <div className="chero__foot">
          <span><Icon name="users" size={15} /> 멤버 {num(c.members + (st.s.joinedComms[c.id] ? 1 : 0))}명 · 대표 {c.leader}</span>
          <div className="row-end">
            {!c.mine && <button className={`btn ${joined ? 'btn--line' : 'btn--light'}`} onClick={() => { st.toggle('joinedComms', c.id); st.toast(joined ? '공동체에서 나왔어요' : '공동체에 함께해요'); }}>{joined ? '참여 중' : '가입 신청'}</button>}
            <button className="btn btn--light" disabled={!joined} onClick={() => setWriting(true)}><Icon name="edit" size={15} />글쓰기</button>
          </div>
        </div>
      </div>
      <Tabs value={board} onChange={setBoard} className="tabs--page" items={BOARD_TABS.map((b) => ({ value: b, label: `${b}${b === '전체 활동' ? ` (${posts.length})` : ''}` }))} />
      <Panel>
        {shown.length ? (
          <ul className="board">
            {shown.map((p) => (
              <li key={p.id}><button onClick={() => setOpenPost(p)}>
                <Chip tone={{ 공지사항: 'orange', 일정: 'blue', 자료나눔: 'purple', '실천 성찰': 'green', '함께 연구': 'sky', '사진·영상': 'pink' }[p.board]}>{p.board}</Chip>
                <b>{p.title}</b>
                <span className="board__meta">{p.author} · {shortDate(p.date)} · 댓글 {p.comments}</span>
              </button></li>
            ))}
          </ul>
        ) : <Empty text={joined ? '첫 글을 남겨 보세요' : '가입하면 글을 쓸 수 있어요'} />}
      </Panel>
      <Modal open={writing} onClose={() => setWriting(false)} title="공동체에 글쓰기" footer={<button className="btn btn--dark" onClick={write}>올리기</button>}>
        <form onSubmit={write} className="form">
          <Field label="게시판"><select className="input" value={f.board} onChange={(e) => setF({ ...f, board: e.target.value })}>{BOARD_TABS.slice(1).map((b) => <option key={b}>{b}</option>)}</select></Field>
          <Field label="제목"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="내용"><textarea className="ta" rows={5} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
        </form>
      </Modal>
      <Modal open={!!openPost} onClose={() => setOpenPost(null)} title={openPost?.title}>
        {openPost && <><div className="detail-meta"><Avatar name={openPost.author} size={36} /><div><b>{openPost.author}</b><span>{fmtDate(openPost.date)} · {openPost.board}</span></div></div><p className="lead">{openPost.body || '내용이 없습니다.'}</p></>}
      </Modal>
    </div>
  );
}

export function Outcomes() {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('전체');
  const [year, setYear] = useState('전체 연도');
  const [open, setOpen] = useState(null);
  const list = OUTCOMES.filter((o) => (kind === '전체' || o.kind === kind) && (year === '전체 연도' || String(o.year) === year) && (!q || (o.title + o.summary + o.school + o.tags.join(' ')).includes(q)));
  const tone = { 선도학교: 'blue', 실천학교: 'green', 연구년제: 'purple' };
  return (
    <div className="container">
      <PageHead crumbs={['나눔', '성과나눔']} code="3.3 · 성과 나누기 · 살펴보기" title="성과나눔" desc="선도학교, 실천학교, 연구년제의 사례를 한 번에 검색해 찾아봅니다." />
      <div className="filters">
        <SearchBox value={q} onChange={setQ} placeholder="주제, 학교, 태그로 통합 검색" />
        <Select label="연도" value={year} onChange={setYear} options={['전체 연도', '2026', '2025']} />
      </div>
      <Tabs size="sm" value={kind} onChange={setKind} items={['전체', '선도학교', '실천학교', '연구년제'].map((k) => ({ value: k, label: `${k} (${OUTCOMES.filter((o) => k === '전체' || o.kind === k).length})` }))} />
      <div className="ogrid">
        {list.map((o) => (
          <button key={o.id} className={`ocard ocard--${tone[o.kind]}`} onClick={() => setOpen(o)}>
            <span className="ocard__band"><span className="mono">{o.kind}</span><span className="mono">{o.year}</span></span>
            <b>{o.title}</b>
            <span className="ocard__school">{o.school} · {o.region}</span>
            <span className="ocard__sum">{o.summary}</span>
            <span className="chips">{o.tags.map((t) => <Chip key={t}>#{t}</Chip>)}</span>
            <span className="mono ocard__views"><Icon name="eye" size={13} /> {num(o.views)}</span>
          </button>
        ))}
      </div>
      {!list.length && <Empty text="검색 결과가 없어요" />}
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title} footer={<button className="btn btn--line" onClick={() => setOpen(null)}>닫기</button>}>
        {open && <><div className="chips"><Chip tone={tone[open.kind]} solid>{open.kind}</Chip><Chip>{open.year}년</Chip><Chip>{open.level}</Chip></div>
          <dl className="dl"><dt>학교·기관</dt><dd>{open.school}</dd><dt>지역</dt><dd>{open.region}</dd><dt>조회</dt><dd>{num(open.views)}</dd></dl>
          <p className="lead">{open.summary}</p>
          <ul className="files"><li><Icon name="file" size={18} /><span>{open.title}_보고서.pdf</span></li><li><Icon name="image" size={18} /><span>운영 사진 모음</span></li></ul></>}
      </Modal>
    </div>
  );
}
