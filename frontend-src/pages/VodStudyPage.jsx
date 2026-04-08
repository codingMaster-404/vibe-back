/**
 * VodStudyPage.jsx — VOD 학습 페이지
 *
 * - 좌측: 동영상 플레이어 (HTML5 video / YouTube embed 전환 가능)
 * - 우측: AI 몰입도 게이지 (얼굴 미표시, FocusGauge만)
 * - 숨겨진 <video>에 카메라 스트림 연결 → face-api.js 분석
 * - 학습 종료 시 averageFocusScore와 함께 백엔드에 자동 저장
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useFocusTracker from '../hooks/useFocusTracker';
import FocusGauge      from '../components/FocusGauge';
import useStudyStore   from '../store/useStudyStore';

const CURRENT_USER_ID = 1; // TODO: 인증 연동 후 교체

// 샘플 VOD 목록 (실제 서비스에서는 API로 조회)
const VOD_LIST = [
  { id: 1, title: 'CS 알고리즘 기초 #1', src: '/videos/algo-01.mp4', duration: '45분' },
  { id: 2, title: 'React 심화 — Hook 완전 정복', src: '/videos/react-hooks.mp4', duration: '62분' },
  { id: 3, title: 'Spring Boot JPA 실전', src: '/videos/spring-jpa.mp4', duration: '58분' },
];

export default function VodStudyPage() {
  const navigate = useNavigate();
  const playerRef = useRef(null);

  const [selectedVod, setSelectedVod]   = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [elapsed, setElapsed]           = useState(0);       // 경과 초
  const [camEnabled, setCamEnabled]     = useState(false);
  const [result, setResult]             = useState(null);    // 세션 종료 결과
  const timerRef = useRef(null);

  const { startSession, endSession } = useStudyStore();
  const {
    videoRef,     // 숨겨진 카메라 스트림 video
    isReady,
    isTracking,
    currentScore,
    minuteScores,
    status,
    errorMsg,
    startTracking,
    stopTracking,
  } = useFocusTracker();

  // ─── 경과 시간 타이머 ──────────────────────────────────────────
  useEffect(() => {
    if (sessionActive) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [sessionActive]);

  const fmtTime = (s) =>
    `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ─── 학습 시작 ─────────────────────────────────────────────────
  const handleStart = async () => {
    if (!selectedVod) return;
    startSession(selectedVod.title, CURRENT_USER_ID);
    setSessionActive(true);
    setElapsed(0);
    playerRef.current?.play();

    if (camEnabled) await startTracking();
  };

  // ─── 학습 종료 ─────────────────────────────────────────────────
  const handleEnd = async () => {
    playerRef.current?.pause();
    setSessionActive(false);
    clearInterval(timerRef.current);

    let avgFocus = null;
    if (isTracking) {
      const { averageFocusScore } = stopTracking();
      avgFocus = averageFocusScore;
    }

    const saved = await endSession(avgFocus);
    setResult({ saved, avgFocus });
  };

  // ─── 결과 화면 ─────────────────────────────────────────────────
  if (result) {
    return (
      <div style={styles.resultPage}>
        <div style={styles.resultCard}>
          <p style={styles.resultEmoji}>🎉</p>
          <h2 style={styles.resultTitle}>학습 완료!</h2>
          <p style={styles.resultVodName}>{selectedVod?.title}</p>
          <div style={styles.resultGrid}>
            <ResultStat label="학습 시간" value={fmtTime(elapsed)} />
            <ResultStat
              label="평균 몰입도"
              value={result.avgFocus != null ? `${result.avgFocus}점` : 'AI 캠 미사용'}
              highlight={result.avgFocus != null}
            />
          </div>
          <p style={styles.resultNote}>결과가 대시보드에 저장되었습니다.</p>
          <div style={styles.resultBtnRow}>
            <button style={styles.btnPrimary} onClick={() => navigate('/dashboard')}>
              대시보드로 이동
            </button>
            <button style={styles.btnSecondary} onClick={() => { setResult(null); setSelectedVod(null); }}>
              다른 강의 선택
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── VOD 선택 화면 ─────────────────────────────────────────────
  if (!selectedVod) {
    return (
      <div style={styles.page}>
        <h1 style={styles.pageTitle}>📚 VOD 강의 선택</h1>
        <div style={styles.vodList}>
          {VOD_LIST.map((vod) => (
            <button
              key={vod.id}
              style={styles.vodCard}
              onClick={() => setSelectedVod(vod)}
            >
              <span style={styles.vodIcon}>🎬</span>
              <div>
                <p style={styles.vodTitle}>{vod.title}</p>
                <p style={styles.vodDuration}>⏱ {vod.duration}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── 학습 메인 화면 ────────────────────────────────────────────
  return (
    <div style={styles.page}>

      {/* 숨겨진 카메라 video — 화면에 미표시, face-api.js 분석용 */}
      <video ref={videoRef} style={{ display: 'none' }} muted playsInline />

      <div style={styles.layout}>

        {/* ── 좌측: 플레이어 영역 ── */}
        <div style={styles.playerCol}>
          <div style={styles.playerWrap}>
            <video
              ref={playerRef}
              src={selectedVod.src}
              style={styles.player}
              controls={sessionActive}
              poster="/images/video-placeholder.png"
            />
            {!sessionActive && (
              <div style={styles.playerOverlay}>
                <p style={styles.overlayText}>▶ 학습 시작 버튼을 눌러주세요</p>
              </div>
            )}
          </div>

          {/* 제목 + 타이머 */}
          <div style={styles.playerMeta}>
            <p style={styles.vodTitleLarge}>{selectedVod.title}</p>
            {sessionActive && (
              <span style={styles.timer}>{fmtTime(elapsed)}</span>
            )}
          </div>

          {/* AI 캠 토글 */}
          {!sessionActive && (
            <label style={styles.camToggle}>
              <input
                type="checkbox"
                checked={camEnabled}
                onChange={(e) => setCamEnabled(e.target.checked)}
                disabled={!isReady}
              />
              <span>
                AI 몰입 추적 사용
                {!isReady && ' (모델 로딩 중…)'}
              </span>
            </label>
          )}

          {/* 시작 / 종료 버튼 */}
          <div style={styles.btnRow}>
            {!sessionActive ? (
              <button style={styles.btnPrimary} onClick={handleStart}>
                🚀 학습 시작
              </button>
            ) : (
              <button style={styles.btnDanger} onClick={handleEnd}>
                ⏹ 학습 종료
              </button>
            )}
            {!sessionActive && (
              <button style={styles.btnSecondary} onClick={() => setSelectedVod(null)}>
                강의 변경
              </button>
            )}
          </div>

          {errorMsg && <p style={styles.errorText}>⚠️ {errorMsg}</p>}
        </div>

        {/* ── 우측: AI 몰입도 사이드바 ── */}
        <aside style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>🔍 AI 몰입도 분석</h3>

          {!camEnabled && (
            <div style={styles.camOffMsg}>
              <p>📷</p>
              <p>AI 캠 모드를 켜면<br/>실시간 몰입도를 추적합니다.</p>
              <p style={{ fontSize: 11, color: '#9ca3af' }}>얼굴 데이터는 서버로 전송되지 않습니다.</p>
            </div>
          )}

          {camEnabled && (
            <FocusGauge
              score={currentScore}
              minuteScores={minuteScores}
            />
          )}

          {/* 분당 점수 로그 텍스트 */}
          {minuteScores.length > 0 && (
            <div style={styles.scoreLog}>
              <p style={styles.scoreLogTitle}>분당 기록</p>
              {minuteScores.map((s, i) => (
                <div key={i} style={styles.scoreLogRow}>
                  <span>{i + 1}분</span>
                  <span style={{ color: s >= 60 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                    {s}점
                  </span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ResultStat({ label, value, highlight }) {
  return (
    <div style={styles.resultStat}>
      <p style={styles.resultStatLabel}>{label}</p>
      <p style={{ ...styles.resultStatValue, color: highlight ? '#6366f1' : '#111827' }}>
        {value}
      </p>
    </div>
  );
}

// ─── 스타일 ─────────────────────────────────────────────────────
const styles = {
  page:  { maxWidth: 1100, margin: '0 auto', padding: '28px 20px', fontFamily: "'Pretendard', sans-serif" },
  pageTitle: { fontSize: 24, fontWeight: 700, marginBottom: 24 },

  // VOD 선택
  vodList: { display: 'flex', flexDirection: 'column', gap: 12 },
  vodCard: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '18px 24px', borderRadius: 12,
    border: '1.5px solid #e5e7eb', background: '#fff',
    cursor: 'pointer', textAlign: 'left',
    transition: 'box-shadow 0.2s',
  },
  vodIcon:     { fontSize: 32 },
  vodTitle:    { margin: 0, fontWeight: 600, fontSize: 16 },
  vodDuration: { margin: '4px 0 0', color: '#6b7280', fontSize: 13 },

  // 학습 레이아웃
  layout:     { display: 'flex', gap: 24 },
  playerCol:  { flex: 1, display: 'flex', flexDirection: 'column', gap: 14 },
  sidebar:    { width: 240, flexShrink: 0 },
  sidebarTitle: { margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#374151' },

  // 플레이어
  playerWrap: { position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9' },
  player:     { width: '100%', height: '100%', objectFit: 'contain' },
  playerOverlay: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.45)',
  },
  overlayText: { color: '#fff', fontSize: 18, fontWeight: 600 },

  playerMeta:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  vodTitleLarge: { margin: 0, fontWeight: 700, fontSize: 17, color: '#111827' },
  timer:         { fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 20, color: '#6366f1' },

  camToggle: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#374151' },

  btnRow:      { display: 'flex', gap: 10 },
  btnPrimary:  { flex: 1, padding: '12px 0', borderRadius: 10, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  btnDanger:   { flex: 1, padding: '12px 0', borderRadius: 10, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  btnSecondary:{ padding: '12px 20px', borderRadius: 10, background: '#f3f4f6', color: '#374151', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  errorText:   { color: '#ef4444', fontSize: 13 },

  // 카메라 OFF 메시지
  camOffMsg: {
    textAlign: 'center', padding: 20, background: '#f9fafb',
    borderRadius: 12, fontSize: 14, color: '#6b7280', lineHeight: 1.8,
  },

  // 점수 로그
  scoreLog:      { marginTop: 16, background: '#f9fafb', borderRadius: 10, padding: '12px 14px' },
  scoreLogTitle: { margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#6b7280' },
  scoreLogRow:   { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' },

  // 결과 화면
  resultPage: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' },
  resultCard: {
    background: '#fff', borderRadius: 20, padding: '48px 40px',
    boxShadow: '0 4px 24px rgba(0,0,0,.10)', textAlign: 'center', maxWidth: 420,
  },
  resultEmoji:   { fontSize: 56, margin: '0 0 8px' },
  resultTitle:   { fontSize: 28, fontWeight: 800, margin: '0 0 6px' },
  resultVodName: { color: '#6b7280', marginBottom: 24, fontSize: 15 },
  resultGrid:    { display: 'flex', gap: 16, marginBottom: 20, justifyContent: 'center' },
  resultStat:    { background: '#f9fafb', borderRadius: 12, padding: '16px 28px' },
  resultStatLabel: { margin: '0 0 4px', fontSize: 12, color: '#9ca3af', fontWeight: 600 },
  resultStatValue: { margin: 0, fontSize: 22, fontWeight: 800 },
  resultNote:    { color: '#9ca3af', fontSize: 13, marginBottom: 24 },
  resultBtnRow:  { display: 'flex', gap: 10, justifyContent: 'center' },
};
