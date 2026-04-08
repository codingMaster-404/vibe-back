package com.vibe.vibeback.repository;

import com.vibe.vibeback.domain.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, Long> {

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

    /**
     * 특정 강의의 마감 임박 과제 제출 현황
     * (수강생 사이드바 빨간 포인트 표시용 — dueDate 기준 3일 이내 + 미제출)
     */
    @Query("SELECT COUNT(a) FROM Assignment a " +
           "WHERE a.course.id = :courseId " +
           "  AND a.dueDate BETWEEN CURRENT_TIMESTAMP AND (CURRENT_TIMESTAMP + 3) " +
           "  AND a.id NOT IN (SELECT s.assignment.id FROM AssignmentSubmission s WHERE s.student.id = :studentId)")
    long countUpcomingDeadlineForStudent(@Param("courseId") Long courseId,
                                         @Param("studentId") Long studentId);
}
