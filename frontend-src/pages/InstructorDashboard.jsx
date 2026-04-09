/**
 * InstructorDashboard.jsx — 강사 메인 대시보드 (다크 테마)
 *
 * 구성:
 *   1. 부진 수강생 알림 배너 (avg < 40 존재 시 상단 표시)
 *   2. 통계 카드 행 (개설 강의 수 / 총 수강생 / 클래스 평균 몰입도)
 *   3. 내 강의 목록 (카드) + 강의별 수강생 명단 + AI 신호등 토글
 *   4. [+ 강의 개설] 모달
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/useUserStore';
import useCourseStore from '../store/useCourseStore';

const CURRENT_USER_ID = 1; // TODO: 실제 인증 연동 시 교체
const BASE = 'http://localhost:8081/api';

const D = {
  bg:       '#0f172a', surface:  '#1e293b', surfaceHover: '#263348',
  border:   '#334155', text:     '#f1f5f9', muted:        '#94a3b8',
  accent:   '#6366f1', accentBg: '#312e81', success:      '#22c55e',
  warning:  '#f59e0b', danger:   '#ef4444',
};

// ── 신호등 설정 ───────────────────────────────────────────────────
const SIGNAL = {
  GREEN:  { emoji: '🟢', label: '집중',  color: D.success, bg: '#14532d' },
  YELLOW: { emoji: '🟡', label: '보통',  color: D.warning, bg: '#78350f' },
  RED:    { emoji: '🔴', label: '저조',  color: D.danger,  bg: '#7f1d1d' },
};

export default function InstructorDashboard({ onOpenCreateCourse }) {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const {
    courses,
    instructorEnrollmentStats,
    fetchInstructorEnrollmentStatsOnly,
    refreshInstructorCoursesAndStats,
  } = useCourseStore();

  const [roster, setRoster]         = useState({});   // { [courseId]: StudentFocusDto[] }
  const [openCourseId, setOpenCourseId] = useState(null);
  const [creating, setCreating]     = useState(false);
  const [form, setForm]             = useState({ title: '', description: '', schedule: '', category: '', sessionType: 'VOD', coursePassword: '' });
  const [formLoading, setFormLoading] = useState(false);

  /* 강의 목록은 App 레이아웃에서 fetchInstructorCourses로 로드 — 여기서는 통계만 */
  useEffect(() => {
    if (user?.role !== 'INSTRUCTOR' || user?.id == null) return;
    fetchInstructorEnrollmentStatsOnly(user.id);
  }, [user?.id, user?.role]);

  // 수강생 명단 토글 로드
  const toggleRoster = async (courseId) => {
    if (openCourseId === courseId) { setOpenCourseId(null); return; }
    setOpenCourseId(courseId);
    if (!roster[courseId]) {
      const iid = user?.id ?? CURRENT_USER_ID;
      const res  = await fetch(`${BASE}/enrollments/course/${courseId}/students?instructorId=${iid}`, { credentials: 'include' });
      const data = await res.json();
      setRoster((prev) => ({ ...prev, [courseId]: data }));
    }
  };

  // ── 부진 수강생 전체 목록 ─────────────────────────────────────────
  const allUnderperforming = Object.values(roster)
    .flat()
    .filter((s) => s.isUnderperforming);

  // ── 전체 통계 집계 ────────────────────────────────────────────────
  const totalStudents  = Object.values(instructorEnrollmentStats).reduce((s, st) => s + (st.totalStudents ?? 0), 0);
  const allAvgFocus    = Object.values(instructorEnrollmentStats)
    .map((st) => st.avgFocusScore)
    .filter((v) => v != null && v > 0);
  const globalAvgFocus = allAvgFocus.length
    ? Math.round(allAvgFocus.reduce((a, b) => a + b, 0) / allAvgFocus.length * 10) / 10
    : null;

  // ── 강의 개설 ──────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await fetch(`${BASE}/courses`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, instructorId: user?.id ?? CURRENT_USER_ID }),
      });
      await refreshInstructorCoursesAndStats(user?.id ?? CURRENT_USER_ID);
      setCreating(false);
      setForm({ title: '', description: '', schedule: '', category: '', sessionType: 'VOD', coursePassword: '' });
    } catch (err) {
      alert('강의 개설에 실패했습니다: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div style={S.page}>

      {/* ── 부진 수강생 알림 배너 ── */}
      {allUnderperforming.length > 0 && (
        <div style={S.alertBanner}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={S.alertTitle}>
              집중력 저조 수강생 {allUnderperforming.length}명 감지됨
            </p>
            <p style={S.alertSub}>
              {allUnderperforming.map((s) => s.nickname).slice(0, 5).join(', ')}
              {allUnderperforming.length > 5 ? ` 외 ${allUnderperforming.length - 5}명` : ''}
              — 평균 몰입도 40점 미만
            </p>
          </div>
          <span style={S.alertScore}>🔴 관리 필요</span>
        </div>
      )}

      {/* ── 헤더 ── */}
      <div style={S.hero}>
        <div>
          <p style={S.greeting}>안녕하세요, {user?.nickname ?? '강사'}님 👩‍🏫</p>
          <p style={S.heroSub}>강의를 관리하고 수강생의 학습 현황을 확인하세요</p>
        </div>
        <button style={S.createBtn} onClick={() => setCreating(true)}>
          ＋ 강의 개설
        </button>
      </div>

      {/* ── 요약 카드 ── */}
      <div style={S.statsRow}>
        <StatCard icon="📚" label="개설 강의"        value={`${courses?.length ?? 0}개`} />
        <StatCard icon="👥" label="총 수강생"         value={`${totalStudents}명`} />
        <StatCard
          icon="🎯" label="클래스 평균 몰입도"
          value={globalAvgFocus != null ? `${globalAvgFocus}점` : '—'}
          color={globalAvgFocus != null ? focusColor(globalAvgFocus) : D.muted}
        />
        <StatCard
          icon="🔴" label="부진 수강생"
          value={`${allUnderperforming.length}명`}
          color={allUnderperforming.length > 0 ? D.danger : D.success}
        />
      </div>

      {/* ── 강의 목록 ── */}
      <h2 style={S.sectionTitle}>📋 내 강의 목록</h2>

      {(!courses || courses.length === 0) ? (
        <div style={S.empty}>
          <p style={{ fontSize: 48 }}>📝</p>
          <p style={S.emptyTitle}>개설된 강의가 없어요</p>
          <button style={S.emptyBtn} onClick={() => setCreating(true)}>+ 첫 강의 개설하기</button>
        </div>
      ) : (
        <div style={S.courseList}>
          {courses.map((c) => {
            const st      = instructorEnrollmentStats[c.id] ?? {};
            const members = roster[c.id] ?? [];
            const isOpen  = openCourseId === c.id;

            return (
              <div key={c.id} style={S.courseBlock}>
                {/* 강의 행 */}
                <div style={S.courseRow}>
                  <div style={S.courseInfo} onClick={() => navigate(`/courses/${c.id}`)}>
                    <div style={S.courseDot(c.sessionType === 'LIVE' ? D.danger : D.success)} />
                    <div>
                      <p style={S.courseTitle}>{c.title}</p>
                      <p style={S.courseMeta}>
                        {c.sessionType} · {c.category || '분류 없음'} · 코드: <code style={S.code}>{c.accessCode}</code>
                      </p>
                    </div>
                  </div>

                  <div style={S.courseActions}>
                    {/* 채점 대기 배지 */}
                    {c.pendingSubmissionsCount > 0 && (
                      <span style={S.pendingBadge}>{c.pendingSubmissionsCount} 채점 대기</span>
                    )}
                    <p style={S.enrollCount}>{st.totalStudents ?? 0}명 수강</p>
                    {st.avgFocusScore > 0 && (
                      <p style={{ ...S.avgFocus, color: focusColor(st.avgFocusScore) }}>
                        avg {st.avgFocusScore}점
                      </p>
                    )}
                    <button style={S.rosterToggleBtn} onClick={() => toggleRoster(c.id)}>
                      {isOpen ? '▲ 명단 닫기' : '▼ 명단 보기'}
                    </button>
                  </div>
                </div>

                {/* 수강생 명단 (펼침) */}
                {isOpen && (
                  <div style={S.rosterWrap}>
                    {members.length === 0 ? (
                      <p style={{ fontSize: 13, color: D.muted, padding: '12px 0' }}>수강생이 없습니다.</p>
                    ) : (
                      <table style={S.table}>
                        <thead>
                          <tr>
                            {['신호등', '이름', '연락처', '평균 몰입도', '학습 시간', '진행률', '마지막 학습'].map((h) => (
                              <th key={h} style={S.th}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {members.map((s) => {
                            const sig = SIGNAL[s.focusSignal] ?? SIGNAL.RED;
                            return (
                              <tr key={s.studentId} style={S.tr}>
                                <td style={S.td}>
                                  <span style={{ ...S.signalBadge, background: sig.bg, color: sig.color }}>
                                    {sig.emoji} {sig.label}
                                  </span>
                                </td>
                                <td style={{ ...S.td, fontWeight: 700, color: D.text }}>{s.nickname}</td>
                                <td style={S.td}>{s.phone ?? '—'}</td>
                                <td style={{ ...S.td, color: focusColor(s.cumulativeFocusScore ?? 0), fontWeight: 700 }}>
                                  {s.cumulativeFocusScore != null
                                    ? `${Math.round(s.cumulativeFocusScore)}점`
                                    : '—'}
                                </td>
                                <td style={S.td}>{s.totalStudyMinutes ?? 0}분</td>
                                <td style={S.td}>
                                  <div style={S.miniPBar}>
                                    <div style={{ ...S.miniPFill, width: `${s.progressPercent ?? 0}%` }} />
                                  </div>
                                  <span style={{ fontSize: 10, color: D.muted }}>{s.progressPercent ?? 0}%</span>
                                </td>
                                <td style={{ ...S.td, fontSize: 11, color: D.muted }}>
                                  {s.lastStudiedAt
                                    ? new Date(s.lastStudiedAt).toLocaleDateString('ko-KR')
                                    : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── 강의 개설 모달 ── */}
      {creating && (
        <div style={S.overlay} onClick={() => setCreating(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <span style={{ fontSize: 24 }}>📝</span>
              <p style={S.modalTitle}>강의 개설</p>
              <button style={S.closeBtn} onClick={() => setCreating(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: 20 }}>
              <FormField label="강의명 *" value={form.title}
                onChange={(v) => setForm({ ...form, title: v })} placeholder="예: React 심화 과정" />
              <FormField label="설명" value={form.description} textarea
                onChange={(v) => setForm({ ...form, description: v })} placeholder="강의 소개를 입력하세요" />
              <FormField label="시간표" value={form.schedule}
                onChange={(v) => setForm({ ...form, schedule: v })} placeholder="예: 월수금 10:00-11:30" />
              <FormField label="카테고리" value={form.category}
                onChange={(v) => setForm({ ...form, category: v })} placeholder="예: 컴퓨터과학" />

              <div style={{ marginBottom: 14 }}>
                <label style={S.fLabel}>세션 유형</label>
                <select value={form.sessionType} onChange={(e) => setForm({ ...form, sessionType: e.target.value })} style={S.select}>
                  <option value="VOD">VOD (녹화 강의)</option>
                  <option value="LIVE">LIVE (실시간 강의)</option>
                  <option value="HYBRID">HYBRID (혼합)</option>
                </select>
              </div>

              <FormField label="입장 비밀번호 (선택)" value={form.coursePassword} type="password"
                onChange={(v) => setForm({ ...form, coursePassword: v })} placeholder="비워두면 비밀번호 없음" />

              <p style={{ fontSize: 11, color: D.muted, marginBottom: 16 }}>
                💡 입장 코드는 자동 생성됩니다. 개설 후 수강생에게 공유하세요.
              </p>

              <button type="submit" style={S.submitBtn} disabled={!form.title || formLoading}>
                {formLoading ? '개설 중…' : '강의 개설하기'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div style={S.statCard}>
      <p style={S.statIcon}>{icon}</p>
      <p style={S.statLabel}>{label}</p>
      <p style={{ ...S.statValue, color: color ?? D.text }}>{value}</p>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, textarea, type }) {
  const style = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    background: D.bg, border: `1.5px solid ${D.border}`,
    color: D.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    resize: textarea ? 'vertical' : 'none',
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={S.fLabel}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ ...style, minHeight: 72 }} />
        : <input type={type ?? 'text'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={style} />
      }
    </div>
  );
}

const focusColor = (s) =>
  s >= 80 ? D.success : s >= 60 ? '#a3e635' : s >= 40 ? D.warning : D.danger;

// ── 스타일 ──────────────────────────────────────────────────────
const S = {
  page: { background: D.bg, minHeight: '100vh', color: D.text, padding: '28px 32px' },

  alertBanner: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: '#450a0a', border: `1px solid ${D.danger}55`,
    borderRadius: 12, padding: '14px 20px', marginBottom: 24,
  },
  alertTitle: { margin: 0, fontSize: 15, fontWeight: 800, color: D.danger },
  alertSub:   { margin: '2px 0 0', fontSize: 12, color: '#fca5a5' },
  alertScore: { fontSize: 13, fontWeight: 700, color: D.danger, flexShrink: 0 },

  hero: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 16, marginBottom: 24,
    background: D.surface, borderRadius: 16, padding: '22px 28px',
    border: `1px solid ${D.border}`,
  },
  greeting: { margin: 0, fontSize: 22, fontWeight: 800, color: D.text },
  heroSub:  { margin: '4px 0 0', fontSize: 13, color: D.muted },
  createBtn: {
    padding: '10px 22px', borderRadius: 8, background: D.accent,
    border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
  },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 },
  statCard:  {
    background: D.surface, border: `1px solid ${D.border}`,
    borderRadius: 12, padding: '16px', textAlign: 'center',
  },
  statIcon:  { margin: '0 0 4px', fontSize: 24 },
  statLabel: { margin: '0 0 6px', fontSize: 11, color: D.muted, fontWeight: 700 },
  statValue: { margin: 0, fontSize: 24, fontWeight: 900 },

  sectionTitle: { margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: D.text },

  courseList:  { display: 'flex', flexDirection: 'column', gap: 12 },
  courseBlock: {
    background: D.surface, border: `1px solid ${D.border}`,
    borderRadius: 14, overflow: 'hidden',
  },
  courseRow: {
    display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px',
    flexWrap: 'wrap',
  },
  courseInfo: {
    display: 'flex', alignItems: 'center', gap: 12, flex: 1,
    cursor: 'pointer',
  },
  courseDot: (color) => ({ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }),
  courseTitle: { margin: 0, fontSize: 15, fontWeight: 800, color: D.text },
  courseMeta:  { margin: '2px 0 0', fontSize: 12, color: D.muted },
  code: { background: D.accentBg, color: '#a5b4fc', padding: '0 6px', borderRadius: 4, fontSize: 12 },

  courseActions: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  pendingBadge: {
    padding: '3px 10px', borderRadius: 999, background: '#7f1d1d',
    color: D.danger, fontSize: 11, fontWeight: 800,
  },
  enrollCount:    { margin: 0, fontSize: 12, color: D.muted },
  avgFocus:       { margin: 0, fontSize: 12, fontWeight: 700 },
  rosterToggleBtn: {
    padding: '5px 12px', borderRadius: 6, background: D.accentBg,
    border: `1px solid ${D.accent}`, color: '#a5b4fc',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },

  rosterWrap: { padding: '0 18px 18px', borderTop: `1px solid ${D.border}`, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    padding: '8px 12px', background: D.bg, color: D.muted,
    fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap',
    borderBottom: `1px solid ${D.border}`, fontSize: 11,
  },
  tr:  { borderBottom: `1px solid #1e293b40` },
  td:  { padding: '9px 12px', color: D.muted, whiteSpace: 'nowrap' },
  signalBadge: { padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 },
  miniPBar:  { width: 60, height: 4, background: D.border, borderRadius: 999, overflow: 'hidden', marginBottom: 2 },
  miniPFill: { height: '100%', background: D.accent, borderRadius: 999 },

  empty: {
    textAlign: 'center', padding: '60px 20px',
    background: D.surface, borderRadius: 16, border: `1px solid ${D.border}`,
  },
  emptyTitle: { fontSize: 18, fontWeight: 800, color: D.text, margin: '12px 0 20px' },
  emptyBtn:   {
    padding: '10px 24px', borderRadius: 8, background: D.accent,
    border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },

  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.80)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, backdropFilter: 'blur(4px)', padding: 16,
  },
  modal: {
    background: D.surface, border: `1px solid ${D.border}`,
    borderRadius: 16, width: 480, maxWidth: '100%', maxHeight: '90vh',
    overflowY: 'auto', boxShadow: '0 24px 48px rgba(0,0,0,.7)',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '20px 20px 14px', borderBottom: `1px solid ${D.border}`,
  },
  modalTitle: { margin: 0, flex: 1, fontSize: 17, fontWeight: 800, color: D.text },
  closeBtn:   { background: 'none', border: 'none', color: D.muted, fontSize: 18, cursor: 'pointer' },
  fLabel:     { display: 'block', fontSize: 12, fontWeight: 700, color: D.muted, marginBottom: 5 },
  select: {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    background: D.bg, border: `1.5px solid ${D.border}`,
    color: D.text, fontSize: 13, outline: 'none',
  },
  submitBtn: {
    width: '100%', padding: '12px', borderRadius: 8,
    background: D.accent, border: 'none', color: '#fff',
    fontSize: 15, fontWeight: 800, cursor: 'pointer',
  },
};
