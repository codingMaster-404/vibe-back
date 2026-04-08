/**
 * CourseDetailPage.jsx — 강의 상세 페이지
 *
 * 탭 구조:
 *  ① 강의 시간표   — 주간 일정 표시
 *  ② VOD 강의     — 영상 플레이어 + AI 몰입 캠 모드
 *  ③ 과제         — AssignmentPanel (제출 + 현황)
 */

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useCourseStore  from '../store/useCourseStore';
import useFocusTracker from '../hooks/useFocusTracker';
import FocusGauge      from '../components/FocusGauge';
import AssignmentPanel from '../components/AssignmentPanel';

const CURRENT_USER_ID = 1;

// 샘플 VOD 목록 (실제에선 강의 API에 포함)
const SAMPLE_VODS = [
  { id: 1, title: '1강. 오리엔테이션 및 과목 소개', duration: '42:30', src: '' },
  { id: 2, title: '2강. 핵심 개념 정리',            duration: '58:12', src: '' },
  { id: 3, title: '3강. 실습 예제 풀이',            duration: '51:05', src: '' },
];

const DAY_LABELS = ['월', '화', '수', '목', '금'];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9~18시

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate     = useNavigate();

  const {
    currentCourse, assignments, isLoading, error,
    fetchCourse, fetchAssignments, fetchMySubmissions, saveFocusLog,
  } = useCourseStore();

  const [activeTab,    setActiveTab]    = useState('schedule');
  const [selectedVod,  setSelectedVod]  = useState(null);
  const [camEnabled,   setCamEnabled]   = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [elapsed, setElapsed]           = useState(0);
  const timerRef   = useRef(null);
  const playerRef  = useRef(null);

  const {
    videoRef, isReady, isTracking, currentScore, minuteScores,
    status: camStatus, errorMsg: camError,
    startTracking, stopTracking,
  } = useFocusTracker();

  useEffect(() => {
    fetchCourse(courseId);
    fetchAssignments(courseId);
    fetchMySubmissions(CURRENT_USER_ID);
  }, [courseId, fetchCourse, fetchAssignments, fetchMySubmissions]);

  // ── 타이머 ─────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionActive) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [sessionActive]);

  const fmtTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── VOD 학습 시작 ──────────────────────────────────────────────
  const handleStartVod = async () => {
    setSessionActive(true);
    setElapsed(0);
    if (camEnabled && isReady) await startTracking();
  };

  // ── VOD 학습 종료 → 몰입 로그 저장 ─────────────────────────────
  const handleEndVod = async () => {
    setSessionActive(false);
    clearInterval(timerRef.current);
    playerRef.current?.pause();

    let avgScore = null;
    let focused = 0, drowsy = 0, away = 0;
    let finalMinutes = [...minuteScores];

    if (isTracking) {
      const result = stopTracking();
      avgScore     = result.averageFocusScore;
      finalMinutes = result.minuteScores;
      focused = finalMinutes.filter((s) => s >= 60).length;
      drowsy  = finalMinutes.filter((s) => s >= 20 && s < 60).length;
      away    = finalMinutes.filter((s) => s < 20).length;
    }

    if (avgScore != null) {
      await saveFocusLog({
        userId:          CURRENT_USER_ID,
        courseId:        Number(courseId),
        overallScore:    avgScore,
        minuteScoresJson: JSON.stringify(finalMinutes),
        totalMinutes:    finalMinutes.length,
        focusedMinutes:  focused,
        drowsyMinutes:   drowsy,
        awayMinutes:     away,
        sessionType:     'VOD',
      });
    }
  };

  if (isLoading && !currentCourse) return <div style={S.center}>불러오는 중…</div>;
  if (error) return <div style={S.center}>⚠️ {error}</div>;
  if (!currentCourse) return null;

  return (
    <div style={S.page}>

      {/* 숨겨진 카메라 스트림 */}
      <video ref={videoRef} style={{ display: 'none' }} muted playsInline />

      {/* ── 강의 헤더 ── */}
      <div style={S.courseHeader}>
        <button style={S.backBtn} onClick={() => navigate('/hub')}>← 목록</button>
        <div style={S.headerInfo}>
          <h1 style={S.courseTitle}>{currentCourse.title}</h1>
          <p style={S.courseMeta}>
            👨‍🏫 {currentCourse.instructorName}
            {currentCourse.schedule && <> &nbsp;·&nbsp; 🗓 {currentCourse.schedule}</>}
            &nbsp;·&nbsp; 수강생 {currentCourse.enrolledCount}명
          </p>
        </div>
      </div>

      {/* ── 탭 네비게이션 ── */}
      <nav style={S.tabNav}>
        {[
          { key: 'schedule', label: '📅 시간표' },
          { key: 'vod',      label: '🎬 VOD 강의' },
          { key: 'assign',   label: `📝 과제 (${assignments.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            style={activeTab === key ? S.tabActive : S.tabBtn}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* ── 탭 콘텐츠 ── */}
      <div style={S.tabContent}>

        {/* ① 시간표 ── */}
        {activeTab === 'schedule' && (
          <div>
            <p style={S.scheduleDesc}>{currentCourse.description}</p>
            <div style={S.scheduleNote}>
              <span style={S.scheduleTag}>🗓 정규 강의 시간</span>
              <strong>{currentCourse.schedule ?? '미등록'}</strong>
            </div>

            {/* 주간 시간표 그리드 */}
            <div style={S.timetableWrap}>
              <div style={S.timetable}>
                {/* 헤더 */}
                <div style={S.ttCell} />
                {DAY_LABELS.map((d) => (
                  <div key={d} style={S.ttHeader}>{d}</div>
                ))}
                {/* 시간 행 */}
                {HOURS.map((h) => (
                  <TimeRow
                    key={h}
                    hour={h}
                    schedule={currentCourse.schedule}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ② VOD 강의 ── */}
        {activeTab === 'vod' && (
          <div style={S.vodLayout}>
            {/* 왼쪽: VOD 목록 + 플레이어 */}
            <div style={S.vodMain}>
              {/* VOD 목록 */}
              <div style={S.vodList}>
                {SAMPLE_VODS.map((vod) => (
                  <button
                    key={vod.id}
                    style={{ ...S.vodItem, ...(selectedVod?.id === vod.id ? S.vodItemActive : {}) }}
                    onClick={() => { setSelectedVod(vod); setSessionActive(false); }}
                  >
                    <span style={S.vodNum}>{vod.id}</span>
                    <div>
                      <p style={S.vodTitle}>{vod.title}</p>
                      <p style={S.vodDur}>⏱ {vod.duration}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* 플레이어 */}
              {selectedVod && (
                <div style={S.playerArea}>
                  <div style={S.playerBox}>
                    <video
                      ref={playerRef}
                      src={selectedVod.src || ''}
                      style={S.player}
                      controls={sessionActive}
                      poster="/images/video-placeholder.png"
                    />
                    {!sessionActive && (
                      <div style={S.playerOverlay}>
                        <p>▶ 학습 시작을 눌러주세요</p>
                      </div>
                    )}
                  </div>

                  <div style={S.playerMeta}>
                    <p style={S.vodNowTitle}>{selectedVod.title}</p>
                    {sessionActive && <span style={S.timer}>{fmtTime(elapsed)}</span>}
                  </div>

                  {!sessionActive && (
                    <label style={S.camLabel}>
                      <input
                        type="checkbox"
                        checked={camEnabled}
                        onChange={(e) => setCamEnabled(e.target.checked)}
                        disabled={!isReady}
                      />
                      <span>🔍 AI 몰입 추적 사용 {!isReady && '(모델 로딩 중…)'}</span>
                    </label>
                  )}

                  <div style={S.btnRow}>
                    {!sessionActive
                      ? <button style={S.btnStart} onClick={handleStartVod}>🚀 학습 시작</button>
                      : <button style={S.btnEnd}   onClick={handleEndVod}>⏹ 학습 종료</button>
                    }
                  </div>

                  {camError && <p style={S.errTxt}>⚠️ {camError}</p>}
                </div>
              )}
            </div>

            {/* 오른쪽: AI 몰입도 패널 */}
            <aside style={S.focusSide}>
              <h3 style={S.focusSideTitle}>🔥 AI 몰입도 분석</h3>
              {camEnabled
                ? <FocusGauge score={currentScore} minuteScores={minuteScores} />
                : (
                  <div style={S.camOff}>
                    <p>📷</p>
                    <p>AI 캠 모드를 켜면<br />실시간 몰입도를 추적합니다.</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
                      얼굴 데이터는 서버로<br />전송되지 않습니다.
                    </p>
                  </div>
                )
              }
            </aside>
          </div>
        )}

        {/* ③ 과제 ── */}
        {activeTab === 'assign' && (
          <AssignmentPanel
            assignments={assignments}
            studentId={CURRENT_USER_ID}
          />
        )}
      </div>
    </div>
  );
}

// ── 시간표 행 ─────────────────────────────────────────────────────
function TimeRow({ hour, schedule }) {
  // 간단한 시간표 파싱 (예: "월수금 10:00-11:30")
  const parseSchedule = (s) => {
    if (!s) return {};
    const match = s.match(/([월화수목금]+)\s+(\d+):(\d+)-(\d+):(\d+)/);
    if (!match) return {};
    const [, days, startH, , endH] = match;
    return {
      days: [...days],
      startH: parseInt(startH),
      endH:   parseInt(endH),
    };
  };
  const { days = [], startH, endH } = parseSchedule(schedule);
  const isClass = (day) => days.includes(day) && hour >= startH && hour < endH;

  return (
    <>
      <div style={S.ttHour}>{hour}:00</div>
      {DAY_LABELS.map((d) => (
        <div
          key={d}
          style={{ ...S.ttCell, background: isClass(d) ? '#eef2ff' : 'transparent', border: '1px solid #f3f4f6' }}
        >
          {isClass(d) && <span style={{ fontSize: 10, color: '#6366f1', fontWeight: 700 }}>강의</span>}
        </div>
      ))}
    </>
  );
}

// ── 스타일 ─────────────────────────────────────────────────────
const S = {
  page:   { maxWidth: 1100, margin: '0 auto', padding: '24px 20px', fontFamily: "'Pretendard', sans-serif" },
  center: { textAlign: 'center', marginTop: 80, color: '#9ca3af', fontSize: 16 },

  courseHeader: { display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 },
  backBtn:      { padding: '8px 14px', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151', whiteSpace: 'nowrap', fontWeight: 600 },
  headerInfo:   { flex: 1 },
  courseTitle:  { margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#111827' },
  courseMeta:   { margin: 0, color: '#6b7280', fontSize: 14 },

  tabNav:    { display: 'flex', gap: 4, borderBottom: '2px solid #f3f4f6', marginBottom: 24 },
  tabBtn:    { padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#9ca3af', fontWeight: 500 },
  tabActive: { padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#6366f1', fontWeight: 700, borderBottom: '2px solid #6366f1', marginBottom: -2 },
  tabContent: {},

  // 시간표
  scheduleDesc: { color: '#374151', fontSize: 15, marginBottom: 16, lineHeight: 1.7 },
  scheduleNote: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f9fafb', borderRadius: 10, marginBottom: 20, fontSize: 14 },
  scheduleTag:  { background: '#eef2ff', color: '#6366f1', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600 },
  timetableWrap:{ overflowX: 'auto' },
  timetable:    { display: 'grid', gridTemplateColumns: '60px repeat(5, 1fr)', minWidth: 400 },
  ttHeader:     { padding: '8px 4px', textAlign: 'center', fontWeight: 700, fontSize: 13, background: '#f9fafb' },
  ttHour:       { padding: '8px 4px', fontSize: 11, color: '#9ca3af', textAlign: 'right', borderRight: '1px solid #f3f4f6' },
  ttCell:       { height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // VOD
  vodLayout:  { display: 'flex', gap: 20 },
  vodMain:    { flex: 1, display: 'flex', flexDirection: 'column', gap: 16 },
  vodList:    { display: 'flex', flexDirection: 'column', gap: 6 },
  vodItem:    { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', textAlign: 'left' },
  vodItemActive: { borderColor: '#6366f1', background: '#eef2ff' },
  vodNum:     { width: 28, height: 28, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  vodTitle:   { margin: 0, fontWeight: 600, fontSize: 14, color: '#111827' },
  vodDur:     { margin: '2px 0 0', fontSize: 11, color: '#9ca3af' },

  playerArea:   { display: 'flex', flexDirection: 'column', gap: 12 },
  playerBox:    { position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9' },
  player:       { width: '100%', height: '100%', objectFit: 'contain' },
  playerOverlay:{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 18, fontWeight: 600 },
  playerMeta:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  vodNowTitle:  { margin: 0, fontWeight: 700, fontSize: 16, color: '#111827' },
  timer:        { fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 20, color: '#6366f1' },
  camLabel:     { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', color: '#374151' },
  btnRow:       { display: 'flex', gap: 10 },
  btnStart:     { flex: 1, padding: '11px 0', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  btnEnd:       { flex: 1, padding: '11px 0', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  errTxt:       { color: '#ef4444', fontSize: 13 },

  focusSide:      { width: 220, flexShrink: 0 },
  focusSideTitle: { margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#374151' },
  camOff:         { background: '#f9fafb', borderRadius: 12, padding: '24px 16px', textAlign: 'center', fontSize: 13, color: '#6b7280', lineHeight: 1.8 },
};
