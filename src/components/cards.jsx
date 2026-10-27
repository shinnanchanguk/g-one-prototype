// 한 객체는 어느 화면에서든 같은 카드로 그린다(첫 화면·목록·검색 공용).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BADGE_STAGES, COMM_TYPES, DELIVERY_INFO, LEVEL_COLOR, ME, TODAY, TRAINING_TYPE_INFO, badgeOf } from '../data/seed.js';
import { SCOPE_LABEL, classAccess, shortOffice } from '../fit.js';
import { useStore } from '../store.jsx';
import Icon from './Icon.jsx';
import { Avatar, Chip, InfoPop, Modal, Progress, fmtDate, num, shortDate } from './ui.jsx';

export function trainingState(t, s) {
  if (s.applied[t.id]) return 'applied';
  if (TODAY < t.applyFrom) return 'soon';
  if (TODAY > t.applyTo || (t.cap != null && t.applied >= t.cap)) return 'closed';
  return 'open';
}
const daysLeft = (d) => Math.round((new Date(d) - new Date(TODAY)) / 864e5);

export function useTrainingActions() {
  const st = useStore();
  return {
    apply(t) {
      const state = trainingState(t, st.s);
      if (state === 'applied') {
        st.toggle('applied', t.id);
        st.toast(`「${t.title}」 신청을 취소했어요`, 'warn');
        return;
      }
      if (state !== 'open') return;
      st.toggle('applied', t.id);
      st.award('활동', 10, `연수 신청: ${t.title}`);
      st.toast(`「${t.title}」 신청 완료 · 학습방과 성장 여정에 담았어요`);
    },
    keep(t) {
      st.toggle('journeyItems', t.id);
      st.toast(st.s.journeyItems[t.id] ? '관심 연수에서 뺐어요' : '관심 연수로 담았어요 · 성장 여정에서 다시 볼 수 있어요');
    },
  };
}

const CAT_ICON = { '수업·평가': 'target', '디지털·AI': 'spark', 생활교육: 'heart', 학급경영: 'users', 진로교육: 'compass', 교육과정: 'layers', '업무 역량': 'file', '정신건강·자기돌봄': 'leaf' };
const CAT_THUMB = { '수업·평가': 0, '디지털·AI': 3, 생활교육: 2, 학급경영: 1, 진로교육: 4, 교육과정: 1, '업무 역량': 4, '정신건강·자기돌봄': 1 };
export const DELIVERY_LABEL = { 대면: '대면과정', '원격(상시)': '원격과정 (상시)', '원격(기수)': '원격과정 (기수)', 혼합: '혼합과정' };
const yy = (d) => d.slice(2).replaceAll('-', '.');

// 직무연수(NEIS) · 자율연수 뱃지. 누르면 무엇이 다른지 설명이 뜬다.
export function TypeBadge({ t }) {
  return (
    <InfoPop className={`infopop--${t.type === '직무' ? 'duty' : 'free'}`} label={t.type === '직무' ? '직무연수(NEIS)' : '자율연수'} title={t.type === '직무' ? '직무연수 (나이스 이수 인정)' : '자율연수 (이수 시간 인정 안 됨)'}>
      {TRAINING_TYPE_INFO[t.type]}
    </InfoPop>
  );
}

// 연수 한 건. 목록·첫 화면·검색 공용. 상세는 팝업 대신 카드 아래로 펼친다.
export function TrainingCard({ t, compact, defaultOpen = false }) {
  const { s } = useStore();
  const act = useTrainingActions();
  const [open, setOpen] = useState(defaultOpen);
  const state = trainingState(t, s);
  const applied = t.applied + (s.applied[t.id] ? 1 : 0);
  const kept = !!s.journeyItems[t.id];
  const always = t.delivery === '원격(상시)';
  const dl = daysLeft(t.applyTo);
  const status = state === 'applied' ? ['신청함', 'blue'] : state === 'soon' ? ['신청 예정', 'ink'] : state === 'closed' ? ['신청 마감', 'ink'] : dl <= 4 ? [`마감 ${dl}일 전`, 'orange'] : ['신청 중', 'green'];
  const btn = { applied: '신청 완료', open: '신청하기', soon: `${yy(t.applyFrom)}부터 신청`, closed: '신청 마감' }[state];
  return (
    <article className={`tcard ${compact ? 'tcard--compact' : ''} ${open ? 'is-open' : ''}`}>
      <div className={`tcard__thumb thumb--${CAT_THUMB[t.cat] ?? 0}`}>
        <Icon name={CAT_ICON[t.cat] ?? 'book'} size={compact ? 24 : 30} />
        <span className="mono">{t.cat}</span>
        <button className={`tcard__keep ${kept ? 'is-on' : ''}`} onClick={() => act.keep(t)} aria-pressed={kept} aria-label={kept ? '관심 연수에서 빼기' : '관심 연수로 담기'}><Icon name="heart" size={16} /></button>
      </div>
      <div className="tcard__body">
        <div className="tcard__labels">
          <TypeBadge t={t} />
          <InfoPop className="infopop--plain" label={DELIVERY_LABEL[t.delivery]} title={DELIVERY_LABEL[t.delivery]}>{DELIVERY_INFO[t.delivery]}</InfoPop>
          <span className="tcard__org">{t.host}</span>
          <Chip tone={status[1]}>{status[0]}</Chip>
        </div>
        <button className="tcard__title" onClick={() => setOpen(!open)} aria-expanded={open}>{t.title}</button>
        <dl className="tcard__meta">
          <div><dt>신청기간</dt><dd>{always ? '언제나' : `${yy(t.applyFrom)} ~ ${yy(t.applyTo)}`}</dd></div>
          {!compact && <div><dt>교육기간</dt><dd>{always ? '신청하면 바로' : t.eduFrom === t.eduTo ? yy(t.eduFrom) : `${yy(t.eduFrom)} ~ ${yy(t.eduTo)}`}</dd></div>}
          <div><dt>차시정보</dt><dd>{t.sessions}차시 · 인정시간 <b className={t.hours ? '' : 'c-orange'}>{t.hours}시간</b></dd></div>
          {!compact && <div><dt>교육대상</dt><dd>{t.audience}{t.level !== '전체' ? ` · ${t.level}` : ''}{t.target !== '전체' ? ` · ${t.target} 교사` : ''}</dd></div>}
        </dl>
      </div>
      <div className="tcard__side">
        <span className="tcard__rate"><Icon name="star" size={15} /><b>{t.rating.toFixed(1)}</b><small>({num(t.reviews)})</small></span>
        <span className="tcard__cap mono"><Icon name="users" size={13} />신청 {num(applied)} / 정원 {t.cap == null ? '무제한' : num(t.cap)}</span>
        <div className="tcard__btns">
          <button className={`btn btn--sm ${state === 'open' ? 'btn--blue' : state === 'applied' ? 'btn--line' : 'btn--ghost'}`} disabled={state === 'closed' || state === 'soon'} onClick={() => act.apply(t)}>
            {state === 'applied' && <Icon name="check" size={14} />}{btn}
          </button>
          <button className="btn btn--sm btn--line" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? '접기' : '상세보기'}<Icon name="down" size={14} className="tcard__chev" /></button>
        </div>
      </div>
      {open && (
        <div className="tcard__more">
          <p className="lead">{t.desc}</p>
          <dl className="dl">
            <dt>구분</dt><dd>{t.type === '직무' ? '직무연수 · 나이스 이수 인정' : '자율연수 · 나이스 이수 시간 인정 안 됨'}</dd>
            <dt>주관</dt><dd>{t.host}{t.host !== t.org && <span className="mono"> ({t.org})</span>}</dd>
            <dt>운영</dt><dd>{DELIVERY_LABEL[t.delivery]}{t.time ? ` · ${t.time}` : ''}</dd>
            <dt>이수 인정</dt><dd>{t.hours ? `${t.sessions}차시 마치면 직무연수 ${t.hours}시간 인정` : `${t.sessions}차시 · 인정시간 0시간 (활동은 성장 여정에 기록)`}</dd>
            <dt>분야</dt><dd>{t.cat}{t.subject ? ` · ${t.subject}` : ''}</dd>
          </dl>
          <div className="row-end">
            <button className="btn btn--sm btn--line" onClick={() => act.keep(t)}><Icon name="bookmark" size={14} />{kept ? '성장 여정에 담김' : '나의 성장 여정에 담기'}</button>
            <button className={`btn btn--sm ${state === 'open' ? 'btn--blue' : 'btn--line'}`} disabled={state === 'closed' || state === 'soon'} onClick={() => act.apply(t)}>{state === 'applied' ? '신청 취소' : btn}</button>
          </div>
        </div>
      )}
    </article>
  );
}

// 배움 모듈 한 건. 추천 모듈·나의 모듈·첫 화면 공용.
export function ModuleCard({ m, onOpen }) {
  const st = useStore();
  const taken = !!st.s.takenModules[m.id];
  return (
    <article className="modcard">
      <div className="modcard__head">
        <span className="chips"><Chip tone="green">{m.cat}</Chip>{m.share === '우리 학교' && <Chip tone="orange" solid>우리 학교 공유</Chip>}{m.share === '나만 보기' && <Chip>나만 보기</Chip>}{m.level && m.level !== '전체' && <Chip>{m.level}</Chip>}</span>
        <span className="mono">{m.weeks}주</span>
      </div>
      <h3>{m.title}</h3>
      <ol>{m.items.map((it, i) => <li key={i}>{it}</li>)}</ol>
      <div className="modcard__foot">
        <span><Avatar name={m.author} size={24} /> {m.author} · {m.school}</span>
        <span className="mono"><Icon name="users" size={13} />{num(m.learners + (taken && !m.mine ? 1 : 0))} <Icon name="heart" size={13} />{m.likes}</span>
      </div>
      <div className="row-end">
        {onOpen && <button className="btn btn--sm btn--line" onClick={() => onOpen(m)}>자세히</button>}
        {!m.mine && <button className={`btn btn--sm ${taken ? 'btn--line' : 'btn--blue'}`} onClick={() => { st.toggle('takenModules', m.id); st.toast(taken ? '나의 모듈에서 뺐어요' : '나의 모듈과 학습방에 담았어요', taken ? 'warn' : 'ok'); }}>
          {taken ? <><Icon name="check" size={14} />담김</> : '나의 모듈에 담기'}
        </button>}
      </div>
    </article>
  );
}

export function MaterialCard({ m, compact }) {
  const st = useStore();
  const liked = !!st.s.liked[m.id];
  const like = () => {
    st.toggle('liked', m.id);
    if (!liked) st.toast('좋아요를 눌렀어요 · 작성자에게 도움됨 포인트가 쌓여요');
  };
  return (
    <article className={`mcard ${compact ? 'mcard--compact' : ''}`}>
      <div className={`mcard__thumb thumb--${[...m.id].reduce((a, c) => a + c.charCodeAt(0), 0) % 5}`}>
        <Icon name={m.type === '평가자료' ? 'target' : m.type === '장학자료' ? 'layers' : m.type === '생활교육' ? 'heart' : m.type === '진로자료' ? 'compass' : 'file'} size={compact ? 22 : 28} />
        <span className="mono">{m.subject}</span>
      </div>
      <div className="mcard__body">
        <div className="mcard__top"><Chip tone="purple">{m.type}</Chip>{!compact && <Chip>{m.level}</Chip>}</div>
        <Link className="mcard__title" to={`/learn/materials/${m.id}`}>{m.title}</Link>
        <p className="mcard__desc">{m.desc}</p>
        <div className="mcard__foot">
          <span>{m.author} 선생님 <i /> {shortDate(m.date)}</span>
          <span className="mcard__nums">
            <button className={`likebtn ${liked ? 'is-on' : ''}`} onClick={like} aria-pressed={liked} aria-label="좋아요"><Icon name="heart" size={15} />{num(m.likes + (liked ? 1 : 0))}</button>
            <span className="mono"><Icon name="download" size={14} />{num(m.downloads)}</span>
          </span>
        </div>
      </div>
    </article>
  );
}

export function CommunityCard({ c }) {
  const st = useStore();
  const joined = c.mine || !!st.s.joinedComms[c.id];
  return (
    <article className={`ccard ccard--${COMM_TYPES[c.type]}`}>
      <div className="ccard__band"><span className="mono">{c.type}</span><span>{c.region}</span></div>
      <Link to={`/share/communities/${c.id}`} className="ccard__name">{c.name}</Link>
      <p>{c.desc}</p>
      <div className="chips">{c.tags.map((t) => <Chip key={t}>#{t}</Chip>)}</div>
      <div className="ccard__foot">
        <span><Icon name="users" size={13} /> {num(c.members + (st.s.joinedComms[c.id] ? 1 : 0))}명 <i /> 대표 {c.leader}</span>
        <button className={`btn btn--sm ${joined ? 'btn--line' : 'btn--dark'}`} onClick={() => {
          if (c.mine) return;
          st.toggle('joinedComms', c.id);
          if (!joined) st.award('활동', 5, `공동체 가입: ${c.name}`);
          st.toast(joined ? '공동체에서 나왔어요' : `「${c.name}」에 함께해요`, joined ? 'warn' : 'ok');
        }}>{joined ? '참여 중' : '가입 신청'}</button>
      </div>
    </article>
  );
}

const WD = '일월화수목금토';
export function ScopeChip({ scope }) {
  return <span className={`scope scope--${{ 도: 'do', 지원청: 'office', 학교: 'school' }[scope]}`}>{SCOPE_LABEL[scope]}</span>;
}

// 공개수업 한 건. 시안 다섯 개(피드·교과·주간·지도·달력)가 모두 이 카드를 쓴다.
export function OpenClassCard({ o, onOpen, showDist }) {
  const { s } = useStore();
  const access = classAccess(o, s.profile);
  const applied = !!s.classApps[o.id];
  const own = o.mine || o.teacher === ME.name;
  const left = o.cap - o.applied - (applied ? 1 : 0);
  const [, m, d] = o.date.split('-').map(Number);
  const wd = WD[new Date(o.date).getDay()];
  return (
    <article className={`ocls ${access === 'other' ? 'is-locked' : ''} ${applied ? 'is-applied' : ''}`}>
      <div className="ocls__date"><b>{m}. {d}.</b><span>{wd}요일</span><small>{o.time.split('~')[0]}</small></div>
      <div className="ocls__body">
        <div className="ocls__tags">
          <ScopeChip scope={o.scope} />
          <Chip tone={LEVEL_COLOR[o.level]}>{o.level}</Chip>
          {o.audience.length > 1 && <span className="mono">대상 {o.audience.join('·')}</span>}
          {showDist != null && <span className="mono">{showDist ? `약 ${showDist}km` : '같은 시·군'}</span>}
        </div>
        <button className="ocls__title" onClick={() => onOpen(o)}><b>{o.subject}</b> {o.topic}</button>
        <span className="ocls__meta">{o.school} {o.grade} · {shortOffice(o.office)} · {o.teacher} 선생님</span>
      </div>
      <div className="ocls__side">
        {own ? <Chip tone="orange" solid>내 수업</Chip> : applied ? <Chip tone="blue" solid><Icon name="check" size={12} />신청함</Chip>
          : access === 'other' ? <span className="ocls__lock"><Icon name="lock" size={13} />{shortOffice(o.office)} 선생님 대상</span>
          : <span className={`mono ${left <= 0 ? 'c-orange' : ''}`}>{left <= 0 ? '정원 마감' : `남은 자리 ${left}`}</span>}
        <button className="btn btn--sm btn--line" onClick={() => onOpen(o)}><Icon name="file" size={14} />지도안 보기</button>
      </div>
    </article>
  );
}

export function OpenClassModal({ o, onClose }) {
  const st = useStore();
  const [plan, setPlan] = useState(true);
  if (!o) return null;
  const access = classAccess(o, st.s.profile);
  const applied = !!st.s.classApps[o.id];
  const full = o.applied >= o.cap && !applied;
  const past = o.date < TODAY;
  const own = o.mine || o.teacher === ME.name;
  const blocked = (full || past || access !== 'ok' || own) && !applied;
  const label = applied ? '참관 신청 취소' : own ? '내가 여는 수업이에요' : access === 'other' ? '대상 지원청이 아니에요' : full ? '정원 마감' : past ? '지난 수업' : '지도안 확인하고 참관 신청';
  return (
    <Modal open={!!o} onClose={onClose} title={`${o.subject} 공개수업`} wide
      footer={<button className="btn btn--blue" disabled={blocked} onClick={() => {
        st.toggle('classApps', o.id);
        if (!applied) { st.award('활동', 10, `공개수업 참관 신청: ${o.school}`); st.toast('참관 신청 완료 · 성장 여정에 기록했어요'); }
        else st.toast('참관 신청을 취소했어요', 'warn');
      }}>{label}</button>}>
      <div className="chips">
        <ScopeChip scope={o.scope} />
        <Chip tone={LEVEL_COLOR[o.level]} solid>{o.level}</Chip>
        <Chip>참관 대상 {o.audience.join('·')}</Chip>
      </div>
      <h4 className="h4">{o.topic}</h4>
      <div className="grid2 grid2--modal">
        <dl className="dl">
          <dt>일시</dt><dd>{fmtDate(o.date)} {o.time}</dd>
          <dt>장소</dt><dd>{o.city} {o.school} {o.grade}</dd>
          <dt>교과</dt><dd>{o.subject}</dd>
          <dt>정원</dt><dd>{o.cap}명 (신청 {o.applied + (applied ? 1 : 0)}명)</dd>
          <dt>수업자</dt><dd>{o.teacher} 선생님</dd>
          <dt>공개 범위</dt><dd>{SCOPE_LABEL[o.scope]} · {o.scope === '도' ? '경기도 모든 선생님' : o.scope === '지원청' ? `${o.office} 선생님` : `${o.school} 선생님`}</dd>
        </dl>
        {o.plan && (
          <div className="lplan">
            <button className="lplan__head" onClick={() => setPlan(!plan)} aria-expanded={plan}><Icon name="file" size={16} /><b>지도안 미리 보기</b><span className="mono">{o.plan.file}</span><Icon name="down" size={14} className="tcard__chev" /></button>
            {plan && <>
              <p className="lplan__goal"><span className="mono">학습 목표</span>{o.plan.goal}</p>
              <ol className="lplan__flow">{o.plan.flow.map((f, i) => <li key={i}>{f}</li>)}</ol>
              <button className="btn btn--sm btn--line" onClick={() => st.toast(`프로토타입이라 「${o.plan.file}」 내려받기는 흉내만 내요`)}><Icon name="download" size={14} />지도안 내려받기</button>
            </>}
          </div>
        )}
      </div>
      {access === 'other' && <p className="note"><Icon name="lock" size={15} /> 지원청 단위 공개라 {o.office} 선생님만 신청할 수 있어요. 지도안은 누구나 볼 수 있어요.</p>}
      {o.scope === '학교' && <p className="note"><Icon name="school" size={15} /> 우리 학교 안에서만 공개한 동료장학 수업이에요.</p>}
      <p className="note"><Icon name="route" size={15} /><span>참관 신청 현황은 성장 메뉴의 <b>성장 여정</b>에 자동으로 연결돼요.</span></p>
    </Modal>
  );
}

export function WorryItem({ w, onOpenDetail }) {
  const st = useStore();
  const comments = [...w.comments, ...(st.s.worryComments[w.id] ?? [])];
  const liked = !!st.s.worryLikes[w.id];
  return (
    <article className="witem">
      <Avatar name={w.author} size={38} />
      <div className="witem__body">
        <div className="witem__top">
          <Link to={`/together/worries/${w.id}`} className="witem__title" onClick={onOpenDetail}>{w.title}</Link>
          <Chip tone={w.solved ? 'green' : 'orange'}>{w.solved ? '해결됨' : `답변 ${comments.length}`}</Chip>
        </div>
        <p className="witem__text">{w.body}</p>
        <div className="witem__foot">
          <button className={`likebtn ${liked ? 'is-on' : ''}`} onClick={() => st.toggle('worryLikes', w.id)} aria-pressed={liked} aria-label="공감"><Icon name="heart" size={14} />{w.likes + (liked ? 1 : 0)}</button>
          <Link to={`/together/worries/${w.id}`} className="likebtn"><Icon name="message" size={14} />{comments.length}</Link>
          <span className="mono">#{w.tag} · {shortDate(w.date)}</span>
        </div>
      </div>
    </article>
  );
}

export function MentorCard({ m, onApply }) {
  return (
    <article className={`mtcard ${m.verified ? 'mtcard--verified' : ''}`}>
      {m.verified && <div className="mtcard__ribbon"><Icon name="shield" size={14} /> 우수멘토 · {m.verified}</div>}
      <div className="mtcard__head">
        <Avatar name={m.name} size={48} />
        <div>
          <strong>{m.name} 선생님</strong>
          <span>{m.school} · {m.role} · 경력 {m.years}년</span>
        </div>
      </div>
      <p>{m.intro}</p>
      <div className="chips">{m.fields.map((f) => <Chip key={f} tone="purple">{f}</Chip>)}{m.region.map((r) => <Chip key={r}>{r}</Chip>)}</div>
      <div className="mtcard__foot">
        <span className="mono"><Icon name="star" size={13} /> {m.rating} · 멘토링 {m.sessions}회{m.verified ? ' · 강사 인력풀' : ''}</span>
        <button className={`btn btn--sm ${m.verified ? 'btn--dark' : 'btn--line'}`} onClick={() => onApply(m)}>상세 · 신청</button>
      </div>
    </article>
  );
}

export function BadgeHex({ name, stage, got = true, size = 64 }) {
  const tone = { 배움: 'blue', 나눔: 'orange', 동행: 'green' }[stage] ?? 'ink';
  const icon = { 배움: 'book', 나눔: 'heart', 동행: 'users' }[stage] ?? 'award';
  return (
    <figure className={`hex ${got ? '' : 'is-locked'}`} title={name}>
      <svg viewBox="0 0 64 70" width={size} height={size * 70 / 64} aria-hidden>
        <path d="M32 3 59 18.5v33L32 67 5 51.5v-33Z" className={`hex__bg fill-${got ? tone : 'locked'}`} />
        <path d="M32 9.5 53.5 22v26L32 60.5 10.5 48V22Z" className="hex__inner" />
      </svg>
      <span className="hex__icon"><Icon name={got ? icon : 'lock'} size={size * 0.34} stroke={2} /></span>
      <figcaption>{name}</figcaption>
    </figure>
  );
}


export const STAGE_TONE = { 배움: 'blue', 나눔: 'orange', 동행: 'green' };
const ymd = (d) => d.split('-').map(Number).join('. ') + '.';

// 진단 한 영역의 배움(1단계) → 나눔(2단계) → 동행(3단계) → 전문가 사다리. 앨범·전문가 인증·첫 화면 공용.
export function AreaLadder({ area, compact }) {
  const steps = BADGE_STAGES.map((sg) => ({ sg, b: badgeOf(area.key, sg.key) }));
  const done = steps.filter((x) => x.b?.got).length;
  const expert = done === steps.length;
  return (
    <div className={`ladder ${expert ? 'is-expert' : ''} ${compact ? 'ladder--compact' : ''}`}>
      <div className="ladder__head">
        <b>{area.name}</b>
        {expert ? <Chip tone="green" solid><Icon name="shield" size={12} />전문가</Chip> : <span className="mono">{done} / 3 단계</span>}
      </div>
      <ol className="ladder__steps">
        {steps.map(({ sg, b }, i) => {
          const got = !!b?.got;
          const open = i === 0 || !!steps[i - 1].b?.got;
          return (
            <li key={sg.key} className={got ? 'is-got' : open ? 'is-next' : 'is-locked'}>
              <BadgeHex name={`${sg.step}단계 ${sg.key}`} stage={sg.key} got={got} size={compact ? 40 : 50} />
              {!compact && (
                <div className="ladder__note">
                  {got && <small>{ymd(b.date)} · {b.how}</small>}
                  {!got && open && b && <><small>{b.how} · {b.now}/{b.need}{b.unit}</small><Progress value={(b.now / b.need) * 100} tone={STAGE_TONE[sg.key]} /></>}
                  {!got && open && !b && <small>{sg.rule}</small>}
                  {!got && !open && <small>{steps[i - 1].sg.key}을 먼저 받아요</small>}
                </div>
              )}
            </li>
          );
        })}
        <li className={`ladder__expert ${expert ? 'is-got' : 'is-locked'}`}>
          <span className="ladder__seal"><Icon name={expert ? 'shield' : 'lock'} size={compact ? 16 : 20} /></span>
          <small>전문가</small>
        </li>
      </ol>
    </div>
  );
}
