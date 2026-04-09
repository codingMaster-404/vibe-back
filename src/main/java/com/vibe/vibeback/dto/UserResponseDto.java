package com.vibe.vibeback.dto;

import com.vibe.vibeback.domain.User;
import com.vibe.vibeback.domain.UserRole;
import lombok.Getter;

@Getter
public class UserResponseDto {

    private final Long     id;
    private final String   email;
    private final String   nickname;
    private final String   phone;
    private final Integer  weeklyGoalMinutes;
    private final UserRole role;
    private final boolean  requirePasswordChange;

    public UserResponseDto(User user) {
        this(user, false);
    }

    public UserResponseDto(User user, boolean requirePasswordChange) {
        this.id                = user.getId();
        this.email             = user.getEmail();
        this.nickname          = user.getNickname();
        this.phone             = user.getPhone();
        this.weeklyGoalMinutes = user.getWeeklyGoalMinutes();
        this.role              = user.getRole();
        this.requirePasswordChange = requirePasswordChange;
    }
}
