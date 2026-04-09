/**
 * Sidebar.jsx — 역할(Role) 기반 다크 사이드바
 *
 * INSTRUCTOR 역할:
 *   - [+ 강의 개설] 버튼
 *   - 내가 개설한 강의 목록 (채점 대기 알림 배지)
 *
 * STUDENT 역할:
 *   - [입장 코드로 강의 찾기] 버튼
 *   - 수강 중인 강의 목록 (마감 임박 과제 빨간 포인트)
 */

import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useUserStore from '../store/useUserStore';
import useEnrollmentStore from '../store/useEnrollmentStore';
import useCourseStore from '../store/useCourseStore';

const CURRENT_USER_ID = 1; // TODO: 실제 인증 연동 시 교체

// ── 색상 상수 ────────────────────────────────────────────────────
const D = {
  bg:        '#0f172a',
  surface:   '#1e293b',
  surfaceHover: '#263348',
  border:    '#334155',
  text:      '#f1f5f9',
  muted:     '#94a3b8',
  accent:    '#6366f1',
  accentBg:  '#312e81',
  success:   '#22c55e',
  warning:   '#f59e0b',
  danger:    '#ef4444',
};

export default function Sidebar({ onOpenCreateCourse, onOpenAccessCode }) {
  const navigate   = useNavigate();
  const { user }   = useUserStore();
  const { myEnrollments, fetchMyEnrollments } = useEnrollmentStore();
  const { courses: instructorCourses, fetchInstructorCourses } = useCourseStore();

  const isInstructor = user?.role === 'INSTRUCTOR';

  useEffect(() => {
    if (!user) return;
    if (isInstructor) {
      fetchInstructorCourses(user.id);
    } else {
      fetchMyEnrollments(user.id);
    }
  }, [user, isInstructor]);

  return (
    <aside style={S.sidebar}>
      {/* ── 로고 ── */}
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

      {/* ── 역할별 주요 액션 버튼 ── */}
      <div style={S.actionArea}>
        {isInstructor ? (
          <button style={S.actionBtn} onClick={onOpenCreateCourse}>
            <span style={{ fontSize: 16 }}>＋</span> 강의 개설
          </button>
        ) : (
          <button style={{ ...S.actionBtn, background: '#1e3a5f', borderColor: '#3b82f6' }}
                  onClick={onOpenAccessCode}>
            🔑 입장 코드로 강의 찾기
          </button>
        )}
      </div>

      {/* ── 내비게이션 공통 링크 ── */}
      <nav style={S.nav}>
        <p style={S.navLabel}>메뉴</p>
        <SideNavLink to={isInstructor ? '/instructor' : '/student'} icon="🏠" label="대시보드" />
        <SideNavLink to="/dashboard"  icon="📊" label="학습 통계" />
        {!isInstructor && <SideNavLink to="/hub" icon="📚" label="전체 강의" />}
        <SideNavLink to="/study/vod"  icon="🎬" label="VOD 학습" />
        <SideNavLink to="/study/live" icon="📡" label="실시간 강의" />
      </nav>

      {/* ── 강의 목록 ── */}
      <div style={S.courseSection}>
        <p style={S.navLabel}>
          {isInstructor ? '내가 개설한 강의' : '수강 중인 강의'}
        </p>

        <div style={S.courseList}>
          {isInstructor
            ? <InstructorCourseList courses={instructorCourses} navigate={navigate} />
            : <StudentCourseList enrollments={myEnrollments} navigate={navigate} />
          }
        </div>
      </div>

      {/* ── 하단 유저 정보 ── */}
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

// ── 강사용 강의 목록 ─────────────────────────────────────────────
function InstructorCourseList({ courses, navigate }) {
  if (!courses?.length) return <p style={S.empty}>개설된 강의가 없어요</p>;
  return courses.map((c) => (
    <button key={c.id} style={S.courseItem} onClick={() => navigate(`/courses/${c.id}`)}>
      <span style={S.courseItemDot(c.sessionType === 'LIVE' ? D.danger : D.success)} />
      <span style={S.courseItemTitle}>{c.title}</span>
      {c.pendingSubmissionsCount > 0 && (
        <span style={S.badge}>{c.pendingSubmissionsCount}</span>
      )}
    </button>
  ));
}

// ── 수강생용 강의 목록 ───────────────────────────────────────────
function StudentCourseList({ enrollments, navigate }) {
  if (!enrollments?.length) return <p style={S.empty}>수강 중인 강의가 없어요</p>;
  return enrollments.map((e) => (
    <button key={e.id} style={S.courseItem} onClick={() => navigate(`/courses/${e.courseId}`)}>
      <span style={S.courseItemDot(e.sessionType === 'LIVE' ? D.danger : D.success)} />
      <span style={S.courseItemTitle}>{e.courseTitle}</span>
      {e.upcomingDeadlineCount > 0 && (
        <span style={{ ...S.dot, background: D.danger }} title="마감 임박 과제 있음" />
      )}
    </button>
  ));
}

// ── NavLink 래퍼 ─────────────────────────────────────────────────
function SideNavLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...S.navLink,
        background: isActive ? D.accentBg : 'transparent',
        color:      isActive ? '#a5b4fc'  : D.muted,
      })}
    >
      <span style={{ width: 20, textAlign: 'center' }}>{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

// ── 스타일 ──────────────────────────────────────────────────────
const S = {
  sidebar: {
    width: 240, minHeight: '100vh', background: D.bg,
    borderRight: `1px solid ${D.border}`,
    display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, zIndex: 50,
    overflowY: 'auto',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '20px 16px 16px',
    borderBottom: `1px solid ${D.border}`,
  },
  logo: { fontSize: 20, fontWeight: 900, color: '#818cf8', letterSpacing: -0.5, flex: 1 },
  roleBadge: { padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700 },

  actionArea: { padding: '14px 12px 6px' },
  actionBtn: {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    background: D.accentBg, border: `1px solid ${D.accent}`,
    color: '#a5b4fc', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
    justifyContent: 'center', transition: 'background .15s',
  },

  nav: { padding: '8px 8px 0' },
  navLabel: { margin: '8px 8px 4px', fontSize: 10, fontWeight: 700, color: D.muted, letterSpacing: 1, textTransform: 'uppercase' },
  navLink: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', borderRadius: 8, margin: '2px 0',
    fontSize: 13, fontWeight: 600, textDecoration: 'none',
    transition: 'all .12s',
  },

  courseSection: { flex: 1, padding: '4px 8px', overflowY: 'auto' },
  courseList: { display: 'flex', flexDirection: 'column', gap: 2 },
  courseItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 10px', borderRadius: 8, width: '100%',
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: D.muted, fontSize: 12, fontWeight: 500, textAlign: 'left',
    transition: 'background .12s',
  },
  courseItemTitle: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#cbd5e1' },
  courseItemDot: (color) => ({ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }),

  badge: {
    background: D.danger, color: '#fff',
    borderRadius: 999, fontSize: 10, fontWeight: 800,
    padding: '1px 6px', flexShrink: 0, minWidth: 18, textAlign: 'center',
  },
  dot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  empty: { fontSize: 12, color: D.muted, textAlign: 'center', padding: '16px 0' },

  userInfo: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 14px',
    borderTop: `1px solid ${D.border}`,
    marginTop: 'auto',
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: D.accentBg, color: '#a5b4fc',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 800, flexShrink: 0,
  },
  userName:  { margin: 0, fontSize: 13, fontWeight: 700, color: D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userEmail: { margin: 0, fontSize: 11, color: D.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
