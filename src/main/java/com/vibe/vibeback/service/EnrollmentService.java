package com.vibe.vibeback.service;

import com.vibe.vibeback.domain.Course;
import com.vibe.vibeback.domain.Enrollment;
import com.vibe.vibeback.domain.FocusLog;
import com.vibe.vibeback.domain.User;
import com.vibe.vibeback.dto.EnrollmentResponseDto;
import com.vibe.vibeback.dto.StudentFocusDto;
import com.vibe.vibeback.exception.AccessDeniedException;
import com.vibe.vibeback.repository.AssignmentSubmissionRepository;
import com.vibe.vibeback.repository.CourseRepository;
import com.vibe.vibeback.repository.EnrollmentRepository;
import com.vibe.vibeback.repository.FocusLogRepository;
import com.vibe.vibeback.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EnrollmentService {

    private final EnrollmentRepository           enrollmentRepository;
    private final CourseRepository               courseRepository;
    private final UserRepository                 userRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final FocusLogRepository             focusLogRepository;

    // ── 수강생: 내 수강 목록 ─────────────────────────────────────────
    public List<EnrollmentResponseDto> getMyEnrollments(Long studentId) {
        List<Enrollment> enrollments = enrollmentRepository.findActiveByStudentId(studentId);
        if (enrollments.isEmpty()) {
            return List.of();
        }
        List<Long> courseIds = enrollments.stream()
                .map(e -> e.getCourse().getId())
                .distinct()
                .toList();
        Map<Long, Long> upcomingByCourse = new HashMap<>();
        for (Object[] row : submissionRepository.countUpcomingDeadlineGroupByCourseId(courseIds, studentId)) {
            upcomingByCourse.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }
        return enrollments.stream()
                .map(e -> new EnrollmentResponseDto(e,
                        upcomingByCourse.getOrDefault(e.getCourse().getId(), 0L)))
                .toList();
    }

    // ── 수강 신청 (비밀번호 검증 포함) ──────────────────────────────
    @Transactional
    public EnrollmentResponseDto enroll(Long courseId, Long studentId, String password) {
        Course course  = getCourse(courseId);
        User   student = getUser(studentId);

        if (!course.verifyPassword(password)) {
            throw new IllegalArgumentException("강의 비밀번호가 일치하지 않습니다.");
        }

        Enrollment enrollment = enrollmentRepository
                .findByCourseIdAndStudentId(courseId, studentId)
                .map(e -> { e.setIsActive(true); return e; })
                .orElse(Enrollment.builder().course(course).student(student).build());

        return new EnrollmentResponseDto(enrollmentRepository.save(enrollment));
    }

    // ── 수강 취소 ────────────────────────────────────────────────────
    @Transactional
    public void unenroll(Long courseId, Long studentId) {
        Enrollment e = enrollmentRepository.findByCourseIdAndStudentId(courseId, studentId)
                .orElseThrow(() -> new IllegalArgumentException("수강 신청 정보를 찾을 수 없습니다."));
        e.setIsActive(false);
        enrollmentRepository.save(e);
    }

    // ── 몰입도 누적 업데이트 ─────────────────────────────────────────
    @Transactional
    public EnrollmentResponseDto updateFocusScore(Long enrollmentId, double newScore) {
        Enrollment e = getEnrollment(enrollmentId);
        e.updateFocusScore(newScore);
        return new EnrollmentResponseDto(enrollmentRepository.save(e));
    }

    // ── 학습 시간 누적 ───────────────────────────────────────────────
    @Transactional
    public EnrollmentResponseDto addStudyMinutes(Long courseId, Long studentId, int minutes) {
        Enrollment e = enrollmentRepository.findByCourseIdAndStudentId(courseId, studentId)
                .orElseThrow(() -> new IllegalArgumentException("수강 신청 정보를 찾을 수 없습니다."));
        e.addStudyMinutes(minutes);
        return new EnrollmentResponseDto(enrollmentRepository.save(e));
    }

    // ── 강의별 수강생 명단 + 몰입도 신호등 (강사용) ─────────────────
    public List<StudentFocusDto> getStudentRoster(Long courseId, Long instructorId) {
        verifyInstructorOwnership(courseId, instructorId);
        return enrollmentRepository.findActiveByCourseId(courseId).stream()
                .map(StudentFocusDto::new)
                .toList();
    }

    // ── 강의별 전체 통계 (강사용) ────────────────────────────────────
    public Map<String, Object> getCourseEnrollmentStats(Long courseId, Long instructorId) {
        verifyInstructorOwnership(courseId, instructorId);
        List<Enrollment> enrollments = enrollmentRepository.findActiveByCourseId(courseId);
        return buildEnrollmentStats(courseId, enrollments);
    }

    /**
     * 강사 대시보드: 개설 강의 전체에 대한 수강 통계를 한 번의 수강 조회로 계산
     * (기존: 강의마다 GET /enrollments/course/{id}/stats 호출)
     */
    public Map<Long, Map<String, Object>> getBulkCourseEnrollmentStats(Long instructorId) {
        List<Course> courses = courseRepository.findByInstructorId(instructorId);
        if (courses.isEmpty()) {
            return new LinkedHashMap<>();
        }
        List<Long> ids = courses.stream().map(Course::getId).toList();
        List<Enrollment> all = enrollmentRepository.findActiveByCourseIdIn(ids);
        Map<Long, List<Enrollment>> byCourse = all.stream()
                .collect(Collectors.groupingBy(e -> e.getCourse().getId()));
        Map<Long, Map<String, Object>> out = new LinkedHashMap<>();
        for (Course c : courses) {
            out.put(c.getId(), buildEnrollmentStats(c.getId(), byCourse.getOrDefault(c.getId(), List.of())));
        }
        return out;
    }

    /**
     * 강사 관제탑: 강사가 개설한 강의의 수강생 카드를 그리기 위한 데이터.
     * 카드 색상은 currentFocusScore(최근 overallScore 기준)로 결정한다.
     */
    public List<Map<String, Object>> getInstructorMonitorGrid(Long instructorId) {
        List<Course> courses = courseRepository.findByInstructorId(instructorId);
        if (courses.isEmpty()) return List.of();

        List<Map<String, Object>> cards = new java.util.ArrayList<>();
        for (Course course : courses) {
            List<Enrollment> enrollments = enrollmentRepository.findActiveByCourseId(course.getId());
            for (Enrollment e : enrollments) {
                User s = e.getStudent();
                Optional<FocusLog> lastLogOpt = focusLogRepository
                        .findTop1ByUserIdAndCourseIdOrderBySessionDateDesc(s.getId(), course.getId());
                double current = lastLogOpt.map(FocusLog::getOverallScore).orElse(0.0);
                List<Double> trend = lastLogOpt
                        .map(log -> extractRecentTrend(log.getMinuteScoresJson()))
                        .orElse(List.of());
                cards.add(Map.of(
                        "courseId", course.getId(),
                        "courseTitle", course.getTitle(),
                        "studentId", s.getId(),
                        "nickname", s.getNickname(),
                        "birthDate", s.getBirthDate(),
                        "currentFocusScore", Math.round(current * 10.0) / 10.0,
                        "trend5m", trend
                ));
            }
        }
        return cards;
    }

    private static List<Double> extractRecentTrend(String minuteScoresJson) {
        if (minuteScoresJson == null || minuteScoresJson.isBlank()) return List.of();
        String body = minuteScoresJson.trim();
        if (body.startsWith("[")) body = body.substring(1);
        if (body.endsWith("]")) body = body.substring(0, body.length() - 1);
        if (body.isBlank()) return List.of();
        String[] toks = body.split(",");
        int start = Math.max(0, toks.length - 5);
        List<Double> out = new java.util.ArrayList<>();
        for (int i = start; i < toks.length; i++) {
            try {
                out.add(Double.parseDouble(toks[i].trim()));
            } catch (NumberFormatException ignore) {
                // skip malformed token
            }
        }
        return out;
    }

    private static Map<String, Object> buildEnrollmentStats(Long courseId, List<Enrollment> enrollments) {
        double avgFocus = enrollments.stream()
                .filter(e -> e.getCumulativeFocusScore() != null)
                .mapToDouble(Enrollment::getCumulativeFocusScore)
                .average().orElse(0.0);
        double avgStudyMinutes = enrollments.stream()
                .mapToInt(e -> e.getTotalStudyMinutes() != null ? e.getTotalStudyMinutes() : 0)
                .average().orElse(0.0);
        long underperformingCount = enrollments.stream()
                .filter(e -> e.getCumulativeFocusScore() != null && e.getCumulativeFocusScore() < 40)
                .count();
        return Map.of(
                "courseId", courseId,
                "totalStudents", enrollments.size(),
                "avgFocusScore", Math.round(avgFocus * 10.0) / 10.0,
                "avgStudyMinutes", (long) Math.round(avgStudyMinutes),
                "underperformingCount", underperformingCount
        );
    }

    // ── 수강 권한 확인 ───────────────────────────────────────────────
    public boolean isEnrolled(Long courseId, Long studentId) {
        return enrollmentRepository.existsByCourseIdAndStudentIdAndIsActiveTrue(courseId, studentId);
    }

    // ── 내부 헬퍼 ────────────────────────────────────────────────────
    private Course getCourse(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("강의를 찾을 수 없습니다. id=" + id));
    }
    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. id=" + id));
    }
    private Enrollment getEnrollment(Long id) {
        return enrollmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("수강 신청 정보를 찾을 수 없습니다. id=" + id));
    }

    private void verifyInstructorOwnership(Long courseId, Long instructorId) {
        if (instructorId == null) {
            throw new AccessDeniedException("강사 식별 정보가 필요합니다.");
        }
        Course course = getCourse(courseId);
        Long ownerId = course.getInstructor() != null ? course.getInstructor().getId() : null;
        if (ownerId == null || !ownerId.equals(instructorId)) {
            throw new AccessDeniedException("본인 강의가 아니므로 접근할 수 없습니다.");
        }
    }
}
