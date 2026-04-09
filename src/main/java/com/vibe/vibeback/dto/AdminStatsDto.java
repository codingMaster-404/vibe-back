package com.vibe.vibeback.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record AdminStatsDto(
        long studentCount,
        long instructorCount,
        long activeCourses,
        String systemStatus,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime serverTime
) {
}

