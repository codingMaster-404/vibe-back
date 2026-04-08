package com.vibe.vibeback.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 과제 제출(AssignmentSubmission) 엔티티
 * 학생이 특정 과제에 파일을 제출한 기록.
 * 서버 파일 시스템에 저장된 파일 경로를 참조한다.
 */
@Entity
@Table(
    name = "assignment_submissions",
    uniqueConstraints = {
        // 한 학생은 한 과제에 하나의 제출만 (재제출 시 UPDATE)
        @UniqueConstraint(columnNames = {"assignment_id", "student_id"})
    }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AssignmentSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 서버에 저장된 파일 경로 (내부 경로, 외부 노출 금지) */
    @Column(nullable = false, length = 500)
    private String filePath;

    /** 업로드 원본 파일명 */
    @Column(nullable = false, length = 255)
    private String originalFileName;

    /** 파일 크기 (bytes) */
    private Long fileSize;

    /** 파일 MIME 타입 */
    @Column(length = 100)
    private String contentType;

    /** 제출 시각 */
    @Column(nullable = false)
    private LocalDateTime submittedAt;

    /**
     * 제출 상태
     * SUBMITTED: 제출 완료, 채점 대기
     * GRADED:    채점 완료
     * LATE:      기한 초과 제출
     */
    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "SUBMITTED";

    /** 강사 피드백 (채점 후 작성) */
    @Column(columnDefinition = "TEXT")
    private String feedback;

    /** 획득 점수 (채점 후 설정) */
    private Integer grade;

    // ── 연관관계 ──────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    // ── 헬퍼 ──────────────────────────────────────────────

    @PrePersist
    public void prePersist() {
        this.submittedAt = LocalDateTime.now();
        if (this.assignment != null && this.assignment.isOverdue()) {
            this.status = "LATE";
        }
    }
}
