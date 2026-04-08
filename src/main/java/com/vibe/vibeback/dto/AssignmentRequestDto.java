package com.vibe.vibeback.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class AssignmentRequestDto {
    private String title;
    private String description;
    private LocalDateTime dueDate;
    private Integer maxScore;
    private Long courseId;
}
