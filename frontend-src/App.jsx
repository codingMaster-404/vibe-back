/**
 * App.jsx — Vibe 플랫폼 루트 (다크 레이아웃 + Role 기반 라우팅)
 *
 * 3-way 라우팅:
 *   /admin/**              → 운영자 포털 (AdminTokenFilter JWT 검증)
 *   /login                 → 사용자 로그인 (STUDENT / INSTRUCTOR)
 *   /*                     → 사이드바 앱 레이아웃 (STUDENT / INSTRUCTOR)
 *
 * 역할별 기본 경로:
 *   ADMIN      → /admin/dashboard
 *   INSTRUCTOR → /instructor
 *   STUDENT    → /student
 *
 * 라우트 목록 (사용자 앱):
 *   /instructor           InstructorDashboard
 *   /student              StudentDashboard
 *   /dashboard            Dashboard (학습 통계)
 *   /hub                  LearningHubPage
 *   /courses/:courseId    CourseDetailPage
 *   /study/vod            VodStudyPage
 *   /study/live           LiveClassroomPage
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';

import useUserStore      from './store/useUserStore';
import useEnrollmentStore from './store/useEnrollmentStore';
import useCourseStore    from './store/useCourseStore';
import useAdminAuthStore from './store/useAdminAuthStore';

import InstructorDashboard from './pages/InstructorDashboard';
import StudentDashboard    from './pages/StudentDashboard';
import Dashboard           from './pages/Dashboard';
import LearningHubPage     from './pages/LearningHubPage';
import CourseDetailPage    from './pages/CourseDetailPage';
import VodStudyPage        from './pages/VodStudyPage';
import LiveClassroomPage   from './pages/LiveClassroomPage';
import AdminLoginPage      from './pages/AdminLoginPage';

const CURRENT_USER_ID = 1; // TODO: 실제 세션 연동 시 교체

const D = {
  bg:       '#0f172a', surface:  '#1e293b',
  border:   '#334155', text:     '#f1f5f9', muted: '#94a3b8',
  accent:   '#6366f1', accentBg: '#312e81',
  success:  '#22c55e', danger:   '#ef4444', warning: '#f59e0b',
};

// ── 앱 루트 ────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

/**
 * 최상위 라우터 — 운영자 / 일반 사용자 경로 분기.
 *
 * /admin/** 는 AdminPortal 렌더 (사이드바 없음, 어드민 레이아웃)
 * 나머지는 AppLayout 렌더 (기존 사이드바 레이아웃)
 */
function AppRouter() {
  const { isAdminAuth } = useAdminAuthStore();

  return (
    <Routes>
      {/* ── 운영자 포털 ── */}
      <Route path="/admin/login"     element={<AdminLoginPage />} />
      <Route path="/admin/*"         element={
        isAdminAuth
          ? <AdminPortal />
          : <Navigate to="/admin/login" replace />
      } />

      {/* ── 일반 사용자 앱 ── */}
      <Route path="/*" element={<AppLayout />} />
    </Routes>
  );
}

/**
 * 운영자 포털 래퍼.
 * 현재는 빈 대시보드 플레이스홀더; 향후 AdminDashboard 컴포넌트로 교체.
 */
function AdminPortal() {
  const { adminUser, adminLogout } = useAdminAuthStore();

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa',
                  fontFamily: "'Inter', 'Noto Sans KR', sans-serif" }}>
      {/* 어드민 상단 바 */}
      <header style={{
        height: 52, background: '#18181b',
        borderBottom: '1px solid #3f3f46',
        display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 12,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: '#dc2626' }}>🔐 Vibe Admin</span>
        <span style={{ flex: 1 }} />
        {adminUser && (
          <span style={{ fontSize: 13, color: '#a1a1aa' }}>
            {adminUser.nickname} ({adminUser.email})
          </span>
        )}
        <button
          onClick={adminLogout}
          style={{
            padding: '5px 14px', background: '#450a0a',
            border: '1px solid #dc2626', color: '#fca5a5',
            borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          로그아웃
        </button>
      </header>

      {/* 콘텐츠 영역 */}
      <main style={{ padding: 32 }}>
        <Routes>
          <Route path="dashboard" element={<AdminDashboardPlaceholder adminUser={adminUser} />} />
          <Route path="*"         element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

/** 어드민 대시보드 플레이스홀더 (향후 AdminDashboardPage 로 교체) */
function AdminDashboardPlaceholder({ adminUser }) {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fafafa', marginBottom: 8 }}>
        운영자 대시보드
      </h1>
      <p style={{ color: '#a1a1aa', marginBottom: 32 }}>
        안녕하세요, <strong style={{ color: '#dc2626' }}>{adminUser?.nickname ?? '운영자'}</strong>님.
      </p>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
      }}>
        {[
          { icon: '👥', label: '전체 사용자', value: '—' },
          { icon: '📚', label: '전체 강의',   value: '—' },
          { icon: '📋', label: '수강 신청',   value: '—' },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{
            background: '#18181b', border: '1px solid #3f3f46',
            borderRadius: 12, padding: '20px 24px',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fafafa' }}>{value}</div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 40, fontSize: 12, color: '#52525b' }}>
        ℹ 상세 기능(사용자 관리 · 강의 생성 · CSV 일괄 등록)은 순차적으로 추가됩니다.
      </p>
    </div>
  );
}

// ── 메인 레이아웃 ──────────────────────────────────────────────────
function AppLayout() {
  const { user, fetchUser } = useUserStore();
  const { fetchMyEnrollments } = useEnrollmentStore();
  const { fetchInstructorCourses } = useCourseStore();

  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [accessCodeOpen, setAccessCodeOpen]     = useState(false);

  useEffect(() => {
    fetchUser(CURRENT_USER_ID);
  }, []);

  /* 역할별 강의 목록: 강사 → 개설 강의 API, 수강생 → 내 수강 API (대시보드 통계는 InstructorDashboard에서 별도 로드) */
  useEffect(() => {
    if (!user) return;
    if (user.role === 'INSTRUCTOR') fetchInstructorCourses(user.id);
    else fetchMyEnrollments(user.id);
  }, [user]);

  const isInstructor = user?.role === 'INSTRUCTOR';
  const defaultPath  = isInstructor ? '/instructor' : '/student';

  return (
    <div style={S.appWrap}>
      {/* ── 사이드바 ── */}
      <Sidebar
        user={user}
        isInstructor={isInstructor}
        onOpenCreateCourse={() => setCreateCourseOpen(true)}
        onOpenAccessCode={() => setAccessCodeOpen(true)}
      />

      {/* ── 메인 콘텐츠 ── */}
      <div style={S.mainArea}>
        {/* 상단 헤더 바 */}
        <TopBar user={user} />

        <div style={S.content}>
          <Routes>
            <Route path="/"              element={<Navigate to={defaultPath} replace />} />
            <Route path="/instructor"    element={<InstructorDashboard />} />
            <Route path="/student"       element={<StudentDashboard />} />
            <Route path="/dashboard"     element={<Dashboard />} />
            <Route path="/hub"           element={<LearningHubPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />
            <Route path="/study/vod"     element={<VodStudyPage />} />
            <Route path="/study/live"    element={<LiveClassroomPage />} />
            <Route path="*"              element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// ── 사이드바 ───────────────────────────────────────────────────────
function Sidebar({ user, isInstructor, onOpenCreateCourse, onOpenAccessCode }) {
  const { myEnrollments } = useEnrollmentStore();
  const { courses }       = useCourseStore();
  const navigate          = useNavigate();

  const navLink = ({ isActive }) => ({
    ...S.navLink,
    background: isActive ? D.accentBg : 'transparent',
    color:      isActive ? '#a5b4fc'  : D.muted,
  });

  return (
    <aside style={S.sidebar}>
      {/* 로고 */}
      <div style={S.logoWrap}>
        <span style={S.logo}>🎓 Vibe</span>
        <span style={{
          ...S.roleBadge,
          background: isInstructor ? D.accentBg : '#064e3b',
          color:      isInstructor ? '#a5b4fc'  : '#6ee7b7',
        }}>
          {isInstructor ? '강사' : '수강생'}
        </span>
      </div>

      {/* 역할별 액션 버튼 */}
      <div style={S.actionArea}>
        {isInstructor ? (
          <button style={S.actionBtn} onClick={onOpenCreateCourse}>
            ＋ 강의 개설
          </button>
        ) : (
          <button style={{ ...S.actionBtn, background: '#1e3a5f', borderColor: '#3b82f6', color: '#93c5fd' }}
                  onClick={onOpenAccessCode}>
            🔑 입장 코드로 강의 찾기
          </button>
        )}
      </div>

      {/* 내비게이션 */}
      <nav style={S.nav}>
        <p style={S.navSection}>메뉴</p>
        <NavLink to={isInstructor ? '/instructor' : '/student'} style={navLink}>
          <span style={S.navIcon}>🏠</span> 대시보드
        </NavLink>
        <NavLink to="/dashboard" style={navLink}>
          <span style={S.navIcon}>📊</span> 학습 통계
        </NavLink>
        {!isInstructor && (
          <NavLink to="/hub" style={navLink}>
            <span style={S.navIcon}>📚</span> 전체 강의
          </NavLink>
        )}
        <NavLink to="/study/vod" style={navLink}>
          <span style={S.navIcon}>🎬</span> VOD 학습
        </NavLink>
        <NavLink to="/study/live" style={navLink}>
          <span style={S.navIcon}>📡</span> 실시간 강의
        </NavLink>
      </nav>

      {/* 강의 목록 */}
      <div style={S.courseSection}>
        <p style={S.navSection}>
          {isInstructor ? '내가 개설한 강의' : '수강 중인 강의'}
        </p>

        {isInstructor
          ? (courses ?? []).map((c) => (
              <button key={c.id} style={S.courseItem} onClick={() => navigate(`/courses/${c.id}`)}>
                <span style={S.cdot(c.sessionType === 'LIVE' ? D.danger : D.success)} />
                <span style={S.cname}>{c.title}</span>
                {c.pendingSubmissionsCount > 0 && (
                  <span style={S.badge}>{c.pendingSubmissionsCount}</span>
                )}
              </button>
            ))
          : (myEnrollments ?? []).map((e) => (
              <button key={e.id} style={S.courseItem} onClick={() => navigate(`/courses/${e.courseId}`)}>
                <span style={S.cdot(e.sessionType === 'LIVE' ? D.danger : D.success)} />
                <span style={S.cname}>{e.courseTitle}</span>
                {e.upcomingDeadlineCount > 0 && (
                  <span style={{ ...S.cdot(D.danger), flexShrink: 0 }} title="마감 임박 과제" />
                )}
              </button>
            ))
        }

        {((isInstructor ? courses : myEnrollments) ?? []).length === 0 && (
          <p style={S.emptyList}>{isInstructor ? '개설된 강의 없음' : '수강 중인 강의 없음'}</p>
        )}
      </div>

      {/* 하단 유저 정보 */}
      {user && (
        <div style={S.userInfo}>
          <div style={S.avatar}>{user.nickname?.slice(0, 1) ?? '?'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={S.userName}>{user.nickname}</p>
            <p style={S.userEmail}>{user.email}</p>
          </div>
        </div>
      )}
    </aside>
  );
}

// ── 상단 바 ────────────────────────────────────────────────────────
function TopBar({ user }) {
  return (
    <header style={S.topBar}>
      <div style={S.topBarTitle}>Vibe 통합 학습 플랫폼</div>
      <div style={S.topBarRight}>
        {user && (
          <span style={S.topBarUser}>
            <span style={S.topBarDot} />
            {user.nickname}
          </span>
        )}
      </div>
    </header>
  );
}

// ── 404 ────────────────────────────────────────────────────────────
function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: D.text }}>
      <p style={{ fontSize: 60 }}>🔍</p>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>페이지를 찾을 수 없어요</h2>
      <p style={{ color: D.muted, marginBottom: 24 }}>주소를 확인하거나 대시보드로 돌아가세요.</p>
      <a href="/" style={{
        padding: '10px 24px', background: D.accent, color: '#fff',
        borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none',
      }}>
        홈으로
      </a>
    </div>
  );
}

// ── 스타일 ──────────────────────────────────────────────────────
const S = {
  appWrap:  { display: 'flex', minHeight: '100vh', background: D.bg },

  sidebar: {
    width: 240, minHeight: '100vh', background: '#080f1e',
    borderRight: `1px solid ${D.border}`,
    display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, zIndex: 50,
    overflowY: 'auto',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '18px 16px 14px',
    borderBottom: `1px solid ${D.border}`,
  },
  logo:     { fontSize: 20, fontWeight: 900, color: '#818cf8', flex: 1, letterSpacing: -0.5 },
  roleBadge:{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700 },

  actionArea: { padding: '12px 10px 4px' },
  actionBtn: {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    background: D.accentBg, border: `1px solid ${D.accent}`,
    color: '#a5b4fc', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    gap: 6, justifyContent: 'center',
  },

  nav:        { padding: '6px 8px 0' },
  navSection: {
    margin: '10px 8px 4px', fontSize: 10, fontWeight: 700,
    color: D.muted, letterSpacing: 1, textTransform: 'uppercase',
  },
  navLink: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 10px', borderRadius: 7, margin: '1px 0',
    fontSize: 12, fontWeight: 600, textDecoration: 'none',
    transition: 'all .12s',
  },
  navIcon: { width: 18, textAlign: 'center', fontSize: 14 },

  courseSection: { flex: 1, padding: '4px 8px', overflowY: 'auto' },
  courseItem: {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '6px 10px', borderRadius: 7, width: '100%',
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: D.muted, fontSize: 12, textAlign: 'left',
    transition: 'background .12s',
  },
  cname:     { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#cbd5e1' },
  cdot:      (color) => ({ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }),
  badge:     {
    background: D.danger, color: '#fff', borderRadius: 999,
    fontSize: 10, fontWeight: 800, padding: '1px 6px',
    flexShrink: 0, minWidth: 18, textAlign: 'center',
  },
  emptyList: { fontSize: 11, color: D.muted, textAlign: 'center', padding: '12px 0' },

  userInfo: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '12px 14px', borderTop: `1px solid ${D.border}`, marginTop: 'auto',
  },
  avatar:    {
    width: 30, height: 30, borderRadius: '50%',
    background: D.accentBg, color: '#a5b4fc',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 800, flexShrink: 0,
  },
  userName:  { margin: 0, fontSize: 12, fontWeight: 700, color: D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userEmail: { margin: 0, fontSize: 10, color: D.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  mainArea:  { marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' },

  topBar: {
    height: 50, background: '#080f1e', borderBottom: `1px solid ${D.border}`,
    display: 'flex', alignItems: 'center', padding: '0 24px',
    position: 'sticky', top: 0, zIndex: 40,
    justifyContent: 'space-between',
  },
  topBarTitle: { fontSize: 14, fontWeight: 700, color: D.muted },
  topBarRight: { display: 'flex', alignItems: 'center', gap: 12 },
  topBarUser:  { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: D.text, fontWeight: 600 },
  topBarDot:   { width: 7, height: 7, borderRadius: '50%', background: D.success },

  content: { flex: 1 },
};
