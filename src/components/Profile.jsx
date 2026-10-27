// 처음 들어오면 학교급·담당·지원청을 묻고, 모든 목록이 이 기준으로 정렬된다.
// 분류는 도름스 가입 때 받는 체계(학교급 4개 + 교과·담당 목록, 없으면 직접 입력)를 그대로 쓴다.
import { useEffect, useState } from 'react';
import { OFFICES, SCHOOL_LEVELS, SUBJECTS } from '../data/seed.js';
import { SUBJECT_MAX, cleanProfile, cleanSubject, profileLabel, schoolFor, shortOffice, withRo } from '../fit.js';
import { useStore } from '../store.jsx';
import Icon from './Icon.jsx';
import { Field, Modal } from './ui.jsx';

const CUSTOM = '직접 입력';

export function ProfileModal({ open, onClose }) {
  const st = useStore();
  const [f, setF] = useState(st.s.profile);
  // 목록에 없는 담당을 고른 상태면 '직접 입력' 칸을 연다
  const [custom, setCustom] = useState(false);
  useEffect(() => {
    if (!open) return;
    setF(st.s.profile);
    setCustom(!!st.s.profile.subject && !SUBJECTS.includes(st.s.profile.subject));
  }, [open, st.s.profile]);
  const secondary = f.level === '중학교' || f.level === '고등학교';
  const save = () => {
    const subject = cleanSubject(f.subject);
    if (secondary && !subject) { st.toast('중·고등학교 선생님은 담당 교과를 골라 주세요', 'warn'); return; }
    const next = cleanProfile({ ...f, subject, set: true });
    st.patch(() => ({ profile: next }));
    st.toast(`${profileLabel(next, shortOffice(next.office))} 기준으로 보여 드릴게요`);
    onClose();
  };
  const later = () => { st.patch((s) => ({ profile: { ...s.profile, set: true } })); onClose(); };
  const pickSubject = (v) => {
    if (v === CUSTOM) { setCustom(true); setF({ ...f, subject: '' }); return; }
    setCustom(false);
    setF({ ...f, subject: v });
  };
  return (
    <Modal open={open} onClose={st.s.profile.set ? onClose : later} title="선생님에 대해 알려주세요"
      footer={<>
        {!st.s.profile.set && <button className="btn btn--line" onClick={later}>나중에 고를게요</button>}
        <button className="btn btn--dark" onClick={save}><Icon name="check" size={15} />이대로 보기</button>
      </>}>
      <p className="lead">몇 가지만 알려 주시면 연수, 배움 모듈, 교육자료, 공개수업을 선생님께 맞는 것부터 보여 드려요. 머리말의 <b>내 정보</b>에서 언제든 바꿀 수 있어요.</p>
      <div className="field">
        <span className="field__label">어디에서 가르치세요?</span>
        <div className="seg seg--full" role="radiogroup" aria-label="학교급">
          {SCHOOL_LEVELS.map((l) => <button key={l} type="button" role="radio" aria-checked={f.level === l} className={f.level === l ? 'is-on' : ''} onClick={() => setF({ ...f, level: l })}>{l}</button>)}
        </div>
        <span className="field__hint">중학교와 고등학교 선생님께는 두 학교급 자료를 함께 보여 드려요. 체험용이라 우리 학교는 {withRo(schoolFor(f.level, cleanSubject(f.subject)))} 정해져요.</span>
      </div>
      <Field label={secondary ? '담당 교과·업무 (꼭 골라 주세요)' : '담당 교과·업무 (선택)'} hint="특수교육, 상담, 보건, 사서, 영양 선생님께는 학교급보다 같은 담당 자료를 먼저 보여 드려요.">
        <select className="input" value={custom ? CUSTOM : f.subject} onChange={(e) => pickSubject(e.target.value)}>
          <option value="">고르지 않음</option>
          {SUBJECTS.map((x) => <option key={x}>{x}</option>)}
          <option value={CUSTOM}>{CUSTOM}</option>
        </select>
      </Field>
      {custom && (
        <Field label="맡은 교과나 업무">
          <input className="input" value={f.subject} maxLength={SUBJECT_MAX} placeholder="맡고 계신 일을 적어 주세요" onChange={(e) => setF({ ...f, subject: e.target.value })} autoFocus />
        </Field>
      )}
      <Field label="소속 교육지원청" hint="학교를 옮기면 해마다 바뀔 수 있어요. 바뀌면 여기서 고쳐 주세요.">
        <select className="input" value={f.office} onChange={(e) => setF({ ...f, office: e.target.value, city: OFFICES.find((o) => o.name === e.target.value).cities[0] })}>
          {OFFICES.map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}
        </select>
      </Field>
    </Modal>
  );
}

export function ProfileChip({ onOpen }) {
  const { s } = useStore();
  const p = s.profile;
  return (
    <button className="pchip" onClick={onOpen} aria-label={`내 정보: ${profileLabel(p, p.office)}. 눌러서 바꾸기`}>
      <Icon name="user" size={15} />
      <span className="pchip__k">내 정보</span>
      <span className="pchip__v">{profileLabel(p, shortOffice(p.office))}</span>
    </button>
  );
}
