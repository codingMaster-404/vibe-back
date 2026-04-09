package com.vibe.vibeback.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
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

    /** 연락처 — 강사가 수강생 명단 조회 시 노출 (nullable) */
    @Column(length = 20)
    private String phone;

    /**
     * 생년월일 6자리 (학생 로그인용, 예: YYMMDD = "010101")
     * 실제 서비스에서는 LocalDate + 추가 검증 권장.
     */
    @Column(length = 6)
    private String birthDate;

    /** 주간 목표 학습 시간 (분 단위) */
    @Column(nullable = false)
    @Builder.Default
    private Integer weeklyGoalMinutes = 0;

    // ── 보안: 계정 잠금 ──────────────────────────────────────────────

    /** 연속 로그인 실패 횟수 (5회 초과 시 30분 잠금) */
    @Column(nullable = false)
    @Builder.Default
    private Integer loginFailCount = 0;

    /** 잠금 해제 시각 (null = 잠금 없음) */
    @Column
    private LocalDateTime lockedUntil;

    /** 마지막 로그인 IP */
    @Column(length = 45)
    private String lastLoginIp;

    /** 마지막 로그인 일시 */
    @Column
    private LocalDateTime lastLoginAt;

    /** 사용자 역할 — STUDENT | INSTRUCTOR */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.STUDENT;

    // ── 연관관계 ──────────────────────────────────────────────────

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StudyLog> studyLogs = new ArrayList<>();

    @OneToMany(mappedBy = "instructor", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Course> createdCourses = new ArrayList<>();

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Enrollment> enrollments = new ArrayList<>();
}
