package com.vibe.vibeback.dto;

import lombok.Getter;

import java.time.LocalDate;

/**
 * 주간 학습 목표 달성률 응답 DTO
 */
@Getter
public class WeeklyProgressDto {

    /** 조회 대상 사용자 ID */
    private final Long userId;

    /** 사용자 닉네임 */
    private final String nickname;

    /** 주간 목표 학습 시간 (분) */
    private final Integer weeklyGoalMinutes;

    /** 이번 주 실제 학습 시간 (분) */
    private final Integer actualMinutes;

    /**
     * 달성률 (%)
     * weeklyGoalMinutes == 0 이면 0.0 반환
     */
    private final double achievementRate;

    /** 조회 기준 주의 시작일 (월요일) */
    private final LocalDate weekStart;

    /** 조회 기준 주의 종료일 (일요일) */
    private final LocalDate weekEnd;

    public WeeklyProgressDto(Long userId, String nickname,
                             Integer weeklyGoalMinutes, Integer actualMinutes,
                             LocalDate weekStart, LocalDate weekEnd) {
        this.userId = userId;
        this.nickname = nickname;
        this.weeklyGoalMinutes = weeklyGoalMinutes;
        this.actualMinutes = actualMinutes;
        this.weekStart = weekStart;
        this.weekEnd = weekEnd;

        if (weeklyGoalMinutes == null || weeklyGoalMinutes == 0) {
            this.achievementRate = 0.0;
        } else {
            double rate = (double) actualMinutes / weeklyGoalMinutes * 100.0;
            // 100% 초과도 표현 가능하도록 cap 없이 반환 (필요 시 Math.min(rate, 100.0) 적용)
            this.achievementRate = Math.round(rate * 100.0) / 100.0;
        }
    }
}
