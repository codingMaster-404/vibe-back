package com.vibe.vibeback.repository;

import com.vibe.vibeback.domain.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    /** 특정 수강생의 모든 활성 수강 목록 */
    @Query("SELECT e FROM Enrollment e JOIN FETCH e.course c WHERE e.student.id = :studentId AND e.isActive = true")
    List<Enrollment> findActiveByStudentId(@Param("studentId") Long studentId);

    /** 특정 강의의 모든 활성 수강 목록 (강사용 통계) */
    @Query("SELECT e FROM Enrollment e WHERE e.course.id = :courseId AND e.isActive = true")
    List<Enrollment> findActiveByCourseId(@Param("courseId") Long courseId);

    /** 특정 수강생 + 특정 강의 수강 신청 조회 (중복 방지, 재입장 시 활용) */
    Optional<Enrollment> findByCourseIdAndStudentId(Long courseId, Long studentId);

    /** 특정 강의의 평균 누적 몰입도 (강의별 전체 통계 — 강사 대시보드용) */
    @Query("SELECT AVG(e.cumulativeFocusScore) FROM Enrollment e " +
           "WHERE e.course.id = :courseId AND e.cumulativeFocusScore IS NOT NULL AND e.isActive = true")
    Double avgFocusScoreByCourseId(@Param("courseId") Long courseId);

    /** 특정 수강생이 특정 강의에 수강 신청되어 있는지 여부 */
    boolean existsByCourseIdAndStudentIdAndIsActiveTrue(Long courseId, Long studentId);
}
