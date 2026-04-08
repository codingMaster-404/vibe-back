package com.vibe.vibeback.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 수강 신청(Enrollment) 엔티티
 *
 * 수강생(Student)이 특정 강의(Course)에 등록된 상태를 나타낸다.
 * 단순 ManyToMany 대신 독립 테이블로 설계하여, 몰입도·학습 시간 등
 * 수강별 통계를 직접 누적·관리할 수 있다.
 *
 * DB 유니크 제약: (course_id, student_id) 조합은 중복 불가
 */
@Entity
@Table(
    name = "enrollments",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_enrollment",
        columnNames = {"course_id", "student_id"}
    )
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── 연관관계 ───────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    // ── 기본 정보 ──────────────────────────────────────────────────

    @Column(nullable = false)
    private LocalDateTime enrolledAt;

    /** 수강 활성화 여부 (취소/정지 가능) */
    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;

    // ── 누적 학습 통계 ─────────────────────────────────────────────

    /**
     * 누적 평균 몰입도 점수 (0.0 ~ 100.0)
     * 새로운 세션이 끝날 때마다 updateFocusScore()로 업데이트.
     */
    private Double cumulativeFocusScore;

    /** 몰입도 측정이 완료된 세션 수 (평균 계산에 사용) */
    @Builder.Default
    @Column(nullable = false)
    private Integer focusSessionCount = 0;

    /** 총 학습 시간 (분 단위) */
    @Builder.Default
    @Column(nullable = false)
    private Integer totalStudyMinutes = 0;

    /**
     * 강의 진행률 (%)
     * 강사가 VOD 개수를 기반으로 별도 업데이트하거나,
     * 프론트에서 계산 후 PATCH로 보낼 수 있다.
     */
    @Builder.Default
    @Column(nullable = false)
    private Integer progressPercent = 0;

    /** 마지막 학습 일시 */
    private LocalDateTime lastStudiedAt;

    // ── JPA 콜백 ──────────────────────────────────────────────────

    @PrePersist
    void prePersist() {
        if (this.enrolledAt == null)      this.enrolledAt      = LocalDateTime.now();
        if (this.focusSessionCount == null) this.focusSessionCount = 0;
        if (this.totalStudyMinutes == null) this.totalStudyMinutes  = 0;
        if (this.progressPercent == null)   this.progressPercent   = 0;
    }

    // ── 헬퍼 메서드 ───────────────────────────────────────────────

    /**
     * 새 몰입도 세션 완료 시 누적 평균을 업데이트한다.
     * 이동 평균(running average) 방식 사용.
     *
     * @param newScore 이번 세션의 몰입도 점수 (0.0 ~ 100.0)
     */
    public void updateFocusScore(double newScore) {
        if (this.cumulativeFocusScore == null) this.cumulativeFocusScore = 0.0;
        this.focusSessionCount++;
        // running average: newAvg = (oldAvg * (n-1) + newScore) / n
        this.cumulativeFocusScore =
            ((this.cumulativeFocusScore * (this.focusSessionCount - 1)) + newScore)
            / this.focusSessionCount;
        this.lastStudiedAt = LocalDateTime.now();
    }

    /**
     * 학습 시간 누적 (분 단위)
     */
    public void addStudyMinutes(int minutes) {
        if (this.totalStudyMinutes == null) this.totalStudyMinutes = 0;
        this.totalStudyMinutes += minutes;
        this.lastStudiedAt = LocalDateTime.now();
    }
}
