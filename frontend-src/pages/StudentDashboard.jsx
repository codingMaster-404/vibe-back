/**
 * StudentDashboard.jsx — 수강생 메인 대시보드 (다크 테마)
 *
 * 구성:
 *   1. 상단 헤더 — 환영 메시지 + 주간 통계 요약
 *   2. 수강 중인 강의 카드 목록 (클릭 → 비밀번호 모달 → 강의 상세)
 *   3. [입장 코드로 강의 찾기] 모달
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/useUserStore';
import useEnrollmentStore from '../store/useEnrollmentStore';
import CoursePasswordModal from '../components/CoursePasswordModal';

const CURRENT_USER_ID = 1; // TODO: 실제 인증 연동 시 교체

const D = {
  bg:       '#0f172a', surface:  '#1e293b', surfaceHover: '#263348',
  border:   '#334155', text:     '#f1f5f9', muted:        '#94a3b8',
  accent:   '#6366f1', accentBg: '#312e81', success:      '#22c55e',
  warning:  '#f59e0b', danger:   '#ef4444', live:         '#ef4444',
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, weeklyProgress, fetchAll } = useUserStore();
  const { myEnrollments, fetchMyEnrollments } = useEnrollmentStore();

  const [selectedCourse, setSelectedCourse] = useState(null);   // 비밀번호 모달용
  const [accessCodeMode, setAccessCodeMode] = useState(false);  // 입장코드 모달
  const [codeInput, setCodeInput]           = useState('');
  const [codeError, setCodeError]           = useState('');
  const [codeLoading, setCodeLoading]       = useState(false);
  const [foundCourse, setFoundCourse]       = useState(null);

  useEffect(() => {
    fetchAll(CURRENT_USER_ID);
    fetchMyEnrollments(CURRENT_USER_ID);
  }, []);

  // ── 비밀번호 모달 성공 → 강의 상세로 이동
  const handlePasswordSuccess = (courseId) => {
    setSelectedCourse(null);
    navigate(`/courses/${courseId}`);
  };

  // ── 입장 코드 검색
  const handleCodeSearch = async (e) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    setCodeLoading(true);
    setCodeError('');
    try {
      const res = await fetch(
        `http://localhost:8081/api/courses/access-code/${codeInput.trim().toUpperCase()}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('해당 입장 코드의 강의를 찾을 수 없습니다.');
      const course = await res.json();
      setFoundCourse(course);
    } catch (err) {
      setCodeError(err.message);
    } finally {
      setCodeLoading(false);
    }
  };

  const achieveRate = weeklyProgress?.achievementRate ?? 0;

  return (
    <div style={S.page}>

      {/* ── 상단 헤더 ── */}
      <div style={S.hero}>
        <div>
          <p style={S.greeting}>안녕하세요, {user?.nickname ?? '수강생'}님 👋</p>
          <p style={S.heroSub}>오늘도 꾸준히 학습해보세요!</p>
        </div>
        <div style={S.heroStats}>
          <MiniStat label="주간 목표" value={`${weeklyProgress?.weeklyGoalMinutes ?? 0}분`} />
          <MiniStat label="이번주 학습" value={`${weeklyProgress?.actualMinutes ?? 0}분`} />
          <MiniStat label="달성률" value={`${Math.round(achieveRate)}%`} accent />
        </div>
      </div>

      {/* ── 섹션 헤더 ── */}
      <div style={S.sectionHeader}>
        <div>
          <h2 style={S.sectionTitle}>📚 수강 중인 강의</h2>
          <p style={S.sectionSub}>{myEnrollments.length}개 강의 수강 중</p>
        </div>
        <button style={S.codeBtn} onClick={() => setAccessCodeMode(true)}>
          🔑 입장 코드로 강의 찾기
        </button>
      </div>

      {/* ── 강의 카드 그리드 ── */}
      {myEnrollments.length === 0 ? (
        <div style={S.empty}>
          <p style={{ fontSize: 48 }}>📭</p>
          <p style={S.emptyTitle}>아직 수강 중인 강의가 없어요</p>
          <p style={S.emptySub}>입장 코드를 입력해 첫 강의에 참여해보세요!</p>
          <button style={S.emptyBtn} onClick={() => setAccessCodeMode(true)}>
            🔑 입장 코드로 강의 찾기
          </button>
        </div>
      ) : (
        <div style={S.grid}>
          {myEnrollments.map((e) => (
            <CourseCard
              key={e.id}
              enrollment={e}
              onClick={() => setSelectedCourse({
                id:            e.courseId,
                courseTitle:   e.courseTitle,
                instructorName: e.instructorName,
                courseCategory: e.courseCategory,
                sessionType:   e.sessionType,
                enrolledCount: e.enrolledCount,
                hasPassword:   e.hasPassword,
              })}
            />
          ))}
        </div>
      )}

      {/* ── 비밀번호 모달 ── */}
      <CoursePasswordModal
        course={selectedCourse}
        studentId={CURRENT_USER_ID}
        onSuccess={handlePasswordSuccess}
        onClose={() => setSelectedCourse(null)}
      />

      {/* ── 입장 코드 모달 ── */}
      {accessCodeMode && (
        <div style={S.overlay} onClick={() => { setAccessCodeMode(false); setFoundCourse(null); setCodeInput(''); setCodeError(''); }}>
          <div style={S.codeModal} onClick={(e) => e.stopPropagation()}>
            <div style={S.codeModalHeader}>
              <span style={{ fontSize: 28 }}>🔑</span>
              <div>
                <p style={S.codeModalTitle}>입장 코드로 강의 찾기</p>
                <p style={S.codeModalSub}>강사에게 받은 6자리 코드를 입력하세요</p>
              </div>
              <button style={S.closeBtn} onClick={() => { setAccessCodeMode(false); setFoundCourse(null); }}>✕</button>
            </div>

            <form onSubmit={handleCodeSearch} style={{ padding: '16px 20px' }}>
              <div style={S.codeInputRow}>
                <input
                  value={codeInput}
                  onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(''); setFoundCourse(null); }}
                  placeholder="ABCD12"
                  maxLength={6}
                  style={S.codeInput}
                  autoFocus
                />
                <button type="submit" style={S.codeSearchBtn} disabled={codeLoading}>
                  {codeLoading ? '…' : '검색'}
                </button>
              </div>
              {codeError && <p style={{ fontSize: 12, color: D.danger, marginTop: 6 }}>⚠ {codeError}</p>}
            </form>

            {/* 검색 결과 */}
            {foundCourse && (
              <div style={S.codeResult}>
                <div style={S.codeResultCard}>
                  <div style={S.codeResultInfo}>
                    <p style={S.codeResultTitle}>{foundCourse.title}</p>
                    <p style={S.codeResultSub}>{foundCourse.instructorName} · {foundCourse.category}</p>
                  </div>
                  <button
                    style={S.codeEnterBtn}
                    onClick={() => {
                      setAccessCodeMode(false);
                      setSelectedCourse({
                        id:            foundCourse.id,
                        courseTitle:   foundCourse.title,
                        instructorName: foundCourse.instructorName,
                        courseCategory: foundCourse.category,
                        sessionType:   foundCourse.sessionType,
                        enrolledCount: foundCourse.enrolledCount,
                        hasPassword:   foundCourse.hasPassword,
                      });
                    }}
                  >
                    입장 →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 강의 카드 ─────────────────────────────────────────────────────
function CourseCard({ enrollment: e, onClick }) {
  const isLive     = e.sessionType === 'LIVE';
  const hasDeadline = e.upcomingDeadlineCount > 0;

  return (
    <div style={S.card} onClick={onClick}>
      {/* 썸네일 */}
      <div style={{
        ...S.thumb,
        background: e.courseThumbnailUrl ? `url(${e.courseThumbnailUrl}) center/cover` : '#312e81',
      }}>
        <span style={{ ...S.sessionBadge, background: isLive ? D.danger : '#1e3a8a' }}>
          {isLive ? '🔴 LIVE' : '🎬 VOD'}
        </span>
        {e.hasPassword && <span style={S.lockBadge}>🔒</span>}
      </div>

      {/* 카드 바디 */}
      <div style={S.cardBody}>
        <div style={S.cardMeta}>
          {e.courseCategory && <span style={S.categoryBadge}>{e.courseCategory}</span>}
          {hasDeadline && (
            <span style={S.deadlineBadge}>
              ⚠ 마감 {e.upcomingDeadlineCount}건
            </span>
          )}
        </div>
        <p style={S.cardTitle}>{e.courseTitle}</p>
        <p style={S.cardInstructor}>👤 {e.instructorName}</p>

        {/* 진행률 바 */}
        <div style={S.progressWrap}>
          <div style={S.progressBar}>
            <div style={{ ...S.progressFill, width: `${e.progressPercent ?? 0}%` }} />
          </div>
          <span style={S.progressText}>{e.progressPercent ?? 0}%</span>
        </div>

        {/* 몰입도 */}
        {e.cumulativeFocusScore != null && (
          <p style={S.focusLine}>
            🎯 평균 몰입도: <strong style={{ color: focusColor(e.cumulativeFocusScore) }}>
              {Math.round(e.cumulativeFocusScore)}점
            </strong>
          </p>
        )}
      </div>

      <div style={S.enterBtn}>입장하기 →</div>
    </div>
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div style={S.miniStat}>
      <p style={S.miniStatLabel}>{label}</p>
      <p style={{ ...S.miniStatValue, color: accent ? D.accent : D.text }}>{value}</p>
    </div>
  );
}

const focusColor = (s) =>
  s >= 80 ? D.success : s >= 60 ? '#a3e635' : s >= 40 ? D.warning : D.danger;

// ── 스타일 ──────────────────────────────────────────────────────
const D_alias = D; // 클로저 접근용
const S = {
  page: { background: D.bg, minHeight: '100vh', color: D.text, padding: '28px 32px' },

  hero: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 16, marginBottom: 32,
    background: D.surface, borderRadius: 16, padding: '24px 28px',
    border: `1px solid ${D.border}`,
  },
  greeting: { margin: 0, fontSize: 22, fontWeight: 800, color: D.text },
  heroSub:  { margin: '4px 0 0', fontSize: 13, color: D.muted },
  heroStats: { display: 'flex', gap: 16 },
  miniStat:  { textAlign: 'center' },
  miniStatLabel: { margin: 0, fontSize: 11, color: D.muted, fontWeight: 600 },
  miniStatValue: { margin: '4px 0 0', fontSize: 20, fontWeight: 900 },

  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sectionTitle:  { margin: 0, fontSize: 18, fontWeight: 800, color: D.text },
  sectionSub:    { margin: '4px 0 0', fontSize: 12, color: D.muted },
  codeBtn: {
    padding: '9px 18px', borderRadius: 8, background: '#1e3a5f',
    border: `1px solid #3b82f6`, color: '#93c5fd', fontSize: 13,
    fontWeight: 700, cursor: 'pointer',
  },

  grid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  card:  {
    background: D.surface, border: `1px solid ${D.border}`,
    borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
    transition: 'transform .15s, border-color .15s',
    display: 'flex', flexDirection: 'column',
  },
  thumb: {
    height: 140, position: 'relative',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 10,
  },
  sessionBadge: { padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, color: '#fff' },
  lockBadge:    { fontSize: 14 },

  cardBody:     { padding: '14px 16px', flex: 1 },
  cardMeta:     { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  categoryBadge: {
    padding: '2px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700,
    background: D.accentBg, color: '#a5b4fc',
  },
  deadlineBadge: {
    padding: '2px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700,
    background: '#7f1d1d', color: D.danger,
  },
  cardTitle:      { margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: D.text },
  cardInstructor: { margin: '0 0 10px', fontSize: 12, color: D.muted },

  progressWrap: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  progressBar:  { flex: 1, height: 5, background: '#334155', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', background: D.accent, borderRadius: 999, transition: 'width .3s' },
  progressText: { fontSize: 11, color: D.muted, fontWeight: 700, flexShrink: 0 },
  focusLine:    { margin: 0, fontSize: 12, color: D.muted },

  enterBtn: {
    padding: '10px 16px', background: '#1e1b4b',
    color: '#a5b4fc', fontSize: 13, fontWeight: 700,
    textAlign: 'right', borderTop: `1px solid ${D.border}`,
  },

  empty: {
    textAlign: 'center', padding: '80px 20px',
    background: D.surface, borderRadius: 16, border: `1px solid ${D.border}`,
  },
  emptyTitle: { fontSize: 18, fontWeight: 800, color: D.text, margin: '12px 0 6px' },
  emptySub:   { fontSize: 13, color: D.muted, margin: '0 0 24px' },
  emptyBtn:   {
    padding: '10px 24px', borderRadius: 8, background: D.accent,
    border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },

  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, backdropFilter: 'blur(4px)',
  },
  codeModal: {
    background: D.surface, border: `1px solid ${D.border}`,
    borderRadius: 16, width: 400, maxWidth: 'calc(100vw - 32px)',
    boxShadow: '0 24px 48px rgba(0,0,0,.6)', overflow: 'hidden',
  },
  codeModalHeader: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '20px 20px 14px', borderBottom: `1px solid ${D.border}`,
  },
  codeModalTitle: { margin: 0, fontSize: 16, fontWeight: 800, color: D.text },
  codeModalSub:   { margin: '2px 0 0', fontSize: 12, color: D.muted },
  closeBtn: { marginLeft: 'auto', background: 'none', border: 'none', color: D.muted, fontSize: 18, cursor: 'pointer' },

  codeInputRow: { display: 'flex', gap: 8 },
  codeInput: {
    flex: 1, padding: '10px 14px', borderRadius: 8,
    background: D.bg, border: `1.5px solid ${D.border}`,
    color: D.text, fontSize: 18, fontWeight: 800, letterSpacing: 4,
    textAlign: 'center', outline: 'none', textTransform: 'uppercase',
  },
  codeSearchBtn: {
    padding: '10px 20px', borderRadius: 8, background: D.accent,
    border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
  },
  codeResult:     { padding: '0 20px 20px' },
  codeResultCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: D.bg, border: `1px solid ${D.border}`,
    borderRadius: 10, padding: '12px 14px',
  },
  codeResultInfo:  { flex: 1 },
  codeResultTitle: { margin: 0, fontSize: 14, fontWeight: 800, color: D.text },
  codeResultSub:   { margin: '2px 0 0', fontSize: 12, color: D.muted },
  codeEnterBtn: {
    padding: '8px 18px', borderRadius: 8, background: D.accent,
    border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
};
