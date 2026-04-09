package com.vibe.vibeback.repository;

import com.vibe.vibeback.domain.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    /** 특정 수강생의 모든 활성 수강 목록 — course·student 동시 로드(세션 밖 LazyInitializationException 방지) */
    @Query("SELECT e FROM Enrollment e JOIN FETCH e.course c JOIN FETCH e.student s " +
           "WHERE e.student.id = :studentId AND e.isActive = true")
    List<Enrollment> findActiveByStudentId(@Param("studentId") Long studentId);

    /** 특정 강의의 모든 활성 수강 목록 (강사용 통계) — student FETCH JOIN 포함 */
    @Query("SELECT e FROM Enrollment e JOIN FETCH e.student s WHERE e.course.id = :courseId AND e.isActive = true")
    List<Enrollment> findActiveByCourseId(@Param("courseId") Long courseId);

    /** 여러 강의의 활성 수강 목록 일괄 (통계용 + 연관 엔티티 선로딩) */
    @Query("SELECT e FROM Enrollment e JOIN FETCH e.course c JOIN FETCH e.student s " +
           "WHERE e.course.id IN :courseIds AND e.isActive = true")
    List<Enrollment> findActiveByCourseIdIn(@Param("courseIds") List<Long> courseIds);

    /** 특정 수강생 + 특정 강의 수강 신청 조회 (중복 방지, 재입장 시 활용) */
    Optional<Enrollment> findByCourseIdAndStudentId(Long courseId, Long studentId);

    /** 특정 강의에 특정 수강생 IDs가 이미 매핑되어 있는지 조회 (벌크 등록 중복 제거용) */
    List<Enrollment> findByCourseIdAndStudentIdIn(Long courseId, List<Long> studentIds);

    /** 특정 수강생이 특정 강의에 수강 신청되어 있는지 여부 */
    boolean existsByCourseIdAndStudentIdAndIsActiveTrue(Long courseId, Long studentId);
}
