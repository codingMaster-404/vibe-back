package com.vibe.vibeback.repository;

import com.vibe.vibeback.domain.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {

    /** 활성화된 전체 강의 목록 */
    List<Course> findByIsActiveTrue();

    /** 카테고리별 강의 목록 */
    List<Course> findByCategoryAndIsActiveTrue(String category);

    /**
     * 강사가 개설한 강의 목록
     * (instructorId = User.id, INSTRUCTOR 역할 전용)
     */
    @Query("SELECT c FROM Course c WHERE c.instructor.id = :instructorId AND c.isActive = true")
    List<Course> findByInstructorId(@Param("instructorId") Long instructorId);

    /**
     * 입장 코드로 강의 찾기
     * 수강생이 "입장 코드로 강의 찾기" 기능 사용 시 호출된다.
     */
    Optional<Course> findByAccessCodeAndIsActiveTrue(String accessCode);

    /**
     * 특정 수강생이 수강 중인 강의 목록
     * Enrollment 엔티티 기반 (기존 ManyToMany 쿼리 대체)
     */
    @Query("SELECT e.course FROM Enrollment e " +
           "WHERE e.student.id = :userId AND e.isActive = true AND e.course.isActive = true")
    List<Course> findEnrolledCoursesByUserId(@Param("userId") Long userId);
}
