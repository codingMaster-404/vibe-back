package com.vibe.vibeback.repository;

import com.vibe.vibeback.domain.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    List<Assignment> findByCourseIdAndIsVisibleTrue(Long courseId);

    /** 마감 임박 과제 (현재 시각 기준 N일 이내) */
    List<Assignment> findByCourseIdAndDueDateBetweenAndIsVisibleTrue(
            Long courseId, LocalDateTime from, LocalDateTime to);
}
