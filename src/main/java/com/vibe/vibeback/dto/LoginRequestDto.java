package com.vibe.vibeback.dto;

/**
 * POST /api/login 요청 본문
 *
 * - 강사: email + password
 * - 학생: accessCode + birthDate(YYMMDD)
 */
public record LoginRequestDto(String email, String password, String birthDate, String accessCode) {
}
