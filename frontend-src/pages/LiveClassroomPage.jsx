/**
 * LiveClassroomPage.jsx — 실시간 가상 강의실 페이지
 *
 * - Webex/Zoom 강의 병행 시 사용하는 "몰입도 트래킹 전용 창"
 * - 강사 뷰 + 수강생 가상 시트 배치로 강의실 분위기 연출
 * - AI 캠이 내 자리를 모니터링하고, 집중 상태를 🔥 아이콘으로만 표시
 * - 학습 종료 시 useStudyStore → 백엔드 자동 연동
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useFocusTracker from '../hooks/useFocusTracker';
import FocusGauge      from '../components/FocusGauge';
import useStudyStore   from '../store/useStudyStore';

const CURRENT_USER_ID = 1;   // TODO: 인증 연동
const CURRENT_NICKNAME = '나'; // TODO: 스토어에서 주입

// 가상 수강생 데이터 (실제 서비스에서는 API로 조회)
const VIRTUAL_STUDENTS = [
  { id: 2, nickname: '김민준', focusLevel: 'high'   },
  { id: 3, nickname: '이서연', focusLevel: 'medium' },
  { id: 4, nickname: '박지호', focusLevel: 'low'    },
  { id: 5, nickname: '최예림', focusLevel: 'high'   },
  { id: 6, nickname: '정우진', focusLevel: 'medium' },
  { id: 7, nickname: '강다은', focusLevel: 'high'   },
  { id: 8, nickname: '윤성민', focusLevel: 'away'   },
];

const FOCUS_ICON = { high: '🔥', medium: '⚡', low: '😐', away: '💤' };
const FOCUS_COLOR = { high: '#6366f1', medium: '#22c55e', low: '#f59e0b', away: '#e5e7eb' };

export default function LiveClassroomPage() {
  const navigate = useNavigate();

  const [lectureTitle, setLectureTitle]   = useState('');
  const [phase, setPhase]                 = useState('setup'); // setup|lecture|result
  const [elapsed, setElapsed]             = useState(0);
  const [result, setResult]               = useState(null);
  const timerRef = useRef(null);

  const { startSession, endSession } = useStudyStore();
  const {
    videoRef,
    isReady,
    isTracking,
    currentScore,
    minuteScores,
    status,
    errorMsg,
    startTracking,
    stopTracking,
  } = useFocusTracker();

  // ─── 타이머 ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'lecture') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const fmtTime = (s) =>
    `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ─── 강의 입장 ─────────────────────────────────────────────────
  const handleEnter = async () => {
    if (!lectureTitle.trim()) return;
    startSession(lectureTitle, CURRENT_USER_ID);
    setPhase('lecture');
    setElapsed(0);
    await startTracking();
  };

  // ─── 강의 퇴장 ─────────────────────────────────────────────────
  const handleLeave = async () => {
    setPhase('result');
    let avgFocus = null;
    if (isTracking) {
      const { averageFocusScore } = stopTracking();
      avgFocus = averageFocusScore;
    }
    const saved = await endSession(avgFocus);
    setResult({ saved, avgFocus, elapsed });
  };

  // ─── 셋업 화면 ─────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div style={styles.setupPage}>
        <div style={styles.setupCard}>
          <h1 style={styles.setupTitle}>🏫 가상 강의실 입장</h1>
          <p style={styles.setupSub}>오늘 수강할 강의명을 입력하세요</p>
          <input
            style={styles.input}
            placeholder="예: CS 알고리즘 특강 Day 3"
            value={lectureTitle}
            onChange={(e) => setLectureTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
          />
          <p style={styles.setupPrivacy}>
            🔒 AI 캠이 자동으로 몰입도를 측정합니다.<br />
            얼굴 영상은 서버로 전송되지 않습니다.
          </p>
          {!isReady && <p style={styles.loadingText}>AI 모델 로딩 중…</p>}
          {errorMsg && <p style={styles.errorText}>{errorMsg}</p>}
          <button
            style={{ ...styles.btnPrimary, opacity: !isReady ? 0.5 : 1 }}
            onClick={handleEnter}
            disabled={!isReady || !lectureTitle.trim()}
          >
            입장하기 🚪
          </button>
        </div>
      </div>
    );
  }

  // ─── 결과 화면 ─────────────────────────────────────────────────
  if (phase === 'result') {
    return (
      <div style={styles.setupPage}>
        <div style={styles.setupCard}>
          <p style={{ fontSize: 48 }}>📋</p>
          <h2 style={styles.setupTitle}>강의 종료</h2>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>{lectureTitle}</p>
          <div style={styles.resultGrid}>
            <ResultBadge label="수강 시간"  value={fmtTime(result?.elapsed ?? 0)} />
            <ResultBadge
              label="평균 몰입도"
              value={result?.avgFocus != null ? `${result.avgFocus}점` : '-'}
              color="#6366f1"
            />
          </div>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>
            학습 기록이 대시보드에 저장되었습니다.
          </p>
          <div style={styles.resultBtnRow}>
            <button style={styles.btnPrimary} onClick={() => navigate('/dashboard')}>
              대시보드 보기
            </button>
            <button style={styles.btnSecondary} onClick={() => { setPhase('setup'); setLectureTitle(''); }}>
              다시 입장
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── 강의실 메인 화면 ──────────────────────────────────────────
  return (
    <div style={styles.classroomPage}>

      {/* 숨겨진 카메라 스트림 — 화면에 절대 표시 안 함 */}
      <video ref={videoRef} style={{ display: 'none' }} muted playsInline />

      {/* 상단 HUD 바 */}
      <div style={styles.hud}>
        <div style={styles.hudLeft}>
          <span style={styles.liveIndicator}>● LIVE</span>
          <span style={styles.hudTitle}>{lectureTitle}</span>
        </div>
        <div style={styles.hudCenter}>
          <span style={styles.hudTimer}>{fmtTime(elapsed)}</span>
        </div>
        <div style={styles.hudRight}>
          <FocusGauge score={currentScore} compact />
          <button style={styles.btnDanger} onClick={handleLeave}>
            퇴장 ⏹
          </button>
        </div>
      </div>

      {/* 강의실 그리드 */}
      <div style={styles.classroomGrid}>

        {/* 강사 화면 (중앙 상단) */}
        <div style={styles.instructorSlot}>
          <div style={styles.instructorScreen}>
            <p style={styles.instructorLabel}>👨‍🏫 강사</p>
            <p style={styles.instructorWebex}>📡 Webex 강의 진행 중</p>
          </div>
        </div>

        {/* 수강생 슬롯 */}
        <div style={styles.studentsGrid}>

          {/* 내 자리 — AI 몰입도 게이지 표시 */}
          <div style={{ ...styles.studentSlot, ...styles.mySlot }}>
            <div style={styles.myFocusArea}>
              <FocusGauge score={currentScore} minuteScores={minuteScores} />
            </div>
            <div style={styles.studentName}>
              <span>🙋 {CURRENT_NICKNAME} (나)</span>
            </div>
          </div>

          {/* 다른 수강생 슬롯 — 시뮬레이션 데이터 */}
          {VIRTUAL_STUDENTS.map((s) => (
            <VirtualStudentSlot key={s.id} student={s} />
          ))}
        </div>
      </div>

      {/* 하단 분당 추이 */}
      {minuteScores.length > 0 && (
        <div style={styles.minuteBar}>
          <span style={styles.minuteBarLabel}>분당 집중도</span>
          {minuteScores.slice(-12).map((score, i) => (
            <div
              key={i}
              style={{
                ...styles.minutePill,
                background: score >= 60 ? '#eef2ff' : '#fef2f2',
                color: score >= 60 ? '#6366f1' : '#ef4444',
              }}
            >
              {i + 1}분 {score}점
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 가상 수강생 슬롯
function VirtualStudentSlot({ student }) {
  const icon  = FOCUS_ICON[student.focusLevel];
  const color = FOCUS_COLOR[student.focusLevel];
  return (
    <div style={styles.studentSlot}>
      <div style={{ ...styles.studentAvatar, borderColor: color }}>
        <span style={styles.avatarIcon}>{icon}</span>
      </div>
      <div style={styles.studentName}>{student.nickname}</div>
    </div>
  );
}

function ResultBadge({ label, value, color = '#111827' }) {
  return (
    <div style={styles.resultBadge}>
      <p style={{ margin: '0 0 4px', fontSize: 12, color: '#9ca3af' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color }}>{value}</p>
    </div>
  );
}

// ─── 스타일 ─────────────────────────────────────────────────────
const styles = {
  // 셋업 / 결과 공통
  setupPage:  { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: 20 },
  setupCard:  { background: '#fff', borderRadius: 20, padding: '48px 40px', boxShadow: '0 4px 24px rgba(0,0,0,.1)', textAlign: 'center', maxWidth: 440, width: '100%' },
  setupTitle: { fontSize: 26, fontWeight: 800, margin: '0 0 8px' },
  setupSub:   { color: '#6b7280', marginBottom: 20, fontSize: 15 },
  setupPrivacy: { fontSize: 12, color: '#9ca3af', lineHeight: 1.8, marginBottom: 16 },
  loadingText:  { color: '#6366f1', fontSize: 13, marginBottom: 8 },
  input: {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    border: '1.5px solid #d1d5db', fontSize: 15, marginBottom: 12,
    boxSizing: 'border-box', outline: 'none',
  },
  resultGrid:    { display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 },
  resultBadge:   { background: '#f9fafb', borderRadius: 12, padding: '14px 24px' },
  resultBtnRow:  { display: 'flex', gap: 10, justifyContent: 'center' },

  // 강의실 레이아웃
  classroomPage: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#1e1e2e', fontFamily: "'Pretendard', sans-serif" },

  // HUD 상단 바
  hud: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 20px', background: '#16162a', borderBottom: '1px solid #2d2d4e',
  },
  hudLeft:      { display: 'flex', alignItems: 'center', gap: 12 },
  liveIndicator:{ color: '#ef4444', fontWeight: 700, fontSize: 12, animation: 'pulse 1.5s infinite' },
  hudTitle:     { color: '#e5e7eb', fontWeight: 600, fontSize: 15 },
  hudCenter:    { position: 'absolute', left: '50%', transform: 'translateX(-50%)' },
  hudTimer:     { color: '#c7d2fe', fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' },
  hudRight:     { display: 'flex', alignItems: 'center', gap: 12 },

  // 강의실 그리드
  classroomGrid: { flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' },
  instructorSlot:{ display: 'flex', justifyContent: 'center' },
  instructorScreen: {
    width: 480, aspectRatio: '16/9', background: '#2d2d4e',
    borderRadius: 12, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', border: '2px solid #6366f1',
  },
  instructorLabel: { color: '#a5b4fc', fontWeight: 700, fontSize: 14, margin: 0 },
  instructorWebex: { color: '#e5e7eb', fontSize: 13, margin: '8px 0 0' },

  // 수강생 그리드
  studentsGrid: { display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  studentSlot: {
    width: 160, background: '#2d2d4e', borderRadius: 12,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '12px 8px', gap: 8,
  },
  mySlot: { border: '2px solid #6366f1', background: '#1e2145' },
  myFocusArea: { width: '100%' },
  studentAvatar: {
    width: 64, height: 64, borderRadius: '50%',
    background: '#1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '3px solid',
  },
  avatarIcon:  { fontSize: 28 },
  studentName: { color: '#d1d5db', fontSize: 12, fontWeight: 600 },

  // 분당 바
  minuteBar: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', background: '#16162a', flexWrap: 'wrap',
  },
  minuteBarLabel: { color: '#9ca3af', fontSize: 11, marginRight: 4, whiteSpace: 'nowrap' },
  minutePill: { padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 },

  // 버튼
  btnPrimary:   { padding: '11px 24px', borderRadius: 10, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  btnDanger:    { padding: '8px 18px',  borderRadius: 8,  background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  btnSecondary: { padding: '11px 20px', borderRadius: 10, background: '#374151', color: '#e5e7eb', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  errorText:    { color: '#ef4444', fontSize: 13, marginTop: 8 },
};
