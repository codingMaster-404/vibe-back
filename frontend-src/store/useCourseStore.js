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
