package com.vibe.vibeback.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UserRequestDto {

    private String email;
    private String password;
    private String nickname;

    /** 주간 목표 학습 시간 (분) */
    private Integer weeklyGoalMinutes;
}
