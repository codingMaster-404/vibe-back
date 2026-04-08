package com.vibe.vibeback.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CourseRequestDto {
    private String title;
    private String description;
    private String instructorName;  // 하위 호환성 유지 (없으면 User.nickname 사용)
    private Long   instructorId;    // 강사 User ID (필수)
    private String schedule;
    private String thumbnailUrl;
    private String category;
    private String sessionType;     // "VOD" | "LIVE" | "HYBRID"
    private String coursePassword;  // null 이면 비밀번호 없음
    private String accessCode;      // null 이면 자동 생성 (6자리)
}
