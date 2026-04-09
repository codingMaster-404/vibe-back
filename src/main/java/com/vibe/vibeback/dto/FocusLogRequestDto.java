package com.vibe.vibeback.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 프론트엔드 AI 캠 모드에서 측정한 익명화 몰입 데이터 수신 DTO.
 * 얼굴 영상·이미지는 절대 포함되지 않음.
 */
@Getter
@NoArgsConstructor
public class FocusLogRequestDto {
    private Long   userId;
    private Long   courseId;            // null 가능 (강의 무관 학습 시)
    private Double overallScore;        // 0~100

    /** 분당 몰입도 JSON 배열. 예: "[85, 72, 90, ...]" */
    private String minuteScoresJson;

    /**
     * 자동 복습 타임스탬프 JSON 배열.
     * VOD 재생 중 focusScore < 30 이 된 시점(초) 목록.
     * 예: "[142, 380, 712]"
     * LIVE 세션이면 null 또는 "[]" 전송.
     */
    private String reviewTimestampsJson;

    private Integer totalMinutes;
    private Integer focusedMinutes;
    private Integer drowsyMinutes;
    private Integer awayMinutes;
    private String  sessionType;        // "VOD" | "LIVE"
}
