package com.vibe.vibeback.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 과제(Assignment) 엔티티
 * 특정 강의에 속하며, 학생들이 파일을 제출하는 과제 단위.
 */
@Entity
@Table(name = "assignments")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 과제 제목 */
    @Column(nullable = false, length = 200)
    private String title;

    /** 과제 상세 설명 */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** 제출 마감일 */
    @Column(nullable = false)
    private LocalDateTime dueDate;

    /** 만점 점수 (기본 100점) */
    @Builder.Default
    @Column(nullable = false)
    private Integer maxScore = 100;

    /** 과제 공개 여부 */
    @Builder.Default
    @Column(nullable = false)
    private Boolean isVisible = true;

    // ── 연관관계 ──────────────────────────────────────────

    /** 이 과제가 속한 강의 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    /** 제출된 과제 목록 */
    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AssignmentSubmission> submissions = new ArrayList<>();

    // ── 헬퍼 ──────────────────────────────────────────────

    public boolean isOverdue() {
        return LocalDateTime.now().isAfter(dueDate);
    }
}
