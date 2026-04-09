package com.vibe.vibeback.exception;

/**
 * 리소스 소유권/권한이 없는 사용자가 접근할 때 발생.
 */
public class AccessDeniedException extends RuntimeException {
    public AccessDeniedException(String message) {
        super(message);
    }
}

