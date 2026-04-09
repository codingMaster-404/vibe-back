package com.vibe.vibeback.repository;

import com.vibe.vibeback.domain.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, Long> {

    /*
     * 마감 임박(3일 이내) 집계는 모두 MySQL native + NOW()/DATE_ADD 로만 수행한다.
     * (JPQL/Criteria 날짜 연산은 DB·타임존 차이로 어긋날 수 있음)
     */

    /** 특정 과제의 모든 제출물 조회 (강사용) */
    List<AssignmentSubmission> findByAssignmentId(Long assignmentId);

    /** 특정 학생의 모든 제출물 조회 */
    List<AssignmentSubmission> findByStudentId(Long studentId);

    /** 특정 학생 + 특정 과제 제출물 (재제출 여부 확인) */
    Optional<AssignmentSubmission> findByAssignmentIdAndStudentId(Long assignmentId, Long studentId);

    /** 특정 강의의 총 제출물 수 */
    @Query("SELECT COUNT(s) FROM AssignmentSubmission s WHERE s.assignment.course.id = :courseId")
    long countByCourseId(@Param("courseId") Long courseId);

    /**
     * 특정 강의의 채점 대기 중인 제출물 수 (status = 'SUBMITTED')
     * 강사 사이드바의 알림 배지(Badge)에 사용된다.
     */
    @Query("SELECT COUNT(s) FROM AssignmentSubmission s " +
           "WHERE s.assignment.course.id = :courseId AND s.status = 'SUBMITTED'")
    long countPendingByCourseId(@Param("courseId") Long courseId);

    /** 강의 ID 목록에 대해 채점 대기(SUBMITTED) 건수를 한 번에 집계 (강사 강의 목록 N+1 방지) */
    @Query("SELECT s.assignment.course.id, COUNT(s) FROM AssignmentSubmission s " +
           "WHERE s.assignment.course.id IN :courseIds AND s.status = 'SUBMITTED' " +
           "GROUP BY s.assignment.course.id")
    List<Object[]> countPendingGroupByCourseId(@Param("courseIds") List<Long> courseIds);

    /**
     * 특정 강의의 마감 임박 과제 제출 현황
     * (수강생 사이드바 빨간 포인트 표시용 — dueDate 기준 3일 이내 + 미제출)
     * MySQL 날짜 연산 사용 → nativeQuery = true
     */
    @Query(value = "SELECT COUNT(*) FROM assignments a " +
           "WHERE a.course_id = :courseId " +
           "  AND a.due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY) " +
           "  AND a.id NOT IN (" +
           "      SELECT s.assignment_id FROM assignment_submissions s WHERE s.student_id = :studentId" +
           "  )",
           nativeQuery = true)
    long countUpcomingDeadlineForStudent(@Param("courseId") Long courseId,
                                         @Param("studentId") Long studentId);

    /**
     * 수강생 기준, 여러 강의에 대한 마감 임박(3일 이내·미제출) 과제 수를 한 번에 집계
     */
    @Query(value = "SELECT a.course_id, COUNT(*) FROM assignments a " +
           "WHERE a.course_id IN (:courseIds) " +
           "  AND a.due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY) " +
           "  AND a.id NOT IN (" +
           "      SELECT s2.assignment_id FROM assignment_submissions s2 WHERE s2.student_id = :studentId" +
           "  ) " +
           "GROUP BY a.course_id",
           nativeQuery = true)
    List<Object[]> countUpcomingDeadlineGroupByCourseId(@Param("courseIds") List<Long> courseIds,
                                                        @Param("studentId") Long studentId);
}
