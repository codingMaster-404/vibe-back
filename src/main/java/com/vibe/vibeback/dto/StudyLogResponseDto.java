package com.vibe.vibeback.dto;

import com.vibe.vibeback.domain.StudyLog;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class StudyLogResponseDto {

    private final Long id;
    private final String meetingTitle;
    private final LocalDateTime startTime;
    private final LocalDateTime endTime;
    private final Integer durationMinutes;
    private final Long userId;
    private final String userNickname;

    /** AI 캠 몰입도 평균 (0~100). 미사용 시 null */
    private final Integer averageFocusScore;

    public StudyLogResponseDto(StudyLog log) {
        this.id = log.getId();
        this.meetingTitle = log.getMeetingTitle();
        this.startTime = log.getStartTime();
        this.endTime = log.getEndTime();
        this.durationMinutes = log.getDurationMinutes();
        this.userId = log.getUser().getId();
        this.userNickname = log.getUser().getNickname();
        this.averageFocusScore = log.getAverageFocusScore();
    }
}
