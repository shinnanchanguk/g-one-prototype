import { useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { DELIVERY_LABEL, MaterialCard, ModuleCard, TrainingCard, trainingState } from '../components/cards.jsx';
import Icon from '../components/Icon.jsx';
import { Avatar, Chip, Empty, Field, Modal, PageHead, Panel, Progress, SearchBox, Select, Tabs, fmtDate, num } from '../components/ui.jsx';
import { LEVELS, MATERIALS, ME, MODULES, OUTCOMES, ROOMS, TODAY, TRAININGS } from '../data/seed.js';
import { fitsBand, sortByProfile } from '../fit.js';
import { uid, useStore } from '../store.jsx';

const CATS = ['전체', '수업·평가', '디지털·AI', '생활교육', '학급경영', '진로교육', '교육과정', '업무 역량', '정신건강·자기돌봄'];
const RESOURCES = [
  ['연수', 'AI와 함께하는 수업 설계 연수 (직무 15시간)'],
  ['연수', '교원 마음건강 기초: 스트레스 이해와 대처 (원격 상시)'],
  ['연수', '질문으로 여는 수학 수업 월례 연수 (연구회 자율)'],
  ['youtube', '좋은 탐구 질문의 조건 (18분)'],
  ['youtube', '루브릭 한 번에 이해하기 (11분)'],
  ['매뉴얼', '수업 나눔 협의회 진행 가이드'],
  ['매뉴얼', '생성형 AI 수업 안전 수칙'],
  ['가이드', '경기 교원 마음건강 지원 안내'],
];
const ORGS = ['경기도교육청', '교육지원청', '경기도교육연수원', '연구회'];
const T_SORTS = ['학교급 먼저', '교과 먼저', '마감 빠른 순', '만족도 순'];

export function Trainings() {
  const st = useStore();
  const p = st.s.profile;
  const [sp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [org, setOrg] = useState('전체');
  const [type, setType] = useState('전체 구분');
  const [level, setLevel] = useState('전체 학교급');
  const [mode, setMode] = useState('전체 운영방식');
  const [target, setTarget] = useState('신규·경력 모두');
  const [cat, setCat] = useState('전체');
  const [sort, setSort] = useState(p.sortBy === '교과' ? '교과 먼저' : '학교급 먼저');

  const list = useMemo(() => {
    const base = TRAININGS.filter((t) =>
      (org === '전체' || t.org === org)
      && (type === '전체 구분' || (type === '직무연수(NEIS)' ? t.type === '직무' : t.type === '자율'))
      && (level === '전체 학교급' || t.level === level || t.level === '전체')
      && (mode === '전체 운영방식' || DELIVERY_LABEL[t.delivery] === mode)
      && (target === '신규·경력 모두' || t.target === target.replace(' 교사', '') || t.target === '전체')
      && (cat === '전체' || t.cat === cat)
      && (!q || (t.title + t.desc + t.host + t.cat).includes(q)));
    const byState = (t) => ({ open: 0, applied: 1, soon: 2, closed: 3 }[trainingState(t, st.s)]);
    const pre = [...base].sort((a, b) => byState(a) - byState(b) || a.applyTo.localeCompare(b.applyTo));
    if (sort === '마감 빠른 순') return pre;
    if (sort === '만족도 순') return [...base].sort((a, b) => b.rating - a.rating);
    return sortByProfile(pre, p, sort === '교과 먼저' ? '교과' : '학교급');
  }, [org, type, level, mode, target, cat, q, sort, p, st.s]);

  if (['module', 'make'].includes(sp.get('tab'))) return <Navigate to={sp.get('tab') === 'make' ? '/learn/modules?tab=mine&make=1' : '/learn/modules'} replace />;

  return (
    <div className="container">
      <PageHead crumbs={['배움', '연수']} code="2.1 · 직무연수 · 자율연수 · 교육청/지원청 연수 신청" title="연수" desc="경기도교육청, 교육지원청, 교육연수원의 직무연수와 연구회 자율연수를 대면·원격 구분 없이 한곳에서 찾고 신청합니다.">
        <Link className="btn btn--line" to="/learn/modules"><Icon name="layers" size={16} />연수를 묶은 배움 모듈 보기</Link>
      </PageHead>
      <div className="filters">
        <SearchBox value={q} onChange={setQ} placeholder="주제나 고민으로 찾기 (예: 질문, 루브릭, 쉼)" />
        <Select label="연수 구분" value={type} onChange={setType} options={['전체 구분', '직무연수(NEIS)', '자율연수']} />
        <Select label="운영 방식" value={mode} onChange={setMode} options={['전체 운영방식', ...Object.values(DELIVERY_LABEL)]} />
        <Select label="학교급" value={level} onChange={setLevel} options={['전체 학교급', ...LEVELS]} />
        <Select label="대상" value={target} onChange={setTarget} options={['신규·경력 모두', '신규 교사', '경력 교사']} />
      </div>
      <div className="chips chips--scroll">{CATS.map((c) => <button key={c} className={`chip chip--btn ${cat === c ? 'is-on' : ''} ${c === '정신건강·자기돌봄' ? 'chip--care' : ''}`} onClick={() => setCat(c)}>{c === '정신건강·자기돌봄' && <Icon name="leaf" size={13} />}{c}</button>)}</div>
      <Panel>
        <div className="row-between">
          <Tabs size="sm" value={org} onChange={setOrg} items={['전체', ...ORGS].map((o) => ({ value: o, label: `${o === '전체' ? '전체 주관' : o} ${TRAININGS.filter((t) => o === '전체' || t.org === o).length}` }))} />
          <div className="row-end">
            <span className="mono">{list.length}건 · {p.band}{p.subject ? ` · ${p.subject}` : ''} 기준</span>
            <Select label="정렬" size="sm" value={sort} onChange={setSort} options={T_SORTS} />
          </div>
        </div>
        <div className="tcards">
          {list.map((t) => <TrainingCard key={t.id} t={t} />)}
          {!list.length && <Empty text="조건에 맞는 연수가 없어요. 조건을 줄여 보세요." />}
        </div>
      </Panel>
      {q.trim() && (() => {
        const k = q.trim();
        const mats = [...st.s.myMaterials, ...MATERIALS].filter((m) => (m.title + m.desc + m.subject).includes(k)).slice(0, 4);
        const cases = OUTCOMES.filter((o) => (o.title + o.summary + o.tags.join(' ')).includes(k)).slice(0, 4);
        const mods = [...st.s.myModules, ...MODULES].filter((m) => (m.title + m.items.join(' ')).includes(k)).slice(0, 4);
        if (!mats.length && !cases.length && !mods.length) return null;
        return (
          <Panel title={`「${k}」 관련 실천 사례 · 교육자료 · 배움 모듈`} code="주제/고민별 함께 찾기">
            <div className="related">
              {mods.map((m) => <Link key={m.id} to="/learn/modules" className="related__item"><Chip tone="green">배움 모듈</Chip><b>{m.title}</b><span className="mono">{m.author} · {m.weeks}주</span></Link>)}
              {cases.map((o) => <Link key={o.id} to="/share/outcomes" className="related__item"><Chip tone="purple">{o.kind} 사례</Chip><b>{o.title}</b><span className="mono">{o.school}</span></Link>)}
              {mats.map((m) => <Link key={m.id} to={`/learn/materials/${m.id}`} className="related__item"><Chip tone="blue">{m.type}</Chip><b>{m.title}</b><span className="mono">{m.author} 선생님</span></Link>)}
            </div>
          </Panel>
        );
      })()}
    </div>
  );
}

const SHARES = [['전체', '전체 공개', '추천 모듈에 올라가 누구나 담아 갈 수 있어요.'], ['우리 학교', '우리 학교 공유', '같은 학교 선생님에게만 보여요. 학교 중점 사업을 함께 익힐 때 좋아요.'], ['나만 보기', '나만 보기', '나만 보고 들어요.']];

export function Modules() {
  const st = useStore();
  const p = st.s.profile;
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') === 'mine' ? 'mine' : 'rec';
  const making = tab === 'mine' && sp.get('make') === '1';
  const [cat, setCat] = useState('전체');
  const [mod, setMod] = useState(null);
  const [form, setForm] = useState({ title: '', cat: '수업·평가', weeks: 3, items: [], custom: '', share: '전체' });
  const all = [...st.s.myModules, ...MODULES];
  const canSee = (m) => m.mine || m.share === '전체' || (m.share === '우리 학교' && m.school === p.school);
  const rec = sortByProfile(all.filter((m) => !m.mine && canSee(m) && (cat === '전체' || m.cat === cat)), p).sort((a, b) => (b.share === '우리 학교' && fitsBand(b, p.band)) - (a.share === '우리 학교' && fitsBand(a, p.band)));
  const made = all.filter((m) => m.mine);
  const taken = all.filter((m) => !m.mine && st.s.takenModules[m.id]);

  const create = (e) => {
    e.preventDefault();
    const items = [...form.items, ...(form.custom.trim() ? [`실천 과제: ${form.custom.trim()}`] : [])];
    if (!form.title.trim() || items.length < 2) { st.toast('모듈 이름과 구성 요소 2개 이상이 필요해요', 'warn'); return; }
    const m = { id: uid('m'), title: form.title.trim(), author: ME.name, school: ME.school, items, weeks: Number(form.weeks), learners: 0, likes: 0, cat: form.cat, source: '직접 구성', level: '전체', share: form.share, mine: true };
    st.patch((s) => ({ myModules: [m, ...s.myModules], takenModules: { ...s.takenModules, [m.id]: TODAY } }));
    st.award('활동', 40, `배움 모듈 제작: ${m.title}`);
    st.toast(form.share === '우리 학교' ? '모듈을 만들어 우리 학교 선생님들과 나눴어요' : '모듈을 만들었어요 · 학습방에도 담았어요');
    setForm({ title: '', cat: '수업·평가', weeks: 3, items: [], custom: '', share: '전체' });
    setSp({ tab: 'mine' });
  };

  return (
    <div className="container">
      <PageHead crumbs={['배움', '배움 모듈']} code="2.2 · 추천 모듈 · 나의 모듈 · 모듈 만들기" title="배움 모듈" desc="연수, 영상, 매뉴얼, 실천 과제를 한 주제로 묶은 나만의 배움 과정입니다. 동료가 만든 모듈을 담아 듣거나, 내게 맞게 직접 골라 만들어요.">
        <button className="btn btn--dark" onClick={() => setSp({ tab: 'mine', make: '1' })}><Icon name="plus" size={16} />모듈 만들기</button>
      </PageHead>
      <Tabs value={tab} onChange={(v) => setSp(v === 'rec' ? {} : { tab: v })} className="tabs--page" items={[{ value: 'rec', label: `추천 모듈 (${all.filter((m) => !m.mine && canSee(m)).length})`, icon: 'layers' }, { value: 'mine', label: `나의 모듈 (${made.length + taken.length})`, icon: 'bookmark' }]} />

      {tab === 'rec' && (
        <>
          <div className="row-between">
            <div className="chips chips--scroll">{CATS.map((c) => <button key={c} className={`chip chip--btn ${cat === c ? 'is-on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}</div>
            <span className="mono">{p.band} 선생님께 맞는 순</span>
          </div>
          <div className="modgrid mt">{rec.map((m) => <ModuleCard key={m.id} m={m} onOpen={setMod} />)}</div>
          {!rec.length && <Empty text="이 분야의 모듈이 아직 없어요. 직접 만들어 보세요."><button className="btn btn--dark" onClick={() => setSp({ tab: 'mine', make: '1' })}>모듈 만들기</button></Empty>}
        </>
      )}

      {tab === 'mine' && !making && (
        <>
          <div className="row-between"><h2 className="h4">내가 만든 모듈 <span className="mono">{made.length}</span></h2><button className="btn btn--sm btn--dark" onClick={() => setSp({ tab: 'mine', make: '1' })}><Icon name="plus" size={14} />새 모듈 만들기</button></div>
          <div className="modgrid mt">
            {made.map((m) => <ModuleCard key={m.id} m={m} onOpen={setMod} />)}
            <button className="goal goal--new" onClick={() => setSp({ tab: 'mine', make: '1' })}><Icon name="plus" size={22} /><b>나만의 배움 모듈 만들기</b><span>연수·영상·자료·실천 과제를 골라 묶어요</span></button>
          </div>
          <h2 className="h4 mt">담아 둔 모듈 <span className="mono">{taken.length}</span></h2>
          <div className="modgrid mt">{taken.map((m) => <ModuleCard key={m.id} m={m} onOpen={setMod} />)}</div>
          {!taken.length && <p className="empty-line">추천 모듈에서 마음에 드는 모듈을 담아 보세요.</p>}
        </>
      )}

      {making && (
        <form className="grid2" onSubmit={create}>
          <Panel title="모듈 기본 정보" code="나의 모듈 · 만들기">
            <Field label="모듈 이름"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="예) 짝 토의로 여는 수학 시간 3주" /></Field>
            <div className="row2">
              <Field label="분야"><select className="input" value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })}>{CATS.slice(1).map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="기간"><select className="input" value={form.weeks} onChange={(e) => setForm({ ...form, weeks: e.target.value })}>{[1, 2, 3, 4, 6, 8].map((w) => <option key={w} value={w}>{w}주</option>)}</select></Field>
            </div>
            <Field label="실천 과제 직접 더하기" hint="연수·영상·매뉴얼만이 아니라, 학교에서 해 볼 과제를 함께 넣어요."><input className="input" value={form.custom} onChange={(e) => setForm({ ...form, custom: e.target.value })} placeholder="예) 우리 반 학생 질문 수 3주 기록" /></Field>
            <div className="field">
              <span className="field__label">공개 범위</span>
              <div className="seg seg--full" role="radiogroup" aria-label="공개 범위">{SHARES.map(([v, l]) => <button type="button" key={v} role="radio" aria-checked={form.share === v} className={form.share === v ? 'is-on' : ''} onClick={() => setForm({ ...form, share: v })}>{l}</button>)}</div>
              <span className="field__hint">{SHARES.find((x) => x[0] === form.share)[2]}</span>
            </div>
            <div className="row-end"><button type="button" className="btn btn--line" onClick={() => setSp({ tab: 'mine' })}>취소</button><button className="btn btn--dark" type="submit"><Icon name="layers" size={16} />모듈 만들기</button></div>
          </Panel>
          <Panel title="플랫폼 자료로 구성하기" code={`${form.items.length}개 선택`} desc="연수, 영상, 매뉴얼과 가이드를 골라 묶으세요.">
            <ul className="picker">
              {RESOURCES.map(([k, t]) => {
                const label = `${k === 'youtube' ? '영상' : k}: ${t}`;
                const on = form.items.includes(label);
                return (
                  <li key={t}><button type="button" className={on ? 'is-on' : ''} onClick={() => setForm({ ...form, items: on ? form.items.filter((x) => x !== label) : [...form.items, label] })}>
                    <span className="checkbtn">{on && <Icon name="check" size={13} stroke={2.4} />}</span>
                    <Icon name={k === 'youtube' ? 'video' : k === '연수' ? 'school' : 'file'} size={16} /><span>{t}</span><span className="mono">{k === 'youtube' ? '영상' : k}</span>
                  </button></li>
                );
              })}
            </ul>
          </Panel>
        </form>
      )}

      <Modal open={!!mod} onClose={() => setMod(null)} title={mod?.title}>
        {mod && <>
          <p className="lead">{mod.author} 선생님({mod.school})이 만든 {mod.weeks}주 모듈입니다.{mod.share === '우리 학교' ? ' 우리 학교 선생님들과 함께 듣는 모듈이에요.' : ''}</p>
          <ol className="steps-list">{mod.items.map((it, i) => <li key={i}><span className="mono">{i + 1}주차</span>{it}</li>)}</ol>
        </>}
      </Modal>
    </div>
  );
}

export function Materials() {
  const st = useStore();
  const [q, setQ] = useState('');
  const [type, setType] = useState('전체 유형');
  const [level, setLevel] = useState('전체 학교급');
  const [sort, setSort] = useState('나에게 맞는 순');
  const [up, setUp] = useState(false);
  const [f, setF] = useState({ title: '', type: '수업자료', level: '초등학교', subject: '', desc: '', file: '' });
  const all = [...st.s.myMaterials, ...MATERIALS];
  const filtered = all.filter((m) => (type === '전체 유형' || m.type === type) && (level === '전체 학교급' || m.level === level || m.level === '전체') && (!q || (m.title + m.desc + m.subject + m.author).includes(q)))
    .sort((a, b) => (sort === '최신 등록순' ? b.date.localeCompare(a.date) : sort === '다운로드 순' ? b.downloads - a.downloads : b.likes - a.likes));
  const list = sort === '나에게 맞는 순' ? sortByProfile(filtered, st.s.profile) : filtered;

  const upload = (e) => {
    e.preventDefault();
    if (!f.title.trim() || !f.subject.trim()) { st.toast('제목과 과목을 적어 주세요', 'warn'); return; }
    const m = { id: uid('a'), ...f, title: f.title.trim(), author: ME.name, school: ME.school, date: TODAY, likes: 0, downloads: 0, views: 0, rating: 0, files: [f.file || '첨부파일.pdf'], mine: true };
    st.patch((s) => ({ myMaterials: [m, ...s.myMaterials] }));
    st.award('활동', 40, `교육자료 업로드: ${m.title}`);
    st.toast('자료를 올렸어요 · 활동 포인트 +40');
    setUp(false);
    setF({ title: '', type: '수업자료', level: '초등학교', subject: '', desc: '', file: '' });
    setSort('최신 등록순');
  };

  return (
    <div className="container">
      <PageHead crumbs={['배움', '교육자료']} code="2.3 · 교육자료 추천 · 교육자료 업로드" title="교육자료" desc="선생님들이 만든 장학자료와 교육자료를 찾고 올립니다. 좋아요와 활용 평가는 성장 포인트와 분야별 전문가 인증에 반영돼요.">
        <button className="btn btn--dark" onClick={() => setUp(true)}><Icon name="upload" size={16} />자료 올리기</button>
      </PageHead>
      <div className="filters">
        <SearchBox value={q} onChange={setQ} placeholder="자료 이름, 과목, 작성자로 찾기" />
        <Select label="유형" value={type} onChange={setType} options={['전체 유형', '수업자료', '학습지도안', '장학자료', '평가자료', '생활교육', '진로자료']} />
        <Select label="학교급" value={level} onChange={setLevel} options={['전체 학교급', ...LEVELS]} />
      </div>
      <div className="row-between"><Tabs size="sm" value={sort} onChange={setSort} items={['나에게 맞는 순', '좋아요 순', '최신 등록순', '다운로드 순']} /><span className="mono">{list.length}건</span></div>
      <div className="mgrid">{list.map((m) => <MaterialCard key={m.id} m={m} />)}</div>
      {!list.length && <Empty text="조건에 맞는 자료가 없어요" />}

      <Modal open={up} onClose={() => setUp(false)} title="교육자료 올리기" footer={<button className="btn btn--dark" onClick={upload}><Icon name="upload" size={15} />올리기</button>}>
        <form onSubmit={upload} className="form">
          <Field label="제목"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="예) 분수 나눗셈 그림 모델 활동지" /></Field>
          <div className="row2">
            <Field label="유형"><select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{['수업자료', '학습지도안', '장학자료', '평가자료', '생활교육', '진로자료'].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="학교급"><select className="input" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>{[...LEVELS, '전체'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          </div>
          <Field label="과목"><input className="input" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="예) 수학" /></Field>
          <Field label="소개"><textarea className="ta" rows={3} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} /></Field>
          <Field label="파일" hint="프로토타입이라 파일 이름만 기록하고 실제로 올리지는 않아요."><input className="input" type="file" onChange={(e) => setF({ ...f, file: e.target.files?.[0]?.name ?? '' })} /></Field>
        </form>
      </Modal>
    </div>
  );
}

export function MaterialDetail() {
  const { id } = useParams();
  const st = useStore();
  const m = [...st.s.myMaterials, ...MATERIALS].find((x) => x.id === id);
  if (!m) return <div className="container"><Empty text="자료를 찾을 수 없어요"><Link className="btn btn--line" to="/learn/materials">목록으로</Link></Empty></div>;
  const liked = !!st.s.liked[m.id];
  const myRate = st.s.ratings[m.id];
  return (
    <div className="container narrow">
      <PageHead crumbs={['배움', '교육자료', m.type]} title={m.title} desc={m.desc} />
      <Panel>
        <div className="detail-meta">
          <Avatar name={m.author} size={44} />
          <div><b>{m.author} 선생님</b><span>{m.school} · {fmtDate(m.date)}</span></div>
          <div className="chips"><Chip tone="purple">{m.type}</Chip><Chip>{m.level}</Chip><Chip>{m.subject}</Chip></div>
        </div>
        <ul className="files">{m.files.map((f) => <li key={f}><Icon name="file" size={18} /><span>{f}</span><button className="btn btn--sm btn--line" onClick={() => st.toast(`프로토타입이라 「${f}」 내려받기는 흉내만 내요`)}><Icon name="download" size={14} />내려받기</button></li>)}</ul>
        <div className="row-between">
          <button className={`btn ${liked ? 'btn--pink' : 'btn--line'}`} onClick={() => st.toggle('liked', m.id)}><Icon name="heart" size={16} />도움돼요 {num(m.likes + (liked ? 1 : 0))}</button>
          <span className="mono"><Icon name="eye" size={14} /> {num(m.views)} · <Icon name="download" size={14} /> {num(m.downloads)} · 평균 활용 평가 {m.rating || '-'}점</span>
        </div>
      </Panel>
      <Panel title="자료 활용 평가" desc="수업에 써 보셨다면 별점을 남겨 주세요. 작성자의 분야별 전문가 인증에 반영됩니다.">
        <div className="stars" role="radiogroup" aria-label="활용 평가">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} role="radio" aria-checked={myRate === n} className={myRate >= n ? 'is-on' : ''} onClick={() => { st.patch((s) => ({ ratings: { ...s.ratings, [m.id]: n } })); if (!myRate) st.award('상호작용', 5, '자료 활용 평가 남김'); st.toast(`${n}점으로 평가했어요`); }} aria-label={`${n}점`}>
              <Icon name="star" size={28} />
            </button>
          ))}
          {myRate && <span className="mono">내 평가 {myRate}점</span>}
        </div>
      </Panel>
    </div>
  );
}

export function Rooms() {
  const st = useStore();
  const [tab, setTab] = useState('now');
  const [fb, setFb] = useState(null);
  const [fbText, setFbText] = useState('');
  const progress = st.s.roomProgress ?? {};
  const rooms = ROOMS.filter((r) => !r.done && (r.mine || st.s.joinedRooms[r.id]));
  const trainings = TRAININGS.filter((t) => st.s.applied[t.id]);
  const modules = [...st.s.myModules, ...MODULES].filter((m) => st.s.takenModules[m.id]);
  const done = ROOMS.filter((r) => r.done);
  const step = (id, cur) => {
    const next = Math.min(100, cur + 15);
    st.patch((s) => ({ roomProgress: { ...(s.roomProgress ?? {}), [id]: next } }));
    st.award('활동', 5, '학습방 차시 학습');
    st.toast(next >= 100 ? '과정을 모두 마쳤어요 · 피드백을 남겨 주세요' : `진도 ${next}%`);
  };
  return (
    <div className="container">
      <PageHead crumbs={['배움', '학습방']} code="2.4 · 신청한 연수, 배움 모듈, 교육자료 학습" title="학습방" desc="지금 수강 중인 연수와 배움 모듈을 한곳에서 이어서 학습합니다. 다 마친 과정은 성장 여정의 포트폴리오로 넘어가요." />
      <Tabs value={tab} onChange={setTab} className="tabs--page" items={[{ value: 'now', label: `학습 중 (${rooms.length + trainings.length + modules.length})` }, { value: 'done', label: `완료 (${done.length})` }, { value: 'explore', label: '학습방 둘러보기' }]} />
      {tab === 'now' && (
        <div className="studylist">
          {rooms.map((r) => { const p = progress[r.id] ?? r.progress; return (
            <article key={r.id} className="study">
              <div className="study__head"><Chip tone="orange">학습방</Chip><h3>{r.title}</h3></div>
              <p>{p >= 100 ? '모든 차시를 마쳤어요.' : `다음 할 일 · ${r.nextTask ?? '1주차 안내 영상 보기'}`}</p>
              <div className="study__bar"><Progress value={p} /><span className="mono">{p}%</span></div>
              <div className="row-end">
                {p >= 100
                  ? <button className="btn btn--sm btn--line" onClick={() => setFb(r)}><Icon name="message" size={14} />피드백 남기기</button>
                  : <button className="btn btn--sm btn--orange" onClick={() => step(r.id, p)}>이어서 학습하기</button>}
              </div>
            </article>
          ); })}
          {trainings.map((t) => (
            <article key={t.id} className="study">
              <div className="study__head"><Chip tone={t.type === '직무' ? 'blue' : 'ink'}>{t.type === '직무' ? '직무연수(NEIS)' : '자율연수'}</Chip><h3>{t.title}</h3></div>
              <p>{DELIVERY_LABEL[t.delivery]} · {t.host} · {t.sessions}차시 · 인정 {t.hours}시간</p>
              <div className="row-end"><span className="mono">{t.eduFrom > TODAY ? `시작까지 ${Math.round((new Date(t.eduFrom) - new Date(TODAY)) / 864e5)}일` : '진행 중'}</span></div>
            </article>
          ))}
          {modules.map((m) => { const p = progress[m.id] ?? 0; return (
            <article key={m.id} className="study">
              <div className="study__head"><Chip tone="green">배움 모듈</Chip><h3>{m.title}</h3></div>
              <p>{m.items[Math.min(m.items.length - 1, Math.floor((p / 100) * m.items.length))]}</p>
              <div className="study__bar"><Progress value={p} tone="green" /><span className="mono">{p}%</span></div>
              <div className="row-end">{p >= 100 ? <button className="btn btn--sm btn--line" onClick={() => setFb(m)}><Icon name="message" size={14} />피드백 남기기</button> : <button className="btn btn--sm btn--green" onClick={() => step(m.id, p)}>이어서 학습하기</button>}</div>
            </article>
          ); })}
          {!rooms.length && !trainings.length && !modules.length && <Empty text="학습 중인 과정이 없어요"><Link to="/learn/trainings" className="btn btn--blue">연수 찾기</Link><Link to="/learn/modules" className="btn btn--line">배움 모듈 찾기</Link></Empty>}
        </div>
      )}
      {tab === 'done' && (
        <div className="studylist">
          {done.map((r) => (
            <article key={r.id} className="study study--done">
              <div className="study__head"><Chip tone="green" solid><Icon name="check" size={12} /> 이수</Chip><h3>{r.title}</h3></div>
              <p>{fmtDate(r.doneDate)} 이수 · {r.hours}시간 · 성장 여정 포트폴리오에 기록됨</p>
              <div className="row-end">{st.s.feedback[r.id] ? <span className="mono">피드백 남김</span> : <button className="btn btn--sm btn--line" onClick={() => setFb(r)}>피드백 남기기</button>}</div>
            </article>
          ))}
        </div>
      )}
      {tab === 'explore' && <div className="studylist">{ROOMS.filter((r) => !r.done).map((r) => (
        <article key={r.id} className="study">
          <div className="study__head"><Chip>{r.cat}</Chip><h3>{r.title}</h3></div>
          <p>{r.desc}</p>
          <div className="row-between"><span className="mono">멤버 {num(r.members)} · 게시글 {r.posts}</span>
            <button className={`btn btn--sm ${r.mine || st.s.joinedRooms[r.id] ? 'btn--line' : 'btn--orange'}`} onClick={() => { if (r.mine) return; st.toggle('joinedRooms', r.id); st.toast(st.s.joinedRooms[r.id] ? '학습방에서 나왔어요' : '학습방에 들어왔어요'); }}>{r.mine || st.s.joinedRooms[r.id] ? '학습 중' : '가입하기'}</button></div>
        </article>
      ))}</div>}

      <Modal open={!!fb} onClose={() => setFb(null)} title="과정 피드백" footer={<button className="btn btn--dark" onClick={() => { st.patch((s) => ({ feedback: { ...s.feedback, [fb.id]: fbText } })); st.award('상호작용', 5, '연수 피드백'); st.toast('피드백을 보냈어요 · 운영자와 제작자에게 전달돼요'); setFb(null); setFbText(''); }}>보내기</button>}>
        <p className="lead">「{fb?.title}」을 마친 소감과 고쳤으면 하는 점을 알려 주세요.</p>
        <textarea className="ta" rows={4} value={fbText} onChange={(e) => setFbText(e.target.value)} aria-label="피드백" />
      </Modal>
    </div>
  );
}
