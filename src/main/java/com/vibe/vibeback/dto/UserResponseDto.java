package com.vibe.vibeback.dto;

import com.vibe.vibeback.domain.User;
import com.vibe.vibeback.domain.UserRole;
import lombok.Getter;

@Getter
public class UserResponseDto {

    private final Long id;
    private final String email;
    private final String nickname;
    private final Integer weeklyGoalMinutes;
    private final UserRole role;

    public UserResponseDto(User user) {
        this.id                = user.getId();
        this.email             = user.getEmail();
        this.nickname          = user.getNickname();
        this.weeklyGoalMinutes = user.getWeeklyGoalMinutes();
        this.role              = user.getRole();
    }
}
