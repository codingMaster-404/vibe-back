package com.vibe.vibeback.dto;

import com.vibe.vibeback.domain.Course;
import lombok.Getter;

@Getter
public class CourseResponseDto {
    private final Long    id;
    private final String  title;
    private final String  description;
    private final Long    instructorId;
    private final String  instructorName;
    private final String  schedule;
    private final String  thumbnailUrl;
    private final String  category;
    private final Boolean isActive;
    private final String  sessionType;
    private final String  accessCode;
    private final boolean hasPassword;   // 비밀번호 필요 여부만 노출 (값은 미포함)
    private final int     enrolledCount;

    // 강사용 추가 필드 — 채점 대기 중인 과제 제출 수
    private long pendingSubmissionsCount;

    /** 일반 조회용 생성자 */
    public CourseResponseDto(Course course) {
        this.id                      = course.getId();
        this.title                   = course.getTitle();
        this.description             = course.getDescription();
        this.instructorId            = course.getInstructor() != null
                                         ? course.getInstructor().getId() : null;
        this.instructorName          = course.getInstructorName();
        this.schedule                = course.getSchedule();
        this.thumbnailUrl            = course.getThumbnailUrl();
        this.category                = course.getCategory();
        this.isActive                = course.getIsActive();
        this.sessionType             = course.getSessionType();
        this.accessCode              = course.getAccessCode();
        this.hasPassword             = course.hasPassword();
        this.enrolledCount           = course.getEnrolledCount();
        this.pendingSubmissionsCount = 0;
    }

    /** 강사용: 채점 대기 건수 포함 */
    public CourseResponseDto(Course course, long pendingSubmissionsCount) {
        this(course);
        this.pendingSubmissionsCount = pendingSubmissionsCount;
    }
}
