package com.vibe.vibeback.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 50)
    private String nickname;

    /**
     * 주간 목표 학습 시간 (분 단위)
     * 예: 600 = 10시간/주
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer weeklyGoalMinutes = 0;

    /**
     * 사용자 역할 — STUDENT(수강생) | INSTRUCTOR(강사)
     * 기본값: STUDENT
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.STUDENT;

    // ── 연관관계 ──────────────────────────────────────────────────

    /** 이 수강생이 남긴 학습 로그 */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StudyLog> studyLogs = new ArrayList<>();

    /** 강사가 개설한 강의 목록 (INSTRUCTOR 역할에서만 유의미) */
    @OneToMany(mappedBy = "instructor", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Course> createdCourses = new ArrayList<>();

    /** 수강생의 수강 신청 목록 (STUDENT 역할에서만 유의미) */
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Enrollment> enrollments = new ArrayList<>();
}
