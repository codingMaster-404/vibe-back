/**
 * AssignmentPanel.jsx — 과제 목록 + 파일 제출 + 제출 현황 패널
 *
 * Props:
 *   assignments  : Assignment[]  — 강의의 과제 목록
 *   studentId    : number        — 현재 로그인된 수강생 ID
 */

import { useEffect, useRef, useState } from 'react';
import useCourseStore from '../store/useCourseStore';

const STATUS_LABEL = {
  SUBMITTED: { text: '제출 완료', color: '#22c55e', bg: '#f0fdf4' },
  GRADED:    { text: '채점 완료', color: '#6366f1', bg: '#eef2ff' },
  LATE:      { text: '지각 제출', color: '#f59e0b', bg: '#fffbeb' },
};

export default function AssignmentPanel({ assignments = [], studentId }) {
  const { submissions, fetchMySubmissions, submitAssignment, getSubmissionFor } = useCourseStore();
  const [expanded, setExpanded]   = useState(null);   // 펼쳐진 과제 id
  const [uploading, setUploading] = useState({});      // { [assignmentId]: boolean }
  const [uploadMsg, setUploadMsg] = useState({});      // { [assignmentId]: string }
  const fileRefs = useRef({});                         // file input refs per assignment

  useEffect(() => {
    if (studentId) fetchMySubmissions(studentId);
  }, [studentId, fetchMySubmissions]);

  // ── 제출 핸들러 ──────────────────────────────────────────────
  const handleFileChange = async (assignmentId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading((prev) => ({ ...prev, [assignmentId]: true }));
    setUploadMsg((prev) => ({ ...prev, [assignmentId]: '' }));

    try {
      await submitAssignment(assignmentId, file, studentId);
      await fetchMySubmissions(studentId);
      setUploadMsg((prev) => ({ ...prev, [assignmentId]: '✅ 제출 완료!' }));
    } catch (err) {
      setUploadMsg((prev) => ({ ...prev, [assignmentId]: `❌ ${err.message}` }));
    } finally {
      setUploading((prev) => ({ ...prev, [assignmentId]: false }));
      // 파일 input 초기화
      if (fileRefs.current[assignmentId]) fileRefs.current[assignmentId].value = '';
    }
  };

  // ── 날짜 포맷 ─────────────────────────────────────────────────
  const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();

  // ── 렌더 ──────────────────────────────────────────────────────
  if (!assignments.length) {
    return (
      <div style={S.empty}>
        <p style={{ fontSize: 36 }}>📭</p>
        <p>등록된 과제가 없습니다.</p>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <h2 style={S.heading}>📋 과제 목록</h2>

      {assignments.map((asgn) => {
        const sub    = getSubmissionFor(asgn.id);
        const open   = expanded === asgn.id;
        const due    = isOverdue(asgn.dueDate);
        const status = sub ? STATUS_LABEL[sub.status] : null;

        return (
          <div key={asgn.id} style={{ ...S.card, border: open ? '1.5px solid #6366f1' : '1.5px solid #e5e7eb' }}>

            {/* ── 카드 헤더 ── */}
            <div style={S.cardHeader} onClick={() => setExpanded(open ? null : asgn.id)}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={S.asgnTitle}>{asgn.title}</span>

                  {/* 상태 배지 */}
                  {status && (
                    <span style={{ ...S.badge, color: status.color, background: status.bg }}>
                      {status.text}
                    </span>
                  )}
                  {!sub && due && (
                    <span style={{ ...S.badge, color: '#ef4444', background: '#fef2f2' }}>마감 초과</span>
                  )}
                  {!sub && !due && (
                    <span style={{ ...S.badge, color: '#6b7280', background: '#f3f4f6' }}>미제출</span>
                  )}
                </div>

                <p style={S.dueLine}>
                  🗓 마감: <span style={due && !sub ? { color: '#ef4444', fontWeight: 700 } : {}}>
                    {fmtDate(asgn.dueDate)}
                  </span>
                  {asgn.maxScore && <span style={S.maxScore}> · 만점 {asgn.maxScore}점</span>}
                </p>
              </div>

              <span style={S.chevron}>{open ? '▲' : '▼'}</span>
            </div>

            {/* ── 펼쳐진 영역 ── */}
            {open && (
              <div style={S.cardBody}>

                {/* 과제 설명 */}
                {asgn.description && (
                  <p style={S.desc}>{asgn.description}</p>
                )}

                {/* 제출 현황 */}
                {sub && (
                  <div style={S.subInfo}>
                    <p style={S.subInfoTitle}>📤 제출 정보</p>
                    <table style={S.table}>
                      <tbody>
                        <tr>
                          <td style={S.td}>파일명</td>
                          <td style={S.tdVal}>{sub.originalFileName}</td>
                        </tr>
                        <tr>
                          <td style={S.td}>제출 일시</td>
                          <td style={S.tdVal}>{fmtDate(sub.submittedAt)}</td>
                        </tr>
                        {sub.grade != null && (
                          <tr>
                            <td style={S.td}>점수</td>
                            <td style={{ ...S.tdVal, color: '#6366f1', fontWeight: 700 }}>
                              {sub.grade} / {asgn.maxScore ?? 100}점
                            </td>
                          </tr>
                        )}
                        {sub.feedback && (
                          <tr>
                            <td style={S.td}>피드백</td>
                            <td style={{ ...S.tdVal, whiteSpace: 'pre-wrap' }}>{sub.feedback}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 파일 업로드 영역 */}
                {!due || sub ? (
                  <div style={S.uploadArea}>
                    <p style={S.uploadLabel}>
                      {sub ? '📂 파일 재제출 (기존 파일이 교체됩니다)' : '📂 파일 업로드'}
                    </p>

                    <label style={S.fileLabel}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.hwp,.ppt,.pptx,.xls,.xlsx,.zip,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        ref={(el) => (fileRefs.current[asgn.id] = el)}
                        onChange={(e) => handleFileChange(asgn.id, e)}
                        disabled={uploading[asgn.id]}
                      />
                      {uploading[asgn.id] ? '⏳ 업로드 중…' : '파일 선택'}
                    </label>

                    {uploadMsg[asgn.id] && (
                      <p style={{
                        marginTop: 8, fontSize: 13,
                        color: uploadMsg[asgn.id].startsWith('✅') ? '#22c55e' : '#ef4444',
                      }}>
                        {uploadMsg[asgn.id]}
                      </p>
                    )}

                    <p style={S.hint}>
                      허용 형식: PDF, DOC, DOCX, HWP, PPT, PPTX, XLS, XLSX, ZIP, JPG, PNG (최대 50MB)
                    </p>
                  </div>
                ) : (
                  <div style={{ ...S.uploadArea, background: '#fef2f2', border: '1.5px dashed #fca5a5' }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
                      🔒 마감일이 지나 제출이 불가능합니다.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 스타일 ──────────────────────────────────────────────────────
const S = {
  wrap:    { padding: '8px 0' },
  heading: { margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#111827' },
  empty:   { textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 14 },

  card:       { borderRadius: 12, marginBottom: 12, overflow: 'hidden', transition: 'border .15s' },
  cardHeader: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', cursor: 'pointer',
    background: '#fff',
  },
  asgnTitle: { fontSize: 15, fontWeight: 700, color: '#111827' },
  badge:     { padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700 },
  dueLine:   { margin: '4px 0 0', fontSize: 12, color: '#6b7280' },
  maxScore:  { color: '#9ca3af' },
  chevron:   { fontSize: 12, color: '#9ca3af', flexShrink: 0 },

  cardBody: { padding: '0 16px 16px', background: '#fff' },
  desc:     { margin: '4px 0 12px', fontSize: 14, color: '#374151', lineHeight: 1.6 },

  subInfo:      { background: '#f8faff', border: '1px solid #e0e7ff', borderRadius: 8, padding: '12px 14px', marginBottom: 14 },
  subInfoTitle: { margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#6366f1' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  td:           { padding: '4px 8px 4px 0', fontSize: 12, color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'top', width: 80 },
  tdVal:        { padding: '4px 0', fontSize: 13, color: '#111827', verticalAlign: 'top' },

  uploadArea:  { background: '#f9fafb', border: '1.5px dashed #d1d5db', borderRadius: 8, padding: '16px', textAlign: 'center' },
  uploadLabel: { margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#374151' },
  fileLabel:   {
    display: 'inline-block', padding: '8px 20px',
    background: '#6366f1', color: '#fff',
    borderRadius: 8, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', userSelect: 'none',
  },
  hint: { margin: '10px 0 0', fontSize: 11, color: '#9ca3af' },
};
