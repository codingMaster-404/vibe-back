/**
 * InstructorSelectModal.jsx
 *
 * 운영자 강의 개설 폼에서 호출되는 강사 선택 모달.
 *
 * Props:
 *   open        {boolean}            — 모달 열림 여부
 *   onClose     {() => void}         — 닫기 콜백
 *   onSelect    {(instructor) => void} — 강사 선택 완료 콜백
 *   selected    {InstructorSummaryDto | null} — 현재 선택된 강사 (하이라이트용)
 *
 * 사용 예:
 *   <InstructorSelectModal
 *     open={modalOpen}
 *     onClose={() => setModalOpen(false)}
 *     onSelect={(inst) => { setForm(f => ({ ...f, instructorId: inst.userId })); setInstructor(inst); }}
 *     selected={selectedInstructor}
 *   />
 */

import { useEffect, useRef, useState } from 'react';
import useAdminStore from '../store/useAdminStore';

// ── 다크 테마 상수 ──────────────────────────────────────────────────
const C = {
  bg:       '#0f172a',
  surface:  '#1e293b',
  surface2: '#273449',
  border:   '#334155',
  text:     '#f1f5f9',
  sub:      '#94a3b8',
  accent:   '#6366f1',
  green:    '#22c55e',
  yellow:   '#eab308',
  red:      '#ef4444',
};

export default function InstructorSelectModal({ open, onClose, onSelect, selected }) {
  const { instructorResults, isSearching, fetchInstructorPool, searchInstructors } =
    useAdminStore();

  const [keyword, setKeyword]   = useState('');
  const searchTimer             = useRef(null);

  // 모달 열릴 때 강사 풀 초기 로드
  useEffect(() => {
    if (open) {
      fetchInstructorPool();
      setKeyword('');
    }
  }, [open]);

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // 검색어 변경 시 300ms 디바운스
  const handleKeyword = (e) => {
    const val = e.target.value;
    setKeyword(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchInstructors(val), 300);
  };

  if (!open) return null;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>

        {/* 헤더 */}
        <div style={S.header}>
          <span style={S.title}>담당 강사 선택</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* 검색 입력 */}
        <div style={S.searchWrap}>
          <span style={S.searchIcon}>🔍</span>
          <input
            style={S.searchInput}
            placeholder="이름, 이메일, 전문분야 검색..."
            value={keyword}
            onChange={handleKeyword}
            autoFocus
          />
          {isSearching && <span style={S.spinner}>⏳</span>}
        </div>

        {/* 결과 헤더 */}
        <div style={S.resultMeta}>
          {instructorResults.length > 0
            ? `${instructorResults.length}명의 강사`
            : '검색 결과 없음'}
        </div>

        {/* 강사 목록 */}
        <div style={S.list}>
          {instructorResults.length === 0 ? (
            <div style={S.empty}>
              {keyword ? `"${keyword}" 에 맞는 강사가 없습니다.` : '등록된 강사가 없습니다.'}
            </div>
          ) : (
            instructorResults.map((inst) => (
              <InstructorCard
                key={inst.userId}
                inst={inst}
                isSelected={selected?.userId === inst.userId}
                onSelect={() => { onSelect(inst); onClose(); }}
              />
            ))
          )}
        </div>

        {/* 하단 */}
        <div style={S.footer}>
          <span style={S.footerNote}>✅ 인증 완료 강사만 표시됩니다.</span>
          <button style={S.cancelBtn} onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}

// ── 강사 카드 ────────────────────────────────────────────────────────
function InstructorCard({ inst, isSelected, onSelect }) {
  const [hovered, setHovered] = useState(false);

  const borderColor = isSelected ? C.accent : hovered ? C.border : 'transparent';
  const bgColor     = isSelected ? `${C.accent}22` : hovered ? C.surface2 : C.surface;

  return (
    <div
      style={{ ...S.card, background: bgColor, borderColor }}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 아바타 */}
      <div style={S.avatar}>
        {inst.nickname.charAt(0).toUpperCase()}
      </div>

      {/* 정보 */}
      <div style={S.cardBody}>
        <div style={S.cardTop}>
          <span style={S.name}>{inst.nickname}</span>
          {inst.verified && (
            <span style={S.badge('green')}>✓ 인증</span>
          )}
          {inst.careerYears > 0 && (
            <span style={S.badge('gray')}>{inst.careerYears}년</span>
          )}
        </div>
        <div style={S.email}>{inst.email}</div>
        {inst.specialty && (
          <div style={S.specialty}>{inst.specialty}</div>
        )}
      </div>

      {/* 선택 체크 */}
      {isSelected && <div style={S.check}>✓</div>}
    </div>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────
const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    width: 520,
    maxWidth: '94vw',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: `1px solid ${C.border}`,
  },
  title: {
    color: C.text, fontSize: 16, fontWeight: 600,
  },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: C.sub, fontSize: 18, lineHeight: 1,
  },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '12px 16px',
    borderBottom: `1px solid ${C.border}`,
    background: C.bg,
  },
  searchIcon: { fontSize: 14, color: C.sub },
  searchInput: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: C.text, fontSize: 14,
  },
  spinner: { fontSize: 14 },
  resultMeta: {
    padding: '6px 16px',
    fontSize: 12, color: C.sub,
    borderBottom: `1px solid ${C.border}`,
  },
  list: {
    flex: 1, overflowY: 'auto',
    padding: '8px 8px',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  empty: {
    textAlign: 'center', color: C.sub,
    fontSize: 14, padding: '32px 0',
  },
  card: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid',
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
  },
  avatar: {
    width: 40, height: 40, borderRadius: '50%',
    background: C.accent,
    color: '#fff', fontWeight: 700, fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTop: {
    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
  },
  name: { color: C.text, fontWeight: 600, fontSize: 14 },
  email: { color: C.sub, fontSize: 12, marginTop: 2 },
  specialty: {
    marginTop: 4, fontSize: 12,
    color: C.accent, background: `${C.accent}18`,
    display: 'inline-block',
    padding: '2px 8px', borderRadius: 4,
  },
  badge: (type) => ({
    fontSize: 11, fontWeight: 600,
    padding: '1px 6px', borderRadius: 4,
    background: type === 'green' ? `${C.green}22` : '#334155',
    color:      type === 'green' ? C.green : C.sub,
  }),
  check: {
    color: C.accent, fontWeight: 700, fontSize: 18,
    flexShrink: 0,
  },
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px',
    borderTop: `1px solid ${C.border}`,
  },
  footerNote: { color: C.sub, fontSize: 12 },
  cancelBtn: {
    background: C.surface2, border: `1px solid ${C.border}`,
    color: C.text, borderRadius: 6,
    padding: '6px 16px', cursor: 'pointer', fontSize: 13,
  },
};
