package com.vibe.vibeback.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 몰입 로그(FocusLog) 엔티티
 *
 * - 브라우저(face-api.js)에서 측정한 익명화된 집중도 데이터
 * - 얼굴 영상·이미지는 절대 저장하지 않음
 * - reviewTimestampsJson : focusScore < 30 이 된 VOD 재생 시점(초) 목록
 *   → 세션 종료 후 "자동 복습 타임스탬프" 리포트에 사용
 */
@Entity
@Table(name = "focus_logs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class FocusLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── 집계 통계 ──────────────────────────────────────────────────

    /** 세션 전체 평균 몰입도 (0~100) */
    @Column(nullable = false)
    private Double overallScore;

    /**
     * 분당 몰입도 JSON 배열 (최대 180분)
     * 예: "[85, 72, 90, 60, 45, ...]"
     */
    @Column(columnDefinition = "TEXT")
    private String minuteScoresJson;

    /**
     * 자동 복습 타임스탬프 — focusScore < 30 으로 떨어진 VOD 재생 시점(초) 목록
     * 예: "[142, 380, 712]"  → 2분 22초, 6분 20초, 11분 52초에 집중력 저하
     * LIVE 세션에서는 null
     */
    @Column(columnDefinition = "TEXT")
    private String reviewTimestampsJson;

    /** 세션 총 측정 시간 (분) */
    private Integer totalMinutes;

    /** 집중 상태 지속 시간 (분, score >= 60) */
    private Integer focusedMinutes;

    /** 졸음 감지 시간 (분, score 20~59) */
    private Integer drowsyMinutes;

    /** 자리 이탈 시간 (분, score < 20 또는 face 미감지) */
    private Integer awayMinutes;

    /** 세션 유형: "VOD" | "LIVE" */
    @Builder.Default
    @Column(nullable = false, length = 10)
    private String sessionType = "VOD";

    /** 세션 시작 시각 */
    @Column(nullable = false)
    private LocalDateTime sessionDate;

    // ── 연관관계 ──────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    // ── JPA 콜백 ──────────────────────────────────────────────────

    @PrePersist
    public void prePersist() {
        if (this.sessionDate == null) this.sessionDate = LocalDateTime.now();
    }

    // ── 헬퍼 ──────────────────────────────────────────────────────

    /** focusedMinutes 비율 반환 (0.0 ~ 100.0) */
    public double getFocusRatio() {
        if (totalMinutes == null || totalMinutes == 0) return 0.0;
        return (double) (focusedMinutes != null ? focusedMinutes : 0) / totalMinutes * 100.0;
    }
}
