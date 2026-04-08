package com.vibe.vibeback.repository;

import com.vibe.vibeback.domain.StudyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface StudyLogRepository extends JpaRepository<StudyLog, Long> {

    List<StudyLog> findByUserId(Long userId);

    /**
     * 특정 기간 내 사용자의 StudyLog 목록 조회
     */
    List<StudyLog> findByUserIdAndStartTimeBetween(
            Long userId,
            LocalDateTime start,
            LocalDateTime end
    );

    /**
     * 특정 기간 내 사용자의 총 학습 시간(분) 합산
     */
    @Query("SELECT COALESCE(SUM(sl.durationMinutes), 0) " +
           "FROM StudyLog sl " +
           "WHERE sl.user.id = :userId " +
           "AND sl.startTime >= :start " +
           "AND sl.startTime < :end")
    Integer sumDurationMinutesByUserIdAndPeriod(
            @Param("userId") Long userId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
}
