package com.vibe.vibeback.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 운영자 전용 강의 생성 DTO
 *
 * 일반 CourseRequestDto 와의 차이:
 *   - instructorId : @NotNull — 강사를 지정하지 않으면 강의를 만들 수 없음
 *   - title        : @NotBlank — 강의명 필수
 *   - sessionType  : 기본값 "VOD" 사용 허용
 *
 * 운영자가 별도 페이지 없이 [강의 생성] 폼 안에서 강사를 즉시 지정하는 워크플로우에 대응.
 */
@Getter
@NoArgsConstructor
public class AdminCourseRequestDto {

    @NotBlank(message = "강의명은 필수입니다.")
    private String title;

    private String description;

    /** 강사 User ID — 강사 풀 셀렉터에서 선택된 값, 필수 */
    @NotNull(message = "담당 강사를 선택해야 합니다.")
    private Long instructorId;

    private String schedule;
    private String thumbnailUrl;
    private String category;

    /** "VOD" | "LIVE" | "HYBRID" — 미입력 시 "VOD" 기본 적용 */
    private String sessionType;

    /** 수강생 입장 비밀번호 (null 이면 비밀번호 없음) */
    private String coursePassword;

    /**
     * 입장 코드 — 운영자가 직접 지정 가능, 미입력 시 서버가 자동 생성
     * (6자리 영숫자, 대소문자 혼용 불가 — 자동 생성 시 대문자+숫자)
     */
    private String accessCode;

    /**
     * 일괄 수강 신청할 학생 ID 목록 (선택)
     * 강의 개설과 동시에 학생을 배정하려면 전달, 없으면 null 또는 빈 배열
     */
    private java.util.List<Long> studentIds;
}
