import { create } from 'zustand';

const BASE_URL = 'http://localhost:8081/api';

// ─────────────────────────────────────────────────────────────────
//  백엔드 WeeklyProgressDto → Recharts 배열 변환 유틸
// ─────────────────────────────────────────────────────────────────

const toCompareChartData = (progress) => {
  if (!progress) return [];
  return [{ name: '이번 주', 목표: progress.weeklyGoalMinutes ?? 0, 실제: progress.actualMinutes ?? 0 }];
};

const toGaugeChartData = (progress) => {
  if (!progress) return [];
  const capped = Math.min(progress.achievementRate ?? 0, 100);
  return [{ name: '달성률', value: capped, fill: '#6366f1' }];
};

export const formatMinutes = (totalMinutes) => {
  if (totalMinutes == null) return '-';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
};

// ─────────────────────────────────────────────────────────────────
//  Zustand 스토어
// ─────────────────────────────────────────────────────────────────

const useUserStore = create((set, get) => ({
  // ── 상태 ──────────────────────────────────────────────────────
  user: null,             // UserResponseDto { id, email, nickname, weeklyGoalMinutes, role }
  weeklyProgress: null,
  compareChartData: [],
  gaugeChartData: [],
  isLoading: false,
  error: null,

  // ── 셀렉터 ────────────────────────────────────────────────────
  isInstructor: () => get().user?.role === 'INSTRUCTOR',
  isStudent:    () => get().user?.role === 'STUDENT' || get().user?.role == null,

  // ── 액션: 유저 정보 로드 ──────────────────────────────────────
  fetchUser: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${BASE_URL}/users/${userId}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`유저 조회 실패 (${res.status})`);
      const user = await res.json();
      set({ user });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── 액션: 주간 달성률 로드 + 차트 변환 ───────────────────────
  fetchWeeklyProgress: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${BASE_URL}/users/${userId}/weekly-progress`, { credentials: 'include' });
      if (!res.ok) throw new Error(`주간 통계 조회 실패 (${res.status})`);
      const progress = await res.json();
      set({
        weeklyProgress:   progress,
        compareChartData: toCompareChartData(progress),
        gaugeChartData:   toGaugeChartData(progress),
      });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── 액션: 유저 + 주간 통계 한 번에 로드 ──────────────────────
  fetchAll: async (userId) => {
    await Promise.all([get().fetchUser(userId), get().fetchWeeklyProgress(userId)]);
  },

  // ── 액션: 주간 목표 수정 ──────────────────────────────────────
  updateWeeklyGoal: async (userId, minutes) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(
        `${BASE_URL}/users/${userId}/weekly-goal?minutes=${minutes}`,
        { method: 'PATCH', credentials: 'include' }
      );
      if (!res.ok) throw new Error(`목표 수정 실패 (${res.status})`);
      const updatedUser = await res.json();
      set({ user: updatedUser });
      await get().fetchWeeklyProgress(userId);
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useUserStore;
