package com.vibe.vibeback.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "study_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Webex 미팅 제목
     */
    @Column(nullable = false, length = 200)
    private String meetingTitle;

    /**
     * 미팅 시작 시간
     */
    @Column(nullable = false)
    private LocalDateTime startTime;

    /**
     * 미팅 종료 시간
     */
    @Column(nullable = false)
    private LocalDateTime endTime;

    /**
     * 계산된 학습 시간 (분 단위)
     * startTime ~ endTime 차이를 저장
     */
    @Column(nullable = false)
    private Integer durationMinutes;

    /**
     * AI 캠 모드로 측정한 세션 평균 몰입도 (0~100)
     * 브라우저 로컬에서 계산된 값을 학습 종료 시 전달받아 저장.
     * AI 캠 미사용 시 null 허용.
     */
    @Column
    private Integer averageFocusScore;

    /**
     * 이 학습 로그를 소유한 사용자 (N:1)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * startTime, endTime 기반으로 durationMinutes 를 자동 계산
     */
    @PrePersist
    @PreUpdate
    public void calculateDuration() {
        if (startTime != null && endTime != null) {
            long minutes = java.time.Duration.between(startTime, endTime).toMinutes();
            this.durationMinutes = (int) Math.max(0, minutes);
        }
    }
}
