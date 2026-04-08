/**
 * LearningHubPage.jsx — 통합 학습 허브 (메인 강의 대시보드)
 *
 * 왼쪽 사이드바: 내 수강 강의 리스트
 * 오른쪽 메인:   선택된 강의의 시간표·VOD·과제 탭 레이아웃
 * 하단:          최근 몰입도 요약 카드
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCourseStore from '../store/useCourseStore';

const CURRENT_USER_ID = 1;

const CATEGORY_COLOR = {
  '컴퓨터과학': '#6366f1',
  '데이터분석': '#22c55e',
  '디자인':     '#f59e0b',
  '비즈니스':   '#ef4444',
  default:      '#9ca3af',
};

export default function LearningHubPage() {
  const navigate = useNavigate();
  const {
    myCourses, courses, focusLogs,
    isLoading, error,
    fetchMyCourses, fetchAllCourses, fetchFocusLogs,
    enroll,
  } = useCourseStore();

  const [tab, setTab] = useState('my');   // 'my' | 'all'
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    fetchMyCourses(CURRENT_USER_ID);
    fetchAllCourses();
    fetchFocusLogs(CURRENT_USER_ID);
  }, [fetchMyCourses, fetchAllCourses, fetchFocusLogs]);

  const displayCourses = (tab === 'my' ? myCourses : courses)
    .filter((c) => c.title.includes(searchQ) || (c.instructorName ?? '').includes(searchQ));

  const todayFocusAvg = (() => {
    const today = new Date().toDateString();
    const todayLogs = focusLogs.filter((l) => new Date(l.sessionDate).toDateString() === today);
    if (!todayLogs.length) return null;
    return Math.round(todayLogs.reduce((s, l) => s + l.overallScore, 0) / todayLogs.length);
  })();

  if (isLoading && !myCourses.length) return <div style={S.center}>불러오는 중…</div>;
  if (error) return <div style={S.center}>⚠️ {error}</div>;

  return (
    <div style={S.page}>

      {/* ── 헤더 ── */}
      <header style={S.header}>
        <div>
          <h1 style={S.title}>📚 Learning Hub</h1>
          <p style={S.sub}>모든 학습을 한 곳에서</p>
        </div>
        <div style={S.headerRight}>
          {todayFocusAvg != null && (
            <div style={S.focusBadge}>
              🔥 오늘 평균 몰입도 <strong>{todayFocusAvg}점</strong>
            </div>
          )}
          <a href="/study/live" style={S.liveBtn}>📡 실시간 강의실 입장</a>
        </div>
      </header>

      {/* ── 탭 + 검색 ── */}
      <div style={S.toolbar}>
        <div style={S.tabs}>
          <button style={tab === 'my'  ? S.tabActive : S.tab} onClick={() => setTab('my')}>
            내 강의 ({myCourses.length})
          </button>
          <button style={tab === 'all' ? S.tabActive : S.tab} onClick={() => setTab('all')}>
            전체 강의 ({courses.length})
          </button>
        </div>
        <input
          style={S.search}
          placeholder="🔍 강의명·강사명 검색"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
      </div>

      {/* ── 강의 그리드 ── */}
      {displayCourses.length === 0 ? (
        <div style={S.empty}>
          <p style={{ fontSize: 40 }}>📭</p>
          <p style={{ fontWeight: 600, color: '#374151' }}>
            {tab === 'my' ? '수강 중인 강의가 없습니다.' : '조건에 맞는 강의가 없습니다.'}
          </p>
          {tab === 'my' && (
            <button style={S.btnPrimary} onClick={() => setTab('all')}>전체 강의 보기</button>
          )}
        </div>
      ) : (
        <div style={S.grid}>
          {displayCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isEnrolled={myCourses.some((c) => c.id === course.id)}
              onEnter={() => navigate(`/courses/${course.id}`)}
              onEnroll={() => enroll(course.id, CURRENT_USER_ID)}
            />
          ))}
        </div>
      )}

      {/* ── 최근 몰입도 요약 ── */}
      {focusLogs.length > 0 && (
        <section style={S.focusSection}>
          <h2 style={S.sectionTitle}>🔥 최근 학습 몰입도</h2>
          <div style={S.focusRow}>
            {focusLogs.slice(0, 5).map((log) => (
              <div key={log.id} style={S.focusCard}>
                <p style={S.focusScore(log.overallScore)}>{log.overallScore.toFixed(0)}점</p>
                <p style={S.focusCourse}>{log.courseTitle ?? '일반 학습'}</p>
                <p style={S.focusDate}>{new Date(log.sessionDate).toLocaleDateString('ko-KR')}</p>
                <p style={S.focusType}>{log.sessionType === 'LIVE' ? '📡 실시간' : '🎬 VOD'}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── 강의 카드 컴포넌트 ───────────────────────────────────────────
function CourseCard({ course, isEnrolled, onEnter, onEnroll }) {
  const catColor = CATEGORY_COLOR[course.category] ?? CATEGORY_COLOR.default;
  return (
    <div style={S.card}>
      {/* 썸네일 */}
      <div style={{ ...S.thumbnail, background: catColor + '22' }}>
        {course.thumbnailUrl
          ? <img src={course.thumbnailUrl} alt="" style={S.thumbImg} />
          : <span style={{ fontSize: 40 }}>📖</span>
        }
      </div>

      {/* 배지 */}
      {course.category && (
        <span style={{ ...S.badge, background: catColor + '22', color: catColor }}>
          {course.category}
        </span>
      )}

      {/* 내용 */}
      <div style={S.cardBody}>
        <h3 style={S.cardTitle}>{course.title}</h3>
        <p style={S.cardInstructor}>👨‍🏫 {course.instructorName}</p>
        {course.schedule && <p style={S.cardSchedule}>🗓 {course.schedule}</p>}
        <p style={S.cardMeta}>수강생 {course.enrolledCount}명</p>
      </div>

      {/* 버튼 */}
      <div style={S.cardFooter}>
        {isEnrolled ? (
          <button style={S.btnEnter} onClick={onEnter}>강의실 입장 →</button>
        ) : (
          <button style={S.btnEnroll} onClick={onEnroll}>수강 신청</button>
        )}
      </div>
    </div>
  );
}

// ── 스타일 ──────────────────────────────────────────────────────
const S = {
  page:   { maxWidth: 1200, margin: '0 auto', padding: '28px 20px', fontFamily: "'Pretendard', sans-serif" },
  center: { textAlign: 'center', marginTop: 80, fontSize: 16, color: '#6b7280' },

  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title:       { fontSize: 28, fontWeight: 800, margin: 0, color: '#111827' },
  sub:         { margin: '4px 0 0', color: '#9ca3af', fontSize: 14 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  focusBadge:  { padding: '8px 16px', background: '#eef2ff', borderRadius: 999, fontSize: 13, color: '#6366f1', fontWeight: 600 },
  liveBtn:     { padding: '10px 18px', background: '#ef4444', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' },

  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 },
  tabs:    { display: 'flex', gap: 4 },
  tab:     { padding: '8px 18px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 500, fontSize: 14, color: '#6b7280' },
  tabActive:{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #6366f1', background: '#6366f1', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: '#fff' },
  search:  { flex: 1, maxWidth: 320, padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' },

  grid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 40 },
  empty: { textAlign: 'center', padding: '60px 0', color: '#9ca3af' },

  // 카드
  card:        { background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  thumbnail:   { height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  thumbImg:    { width: '100%', height: '100%', objectFit: 'cover' },
  badge:       { margin: '12px 16px 0', display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 },
  cardBody:    { padding: '10px 16px', flex: 1 },
  cardTitle:   { margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#111827' },
  cardInstructor: { margin: '0 0 4px', fontSize: 13, color: '#6b7280' },
  cardSchedule:   { margin: '0 0 4px', fontSize: 12, color: '#9ca3af' },
  cardMeta:    { margin: 0, fontSize: 11, color: '#d1d5db' },
  cardFooter:  { padding: '12px 16px', borderTop: '1px solid #f3f4f6' },
  btnEnter:    { width: '100%', padding: '9px 0', borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  btnEnroll:   { width: '100%', padding: '9px 0', borderRadius: 8, background: '#f3f4f6', color: '#374151', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' },

  // 몰입도 섹션
  focusSection: { borderTop: '1px solid #f3f4f6', paddingTop: 28 },
  sectionTitle: { margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#111827' },
  focusRow:     { display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 },
  focusCard:    { minWidth: 140, background: '#fff', borderRadius: 12, padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', textAlign: 'center', flexShrink: 0 },
  focusScore:   (score) => ({
    margin: '0 0 6px', fontSize: 28, fontWeight: 800,
    color: score >= 80 ? '#6366f1' : score >= 60 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444',
  }),
  focusCourse: { margin: '0 0 4px', fontSize: 12, color: '#374151', fontWeight: 600 },
  focusDate:   { margin: '0 0 4px', fontSize: 11, color: '#9ca3af' },
  focusType:   { margin: 0, fontSize: 11, color: '#9ca3af' },

  btnPrimary: { marginTop: 16, padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' },
};
