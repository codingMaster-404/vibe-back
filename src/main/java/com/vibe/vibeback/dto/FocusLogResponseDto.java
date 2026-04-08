package com.vibe.vibeback.dto;

import com.vibe.vibeback.domain.FocusLog;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class FocusLogResponseDto {
    private final Long id;
    private final Double overallScore;
    private final String minuteScoresJson;
    private final Integer totalMinutes;
    private final Integer focusedMinutes;
    private final Integer drowsyMinutes;
    private final Integer awayMinutes;
    private final double focusRatio;
    private final String sessionType;
    private final LocalDateTime sessionDate;
    private final Long userId;
    private final Long courseId;
    private final String courseTitle;

    public FocusLogResponseDto(FocusLog log) {
        this.id                = log.getId();
        this.overallScore      = log.getOverallScore();
        this.minuteScoresJson  = log.getMinuteScoresJson();
        this.totalMinutes      = log.getTotalMinutes();
        this.focusedMinutes    = log.getFocusedMinutes();
        this.drowsyMinutes     = log.getDrowsyMinutes();
        this.awayMinutes       = log.getAwayMinutes();
        this.focusRatio        = log.getFocusRatio();
        this.sessionType       = log.getSessionType();
        this.sessionDate       = log.getSessionDate();
        this.userId            = log.getUser().getId();
        this.courseId          = log.getCourse() != null ? log.getCourse().getId() : null;
        this.courseTitle       = log.getCourse() != null ? log.getCourse().getTitle() : null;
    }
}
