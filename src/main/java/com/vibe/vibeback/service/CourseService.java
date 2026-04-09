package com.vibe.vibeback.service;

import com.vibe.vibeback.domain.Course;
import com.vibe.vibeback.domain.User;
import com.vibe.vibeback.dto.CourseRequestDto;
import com.vibe.vibeback.dto.CourseResponseDto;
import com.vibe.vibeback.repository.AssignmentSubmissionRepository;
import com.vibe.vibeback.repository.CourseRepository;
import com.vibe.vibeback.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseService {

    private final CourseRepository               courseRepository;
    private final UserRepository                 userRepository;
    private final AssignmentSubmissionRepository submissionRepository;

    private static final String ACCESS_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int    ACCESS_CODE_LEN   = 6;
    private static final SecureRandom RNG = new SecureRandom();

    // ─── 강의 개설 (강사용) ──────────────────────────────────────────
    @Transactional
    public CourseResponseDto create(CourseRequestDto dto) {
        User instructor = null;
        String instructorName = dto.getInstructorName();

        if (dto.getInstructorId() != null) {
            instructor    = userRepository.findById(dto.getInstructorId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "강사 정보를 찾을 수 없습니다. id=" + dto.getInstructorId()));
            if (instructorName == null || instructorName.isBlank()) {
                instructorName = instructor.getNickname();
            }
        }

        // accessCode 자동 생성 (미입력 시)
        String accessCode = dto.getAccessCode();
        if (accessCode == null || accessCode.isBlank()) {
            accessCode = generateUniqueAccessCode();
        }

        Course course = Course.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .instructor(instructor)
                .instructorName(instructorName != null ? instructorName : "")
                .schedule(dto.getSchedule())
                .thumbnailUrl(dto.getThumbnailUrl())
                .category(dto.getCategory())
                .sessionType(dto.getSessionType() != null ? dto.getSessionType() : "VOD")
                .coursePassword(dto.getCoursePassword())
                .accessCode(accessCode)
                .build();

        return new CourseResponseDto(courseRepository.save(course));
    }

    // ─── 전체 강의 목록 ──────────────────────────────────────────────
    public List<CourseResponseDto> findAll() {
        return courseRepository.findByIsActiveTrue().stream()
                .map(CourseResponseDto::new).toList();
    }

    // ─── 단건 조회 ───────────────────────────────────────────────────
    public CourseResponseDto findById(Long courseId) {
        return new CourseResponseDto(getCourse(courseId));
    }

    // ─── 수강 중인 강의 목록 (수강생용) ──────────────────────────────
    public List<CourseResponseDto> findEnrolled(Long userId) {
        return courseRepository.findEnrolledCoursesByUserId(userId).stream()
                .map(CourseResponseDto::new).toList();
    }

    // ─── 강사의 개설 강의 목록 + 채점 대기 배지 ──────────────────────
    public List<CourseResponseDto> findByInstructor(Long instructorId) {
        List<Course> courses = courseRepository.findByInstructorId(instructorId);
        if (courses.isEmpty()) {
            return List.of();
        }
        List<Long> ids = courses.stream().map(Course::getId).toList();
        Map<Long, Long> pendingByCourse = new HashMap<>();
        for (Object[] row : submissionRepository.countPendingGroupByCourseId(ids)) {
            Long courseId = ((Number) row[0]).longValue();
            long count = ((Number) row[1]).longValue();
            pendingByCourse.put(courseId, count);
        }
        return courses.stream()
                .map(c -> new CourseResponseDto(c, pendingByCourse.getOrDefault(c.getId(), 0L)))
                .toList();
    }

    // ─── 입장 코드로 강의 찾기 ────────────────────────────────────────
    public CourseResponseDto findByAccessCode(String accessCode) {
        Course course = courseRepository.findByAccessCodeAndIsActiveTrue(accessCode.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException(
                        "입장 코드에 해당하는 강의를 찾을 수 없습니다. code=" + accessCode));
        return new CourseResponseDto(course);
    }

    // ─── 강의 비밀번호 검증 ───────────────────────────────────────────
    public Map<String, Object> verifyPassword(Long courseId, String password) {
        Course course = getCourse(courseId);
        boolean ok = course.verifyPassword(password);
        return Map.of("courseId", courseId, "valid", ok);
    }

    // ─── 수강 신청 (레거시 — EnrollmentService 위임 권장) ──────────────
    @Transactional
    public CourseResponseDto enroll(Long courseId, Long userId) {
        Course course = getCourse(courseId);
        User   user   = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. id=" + userId));
        // 새 Enrollment 생성 방식으로 전환
        // (하위 호환성 유지 — 비밀번호 검증 없이 직접 수강 신청)
        boolean alreadyEnrolled = course.getEnrollments().stream()
                .anyMatch(e -> e.getStudent().getId().equals(userId) && Boolean.TRUE.equals(e.getIsActive()));
        if (!alreadyEnrolled) {
            com.vibe.vibeback.domain.Enrollment enrollment =
                    com.vibe.vibeback.domain.Enrollment.builder()
                            .course(course)
                            .student(user)
                            .build();
            course.getEnrollments().add(enrollment);
            courseRepository.save(course);
        }
        return new CourseResponseDto(course);
    }

    // ─── 수강 취소 (레거시) ───────────────────────────────────────────
    @Transactional
    public CourseResponseDto unenroll(Long courseId, Long userId) {
        Course course = getCourse(courseId);
        course.getEnrollments().stream()
                .filter(e -> e.getStudent().getId().equals(userId))
                .forEach(e -> e.setIsActive(false));
        return new CourseResponseDto(courseRepository.save(course));
    }

    // ─── 내부 헬퍼 ───────────────────────────────────────────────────
    private Course getCourse(Long courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("강의를 찾을 수 없습니다. id=" + courseId));
    }

    private String generateUniqueAccessCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder(ACCESS_CODE_LEN);
            for (int i = 0; i < ACCESS_CODE_LEN; i++) {
                sb.append(ACCESS_CODE_CHARS.charAt(RNG.nextInt(ACCESS_CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (courseRepository.findByAccessCodeAndIsActiveTrue(code).isEmpty()) {
                return code;
            }
        }
        throw new IllegalStateException("입장 코드 생성에 실패했습니다. 다시 시도해주세요.");
    }
}
