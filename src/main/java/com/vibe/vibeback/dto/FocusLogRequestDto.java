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
    private Long userId;
    private Long courseId;       // null 가능 (강의 무관 학습 시)
    private Double overallScore; // 0~100
    private String minuteScoresJson; // "[85, 72, 90, ...]"
    private Integer totalMinutes;
    private Integer focusedMinutes;
    private Integer drowsyMinutes;
    private Integer awayMinutes;
    private String sessionType;  // "VOD" | "LIVE"
}
