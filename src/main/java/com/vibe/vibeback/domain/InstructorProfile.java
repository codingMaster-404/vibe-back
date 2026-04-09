package com.vibe.vibeback.domain;

import jakarta.persistence.*;
import lombok.*;

/**
 * 강사 프로필
 * - User(강사)와 1:1 매핑
 */
@Entity
@Table(name = "instructor_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstructorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 120)
    private String specialty;

    @Builder.Default
    @Column(nullable = false)
    private Integer careerYears = 0;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Builder.Default
    @Column(nullable = false)
    private Boolean forcePwChange = false;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isVerified = false;
}

