package com.vibe.vibeback.dto;

import com.vibe.vibeback.domain.AssignmentSubmission;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AssignmentSubmissionResponseDto {
    private final Long id;
    private final String originalFileName;
    private final Long fileSize;
    private final String contentType;
    private final LocalDateTime submittedAt;
    private final String status;
    private final String feedback;
    private final Integer grade;
    private final Long assignmentId;
    private final String assignmentTitle;
    private final Long studentId;
    private final String studentNickname;

    public AssignmentSubmissionResponseDto(AssignmentSubmission s) {
        this.id               = s.getId();
        this.originalFileName = s.getOriginalFileName();
        this.fileSize         = s.getFileSize();
        this.contentType      = s.getContentType();
        this.submittedAt      = s.getSubmittedAt();
        this.status           = s.getStatus();
        this.feedback         = s.getFeedback();
        this.grade            = s.getGrade();
        this.assignmentId     = s.getAssignment().getId();
        this.assignmentTitle  = s.getAssignment().getTitle();
        this.studentId        = s.getStudent().getId();
        this.studentNickname  = s.getStudent().getNickname();
    }
}
