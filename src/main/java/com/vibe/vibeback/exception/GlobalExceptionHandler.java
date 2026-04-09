package com.vibe.vibeback.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.HashMap;
import java.util.Map;

/**
 * 애플리케이션 전역 예외 처리기.
 * 각 예외 유형을 잡아 적절한 HTTP 상태 코드와 ErrorResponse JSON 을 반환한다.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ─────────────────────────────────────────
    //  404 — 리소스를 찾을 수 없음
    // ─────────────────────────────────────────

    @ExceptionHandler(StudyLogNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleStudyLogNotFound(StudyLogNotFoundException ex) {
        ErrorResponse body = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "Not Found",
                ex.getMessage()           // "StudyLog를 찾을 수 없습니다. id=99"
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    // ─────────────────────────────────────────
    //  400 — 잘못된 요청 (유효성 검사 실패 등)
    // ─────────────────────────────────────────

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        ErrorResponse body = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Bad Request",
                ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(LoginFailedException.class)
    public ResponseEntity<ErrorResponse> handleLoginFailed(LoginFailedException ex) {
        ErrorResponse body = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "Unauthorized",
                ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(AdminAuthException.class)
    public ResponseEntity<Map<String, Object>> handleAdminAuth(AdminAuthException ex) {
        HttpStatus status = "ACCOUNT_LOCKED".equals(ex.getCode()) ? HttpStatus.LOCKED : HttpStatus.UNAUTHORIZED;
        Map<String, Object> body = new HashMap<>();
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("code", ex.getCode());
        body.put("message", ex.getMessage());
        body.put("remainingAttempts", ex.getRemainingAttempts());
        body.put("lockedMinutes", ex.getLockedMinutes());
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        ErrorResponse body = new ErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "Forbidden",
                ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    // ─────────────────────────────────────────
    //  413 — 파일 크기 초과
    // ─────────────────────────────────────────

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        ErrorResponse body = new ErrorResponse(
                HttpStatus.PAYLOAD_TOO_LARGE.value(),
                "Payload Too Large",
                "파일 크기가 허용 한도(50MB)를 초과했습니다."
        );
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(body);
    }

    // ─────────────────────────────────────────
    //  500 — 예상치 못한 서버 내부 에러
    // ─────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Unhandled exception", ex);
        String detail = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
        ErrorResponse body = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "서버 내부 오류가 발생했습니다: " + detail
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
