/**
 * CoursePasswordModal.jsx — 강의 입장 비밀번호 확인 모달 (다크 테마)
 *
 * Props:
 *   course    : CourseResponseDto | null  — null 이면 모달 숨김
 *   studentId : number
 *   onSuccess : (courseId) => void        — 인증 성공 시 호출
 *   onClose   : () => void
 */

import { useState, useEffect, useRef } from 'react';
import useEnrollmentStore from '../store/useEnrollmentStore';

const D = {
  bg:      '#0f172a', surface: '#1e293b', border: '#334155',
  text:    '#f1f5f9', muted:   '#94a3b8', accent: '#6366f1',
  danger:  '#ef4444', accentBg: '#312e81',
};

export default function CoursePasswordModal({ course, studentId, onSuccess, onClose }) {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const inputRef                = useRef(null);
  const { enroll, isEnrolled }  = useEnrollmentStore();

  // 모달이 열릴 때 입력창 포커스
  useEffect(() => {
    if (course) {
      setPassword('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [course]);

  if (!course) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password && course.hasPassword) { setError('비밀번호를 입력하세요.'); return; }

    setLoading(true);
    setError('');

    try {
      // 이미 수강 중이면 바로 입장 (비밀번호 재검증 필요 없음)
      if (isEnrolled(course.id)) {
        onSuccess(course.id);
        return;
      }
      // 신규 수강 신청 (서버에서 비밀번호 검증)
      await enroll(course.id, studentId, password || null);
      onSuccess(course.id);
    } catch (err) {
      setError(err.message.includes('비밀번호') ? '비밀번호가 올바르지 않습니다.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };

  return (
    <div style={S.overlay} onClick={onClose} onKeyDown={handleKeyDown}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>

        {/* 헤더 */}
        <div style={S.header}>
          <div style={S.icon}>🔐</div>
          <div style={{ flex: 1 }}>
            <p style={S.modalTitle}>{course.courseTitle || course.title}</p>
            <p style={S.sub}>{course.instructorName} · {course.courseCategory || course.category}</p>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* 정보 */}
        <div style={S.infoRow}>
          <Tag icon="🎬" label={course.sessionType ?? 'VOD'} />
          <Tag icon="👥" label={`${course.enrolledCount ?? 0}명 수강 중`} />
          {course.hasPassword && <Tag icon="🔒" label="비밀번호 보호" color={D.danger} />}
        </div>

        {/* 입장 폼 */}
        <form onSubmit={handleSubmit} style={S.form}>
          {course.hasPassword ? (
            <>
              <label style={S.label}>강의 비밀번호</label>
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="비밀번호를 입력하세요"
                style={{ ...S.input, ...(error ? { borderColor: D.danger } : {}) }}
                autoComplete="off"
              />
              {error && <p style={S.errorMsg}>⚠ {error}</p>}
            </>
          ) : (
            <p style={S.freeNote}>🟢 이 강의는 비밀번호가 없어 바로 입장할 수 있습니다.</p>
          )}

          <div style={S.btnRow}>
            <button type="button" style={S.cancelBtn} onClick={onClose}>취소</button>
            <button type="submit" style={S.submitBtn} disabled={loading}>
              {loading ? '확인 중…' : '입장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Tag({ icon, label, color }) {
  return (
    <span style={{ ...S.tag, ...(color ? { color, borderColor: color + '55' } : {}) }}>
      {icon} {label}
    </span>
  );
}

const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, backdropFilter: 'blur(4px)',
  },
  modal: {
    background: D.surface, border: `1px solid ${D.border}`,
    borderRadius: 16, width: 420, maxWidth: 'calc(100vw - 32px)',
    boxShadow: '0 24px 48px rgba(0,0,0,.6)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '20px 20px 16px',
    borderBottom: `1px solid ${D.border}`,
  },
  icon:       { fontSize: 28 },
  modalTitle: { margin: 0, fontSize: 16, fontWeight: 800, color: D.text },
  sub:        { margin: '2px 0 0', fontSize: 12, color: D.muted },
  closeBtn:   {
    background: 'none', border: 'none', color: D.muted,
    fontSize: 18, cursor: 'pointer', padding: 4,
  },
  infoRow: {
    display: 'flex', gap: 8, flexWrap: 'wrap',
    padding: '12px 20px', borderBottom: `1px solid ${D.border}`,
  },
  tag: {
    padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
    color: D.muted, border: `1px solid ${D.border}`,
  },
  form:  { padding: 20 },
  label: { display: 'block', fontSize: 13, fontWeight: 700, color: D.muted, marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    background: D.bg, border: `1.5px solid ${D.border}`,
    color: D.text, fontSize: 15, outline: 'none', boxSizing: 'border-box',
    transition: 'border .15s',
  },
  errorMsg:  { margin: '6px 0 0', fontSize: 12, color: D.danger },
  freeNote:  { margin: '0 0 16px', fontSize: 14, color: '#86efac' },
  btnRow:    { display: 'flex', gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1, padding: '10px 0', borderRadius: 8,
    background: 'transparent', border: `1px solid ${D.border}`,
    color: D.muted, fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  submitBtn: {
    flex: 2, padding: '10px 0', borderRadius: 8,
    background: D.accent, border: 'none',
    color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
    transition: 'opacity .15s',
  },
};
