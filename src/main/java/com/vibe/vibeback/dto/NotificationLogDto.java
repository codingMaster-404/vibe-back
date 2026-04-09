package com.vibe.vibeback.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

/**
 * 운영자 알림함·API용 — SMS 대체 로그 이력
 */
public record NotificationLogDto(
        long id,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime sentAt,
        String phone,
        String recipientName,
        String accessCode,
        String contentPreview
) {
}
