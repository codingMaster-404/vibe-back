package com.vibe.vibeback.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class StudyLogRequestDto {

    /** Webex 미팅 제목 */
    private String meetingTitle;

    /** 미팅 시작 시간 */
    private LocalDateTime startTime;

    /** 미팅 종료 시간 */
    private LocalDateTime endTime;

    /** 로그를 등록할 사용자 ID */
    private Long userId;

    /**
     * AI 캠 모드로 측정한 세션 평균 몰입도 (0.0 ~ 100.0).
     * AI 캠 미사용 시 null 전송.
     */
    private Integer averageFocusScore;
}
