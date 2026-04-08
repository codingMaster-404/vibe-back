/**
 * App.jsx — 비이브(Vibe) 앱 루트 라우터
 *
 * 라우트 구조:
 *   /                → redirect → /dashboard
 *   /dashboard       → Dashboard        (주간 학습 통계 + 몰입도 트렌드)
 *   /hub             → LearningHubPage  (강의 목록 · 수강 신청)
 *   /courses/:id     → CourseDetailPage (시간표 · VOD · 과제 탭)
 *   /study/vod       → VodStudyPage     (AI 캠 VOD 학습)
 *   /study/live      → LiveClassroomPage (실시간 강의실)
 */

import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';

import Dashboard        from './pages/Dashboard';
import LearningHubPage  from './pages/LearningHubPage';
import CourseDetailPage from './pages/CourseDetailPage';
import VodStudyPage     from './pages/VodStudyPage';
import LiveClassroomPage from './pages/LiveClassroomPage';

export default function App() {
  return (
    <BrowserRouter>
      {/* ── 글로벌 내비게이션 ── */}
      <GlobalNav />

      {/* ── 라우트 ── */}
      <main style={{ minHeight: 'calc(100vh - 56px)', background: '#f8faff' }}>
        <Routes>
          <Route path="/"              element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/hub"           element={<LearningHubPage />} />
          <Route path="/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="/study/vod"     element={<VodStudyPage />} />
          <Route path="/study/live"    element={<LiveClassroomPage />} />
          <Route path="*"              element={<NotFound />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

// ── 내비게이션 바 ───────────────────────────────────────────────
function GlobalNav() {
  const linkStyle = ({ isActive }) => ({
    ...S.navLink,
    ...(isActive ? S.navLinkActive : {}),
  });

  return (
    <nav style={S.nav}>
      <div style={S.navInner}>
        {/* 로고 */}
        <NavLink to="/dashboard" style={{ textDecoration: 'none' }}>
          <span style={S.logo}>🎓 Vibe</span>
        </NavLink>

        {/* 메뉴 */}
        <div style={S.menu}>
          <NavLink to="/dashboard" style={linkStyle}>📊 대시보드</NavLink>
          <NavLink to="/hub"       style={linkStyle}>📚 학습 허브</NavLink>
          <NavLink to="/study/vod" style={linkStyle}>🎬 VOD 학습</NavLink>
          <NavLink to="/study/live" style={linkStyle}>📡 실시간 강의</NavLink>
        </div>

        {/* 사용자 뱃지 (하드코딩 임시) */}
        <div style={S.userBadge}>👤 수강생 #1</div>
      </div>
    </nav>
  );
}

// ── 404 페이지 ──────────────────────────────────────────────────
function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <p style={{ fontSize: 64 }}>🔍</p>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
        페이지를 찾을 수 없어요
      </h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        주소를 확인하거나 아래 버튼으로 돌아가세요.
      </p>
      <a href="/dashboard" style={{
        padding: '10px 24px', background: '#6366f1', color: '#fff',
        borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none',
      }}>
        대시보드로 이동
      </a>
    </div>
  );
}

// ── 스타일 ──────────────────────────────────────────────────────
const S = {
  nav: {
    height: 56, background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky', top: 0, zIndex: 100,
    boxShadow: '0 1px 4px rgba(0,0,0,.06)',
  },
  navInner: {
    maxWidth: 1200, margin: '0 auto', height: '100%',
    display: 'flex', alignItems: 'center', gap: 24, padding: '0 20px',
  },
  logo: {
    fontSize: 20, fontWeight: 900, color: '#6366f1',
    letterSpacing: -0.5, fontFamily: "'Pretendard', sans-serif",
  },
  menu: { display: 'flex', gap: 4, flex: 1 },
  navLink: {
    padding: '6px 14px', borderRadius: 8,
    fontSize: 13, fontWeight: 600, color: '#6b7280',
    textDecoration: 'none', transition: 'all .15s',
  },
  navLinkActive: {
    background: '#eef2ff', color: '#6366f1',
  },
  userBadge: {
    padding: '5px 14px', background: '#f3f4f6', borderRadius: 999,
    fontSize: 12, fontWeight: 600, color: '#374151',
  },
};
