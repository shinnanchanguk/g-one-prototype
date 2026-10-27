// 처음 들어오면 학교급·교과·지원청을 묻고, 모든 목록이 이 기준으로 정렬된다.
import { useEffect, useState } from 'react';
import { BANDS, OFFICES, SUBJECTS } from '../data/seed.js';
import { SCHOOL_BY_BAND, cleanProfile, shortOffice } from '../fit.js';
import { useStore } from '../store.jsx';
import Icon from './Icon.jsx';
import { Field, Modal } from './ui.jsx';

export function ProfileModal({ open, onClose }) {
  const st = useStore();
  const [f, setF] = useState(st.s.profile);
  useEffect(() => { if (open) setF(st.s.profile); }, [open, st.s.profile]);
  const save = () => {
    if (f.band === '중등' && !f.subject) { st.toast('중등 선생님은 담당 교과를 골라 주세요', 'warn'); return; }
    st.patch(() => ({ profile: cleanProfile({ ...f, set: true }) }));
    st.toast(`${f.band}${f.subject ? ` · ${f.subject}` : ''} · ${shortOffice(f.office)} 기준으로 보여 드릴게요`);
    onClose();
  };
  const later = () => { st.patch((s) => ({ profile: { ...s.profile, set: true } })); onClose(); };
  return (
    <Modal open={open} onClose={st.s.profile.set ? onClose : later} title="선생님에 대해 알려주세요"
      footer={<>
        {!st.s.profile.set && <button className="btn btn--line" onClick={later}>나중에 고를게요</button>}
        <button className="btn btn--dark" onClick={save}><Icon name="check" size={15} />이대로 보기</button>
      </>}>
      <p className="lead">몇 가지만 알려 주시면 연수, 배움 모듈, 교육자료, 공개수업을 선생님께 맞는 것부터 보여 드려요. 머리말의 <b>내 정보</b>에서 언제든 바꿀 수 있어요.</p>
      <div className="field">
        <span className="field__label">학교급</span>
        <div className="seg seg--full" role="radiogroup" aria-label="학교급">
          {BANDS.map((b) => <button key={b} type="button" role="radio" aria-checked={f.band === b} className={f.band === b ? 'is-on' : ''} onClick={() => setF({ ...f, band: b })}>{b}</button>)}
        </div>
        <span className="field__hint">중학교와 고등학교는 서로 오가며 보시니까 중등 하나로 묶었어요. 특수는 특수끼리 먼저 보여요. 체험용이라 우리 학교는 {SCHOOL_BY_BAND[f.band]}로 정해져요.</span>
      </div>
      <Field label={f.band === '중등' ? '담당 교과 (꼭 골라 주세요)' : '담당 교과 (선택)'} hint="보건·상담·사서처럼 학교급보다 교과가 중요한 선생님도 골라 주세요.">
        <select className="input" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })}>
          <option value="">선택 안 함</option>
          {SUBJECTS.map((x) => <option key={x}>{x}</option>)}
        </select>
      </Field>
      <Field label="소속 교육지원청" hint="학교를 옮기면 해마다 바뀔 수 있어요. 바뀌면 여기서 고쳐 주세요.">
        <select className="input" value={f.office} onChange={(e) => setF({ ...f, office: e.target.value, city: OFFICES.find((o) => o.name === e.target.value).cities[0] })}>
          {OFFICES.map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}
        </select>
      </Field>
      <div className="field">
        <span className="field__label">무엇을 먼저 볼까요</span>
        <div className="seg seg--full" role="radiogroup" aria-label="정렬 기준">
          {[['학교급', '같은 학교급 먼저'], ['교과', '같은 교과 먼저']].map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={f.sortBy === v} className={f.sortBy === v ? 'is-on' : ''} onClick={() => setF({ ...f, sortBy: v })}>{l}</button>)}
        </div>
      </div>
    </Modal>
  );
}

export function ProfileChip({ onOpen }) {
  const { s } = useStore();
  const p = s.profile;
  return (
    <button className="pchip" onClick={onOpen} aria-label={`내 정보: ${p.band}${p.subject ? ` ${p.subject}` : ''} ${p.office}. 눌러서 바꾸기`}>
      <Icon name="user" size={15} />
      <span className="pchip__k">내 정보</span>
      <span className="pchip__v">{p.band}{p.subject ? ` · ${p.subject}` : ''} · {shortOffice(p.office)}</span>
    </button>
  );
}
