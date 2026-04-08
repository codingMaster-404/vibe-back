package com.vibe.vibeback.exception;

/**
 * 요청한 ID의 StudyLog 가 DB에 존재하지 않을 때 발생하는 예외.
 * GlobalExceptionHandler 에서 잡아 HTTP 404 로 변환한다.
 */
public class StudyLogNotFoundException extends RuntimeException {

    private final Long logId;

    public StudyLogNotFoundException(Long logId) {
        super("StudyLog를 찾을 수 없습니다. id=" + logId);
        this.logId = logId;
    }

    public Long getLogId() {
        return logId;
    }
}
