/**
 * useEnrollmentStore.js — 수강 신청 Zustand 스토어
 *
 * 담당 API:
 *   GET  /api/enrollments/student/:studentId   — 내 수강 목록
 *   POST /api/enrollments                      — 수강 신청 (비밀번호 포함)
 *   DELETE /api/enrollments/course/:courseId   — 수강 취소
 *   PATCH /api/enrollments/:id/focus           — 몰입도 누적
 *   PATCH /api/enrollments/study-minutes       — 학습 시간 누적
 *   GET  /api/enrollments/check                — 수강 권한 확인
 */

import { create } from 'zustand';

const BASE = 'http://localhost:8081/api';

const fetchJSON = (url, opts = {}) =>
  fetch(url, { credentials: 'include', ...opts }).then(async (r) => {
    if (!r.ok) {
      const msg = await r.text().catch(() => r.statusText);
      throw new Error(msg || `요청 실패 (${r.status})`);
    }
    return r.json();
  });

const useEnrollmentStore = create((set, get) => ({
  // ── 상태 ────────────────────────────────────────────────────────
  myEnrollments: [],   // EnrollmentResponseDto[] — 내 수강 목록
  isLoading: false,
  error: null,

  // ── 내 수강 목록 조회 ────────────────────────────────────────────
  fetchMyEnrollments: async (studentId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchJSON(`${BASE}/enrollments/student/${studentId}`);
      set({ myEnrollments: Array.isArray(data) ? data : [] });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── 수강 신청 (비밀번호 검증 포함) ──────────────────────────────
  enroll: async (courseId, studentId, password = null) => {
    set({ isLoading: true, error: null });
    try {
      const body = { courseId, studentId };
      if (password) body.password = password;

      const newEnrollment = await fetchJSON(`${BASE}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      set((s) => ({ myEnrollments: [...s.myEnrollments, newEnrollment] }));
      return newEnrollment;
    } catch (err) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── 수강 취소 ────────────────────────────────────────────────────
  unenroll: async (courseId, studentId) => {
    set({ isLoading: true, error: null });
    try {
      await fetch(`${BASE}/enrollments/course/${courseId}?studentId=${studentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      set((s) => ({
        myEnrollments: s.myEnrollments.filter((e) => e.courseId !== courseId),
      }));
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── 몰입도 누적 업데이트 ──────────────────────────────────────────
  updateFocusScore: async (enrollmentId, focusScore) => {
    try {
      const updated = await fetchJSON(`${BASE}/enrollments/${enrollmentId}/focus`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusScore }),
      });
      set((s) => ({
        myEnrollments: s.myEnrollments.map((e) => (e.id === enrollmentId ? updated : e)),
      }));
    } catch (err) {
      console.error('몰입도 업데이트 실패:', err);
    }
  },

  // ── 학습 시간 누적 ────────────────────────────────────────────────
  addStudyMinutes: async (courseId, studentId, minutes) => {
    try {
      const updated = await fetchJSON(`${BASE}/enrollments/study-minutes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, studentId, minutes }),
      });
      set((s) => ({
        myEnrollments: s.myEnrollments.map((e) => (e.courseId === courseId ? updated : e)),
      }));
    } catch (err) {
      console.error('학습 시간 업데이트 실패:', err);
    }
  },

  // ── 특정 강의 수강 정보 셀렉터 ───────────────────────────────────
  getEnrollmentForCourse: (courseId) =>
    get().myEnrollments.find((e) => e.courseId === courseId) ?? null,

  // ── 수강 여부 확인 ────────────────────────────────────────────────
  isEnrolled: (courseId) =>
    get().myEnrollments.some((e) => e.courseId === courseId && e.isActive),
}));

export default useEnrollmentStore;
