package com.vibe.vibeback.config;

import com.vibe.vibeback.domain.User;
import com.vibe.vibeback.domain.UserRole;
import com.vibe.vibeback.domain.Course;
import com.vibe.vibeback.domain.Enrollment;
import com.vibe.vibeback.domain.FocusLog;
import com.vibe.vibeback.domain.InstructorProfile;
import com.vibe.vibeback.repository.CourseRepository;
import com.vibe.vibeback.repository.EnrollmentRepository;
import com.vibe.vibeback.repository.FocusLogRepository;
import com.vibe.vibeback.repository.InstructorProfileRepository;
import com.vibe.vibeback.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 개발·로컬용 테스트 계정 시드. 동일 이메일이 이미 있으면 건너뜀.
 * <ul>
 *   <li>{@code test@vibe.com} / {@code 1234} — STUDENT</li>
 *   <li>{@code instructor@vibe.com} / {@code 1234} — INSTRUCTOR</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements ApplicationRunner {

    private static final String STUDENT_EMAIL     = "test@vibe.com";
    private static final String INSTRUCTOR_EMAIL  = "instructor@vibe.com";
    private static final String ADMIN_EMAIL       = "admin@vibe.com";
    private static final String DEMO_PASSWORD    = "1234";

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final FocusLogRepository focusLogRepository;
    private final InstructorProfileRepository instructorProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        seedIfAbsent(
                STUDENT_EMAIL,
                "테스트학생",
                "010-0000-0001",
                UserRole.STUDENT,
                1000
        );
        seedIfAbsent(
                INSTRUCTOR_EMAIL,
                "테스트강사",
                "010-0000-0002",
                UserRole.INSTRUCTOR,
                0
        );
        seedIfAbsent(
                ADMIN_EMAIL,
                "운영자",
                "010-0000-9999",
                UserRole.ADMIN,
                0
        );
        ensureInstructorProfile();
        seedSampleStudentsAndMappings();
    }

    private void seedIfAbsent(
            String email,
            String nickname,
            String phone,
            UserRole role,
            int weeklyGoalMinutes
    ) {
        User existing = userRepository.findByEmail(email).orElse(null);
        if (existing != null) {
            boolean changed = false;

            // DB에 평문/다른 해시가 남아있어도 데모 계정은 항상 1234로 복구
            if (!passwordEncoder.matches(DEMO_PASSWORD, existing.getPassword())) {
                existing.setPassword(passwordEncoder.encode(DEMO_PASSWORD));
                changed = true;
                log.warn("시드 사용자 비밀번호 해시 불일치 감지 → 재암호화 복구: {}", email);
            }

            if (!role.equals(existing.getRole())) {
                existing.setRole(role);
                changed = true;
            }
            if (!nickname.equals(existing.getNickname())) {
                existing.setNickname(nickname);
                changed = true;
            }
            if (!phone.equals(existing.getPhone())) {
                existing.setPhone(phone);
                changed = true;
            }
            String expectedBirthDate = role == UserRole.STUDENT ? "010101" : null;
            if ((expectedBirthDate == null && existing.getBirthDate() != null)
                    || (expectedBirthDate != null && !expectedBirthDate.equals(existing.getBirthDate()))) {
                existing.setBirthDate(expectedBirthDate);
                changed = true;
            }
            if (!Integer.valueOf(weeklyGoalMinutes).equals(existing.getWeeklyGoalMinutes())) {
                existing.setWeeklyGoalMinutes(weeklyGoalMinutes);
                changed = true;
            }
            if (existing.getLoginFailCount() == null || existing.getLoginFailCount() != 0) {
                existing.setLoginFailCount(0);
                changed = true;
            }
            if (existing.getLockedUntil() != null && existing.getLockedUntil().isBefore(LocalDateTime.now())) {
                existing.setLockedUntil(null);
                changed = true;
            }

            if (changed) {
                userRepository.save(existing);
                log.info("시드 사용자 동기화 완료: {} ({})", email, role);
            }
            return;
        }
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(DEMO_PASSWORD))
                .nickname(nickname)
                .phone(phone)
                .birthDate(role == UserRole.STUDENT ? "010101" : null)
                .role(role)
                .weeklyGoalMinutes(weeklyGoalMinutes)
                .loginFailCount(0)
                .lockedUntil(null)
                .build();
        userRepository.save(user);
        log.info("시드 사용자 생성: {} ({}) — 데모 비밀번호는 애플리케이션 설정(DataLoader) 참고", email, role);
    }

    /**
     * 테스트용 샘플:
     * - 강사 1명(instructor@vibe.com)
     * - 학생 5명(sample1~5@vibe.com, birthDate=01010X)
     * - 강의 1개(VIBE01) + 학생 5명 수강 매핑 + 간단 focus 로그
     */
    private void seedSampleStudentsAndMappings() {
        User instructor = userRepository.findByEmail(INSTRUCTOR_EMAIL).orElse(null);
        if (instructor == null) return;

        Course course = courseRepository.findByAccessCodeAndIsActiveTrue("VIBE01").orElseGet(() ->
                courseRepository.save(Course.builder()
                        .title("운영 샘플 강의")
                        .description("강사 관제탑 테스트용 샘플 강의")
                        .instructor(instructor)
                        .instructorName(instructor.getNickname())
                        .category("샘플")
                        .schedule("월수금 20:00")
                        .accessCode("VIBE01")
                        .sessionType("LIVE")
                        .build())
        );

        for (int i = 1; i <= 5; i++) {
            final int idx = i;
            String email = "sample" + i + "@vibe.com";
            String birth = "01010" + i;
            User student = userRepository.findByEmail(email).orElseGet(() ->
                    userRepository.save(User.builder()
                            .email(email)
                            .password(passwordEncoder.encode(DEMO_PASSWORD))
                            .nickname("샘플학생" + idx)
                            .phone("010-1111-000" + idx)
                            .birthDate(birth)
                            .role(UserRole.STUDENT)
                            .weeklyGoalMinutes(600)
                            .build())
            );
            if (!birth.equals(student.getBirthDate())) {
                student.setBirthDate(birth);
                userRepository.save(student);
            }
            Enrollment enrollment = enrollmentRepository
                    .findByCourseIdAndStudentId(course.getId(), student.getId())
                    .orElseGet(() -> enrollmentRepository.save(Enrollment.builder()
                            .course(course)
                            .student(student)
                            .isActive(true)
                            .build()));
            if (!Boolean.TRUE.equals(enrollment.getIsActive())) {
                enrollment.setIsActive(true);
                enrollmentRepository.save(enrollment);
            }
            if (focusLogRepository.findTop1ByUserIdAndCourseIdOrderBySessionDateDesc(student.getId(), course.getId()).isEmpty()) {
                focusLogRepository.save(FocusLog.builder()
                        .user(student)
                        .course(course)
                        .overallScore(50.0 + (i * 8))
                        .minuteScoresJson("[42,55,63,70," + (50 + i * 8) + "]")
                        .sessionType("LIVE")
                        .totalMinutes(5)
                        .focusedMinutes(3)
                        .drowsyMinutes(1)
                        .awayMinutes(1)
                        .sessionDate(java.time.LocalDateTime.now().minusMinutes(i))
                        .build());
            }
        }
    }

    private void ensureInstructorProfile() {
        User instructor = userRepository.findByEmail(INSTRUCTOR_EMAIL).orElse(null);
        if (instructor == null) return;
        instructorProfileRepository.findByUserId(instructor.getId()).orElseGet(() ->
                instructorProfileRepository.save(InstructorProfile.builder()
                        .user(instructor)
                        .specialty("집중도 코칭")
                        .careerYears(5)
                        .bio("테스트 강사용 기본 프로필")
                        .forcePwChange(false)
                        .isVerified(true)
                        .build())
        );
    }
}
