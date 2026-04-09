package com.vibe.vibeback.dto;

import com.vibe.vibeback.domain.Enrollment;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 강사 대시보드 — 수강생 명단 + AI 몰입도 현황 DTO
 *
 * 신호등 판정 기준:
 *   GREEN  : cumulativeFocusScore >= 80
 *   YELLOW : 40 <= cumulativeFocusScore < 80
 *   RED    : cumulativeFocusScore < 40  (또는 데이터 없음)
 */
@Getter
public class StudentFocusDto {

    private final Long          studentId;
    private final String        nickname;
    private final String        phone;           // 연락처 (null 가능)
    private final Double        cumulativeFocusScore;
    private final Integer       focusSessionCount;
    private final Integer       totalStudyMinutes;
    private final Integer       progressPercent;
    private final LocalDateTime lastStudiedAt;
    private final String        focusSignal;     // "GREEN" | "YELLOW" | "RED"
    private final boolean       isUnderperforming; // avg < 40

    public StudentFocusDto(Enrollment e) {
        this.studentId            = e.getStudent().getId();
        this.nickname             = e.getStudent().getNickname();
        this.phone                = e.getStudent().getPhone();
        this.cumulativeFocusScore = e.getCumulativeFocusScore();
        this.focusSessionCount    = e.getFocusSessionCount();
        this.totalStudyMinutes    = e.getTotalStudyMinutes();
        this.progressPercent      = e.getProgressPercent();
        this.lastStudiedAt        = e.getLastStudiedAt();

        double score = e.getCumulativeFocusScore() != null ? e.getCumulativeFocusScore() : -1;
        if (score >= 80)      this.focusSignal = "GREEN";
        else if (score >= 40) this.focusSignal = "YELLOW";
        else                  this.focusSignal = "RED";

        this.isUnderperforming = score >= 0 && score < 40;
    }
}
