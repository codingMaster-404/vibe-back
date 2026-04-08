/**
 * useFocusTracker.js — Privacy-First AI 집중도 추적 훅
 *
 * ✅ 영상 데이터는 절대 서버로 전송하지 않음.
 * ✅ 브라우저 내부에서만 face-api.js로 얼굴 랜드마크를 분석.
 * ✅ 0~100점 focusScore를 1분 단위로 기록해 averageFocusScore 산출.
 *
 * 설치: npm install face-api.js
 * 모델: public/models/ 폴더에 아래 파일 필요
 *   → https://github.com/justadudewhohacks/face-api.js/tree/master/weights
 *   - tiny_face_detector_model-weights_manifest.json
 *   - face_landmark_68_model-weights_manifest.json
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

// ─── 상수 ────────────────────────────────────────────────────────
const MODEL_URL          = '/models';
const DETECTION_INTERVAL = 200;   // 얼굴 감지 주기 (ms)
const SCORE_INTERVAL     = 60000; // 분당 점수 집계 주기 (ms)

// EAR 임계값 (Eye Aspect Ratio)
const EAR_DROWSY  = 0.22;  // 이 이하면 졸음 의심
const EAR_CLOSED  = 0.17;  // 이 이하면 눈 완전히 감음

// 고개 기울기 임계값 (픽셀 기반 근사값)
const HEAD_TILT_WARN  = 0.12;  // 얼굴 너비 대비 비율
const HEAD_TILT_LEAVE = 0.22;

// ─── EAR 계산 ────────────────────────────────────────────────────
// 68-point 랜드마크 기준
// 왼쪽 눈: 36~41 / 오른쪽 눈: 42~47
const dist = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const calcEAR = (pts) => {
  // EAR = (|p1-p5| + |p2-p4|) / (2 * |p0-p3|)
  const vertical1 = dist(pts[1], pts[5]);
  const vertical2 = dist(pts[2], pts[4]);
  const horizontal = dist(pts[0], pts[3]);
  return (vertical1 + vertical2) / (2 * horizontal);
};

// ─── 순간 집중도 점수 계산 ────────────────────────────────────────
const calcInstantScore = ({ faceDetected, earAvg, headTiltRatio }) => {
  if (!faceDetected) return 0; // 얼굴 이탈 = 0점

  let score = 100;

  // 졸음 감지 (눈 감음)
  if (earAvg < EAR_CLOSED)  score -= 50;
  else if (earAvg < EAR_DROWSY) score -= 25;

  // 고개 이탈 감지
  if (headTiltRatio > HEAD_TILT_LEAVE) score -= 35;
  else if (headTiltRatio > HEAD_TILT_WARN)  score -= 15;

  return Math.max(0, score);
};

// ─── 훅 본체 ─────────────────────────────────────────────────────
export default function useFocusTracker() {
  const videoRef = useRef(null);        // 숨겨진 video 엘리먼트
  const streamRef = useRef(null);       // MediaStream 참조
  const detectionTimerRef = useRef(null);
  const scoreTimerRef = useRef(null);

  const [isReady, setIsReady]         = useState(false);  // 모델 로딩 완료
  const [isTracking, setIsTracking]   = useState(false);
  const [currentScore, setCurrentScore] = useState(null); // 현재 순간 점수
  const [minuteScores, setMinuteScores] = useState([]);   // 분당 점수 배열
  const [status, setStatus]           = useState('idle'); // idle|loading|tracking|error
  const [errorMsg, setErrorMsg]       = useState(null);

  // 현재 분 동안의 순간 점수 버퍼
  const instantBuffer = useRef([]);

  // ─── 모델 사전 로딩 ────────────────────────────────────────────
  useEffect(() => {
    const loadModels = async () => {
      setStatus('loading');
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        setIsReady(true);
        setStatus('idle');
      } catch (e) {
        setErrorMsg('AI 모델 로딩 실패. /public/models 폴더를 확인하세요.');
        setStatus('error');
      }
    };
    loadModels();
  }, []);

  // ─── 추적 시작 ────────────────────────────────────────────────
  const startTracking = useCallback(async () => {
    if (!isReady) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;

      // 숨겨진 video 엘리먼트에 스트림 연결 (화면에는 표시 안 함)
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsTracking(true);
      setStatus('tracking');
      instantBuffer.current = [];

      // 200ms마다 얼굴 감지 + 순간 점수 계산
      detectionTimerRef.current = setInterval(async () => {
        if (!videoRef.current) return;

        const detection = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
          )
          .withFaceLandmarks();

        let instant = 0;

        if (detection) {
          const lm = detection.landmarks.positions;

          // 왼쪽 눈(36~41), 오른쪽 눈(42~47) 랜드마크 슬라이싱
          const leftEyePts  = lm.slice(36, 42);
          const rightEyePts = lm.slice(42, 48);
          const earLeft  = calcEAR(leftEyePts);
          const earRight = calcEAR(rightEyePts);
          const earAvg   = (earLeft + earRight) / 2;

          // 고개 기울기: 코 끝(30)과 두 눈 중심의 수평 편차 비율
          const leftEyeCenter  = lm[39];  // 왼쪽 눈 안쪽 꼬리
          const rightEyeCenter = lm[42];  // 오른쪽 눈 안쪽 꼬리
          const noseTip        = lm[30];
          const eyeCenterX     = (leftEyeCenter.x + rightEyeCenter.x) / 2;
          const faceWidth      = dist(lm[0], lm[16]); // 얼굴 가로 폭
          const headTiltRatio  = Math.abs(noseTip.x - eyeCenterX) / faceWidth;

          instant = calcInstantScore({ faceDetected: true, earAvg, headTiltRatio });
        } else {
          // 얼굴 미감지
          instant = calcInstantScore({ faceDetected: false });
        }

        setCurrentScore(instant);
        instantBuffer.current.push(instant);
      }, DETECTION_INTERVAL);

      // 1분마다 평균 점수 집계
      scoreTimerRef.current = setInterval(() => {
        const buf = instantBuffer.current;
        if (buf.length === 0) return;
        const avg = Math.round(buf.reduce((s, v) => s + v, 0) / buf.length);
        setMinuteScores((prev) => [...prev, avg]);
        instantBuffer.current = [];
      }, SCORE_INTERVAL);

    } catch (e) {
      setErrorMsg('카메라 접근이 거부되었습니다. 브라우저 카메라 권한을 확인하세요.');
      setStatus('error');
    }
  }, [isReady]);

  // ─── 추적 중단 + 세션 평균 반환 ───────────────────────────────
  const stopTracking = useCallback(() => {
    clearInterval(detectionTimerRef.current);
    clearInterval(scoreTimerRef.current);

    // 마지막 1분 미만 버퍼 처리
    const buf = instantBuffer.current;
    let finalScores = [...minuteScores];
    if (buf.length > 0) {
      const lastAvg = Math.round(buf.reduce((s, v) => s + v, 0) / buf.length);
      finalScores = [...finalScores, lastAvg];
    }

    // 카메라 스트림 종료
    streamRef.current?.getTracks().forEach((t) => t.stop());

    const sessionAvg =
      finalScores.length > 0
        ? Math.round(finalScores.reduce((s, v) => s + v, 0) / finalScores.length)
        : null;

    setIsTracking(false);
    setStatus('idle');
    setCurrentScore(null);
    instantBuffer.current = [];
    setMinuteScores([]);

    // averageFocusScore와 분당 타임라인을 반환
    return { averageFocusScore: sessionAvg, minuteScores: finalScores };
  }, [minuteScores]);

  return {
    videoRef,       // <video ref={videoRef} hidden /> 에 연결
    isReady,        // 모델 로딩 완료 여부
    isTracking,
    currentScore,   // 현재 순간 집중도 (0~100)
    minuteScores,   // 분당 집중도 배열
    status,         // 'idle' | 'loading' | 'tracking' | 'error'
    errorMsg,
    startTracking,
    stopTracking,   // 반환값: { averageFocusScore, minuteScores }
  };
}
