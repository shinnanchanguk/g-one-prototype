// 한 객체는 어느 화면에서든 같은 카드로 그린다(첫 화면·목록·검색 공용).
import { Link } from 'react-router-dom';
import { COMM_TYPES, LEVEL_COLOR, TODAY } from '../data/seed.js';
import { useStore } from '../store.jsx';
import Icon from './Icon.jsx';
import { Avatar, Chip, Modal, fmtDate, num, shortDate } from './ui.jsx';

const STATUS_TONE = { 신청중: 'green', 마감임박: 'orange', 예정: 'ink', 마감: 'ink' };

export function trainingState(t, s) {
  if (s.applied[t.id]) return 'applied';
  if (t.status === '마감' || t.applied >= t.cap) return 'closed';
  if (t.status === '예정') return 'soon';
  return 'open';
}

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
      st.toast(st.s.journeyItems[t.id] ? '성장 여정에서 뺐어요' : '나의 성장 여정에 담았어요');
    },
  };
}

export function TrainingRow({ t, onOpen }) {
  const { s } = useStore();
  const act = useTrainingActions();
  const state = trainingState(t, s);
  const label = { applied: '신청 완료', closed: '신청 마감', soon: '신청 예정', open: '신청하기' }[state];
  const badge = state === 'applied' ? '신청함' : t.status;
  return (
    <div className="trow">
      <Chip tone={state === 'applied' ? 'blue' : STATUS_TONE[t.status]}>{badge}</Chip>
      <button className="trow__main" onClick={() => onOpen?.(t)}>
        <strong>{t.title}</strong>
        <span className="trow__meta">{fmtDate(t.date)} {t.time} <i /> {t.host}</span>
      </button>
      <span className="trow__cap mono"><Icon name="users" size={14} />{t.applied + (s.applied[t.id] ? 1 : 0)}/{t.cap}</span>
      <button className={`btn btn--sm ${state === 'open' ? 'btn--blue' : state === 'applied' ? 'btn--line' : 'btn--ghost'}`} disabled={state === 'closed' || state === 'soon'} onClick={() => act.apply(t)}>
        {state === 'applied' && <Icon name="check" size={14} />}{label}
      </button>
    </div>
  );
}

export function TrainingModal({ t, onClose }) {
  const { s } = useStore();
  const act = useTrainingActions();
  if (!t) return null;
  const state = trainingState(t, s);
  return (
    <Modal open={!!t} onClose={onClose} title={t.title}
      footer={<>
        <button className="btn btn--line" onClick={() => act.keep(t)}><Icon name="bookmark" size={15} />{s.journeyItems[t.id] ? '여정에 담김' : '나의 성장 여정에 담기'}</button>
        <button className="btn btn--blue" disabled={state === 'closed' || state === 'soon'} onClick={() => act.apply(t)}>{state === 'applied' ? '신청 취소' : state === 'open' ? '신청하기' : state === 'soon' ? '신청 예정' : '신청 마감'}</button>
      </>}>
      <div className="chips"><Chip tone="blue">{t.kind} 연수</Chip><Chip>{t.mode}</Chip><Chip>{t.target === '전체' ? '신규·경력 모두' : `${t.target} 교사`}</Chip><Chip>{t.level === '전체' ? '전 학교급' : t.level}</Chip><Chip tone="green">{t.cat}</Chip></div>
      <dl className="dl">
        <dt>주관</dt><dd>{t.host}</dd>
        <dt>일시</dt><dd>{fmtDate(t.date)} {t.time}</dd>
        <dt>이수 시간</dt><dd>{t.hours}시간</dd>
        <dt>정원</dt><dd>{t.applied + (s.applied[t.id] ? 1 : 0)} / {t.cap}명</dd>
        <dt>신청 마감</dt><dd>{fmtDate(t.deadline)}</dd>
      </dl>
      <p className="lead">{t.desc}</p>
    </Modal>
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

export function RoomRow({ r, compact }) {
  const st = useStore();
  const joined = r.mine || !!st.s.joinedRooms[r.id];
  return (
    <div className="rrow">
      <div className={`rrow__thumb thumb--${r.title.length % 5}`}><Icon name={r.cat === '디지털·AI' ? 'spark' : r.cat === '생활교육' ? 'heart' : r.cat === '정신건강·자기돌봄' ? 'leaf' : 'book'} size={22} /></div>
      <div className="rrow__body">
        <strong>{r.title}</strong>
        {!compact && <p>{r.desc}</p>}
        <span className="rrow__meta"><Icon name="users" size={13} /> 멤버 {num(r.members + (st.s.joinedRooms[r.id] ? 1 : 0))} <i /> 게시글 {num(r.posts)}</span>
      </div>
      <button className={`btn btn--sm ${joined ? 'btn--line' : 'btn--orange'}`} onClick={() => {
        if (r.mine) return;
        st.toggle('joinedRooms', r.id);
        st.toast(joined ? `「${r.title}」에서 나왔어요` : `「${r.title}」에 가입했어요 · 학습방에서 이어서 볼 수 있어요`, joined ? 'warn' : 'ok');
      }}>{joined ? <><Icon name="check" size={14} />가입됨</> : '가입하기'}</button>
    </div>
  );
}

export function CommunityCard({ c, compact }) {
  const st = useStore();
  const joined = c.mine || !!st.s.joinedComms[c.id];
  return (
    <article className={`ccard ccard--${COMM_TYPES[c.type]}`}>
      <div className="ccard__band"><span className="mono">{c.type}</span><span>{c.region}</span></div>
      <Link to={`/share/communities/${c.id}`} className="ccard__name">{c.name}</Link>
      {!compact && <p>{c.desc}</p>}
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

export function OpenClassModal({ o, onClose }) {
  const st = useStore();
  if (!o) return null;
  const applied = !!st.s.classApps[o.id];
  const full = o.applied >= o.cap && !applied;
  const past = o.date < TODAY;
  return (
    <Modal open={!!o} onClose={onClose} title={`${o.subject} 공개수업`}
      footer={<button className="btn btn--blue" disabled={(full || past) && !applied} onClick={() => {
        st.toggle('classApps', o.id);
        if (!applied) { st.award('활동', 10, `공개수업 참관 신청: ${o.school}`); st.toast('참관 신청 완료 · 성장 여정에 기록했어요'); }
        else st.toast('참관 신청을 취소했어요', 'warn');
      }}>{applied ? '참관 신청 취소' : full ? '정원 마감' : '참관 신청'}</button>}>
      <div className="chips">
        <Chip tone={LEVEL_COLOR[o.level]} solid>{o.level}</Chip>
        <Chip tone={o.scope === '도' ? 'orange' : 'ink'}>{o.scope === '도' ? '도 단위 공개' : '지원청 단위 공개'}</Chip>
        <Chip>{o.mode}</Chip>
      </div>
      <h4 className="h4">{o.topic}</h4>
      <dl className="dl">
        <dt>일시</dt><dd>{fmtDate(o.date)} {o.time}</dd>
        <dt>장소</dt><dd>{o.city} {o.school} {o.grade}</dd>
        <dt>대상</dt><dd>{o.level} 교원 · 정원 {o.cap}명 (신청 {o.applied + (applied ? 1 : 0)}명)</dd>
        <dt>수업자</dt><dd>{o.teacher} 선생님</dd>
        <dt>주관</dt><dd>{o.office}</dd>
      </dl>
      <p className="note"><Icon name="route" size={15} /> 참관 신청 현황은 <b>성장 &gt; 성장 여정</b>에 자동으로 연결됩니다.</p>
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
