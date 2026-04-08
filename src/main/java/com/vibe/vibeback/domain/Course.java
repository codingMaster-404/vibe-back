package com.vibe.vibeback.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * 강의(Course) 엔티티
 *
 * - instructor : 강의를 개설한 강사 (User, INSTRUCTOR 역할)
 * - enrollments : 수강 신청 목록 (Enrollment 엔티티로 관리)
 * - coursePassword : 수강생 입장 시 필요한 비밀번호 (null 이면 비공개 아님)
 * - accessCode : "입장 코드"로 강의를 검색할 때 사용하는 6자리 코드
 * - sessionType : "VOD" | "LIVE" | "HYBRID"
 */
@Entity
@Table(name = "courses")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 강의명 */
    @Column(nullable = false, length = 200)
    private String title;

    /** 강의 설명 */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * 담당 강사 (User FK)
     * instructorName 필드는 하위 호환성을 위해 유지하되,
     * 실제 소유권은 이 FK로 결정한다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id")
    private User instructor;

    /** 강사 이름 (비정규화 — 빠른 조회용, instructor.nickname 값을 복사) */
    @Column(nullable = false, length = 100)
    private String instructorName;

    /**
     * 강의 시간표 — 사람이 읽을 수 있는 문자열
     * 예: "월수금 10:00-11:30"
     */
    @Column(length = 200)
    private String schedule;

    /** 강의 썸네일 이미지 URL */
    @Column(length = 500)
    private String thumbnailUrl;

    /** 강의 카테고리 */
    @Column(length = 100)
    private String category;

    /** 강의 활성화 여부 */
    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;

    /**
     * 수강생 입장 비밀번호
     * null 이면 비밀번호 불필요, 값이 있으면 반드시 일치해야 입장 가능.
     * (프로덕션에서는 BCrypt 등으로 해싱 권장)
     */
    @Column(length = 100)
    private String coursePassword;

    /**
     * 강의 입장 코드 (6자리 영숫자)
     * 수강생이 "입장 코드로 강의 찾기" 기능 사용 시 이 값으로 검색한다.
     */
    @Column(length = 10, unique = true)
    private String accessCode;

    /**
     * 세션 유형: "VOD" | "LIVE" | "HYBRID"
     */
    @Builder.Default
    @Column(length = 20)
    private String sessionType = "VOD";

    // ── 연관관계 ──────────────────────────────────────────────────

    /**
     * 수강 신청 목록 (Enrollment 엔티티로 관리)
     * ManyToMany enrolledStudents 대신 사용.
     */
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Enrollment> enrollments = new ArrayList<>();

    /** 이 강의에 속한 과제 목록 */
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Assignment> assignments = new ArrayList<>();

    /** 이 강의의 몰입 로그 목록 */
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FocusLog> focusLogs = new ArrayList<>();

    // ── 헬퍼 메서드 ──────────────────────────────────────────────

    /** 현재 수강 인원 */
    public int getEnrolledCount() {
        return (int) enrollments.stream().filter(e -> Boolean.TRUE.equals(e.getIsActive())).count();
    }

    /** 비밀번호 검증 */
    public boolean verifyPassword(String input) {
        if (coursePassword == null || coursePassword.isBlank()) return true; // 비밀번호 없음
        return coursePassword.equals(input);
    }

    /** 비밀번호 설정 여부 */
    public boolean hasPassword() {
        return coursePassword != null && !coursePassword.isBlank();
    }
}
