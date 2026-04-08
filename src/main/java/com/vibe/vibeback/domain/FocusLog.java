package com.vibe.vibeback.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 몰입 로그(FocusLog) 엔티티
 *
 * 브라우저 로컬(TF.js / face-api.js)에서 측정한 익명화된 집중도 데이터.
 * 얼굴 영상은 절대 저장하지 않음.
 * 분당 점수 배열은 JSON 문자열로 직렬화해 TEXT 컬럼에 저장.
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

    // ── 집계 통계 ──────────────────────────────────────────

    /** 세션 전체 평균 몰입도 (0~100) */
    @Column(nullable = false)
    private Double overallScore;

    /**
     * 분당 몰입도 JSON 배열 (최대 180분 = 180개)
     * 예: "[85, 72, 90, 60, 45, ...]"
     * 서버에서 구간별 리포트 생성에 사용
     */
    @Column(columnDefinition = "TEXT")
    private String minuteScoresJson;

    /** 세션 총 측정 시간 (분) */
    private Integer totalMinutes;

    /** 집중 상태 지속 시간 (분, score >= 60) */
    private Integer focusedMinutes;

    /** 졸음 감지 시간 (분, score 20~59) */
    private Integer drowsyMinutes;

    /** 자리 이탈 시간 (분, score < 20 또는 face 미감지) */
    private Integer awayMinutes;

    /**
     * 세션 유형
     * VOD  : 녹화 강의 시청
     * LIVE : 실시간 강의 참여
     */
    @Builder.Default
    @Column(nullable = false, length = 10)
    private String sessionType = "VOD";

    /** 세션 시작 시각 */
    @Column(nullable = false)
    private LocalDateTime sessionDate;

    // ── 연관관계 ──────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    // ── 헬퍼 ──────────────────────────────────────────────

    @PrePersist
    public void prePersist() {
        if (this.sessionDate == null) {
            this.sessionDate = LocalDateTime.now();
        }
    }

    /** focusedMinutes 비율 반환 */
    public double getFocusRatio() {
        if (totalMinutes == null || totalMinutes == 0) return 0.0;
        return (double) (focusedMinutes != null ? focusedMinutes : 0) / totalMinutes * 100.0;
    }
}
