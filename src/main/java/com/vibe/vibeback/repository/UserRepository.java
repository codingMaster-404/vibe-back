package com.vibe.vibeback.repository;

import com.vibe.vibeback.domain.User;
import com.vibe.vibeback.domain.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    /**
     * 해당 강의에 활성 수강으로 등록된 학생 중 생년월일이 일치하는 계정.
     * 수강 등록 시각 내림차순(가장 최근 등록이 앞).
     */
    @Query("""
            SELECT u FROM User u
            JOIN Enrollment e ON e.student.id = u.id
            WHERE e.course.id = :courseId
              AND u.birthDate = :birthDate
              AND u.role = :role
              AND e.isActive = true
            ORDER BY e.enrolledAt DESC
            """)
    List<User> findByCourseIdAndBirthDateAndRole(
            @Param("courseId") Long courseId,
            @Param("birthDate") String birthDate,
            @Param("role") UserRole role);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    long countByRoleIn(Collection<UserRole> roles);

    long countByRole(UserRole role);
}
