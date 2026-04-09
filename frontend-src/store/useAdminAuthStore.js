/**
 * useAdminAuthStore.js — 운영자 인증 Zustand 스토어
 *
 * 관리:
 *   adminToken  — localStorage "adminToken" 에 영속화
 *   adminUser   — { userId, nickname, email, role }
 *   isAdminAuth — 파생 상태 (token 존재 여부)
 *
 * 주요 액션:
 *   adminLogin(email, password)  — POST /api/admin/auth/login
 *   adminLogout()                — 토큰 삭제
 *   verifyAdminToken()           — 페이지 리로드 시 토큰 유효성 서버 확인
 */

import { create } from 'zustand';

const API = '/api/admin/auth';
const TOKEN_KEY = 'adminToken';

const useAdminAuthStore = create((set, get) => ({

  // ── 상태 ──────────────────────────────────────────────────────────
  adminToken:  localStorage.getItem(TOKEN_KEY) ?? null,
  adminUser:   null,
  isAdminAuth: !!localStorage.getItem(TOKEN_KEY),
  authError:   null,
  isLoading:   false,

  // ── 로그인 ────────────────────────────────────────────────────────

  adminLogin: async (email, password) => {
    set({ isLoading: true, authError: null });
    try {
      const res = await fetch(`${API}/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.message ?? data?.error ?? '로그인에 실패했습니다.';
        set({ authError: msg, isLoading: false });
        return false;
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      set({
        adminToken:  data.token,
        adminUser:   { userId: data.userId, nickname: data.nickname, email: data.email, role: data.role },
        isAdminAuth: true,
        authError:   null,
        isLoading:   false,
      });
      return true;
    } catch (e) {
      set({ authError: '서버에 연결할 수 없습니다.', isLoading: false });
      return false;
    }
  },

  // ── 로그아웃 ──────────────────────────────────────────────────────

  adminLogout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ adminToken: null, adminUser: null, isAdminAuth: false, authError: null });
  },

  // ── 토큰 검증 (페이지 리로드 시) ─────────────────────────────────

  verifyAdminToken: async () => {
    const token = get().adminToken;
    if (!token) {
      set({ isAdminAuth: false });
      return false;
    }
    try {
      const res = await fetch(`${API}/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        localStorage.removeItem(TOKEN_KEY);
        set({ adminToken: null, adminUser: null, isAdminAuth: false });
        return false;
      }
      const data = await res.json();
      set({ isAdminAuth: data.valid === true });
      return data.valid === true;
    } catch {
      set({ isAdminAuth: false });
      return false;
    }
  },

  // ── 인증 헤더 반환 (다른 스토어에서 사용) ─────────────────────────

  authHeaders: () => {
    const token = get().adminToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  clearError: () => set({ authError: null }),
}));

export default useAdminAuthStore;
