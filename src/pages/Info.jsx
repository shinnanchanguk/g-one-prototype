import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CommunityCard, MaterialCard, ModuleCard, OpenClassCard, OpenClassModal, TrainingCard } from '../components/cards.jsx';
import Icon from '../components/Icon.jsx';
import { MENU } from '../components/Layout.jsx';
import { Chip, Empty, PageHead, Panel, SearchBox, fmtDate } from '../components/ui.jsx';
import { COMMUNITIES, FAQ, INSTRUCTORS, MATERIALS, MENTORS, MODULES, NOTICES, OPEN_CLASSES, OUTCOMES, TRAININGS, WORRIES } from '../data/seed.js';
import { classAccess } from '../fit.js';
import { matCat, thumbsFor } from '../thumbs.js';
import { useStore } from '../store.jsx';

const DIRECTIONS = [
  { k: '성장', tone: 'green', icon: 'sprout', items: [['성찰을 통한 성장 설계', '수치와 점수 중심의 진단에서 벗어나 “어떤 교사가 되고 싶은가”를 스스로 묻고 경험 기반의 서사를 통해 주도적으로 성장을 설계합니다.'], ['성장 여정의 시각화를 통한 인증', '교사 개인의 연수 이수, 멘토링, 연구 활동 등이 축적되어 뱃지와 포인트로 기록하며 한눈에 확인되는 성장 포트폴리오를 제공합니다.']] },
  { k: '배움', tone: 'blue', icon: 'book', items: [['주도적이고 자율적인 배움 문화 확산', '다양한 연수 콘텐츠와 자료를 주도적으로 연결하여 자신의 역량향상을 위한 배움 문화를 확산합니다.'], ['맞춤형 추천을 통한 교원역량 향상', '성장 설계에 따라 맞춤형으로 연수 및 모듈을 추천하여 교원의 전반적인 역량향상을 추구합니다.']] },
  { k: '나눔', tone: 'pink', icon: 'heart', items: [['수업 나눔을 통한 선순환 구조 구축', '흩어져 있는 공개 수업 정보를 통합하여 제공하고, 수업 나눔 문화를 활성화하고 선순환 구조를 구축합니다.'], ['자발적 교류를 통한 교육공동체', '공동체 내 실천 사례와 자료를 공유하고 활동 성과를 아카이빙하고 확산합니다.']] },
  { k: '동행', tone: 'purple', icon: 'users', items: [['현장 밀착형 고민 해결', '교사가 현장에서 겪는 실제적인 수업, 업무적 고민을 즉각적으로 해결할 수 있도록 돕습니다.'], ['다차원적인 맞춤 매칭', '누구나 멘토이자 멘티가 되어 멘토링에 참여하며, 교사의 고민과 관심 분야에 따라 최적의 콘텐츠, 인력풀, 우수 사례를 연결합니다.']] },
];

export function About() {
  return (
    <div className="container">
      <PageHead crumbs={['안내', '소개']} code="5.1 · 플랫폼 및 서비스 소개" title="G-ONE 교원성장플랫폼" />
      <section className="vision vision--about">
        <div className="vision__copy">
          <span className="mono c-orange">Ⅰ. 비전</span>
          <h2>교사 주도의 자발적 성찰과 동행으로<br />함께 성장하는 경기교육 공동체</h2>
          <div className="chips">{['성장', '배움', '나눔', '동행'].map((k) => <span key={k} className="chip chip--ink">{k}</span>)}</div>
        </div>
        <div className="vision__art" aria-hidden><span className="pill pill-1" /><span className="pill pill-2" /><span className="pill pill-3" /><span className="pill pill-4" /><span className="pill pill-5"><span className="checker" /></span></div>
      </section>
      <h2 className="sec-title"><span className="mono">Ⅱ</span>방향</h2>
      <div className="dirs">
        {DIRECTIONS.map((d) => (
          <Panel key={d.k} className={`dir dir--${d.tone}`}>
            <p className="dir__head"><span className={`panel__icon tone-${d.tone}`}><Icon name={d.icon} size={20} /></span><b>{d.k}</b></p>
            {d.items.map(([t, b]) => <div key={t} className="dir__item"><b>{t}</b><p>{b}</p></div>)}
          </Panel>
        ))}
      </div>
      <h2 className="sec-title"><span className="mono">Ⅲ</span>서비스 구조도</h2>
      <div className="tree">
        {MENU.map((m) => (
          <div key={m.key} className="tree__col">
            <p className={`tree__root tone-${m.tone}`}><Icon name={m.icon} size={18} />{m.label}</p>
            {m.items.map((it) => <Link key={it.to} to={it.to} className="tree__leaf"><span className="mono">{it.code}</span><b>{it.label}</b><small>{it.desc}</small></Link>)}
          </div>
        ))}
      </div>
      <Panel dark title="초기화면 구성" code="보고서 Ⅲ. 서비스 구조도">
        <div className="layout6">
          {[['상단 왼쪽', '수업 공개 현황', '지도형으로 3.1 공개수업 노출'], ['상단 가운데', '교육청/지원청 연수 신청', '2.1 연수 목록 노출'], ['상단 오른쪽', '포트폴리오', '1.2 포트폴리오 요약 · 뱃지 · 포인트'], ['하단 왼쪽', '학습방/공동체 통합', '2.3 학습방과 3.2 공동체를 버튼으로 전환'], ['하단 가운데', '교육 자료 추천', '2.2 교육자료 좋아요순 정렬'], ['하단 오른쪽', '고민 남기기', '4.1 고민을 누르면 바로 댓글']].map(([p, n, d]) => (
            <Link key={n} to="/" className="layout6__cell"><span className="mono">{p}</span><b>{n}</b><small>{d}</small></Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function Notices() {
  const [open, setOpen] = useState(NOTICES[0].id);
  return (
    <div className="container narrow">
      <PageHead crumbs={['안내', '공지사항']} code="5.2 · 주요 공지 및 소식" title="공지사항" />
      <Panel>
        <ul className="acc">
          {NOTICES.map((n) => (
            <li key={n.id} className={open === n.id ? 'is-open' : ''}>
              <button onClick={() => setOpen(open === n.id ? null : n.id)} aria-expanded={open === n.id}>
                {n.pin ? <Chip tone="orange" solid>중요</Chip> : <Chip>공지</Chip>}
                <b>{n.title}</b><span className="mono">{fmtDate(n.date)}</span><Icon name="down" size={16} />
              </button>
              {open === n.id && <p>{n.body}</p>}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

export function Faq() {
  const [open, setOpen] = useState(0);
  const [q, setQ] = useState('');
  const list = FAQ.filter((f) => !q || (f.q + f.a).includes(q));
  return (
    <div className="container narrow">
      <PageHead crumbs={['안내', 'FAQ']} code="5.3 · 자주 묻는 질문" title="자주 묻는 질문" />
      <SearchBox value={q} onChange={setQ} placeholder="궁금한 낱말로 찾기" />
      <Panel className="mt">
        <ul className="acc">
          {list.map((f, i) => (
            <li key={f.q} className={open === i ? 'is-open' : ''}>
              <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}><span className="mono c-orange">Q</span><b>{f.q}</b><Icon name="down" size={16} /></button>
              {open === i && <p><span className="mono c-blue">A</span> {f.a}</p>}
            </li>
          ))}
        </ul>
        {!list.length && <Empty text="찾는 질문이 없어요" />}
      </Panel>
    </div>
  );
}

export function Search() {
  const st = useStore();
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') ?? '';
  const [o, setO] = useState(null);
  const has = (s) => q && s.includes(q);
  const r = {
    trainings: TRAININGS.filter((x) => has(x.title + x.desc + x.cat)),
    materials: [...st.s.myMaterials, ...MATERIALS].filter((x) => has(x.title + x.desc + x.subject)),
    comms: [...st.s.myComms, ...COMMUNITIES].filter((x) => has(x.name + x.desc + x.tags.join(' '))),
    modules: [...st.s.myModules, ...MODULES].filter((x) => (x.mine || x.share === '전체' || (x.share === '우리 학교' && x.school === st.s.profile.school)) && has(x.title + x.items.join(' ') + x.cat)),
    // 다른 학교의 '우리 학교' 공개는 검색에도 나오지 않는다
    classes: [...st.s.myClasses, ...OPEN_CLASSES].filter((x) => classAccess(x, st.s.profile) !== 'hidden' && has(x.topic + x.subject + x.school)),
    worries: [...st.s.myWorries, ...WORRIES].filter((x) => has(x.title + x.body)),
    mentors: MENTORS.filter((x) => has(x.name + x.intro + x.fields.join(' '))),
    instructors: INSTRUCTORS.filter((x) => has(x.topics.map((t) => t.title).join(' ') + x.basis.join(' '))),
    outcomes: OUTCOMES.filter((x) => has(x.title + x.summary)),
  };
  const total = Object.values(r).reduce((a, x) => a + x.length, 0);
  const trainImgs = thumbsFor(r.trainings, (t) => t.cat);
  const matImgs = thumbsFor(r.materials, matCat, 3);
  return (
    <div className="container">
      <PageHead title="통합 검색" desc="연수, 배움 모듈, 교육자료, 공동체, 공개수업, 쫑알쫑알 글, 멘토, 강사, 성과를 한 번에 찾아요." />
      <SearchBox value={q} onChange={(v) => setSp(v ? { q: v } : {})} placeholder="예) AI, 질문, 루브릭, 마음" />
      {!q && <div className="chips mt">{['AI', '질문', '평가', '마음', '수학', '생활교육'].map((k) => <button key={k} className="chip chip--btn" onClick={() => setSp({ q: k })}>#{k}</button>)}</div>}
      {q && <p className="mono mt">「{q}」 검색 결과 {total}건</p>}
      {q && !total && <Empty text="검색 결과가 없어요" />}
      {r.trainings.length > 0 && <Panel title="연수" code={`${r.trainings.length}`}><div className="tcards">{r.trainings.map((x, i) => <TrainingCard key={x.id} t={x} thumb={trainImgs[i]} />)}</div></Panel>}
      {r.modules.length > 0 && <Panel title="배움 모듈" code={`${r.modules.length}`}><div className="modgrid">{r.modules.map((x) => <ModuleCard key={x.id} m={x} />)}</div></Panel>}
      {r.materials.length > 0 && <Panel title="교육자료" code={`${r.materials.length}`}><div className="mgrid">{r.materials.map((x, i) => <MaterialCard key={x.id} m={x} thumb={matImgs[i]} />)}</div></Panel>}
      {r.comms.length > 0 && <Panel title="공동체" code={`${r.comms.length}`}><div className="cgrid">{r.comms.map((x) => <CommunityCard key={x.id} c={x} />)}</div></Panel>}
      {r.classes.length > 0 && <Panel title="공개수업" code={`${r.classes.length}`}><div className="oclist">{r.classes.map((x) => <OpenClassCard key={x.id} o={x} onOpen={setO} />)}</div></Panel>}
      {r.worries.length > 0 && <Panel title="쫑알쫑알" code={`${r.worries.length}`}><ul className="olist">{r.worries.map((x) => <li key={x.id}><Link to={`/together/worries/${x.id}`}><span className="dot bg-green" /><span><b>{x.title}</b><small>#{x.tag}</small></span></Link></li>)}</ul></Panel>}
      {r.mentors.length > 0 && <Panel title="멘토" code={`${r.mentors.length}`}><ul className="olist">{r.mentors.map((x) => <li key={x.id}><Link to={`/together/mentors?m=${x.id}`}><span className="dot bg-purple" /><span><b>{x.name} 선생님 {x.verified && `· ${x.verified}`}</b><small>{x.fields.join(', ')}</small></span></Link></li>)}</ul></Panel>}
      {r.instructors.length > 0 && <Panel title="강사 인력풀" code={`${r.instructors.length}`}><ul className="olist">{r.instructors.map((x) => { const m = MENTORS.find((y) => y.id === x.mentorId); return <li key={x.id}><Link to={`/together/instructors?i=${x.id}`}><span className="dot bg-ink" /><span><b>{m.name} 선생님 · {x.basis[0]}</b><small>{x.topics.map((t) => t.title).join(', ')}</small></span></Link></li>; })}</ul></Panel>}
      {r.outcomes.length > 0 && <Panel title="성과나눔" code={`${r.outcomes.length}`}><ul className="olist">{r.outcomes.map((x) => <li key={x.id}><Link to="/share/outcomes"><span className="dot bg-orange" /><span><b>{x.title}</b><small>{x.kind} · {x.school}</small></span></Link></li>)}</ul></Panel>}
      <OpenClassModal o={o} onClose={() => setO(null)} />
    </div>
  );
}

export function NotFound() {
  return <div className="container"><Empty text="없는 화면이에요"><Link className="btn btn--dark" to="/">첫 화면으로</Link></Empty></div>;
}
