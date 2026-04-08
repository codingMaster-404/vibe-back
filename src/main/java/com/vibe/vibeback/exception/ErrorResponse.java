package com.vibe.vibeback.exception;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

/**
 * API 에러 발생 시 프론트엔드에 반환하는 공통 응답 형식.
 *
 * 예시:
 * {
 *   "status"    : 404,
 *   "error"     : "Not Found",
 *   "message"   : "StudyLog를 찾을 수 없습니다. id=99",
 *   "timestamp" : "2026-04-07T15:30:00"
 * }
 */
public class ErrorResponse {

    private final int status;
    private final String error;
    private final String message;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private final LocalDateTime timestamp;

    public ErrorResponse(int status, String error, String message) {
        this.status    = status;
        this.error     = error;
        this.message   = message;
        this.timestamp = LocalDateTime.now();
    }

    public int getStatus()           { return status; }
    public String getError()         { return error; }
    public String getMessage()       { return message; }
    public LocalDateTime getTimestamp() { return timestamp; }
}
