package com.vibe.vibeback.exception;

/**
 * 로그인 실패 (이메일 없음, 비밀번호 불일치 등) — HTTP 401 로 매핑한다.
 */
public class LoginFailedException extends RuntimeException {

    public LoginFailedException() {
        super("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    public LoginFailedException(String message) {
        super(message);
    }
}
