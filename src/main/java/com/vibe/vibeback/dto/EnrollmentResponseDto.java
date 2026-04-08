package com.vibe.vibeback.dto;

import com.vibe.vibeback.domain.Enrollment;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 수강 신청 정보 응답 DTO
 *
 * 수강생 대시보드에서 "내 강의 목록 카드"를 렌더링하기 위해
 * 강의 정보(Course)와 수강 통계(Enrollment)를 통합하여 내려준다.
 */
@Getter
public class EnrollmentResponseDto {

    // ── Enrollment 기본 정보 ────────────────────────────────────
    private final Long          id;
    private final LocalDateTime enrolledAt;
    private final Boolean       isActive;

    // ── 학습 통계 ───────────────────────────────────────────────
    private final Double        cumulativeFocusScore;
    private final Integer       focusSessionCount;
    private final Integer       totalStudyMinutes;
    private final Integer       progressPercent;
    private final LocalDateTime lastStudiedAt;

    // ── 강의 정보 (Course 비정규화) ─────────────────────────────
    private final Long    courseId;
    private final String  courseTitle;
    private final String  instructorName;
    private final String  courseCategory;
    private final String  courseThumbnailUrl;
    private final String  courseSchedule;
    private final String  sessionType;
    private final String  accessCode;
    private final boolean hasPassword;
    private final int     enrolledCount;

    // ── 마감 임박 과제 수 (isOverdue = false, 3일 이내) ─────────
    private final long upcomingDeadlineCount;

    public EnrollmentResponseDto(Enrollment e) {
        this(e, 0L);
    }

    public EnrollmentResponseDto(Enrollment e, long upcomingDeadlineCount) {
        // Enrollment 필드
        this.id                   = e.getId();
        this.enrolledAt           = e.getEnrolledAt();
        this.isActive             = e.getIsActive();
        this.cumulativeFocusScore = e.getCumulativeFocusScore();
        this.focusSessionCount    = e.getFocusSessionCount();
        this.totalStudyMinutes    = e.getTotalStudyMinutes();
        this.progressPercent      = e.getProgressPercent();
        this.lastStudiedAt        = e.getLastStudiedAt();

        // Course 비정규화 필드
        var c = e.getCourse();
        this.courseId          = c.getId();
        this.courseTitle       = c.getTitle();
        this.instructorName    = c.getInstructorName();
        this.courseCategory    = c.getCategory();
        this.courseThumbnailUrl = c.getThumbnailUrl();
        this.courseSchedule    = c.getSchedule();
        this.sessionType       = c.getSessionType();
        this.accessCode        = c.getAccessCode();
        this.hasPassword       = c.hasPassword();
        this.enrolledCount     = c.getEnrolledCount();

        this.upcomingDeadlineCount = upcomingDeadlineCount;
    }
}
