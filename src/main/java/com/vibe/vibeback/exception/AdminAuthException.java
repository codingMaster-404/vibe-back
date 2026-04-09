package com.vibe.vibeback.exception;

import lombok.Getter;

@Getter
public class AdminAuthException extends RuntimeException {

    private final String code;
    private final Integer remainingAttempts;
    private final Integer lockedMinutes;

    public AdminAuthException(String code, String message, Integer remainingAttempts, Integer lockedMinutes) {
        super(message);
        this.code = code;
        this.remainingAttempts = remainingAttempts;
        this.lockedMinutes = lockedMinutes;
    }
}

