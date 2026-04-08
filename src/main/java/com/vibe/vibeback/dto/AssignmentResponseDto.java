package com.vibe.vibeback.dto;

import com.vibe.vibeback.domain.Assignment;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AssignmentResponseDto {
    private final Long id;
    private final String title;
    private final String description;
    private final LocalDateTime dueDate;
    private final Integer maxScore;
    private final Boolean isVisible;
    private final boolean overdue;
    private final Long courseId;
    private final String courseTitle;
    private final int submissionCount;

    public AssignmentResponseDto(Assignment a) {
        this.id              = a.getId();
        this.title           = a.getTitle();
        this.description     = a.getDescription();
        this.dueDate         = a.getDueDate();
        this.maxScore        = a.getMaxScore();
        this.isVisible       = a.getIsVisible();
        this.overdue         = a.isOverdue();
        this.courseId        = a.getCourse().getId();
        this.courseTitle     = a.getCourse().getTitle();
        this.submissionCount = a.getSubmissions().size();
    }
}
