package com.vibe.vibeback.service;

import com.vibe.vibeback.domain.Course;
import com.vibe.vibeback.domain.Enrollment;
import com.vibe.vibeback.domain.InstructorProfile;
import com.vibe.vibeback.domain.User;
import com.vibe.vibeback.domain.UserRole;
import com.vibe.vibeback.dto.AdminCourseRequestDto;
import com.vibe.vibeback.dto.AdminStatsDto;
import com.vibe.vibeback.dto.CourseRequestDto;
import com.vibe.vibeback.dto.CourseResponseDto;
import com.vibe.vibeback.dto.InstructorSummaryDto;
import com.vibe.vibeback.repository.CourseRepository;
import com.vibe.vibeback.repository.EnrollmentRepository;
import com.vibe.vibeback.repository.InstructorProfileRepository;
import com.vibe.vibeback.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final InstructorProfileRepository instructorProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public AdminStatsDto getAdminStats() {
        long studentCount = userRepository.countByRole(UserRole.STUDENT);
        long instructorCount = userRepository.countByRole(UserRole.INSTRUCTOR);
        long activeCourses = courseRepository.countByIsActiveTrue();
        return new AdminStatsDto(
                studentCount,
                instructorCount,
                activeCourses,
                "Healthy",
                LocalDateTime.now()
        );
    }

    /**
     * CSV 형식:
     * email,password,nickname,role,birthDate,phone
     */
    @Transactional
    public Map<String, Object> importUsersCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV 파일이 비어 있습니다.");
        }
        String text;
        try {
            text = new String(file.getBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalArgumentException("CSV 파일을 읽을 수 없습니다.");
        }

        String[] lines = text.split("\\R");
        int created = 0;
        int updated = 0;
        int skipped = 0;

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isBlank()) continue;
            if (i == 0 && line.toLowerCase().startsWith("email,")) continue; // header

            String[] cols = line.split(",", -1);
            if (cols.length < 4) {
                skipped++;
                continue;
            }
            String email = cols[0].trim().toLowerCase();
            String rawPw = cols[1].trim();
            String nickname = cols[2].trim();
            UserRole role;
            try {
                role = UserRole.valueOf(cols[3].trim().toUpperCase());
            } catch (Exception e) {
                skipped++;
                continue;
            }
            String birthDate = cols.length > 4 ? cols[4].trim() : null;
            String phone = cols.length > 5 ? cols[5].trim() : null;

            if (email.isBlank() || rawPw.isBlank() || nickname.isBlank()) {
                skipped++;
                continue;
            }

            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                user = User.builder()
                        .email(email)
                        .password(passwordEncoder.encode(rawPw))
                        .nickname(nickname)
                        .role(role)
                        .birthDate(birthDate != null && !birthDate.isBlank() ? birthDate : null)
                        .phone(phone != null && !phone.isBlank() ? phone : null)
                        .weeklyGoalMinutes(0)
                        .build();
                userRepository.save(user);
                created++;
            } else {
                user.setNickname(nickname);
                user.setRole(role);
                user.setBirthDate(birthDate != null && !birthDate.isBlank() ? birthDate : null);
                user.setPhone(phone != null && !phone.isBlank() ? phone : null);
                user.setPassword(passwordEncoder.encode(rawPw));
                userRepository.save(user);
                updated++;
            }
        }

        return Map.of(
                "created", created,
                "updated", updated,
                "skipped", skipped
        );
    }

    @Transactional
    public Map<String, Object> bulkEnrollStudents(Long courseId, List<Long> studentIds) {
        if (studentIds == null || studentIds.isEmpty()) {
            throw new IllegalArgumentException("studentIds가 비어 있습니다.");
        }
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("강의를 찾을 수 없습니다. id=" + courseId));

        Set<Long> requested = new HashSet<>(studentIds);
        List<Enrollment> existing = enrollmentRepository.findByCourseIdAndStudentIdIn(courseId, List.copyOf(requested));
        Map<Long, Enrollment> existingByStudent = existing.stream()
                .collect(java.util.stream.Collectors.toMap(e -> e.getStudent().getId(), e -> e, (a, b) -> a));

        int created = 0;
        int reactivated = 0;
        int skipped = 0;
        for (Long sid : requested) {
            User student = userRepository.findById(sid)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. id=" + sid));
            if (student.getRole() != UserRole.STUDENT) {
                skipped++;
                continue;
            }
            if (existingByStudent.containsKey(sid)) {
                Enrollment e = existingByStudent.get(sid);
                if (e != null && !Boolean.TRUE.equals(e.getIsActive())) {
                    e.setIsActive(true);
                    enrollmentRepository.save(e);
                    reactivated++;
                } else {
                    skipped++;
                }
                continue;
            }
            Enrollment enrollment = Enrollment.builder()
                    .course(course)
                    .student(student)
                    .isActive(true)
                    .build();
            enrollmentRepository.save(enrollment);
            created++;
            notificationService.sendAccessCode(
                    student.getPhone(),
                    course.getAccessCode(),
                    student.getNickname());
        }
        return Map.of(
                "courseId", courseId,
                "created", created,
                "reactivated", reactivated,
                "skipped", skipped
        );
    }

    /** 운영자 전용: 강의 생성 시 강사 확정 배정 */
    @Transactional
    public CourseResponseDto createCourseByAdmin(CourseRequestDto dto) {
        if (dto.getInstructorId() == null) {
            throw new IllegalArgumentException("instructorId는 필수입니다.");
        }
        User instructor = userRepository.findById(dto.getInstructorId())
                .orElseThrow(() -> new IllegalArgumentException("강사를 찾을 수 없습니다. id=" + dto.getInstructorId()));
        if (instructor.getRole() != UserRole.INSTRUCTOR) {
            throw new IllegalArgumentException("지정한 사용자는 강사가 아닙니다. id=" + dto.getInstructorId());
        }
        String accessCode = dto.getAccessCode();
        if (accessCode == null || accessCode.isBlank()) {
            accessCode = generateUniqueAccessCode();
        }
        Course course = Course.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .instructor(instructor)
                .instructorName(instructor.getNickname())
                .schedule(dto.getSchedule())
                .thumbnailUrl(dto.getThumbnailUrl())
                .category(dto.getCategory())
                .sessionType(dto.getSessionType() != null ? dto.getSessionType() : "VOD")
                .coursePassword(dto.getCoursePassword())
                .accessCode(accessCode)
                .build();
        return new CourseResponseDto(courseRepository.save(course));
    }

    // ── 강사 풀 조회 (셀렉터 드롭다운) ─────────────────────────────────

    /**
     * 강의 생성 폼 초기 로드 — 인증 완료 강사만 반환 (JOIN FETCH, N+1 없음)
     */
    public List<InstructorSummaryDto> getVerifiedInstructors() {
        return fallbackInstructorsFromUsers();
    }

    /**
     * 강사 셀렉터 실시간 검색 — keyword 로 이름·이메일·전문분야 필터
     * keyword 가 null/빈 문자열이면 전체 반환.
     */
    public List<InstructorSummaryDto> searchInstructors(String keyword) {
        String q = keyword == null ? "" : keyword.trim().toLowerCase();
        return fallbackInstructorsFromUsers().stream()
                .filter(i ->
                        q.isBlank()
                                || i.getNickname().toLowerCase().contains(q)
                                || i.getEmail().toLowerCase().contains(q)
                                || i.getSpecialty().toLowerCase().contains(q))
                .toList();
    }

    /**
     * @deprecated keyword 검색을 지원하는 searchInstructors() 사용 권장.
     *             N+1 문제가 있는 레거시 메서드로 하위 호환성 목적으로만 유지.
     */
    @Deprecated
    public List<Map<String, Object>> getInstructorOptions() {
        return getVerifiedInstructors().stream().map(s -> Map.<String, Object>of(
                "id",          s.getUserId(),
                "nickname",    s.getNickname(),
                "email",       s.getEmail(),
                "specialty",   s.getSpecialty(),
                "careerYears", s.getCareerYears(),
                "isVerified",  s.isVerified()
        )).toList();
    }

    // ── AdminCourseRequestDto 기반 강의 생성 (학생 즉시 배정 포함) ─────

    /**
     * 운영자 강의 생성 — instructor_id 필수, 학생 일괄 배정 선택
     * @Valid 검증은 컨트롤러에서 수행.
     */
    @Transactional
    public CourseResponseDto createCourseWithInstructor(AdminCourseRequestDto dto) {
        User instructor = userRepository.findById(dto.getInstructorId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "강사를 찾을 수 없습니다. id=" + dto.getInstructorId()));
        if (instructor.getRole() != UserRole.INSTRUCTOR) {
            throw new IllegalArgumentException(
                    "지정한 사용자는 강사 역할이 아닙니다. id=" + dto.getInstructorId());
        }

        String accessCode = (dto.getAccessCode() != null && !dto.getAccessCode().isBlank())
                ? dto.getAccessCode().toUpperCase()
                : generateUniqueAccessCode();

        Course course = Course.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .instructor(instructor)
                .instructorName(instructor.getNickname())
                .schedule(dto.getSchedule())
                .thumbnailUrl(dto.getThumbnailUrl())
                .category(dto.getCategory())
                .sessionType(dto.getSessionType() != null ? dto.getSessionType() : "VOD")
                .coursePassword(dto.getCoursePassword())
                .accessCode(accessCode)
                .build();
        Course saved = courseRepository.save(course);

        notificationService.sendAccessCode(
                instructor.getPhone(),
                saved.getAccessCode(),
                instructor.getNickname());

        if (dto.getStudentIds() != null && !dto.getStudentIds().isEmpty()) {
            List<Long> deduped = dto.getStudentIds().stream().distinct().toList();
            List<User> studentsToEnroll = userRepository.findAllById(deduped)
                    .stream()
                    .filter(s -> s.getRole() == UserRole.STUDENT)
                    .toList();
            List<Enrollment> toSave = studentsToEnroll.stream()
                    .map(s -> Enrollment.builder().course(saved).student(s).build())
                    .toList();
            enrollmentRepository.saveAll(toSave);
            for (User s : studentsToEnroll) {
                notificationService.sendAccessCode(s.getPhone(), saved.getAccessCode(), s.getNickname());
            }
        }

        return new CourseResponseDto(saved);
    }

    private String generateUniqueAccessCode() {
        final String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        final java.security.SecureRandom rng = new java.security.SecureRandom();
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(chars.charAt(rng.nextInt(chars.length())));
            }
            String code = sb.toString();
            if (courseRepository.findByAccessCodeAndIsActiveTrue(code).isEmpty()) {
                return code;
            }
        }
        throw new IllegalStateException("입장 코드 생성에 실패했습니다.");
    }

    private List<InstructorSummaryDto> fallbackInstructorsFromUsers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.INSTRUCTOR)
                .map(u -> {
                    InstructorProfile p = InstructorProfile.builder()
                            .user(u)
                            .specialty("")
                            .careerYears(0)
                            .isVerified(true)
                            .build();
                    return new InstructorSummaryDto(p);
                })
                .toList();
    }
}

