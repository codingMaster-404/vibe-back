/**
 * useFocusTracker.js — 브라우저 로컬 AI 캠 몰입도 추적 훅 (v2)
 *
 * 주요 기능:
 *   1. 200ms 마다 face-api.js로 얼굴 감지 → EAR(졸음) + 머리 기울기(집중) 계산
 *   2. 1분마다 minuteScore 집계 → minuteScores 상태 업데이트
 *   3. focusScore < LOW_FOCUS_THRESHOLD(30) 구간 → reviewTimestamps 자동 기록
 *      (VOD <video> 요소의 currentTime(초) 기준)
 *   4. stopTracking() → { averageFocusScore, minuteScores, reviewTimestamps, ... } 반환
 *
 * 프라이버시: 카메라 스트림은 숨겨진 <video ref> 에만 연결.
 *            영상·이미지·얼굴 데이터는 절대 서버로 전송하지 않음.
 *
 * 모델 파일: public/models/ 폴더에 face-api.js weights 필요
 *   → https://github.com/justadudewhohacks/face-api.js/tree/master/weights
 *   tiny_face_detector_model-*  +  face_landmark_68_tiny_model-*
 */

import { useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

// ── 상수 ─────────────────────────────────────────────────────────
const DETECT_MS           = 200;    // 얼굴 감지 주기(ms)
const MINUTE_MS           = 60_000; // 분당 집계 주기(ms)
const EAR_DROWSY          = 0.20;   // EAR 임계값 (이 이하 → 졸음)
const LOW_FOCUS_THRESHOLD = 30;     // 복습 타임스탬프 기록 임계값
const MODELS_PATH         = '/models';

// ── 훅 ───────────────────────────────────────────────────────────
export default function useFocusTracker() {
  const [isTracking, setIsTracking]             = useState(false);
  const [focusScore, setFocusScore]             = useState(null);
  const [minuteScores, setMinuteScores]         = useState([]);
  const [reviewTimestamps, setReviewTimestamps] = useState([]);

  const streamRef         = useRef(null);
  const videoRef          = useRef(null);   // 숨겨진 <video> — 카메라 입력
  const vodVideoRef       = useRef(null);   // 외부 VOD <video> — currentTime 참조
  const detectTimer       = useRef(null);
  const minuteTimer       = useRef(null);
  const instantBuf        = useRef([]);     // 현재 분 내 순간 점수 버퍼
  const minuteScoresRef   = useRef([]);     // 최신 minuteScores 동기 참조
  const reviewTsRef       = useRef([]);     // 최신 reviewTimestamps 동기 참조
  const inLowFocuse       = useRef(false);  // 연속 저집중 구간 중복 기록 방지
  const modelsLoaded      = useRef(false);

  // ── 모델 로드 ──────────────────────────────────────────────────
  const ensureModels = useCallback(async () => {
    if (modelsLoaded.current) return;
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_PATH),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_PATH),
    ]);
    modelsLoaded.current = true;
  }, []);

  // ── EAR 계산 ───────────────────────────────────────────────────
  const calcEAR = (pts) => {
    const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    return (d(pts[1], pts[5]) + d(pts[2], pts[4])) / (2 * d(pts[0], pts[3]));
  };

  // ── 순간 focusScore 계산 ──────────────────────────────────────
  const calcScore = (landmarks) => {
    const pts  = landmarks.positions;
    const earL = calcEAR(pts.slice(36, 42));
    const earR = calcEAR(pts.slice(42, 48));
    if ((earL + earR) / 2 < EAR_DROWSY) return 20;  // 졸음

    // 머리 기울기 패널티
    const nose      = pts[30];
    const eyeCx     = (pts[36].x + pts[45].x) / 2;
    const faceW     = Math.abs(pts[16].x - pts[0].x) || 1;
    const tilt      = Math.abs(nose.x - eyeCx) / faceW;
    return Math.max(0, Math.min(100, 90 - tilt * 200));
  };

  // ── 추적 시작 ─────────────────────────────────────────────────
  /**
   * @param {HTMLVideoElement|null} vodElement — VOD 플레이어 요소
   *   전달 시 저집중 구간의 currentTime(초)을 reviewTimestamps에 기록
   */
  const startTracking = useCallback(async (vodElement = null) => {
    try {
      await ensureModels();

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      vodVideoRef.current = vodElement;

      // 상태·버퍼 초기화
      instantBuf.current      = [];
      minuteScoresRef.current = [];
      reviewTsRef.current     = [];
      inLowFocuse.current     = false;
      setMinuteScores([]);
      setReviewTimestamps([]);
      setFocusScore(null);
      setIsTracking(true);

      // ── ① 200ms 얼굴 감지 루프 ──────────────────────────────
      detectTimer.current = setInterval(async () => {
        if (!videoRef.current) return;
        const det = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true);

        const score = det ? calcScore(det.landmarks) : 0;
        setFocusScore(score);
        instantBuf.current.push(score);

        // ── 복습 타임스탬프 기록 (저집중 구간 시작점만 기록) ──
        if (score < LOW_FOCUS_THRESHOLD) {
          if (!inLowFocuse.current && vodVideoRef.current) {
            const sec = Math.floor(vodVideoRef.current.currentTime);
            reviewTsRef.current = [...reviewTsRef.current, sec];
            setReviewTimestamps([...reviewTsRef.current]);
          }
          inLowFocuse.current = true;
        } else {
          inLowFocuse.current = false;
        }
      }, DETECT_MS);

      // ── ② 1분마다 버퍼 집계 ─────────────────────────────────
      minuteTimer.current = setInterval(() => {
        flushBuffer();
      }, MINUTE_MS);

    } catch (err) {
      console.error('[FocusTracker] 초기화 실패:', err);
      setIsTracking(false);
    }
  }, [ensureModels]);

  // ── 버퍼 플러시 (내부 헬퍼) ───────────────────────────────────
  const flushBuffer = () => {
    if (instantBuf.current.length === 0) return;
    const avg = Math.round(
      instantBuf.current.reduce((s, v) => s + v, 0) / instantBuf.current.length
    );
    minuteScoresRef.current = [...minuteScoresRef.current, avg];
    setMinuteScores([...minuteScoresRef.current]);
    instantBuf.current = [];
  };

  // ── 추적 종료 ─────────────────────────────────────────────────
  const stopTracking = useCallback(() => {
    clearInterval(detectTimer.current);
    clearInterval(minuteTimer.current);

    // 마지막 미완성 분 처리
    flushBuffer();

    // 카메라 스트림 정지
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    vodVideoRef.current = null;

    setIsTracking(false);
    setFocusScore(null);

    // ── 최종 결과 객체 반환 ─────────────────────────────────────
    const scores = minuteScoresRef.current;
    const avg    = scores.length
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
      : 0;

    return {
      averageFocusScore:    avg,
      minuteScores:         scores,
      minuteScoresJson:     JSON.stringify(scores),
      reviewTimestamps:     reviewTsRef.current,
      reviewTimestampsJson: JSON.stringify(reviewTsRef.current),
      totalMinutes:         scores.length,
      focusedMinutes:       scores.filter((s) => s >= 60).length,
      drowsyMinutes:        scores.filter((s) => s >= 20 && s < 60).length,
      awayMinutes:          scores.filter((s) => s < 20).length,
    };
  }, []);

  return {
    videoRef,          // 숨겨진 <video ref={videoRef} /> 에 연결
    isTracking,
    focusScore,
    minuteScores,
    reviewTimestamps,
    startTracking,
    stopTracking,
  };
}
