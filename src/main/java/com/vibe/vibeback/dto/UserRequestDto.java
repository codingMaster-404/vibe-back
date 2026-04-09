package com.vibe.vibeback.dto;

import com.vibe.vibeback.domain.UserRole;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UserRequestDto {

    private String   email;
    private String   password;
    private String   nickname;
    private String   phone;              // 연락처 (선택)
    private UserRole role;               // STUDENT | INSTRUCTOR (기본: STUDENT)

    /** 주간 목표 학습 시간 (분) */
    private Integer  weeklyGoalMinutes;
}
