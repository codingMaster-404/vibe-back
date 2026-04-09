/**
 * useAdminStore.js — 운영자(ADMIN) 전용 Zustand 스토어
 *
 * 담당 API:
 *   GET  /api/admin/instructors               — 인증 완료 강사 목록 (초기 로드)
 *   GET  /api/admin/instructors?keyword=...   — 강사 검색 (셀렉터 실시간)
 *   POST /api/admin/courses                   — 강의 개설 (instructorId 필수)
 *   POST /api/admin/courses/:id/enrollments/bulk — 학생 일괄 배정
 *   POST /api/admin/users/import-csv          — 유저 CSV 일괄 등록
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

const useAdminStore = create((set, get) => ({

  // ── 상태 ────────────────────────────────────────────────────────
  /** 강사 셀렉터 목록 — InstructorSummaryDto[] */
  instructorPool:     [],
  /** 강사 검색 결과 (keyword 입력 시 덮어씀) */
  instructorResults:  [],
  isSearching:        false,

  isLoading:  false,
  error:      null,

  // ── 강사 풀 조회 ─────────────────────────────────────────────────

  /**
   * 강의 생성 폼을 열 때 한 번만 호출.
   * 인증 완료 강사 전체를 불러와 instructorPool 에 캐싱.
   */
  fetchInstructorPool: async () => {
    if (get().instructorPool.length > 0) return; // 이미 로드됐으면 스킵
    set({ isLoading: true, error: null });
    try {
      const data = await fetchJSON(`${BASE}/admin/instructors`);
      set({ instructorPool: data, instructorResults: data });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 강사 셀렉터 실시간 검색.
   * keyword 가 비어 있으면 캐싱된 instructorPool 를 복원.
   */
  searchInstructors: async (keyword) => {
    if (!keyword || !keyword.trim()) {
      set({ instructorResults: get().instructorPool });
      return;
    }
    set({ isSearching: true });
    try {
      const data = await fetchJSON(
        `${BASE}/admin/instructors?keyword=${encodeURIComponent(keyword.trim())}`
      );
      set({ instructorResults: data });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ isSearching: false });
    }
  },

  // ── 강의 개설 ────────────────────────────────────────────────────

  /**
   * 운영자 강의 개설.
   * @param {Object} formData
   *   { title, description, instructorId, schedule, category,
   *     sessionType, coursePassword, accessCode, studentIds? }
   * @returns {CourseResponseDto} 생성된 강의 정보
   */
  createCourse: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const course = await fetchJSON(`${BASE}/admin/courses`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      });
      return course;
    } catch (err) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── 학생 일괄 배정 ───────────────────────────────────────────────

  bulkEnrollStudents: async (courseId, studentIds) => {
    set({ isLoading: true, error: null });
    try {
      return await fetchJSON(`${BASE}/admin/courses/${courseId}/enrollments/bulk`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ studentIds }),
      });
    } catch (err) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── CSV 일괄 등록 ─────────────────────────────────────────────────

  importUsersCsv: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const fd = new FormData();
      fd.append('file', file);
      return await fetchJSON(`${BASE}/admin/users/import-csv`, {
        method: 'POST',
        body:   fd,
        // Content-Type 은 FormData 사용 시 자동 설정 (boundary 포함)
      });
    } catch (err) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── 상태 초기화 ──────────────────────────────────────────────────
  clearError: () => set({ error: null }),
  resetInstructorPool: () => set({ instructorPool: [], instructorResults: [] }),
}));

export default useAdminStore;
