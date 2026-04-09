package com.vibe.vibeback.dto;

import com.vibe.vibeback.domain.InstructorProfile;
import lombok.Getter;

/**
 * 운영자 강의 생성 화면 — '강사 선택' 셀렉터에 표시되는 최소 정보 DTO
 *
 * 응답 예시:
 * {
 *   "userId": 7,
 *   "nickname": "홍길동",
 *   "email": "hong@vibe.kr",
 *   "specialty": "스프링 · 백엔드",
 *   "careerYears": 6,
 *   "isVerified": true,
 *   "label": "홍길동 · 스프링 · 백엔드 · 6년"
 * }
 */
@Getter
public class InstructorSummaryDto {

    private final Long    userId;
    private final String  nickname;
    private final String  email;
    private final String  specialty;      // 전문 분야
    private final int     careerYears;    // 경력 연수
    private final boolean isVerified;     // 운영자 인증 여부
    private final String  label;          // 셀렉터 표시 문자열 (프리-렌더링)

    public InstructorSummaryDto(InstructorProfile p) {
        this.userId      = p.getUser().getId();
        this.nickname    = p.getUser().getNickname();
        this.email       = p.getUser().getEmail();
        this.specialty   = p.getSpecialty() != null ? p.getSpecialty() : "";
        this.careerYears = p.getCareerYears() != null ? p.getCareerYears() : 0;
        this.isVerified  = Boolean.TRUE.equals(p.getIsVerified());

        // 셀렉터 옵션 텍스트: "홍길동 · 스프링 · 백엔드 · 6년"
        StringBuilder sb = new StringBuilder(this.nickname);
        if (!this.specialty.isBlank()) sb.append(" · ").append(this.specialty);
        if (this.careerYears > 0)      sb.append(" · ").append(this.careerYears).append("년");
        this.label = sb.toString();
    }
}
