/**
 * useStudyStore.js — 학습 세션 Zustand 스토어
 *
 * 역할:
 * - 학습 세션(시작 시간, 제목) 상태 관리
 * - 세션 종료 시 averageFocusScore와 함께 백엔드에 POST
 * - 사용자별 StudyLog 목록 조회 (Dashboard 몰입도 차트용)
 */

import { create } from 'zustand';

const BASE_URL = 'http://localhost:8081/api';

const useStudyStore = create((set, get) => ({
  // ── 진행 중인 세션 ─────────────────────────────────────
  session: null,   // { title, startTime, userId }
  isLoading: false,
  error: null,

  // ── 저장된 StudyLog 목록 (Dashboard용) ───────────────
  studyLogs: [],

  // ─────────────────────────────────────────────────────
  //  세션 시작 (타이머만 기록, 서버 요청 없음)
  // ─────────────────────────────────────────────────────
  startSession: (title, userId) => {
    set({
      session: {
        title,
        userId,
        startTime: new Date().toISOString(),
      },
      error: null,
    });
  },

  // ─────────────────────────────────────────────────────
  //  세션 종료 → 백엔드 POST /api/study-logs
  //  averageFocusScore: useFocusTracker.stopTracking() 반환값
  // ─────────────────────────────────────────────────────
  endSession: async (averageFocusScore = null) => {
    const { session } = get();
    if (!session) return null;

    set({ isLoading: true, error: null });

    const endTime = new Date().toISOString();

    const body = {
      meetingTitle:      session.title,
      startTime:         session.startTime,
      endTime,
      userId:            session.userId,
      averageFocusScore, // null이면 백엔드에서 그대로 null 저장
    };

    try {
      const res = await fetch(`${BASE_URL}/study-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? `학습 로그 저장 실패 (${res.status})`);
      }

      const saved = await res.json();

      // 저장 성공 → 로그 목록에 추가, 세션 초기화
      set((state) => ({
        studyLogs: [saved, ...state.studyLogs],
        session:   null,
        isLoading: false,
      }));

      return saved;
    } catch (e) {
      set({ error: e.message, isLoading: false });
      return null;
    }
  },

  // ─────────────────────────────────────────────────────
  //  사용자별 학습 로그 목록 조회 (Dashboard 초기 로드)
  // ─────────────────────────────────────────────────────
  fetchStudyLogs: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${BASE_URL}/study-logs/user/${userId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`로그 조회 실패 (${res.status})`);
      const logs = await res.json();
      set({ studyLogs: logs, isLoading: false });
    } catch (e) {
      set({ error: e.message, isLoading: false });
    }
  },

  // ─────────────────────────────────────────────────────
  //  Dashboard용 — 최근 N개 로그를 Recharts LineChart 배열로 변환
  //  [{ name: '04/07 CS스터디', focusScore: 82, durationMinutes: 90 }, ...]
  // ─────────────────────────────────────────────────────
  getFocusTrendData: () => {
    const { studyLogs } = get();
    return studyLogs
      .filter((log) => log.averageFocusScore != null)
      .slice(0, 10)              // 최근 10개
      .reverse()                 // 날짜 오름차순
      .map((log) => {
        const date = new Date(log.startTime);
        const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;
        const shortTitle = log.meetingTitle.length > 8
          ? log.meetingTitle.slice(0, 8) + '…'
          : log.meetingTitle;
        return {
          name:            `${dateLabel} ${shortTitle}`,
          몰입도:           log.averageFocusScore,
          학습시간:          log.durationMinutes,
        };
      });
  },

  // 오늘 날짜 기준 평균 몰입도
  getTodayAverageFocus: () => {
    const { studyLogs } = get();
    const today = new Date().toDateString();
    const todayLogs = studyLogs.filter(
      (log) =>
        new Date(log.startTime).toDateString() === today &&
        log.averageFocusScore != null
    );
    if (todayLogs.length === 0) return null;
    const avg = todayLogs.reduce((s, l) => s + l.averageFocusScore, 0) / todayLogs.length;
    return Math.round(avg * 10) / 10;
  },
}));

export default useStudyStore;
