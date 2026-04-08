package com.vibe.vibeback.repository;

import com.vibe.vibeback.domain.FocusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface FocusLogRepository extends JpaRepository<FocusLog, Long> {

    List<FocusLog> findByUserId(Long userId);

    List<FocusLog> findByCourseId(Long courseId);

    List<FocusLog> findByUserIdAndCourseId(Long userId, Long courseId);

    /** 특정 강의의 기간별 FocusLog 조회 (강사용 클래스 평균 계산에 활용) */
    List<FocusLog> findByCourseIdAndSessionDateBetween(
            Long courseId, LocalDateTime from, LocalDateTime to);

    /** 강의별 전체 학생 평균 몰입도 */
    @Query("SELECT AVG(f.overallScore) FROM FocusLog f WHERE f.course.id = :courseId")
    Double avgOverallScoreByCourseId(@Param("courseId") Long courseId);

    /** 특정 유저의 최근 N개 FocusLog */
    List<FocusLog> findTop10ByUserIdOrderBySessionDateDesc(Long userId);
}
