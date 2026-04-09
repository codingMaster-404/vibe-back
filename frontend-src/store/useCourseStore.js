/**
 * useCourseStore.js — 강의·과제·몰입 로그 통합 Zustand 스토어
 */
import { create } from 'zustand';

const BASE = 'http://localhost:8081/api';
const CURRENT_USER_ID = 1; // TODO: 인증 연동

const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `요청 실패 (${res.status})`);
  }
  return res.json();
};

const useCourseStore = create((set, get) => ({

  // ── 상태 ──────────────────────────────────────────────────────
  courses:      [],   // 전체 강의 목록
  myCourses:    [],   // 내 수강 강의
  currentCourse: null,
  assignments:  [],   // 현재 강의 과제 목록
  submissions:  [],   // 내 제출 목록
  focusLogs:    [],   // 몰입 이력
  courseStats:  null, // 강사용 클래스 통계
  /** 강사 대시보드: courseId → enrollments/stats (일괄 API) */
  instructorEnrollmentStats: {},
  isLoading:    false,
  error:        null,

  // ── 강의 목록 ─────────────────────────────────────────────────
  fetchAllCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const courses = await fetchJSON(`${BASE}/courses`);
      set({ courses, isLoading: false });
    } catch (e) { set({ error: e.message, isLoading: false }); }
  },

  fetchMyCourses: async (userId = CURRENT_USER_ID) => {
    set({ isLoading: true, error: null });
    try {
      const myCourses = await fetchJSON(`${BASE}/courses/enrolled?userId=${userId}`);
      set({ myCourses, isLoading: false });
    } catch (e) { set({ error: e.message, isLoading: false }); }
  },

  /** 강사 전용: 내가 개설한 강의 목록 (채점 대기 배지 포함) — App 레이아웃·사이드바용 */
  fetchInstructorCourses: async (instructorId) => {
    set({ isLoading: true, error: null });
    try {
      const courses = await fetchJSON(`${BASE}/courses/instructor/${instructorId}`);
      set({ courses, isLoading: false });
    } catch (e) {
      set({ error: e.message, isLoading: false });
    }
  },

  /** 강사 대시보드 카드용 통계만 갱신 (강의 목록은 App에서 fetchInstructorCourses로 이미 로드) */
  fetchInstructorEnrollmentStatsOnly: async (instructorId) => {
    try {
      const statsMap = await fetchJSON(
        `${BASE}/enrollments/instructor/${instructorId}/courses-stats`
      );
      set({ instructorEnrollmentStats: statsMap ?? {} });
    } catch (e) {
      set({ error: e.message });
    }
  },

  /** 강의 개설 등 이후: 사이드바 강의 목록 + 대시보드 통계를 한 번에 동기화 */
  refreshInstructorCoursesAndStats: async (instructorId) => {
    set({ isLoading: true, error: null });
    try {
      const [courses, statsMap] = await Promise.all([
        fetchJSON(`${BASE}/courses/instructor/${instructorId}`),
        fetchJSON(`${BASE}/enrollments/instructor/${instructorId}/courses-stats`),
      ]);
      set({
        courses,
        instructorEnrollmentStats: statsMap ?? {},
        isLoading: false,
      });
    } catch (e) {
      set({ error: e.message, isLoading: false });
    }
  },

  /**
   * @deprecated 새 코드는 App에서 fetchInstructorCourses + 대시보드에서 fetchInstructorEnrollmentStatsOnly 조합 권장
   */
  fetchInstructorDashboardData: async (instructorId) => {
    return get().refreshInstructorCoursesAndStats(instructorId);
  },

  fetchCourse: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const currentCourse = await fetchJSON(`${BASE}/courses/${courseId}`);
      set({ currentCourse, isLoading: false });
    } catch (e) { set({ error: e.message, isLoading: false }); }
  },

  // ── 수강 신청 / 취소 ──────────────────────────────────────────
  enroll: async (courseId, userId = CURRENT_USER_ID) => {
    const updated = await fetchJSON(
      `${BASE}/courses/${courseId}/enroll?userId=${userId}`,
      { method: 'POST' }
    );
    set((s) => ({ myCourses: [...s.myCourses, updated] }));
  },

  unenroll: async (courseId, userId = CURRENT_USER_ID) => {
    await fetchJSON(`${BASE}/courses/${courseId}/enroll?userId=${userId}`, { method: 'DELETE' });
    set((s) => ({ myCourses: s.myCourses.filter((c) => c.id !== courseId) }));
  },

  // ── 과제 ──────────────────────────────────────────────────────
  fetchAssignments: async (courseId) => {
    set({ isLoading: true });
    try {
      const assignments = await fetchJSON(`${BASE}/assignments?courseId=${courseId}`);
      set({ assignments, isLoading: false });
    } catch (e) { set({ error: e.message, isLoading: false }); }
  },

  // 과제 파일 제출 (FormData)
  submitAssignment: async (assignmentId, file, studentId = CURRENT_USER_ID) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(
      `${BASE}/assignments/${assignmentId}/submit?studentId=${studentId}`,
      { method: 'POST', credentials: 'include', body: formData }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? '제출 실패');
    }
    return res.json();
  },

  fetchMySubmissions: async (studentId = CURRENT_USER_ID) => {
    const submissions = await fetchJSON(`${BASE}/assignments/my-submissions?studentId=${studentId}`);
    set({ submissions });
  },

  // ── 몰입 로그 ────────────────────────────────────────────────
  saveFocusLog: async (payload) => {
    const log = await fetchJSON(`${BASE}/focus-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    set((s) => ({ focusLogs: [log, ...s.focusLogs] }));
    return log;
  },

  fetchFocusLogs: async (userId = CURRENT_USER_ID) => {
    const focusLogs = await fetchJSON(`${BASE}/focus-logs/user/${userId}/recent`);
    set({ focusLogs });
  },

  // 강사용: 강의 클래스 몰입도 통계
  fetchCourseStats: async (courseId) => {
    const courseStats = await fetchJSON(`${BASE}/focus-logs/course/${courseId}/stats`);
    set({ courseStats });
  },

  // ── 헬퍼: 내 제출 여부 확인 ──────────────────────────────────
  getSubmissionFor: (assignmentId) => {
    const { submissions } = get();
    return submissions.find((s) => s.assignmentId === assignmentId) ?? null;
  },
}));

export default useCourseStore;
