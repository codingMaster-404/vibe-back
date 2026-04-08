package com.vibe.vibeback.service;

import com.vibe.vibeback.domain.Course;
import com.vibe.vibeback.domain.Enrollment;
import com.vibe.vibeback.domain.User;
import com.vibe.vibeback.dto.EnrollmentResponseDto;
import com.vibe.vibeback.repository.AssignmentSubmissionRepository;
import com.vibe.vibeback.repository.CourseRepository;
import com.vibe.vibeback.repository.EnrollmentRepository;
import com.vibe.vibeback.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EnrollmentService {

    private final EnrollmentRepository           enrollmentRepository;
    private final CourseRepository               courseRepository;
    private final UserRepository                 userRepository;
    private final AssignmentSubmissionRepository submissionRepository;

    // ── 수강생: 내 수강 목록 ─────────────────────────────────────────
    public List<EnrollmentResponseDto> getMyEnrollments(Long studentId) {
        return enrollmentRepository.findActiveByStudentId(studentId).stream()
                .map(e -> {
                    long upcoming = submissionRepository.countUpcomingDeadlineForStudent(
                            e.getCourse().getId(), studentId);
                    return new EnrollmentResponseDto(e, upcoming);
                })
                .toList();
    }

    // ── 수강 신청 (비밀번호 검증 포함) ─────────────────────────────────
    @Transactional
    public EnrollmentResponseDto enroll(Long courseId, Long studentId, String password) {
        Course course = getCourse(courseId);
        User   student = getUser(studentId);

        // 비밀번호 검증
        if (!course.verifyPassword(password)) {
            throw new IllegalArgumentException("강의 비밀번호가 일치하지 않습니다.");
        }

        // 중복 수강 신청 체크 — 이미 존재하면 재활성화
        Enrollment enrollment = enrollmentRepository
                .findByCourseIdAndStudentId(courseId, studentId)
                .map(e -> {
                    e.setIsActive(true);
                    return e;
                })
                .orElse(Enrollment.builder()
                        .course(course)
                        .student(student)
                        .build());

        return new EnrollmentResponseDto(enrollmentRepository.save(enrollment));
    }

    // ── 수강 취소 ─────────────────────────────────────────────────────
    @Transactional
    public void unenroll(Long courseId, Long studentId) {
        Enrollment e = enrollmentRepository.findByCourseIdAndStudentId(courseId, studentId)
                .orElseThrow(() -> new IllegalArgumentException("수강 신청 정보를 찾을 수 없습니다."));
        e.setIsActive(false);
        enrollmentRepository.save(e);
    }

    // ── 몰입도 누적 업데이트 ───────────────────────────────────────────
    @Transactional
    public EnrollmentResponseDto updateFocusScore(Long enrollmentId, double newScore) {
        Enrollment e = getEnrollment(enrollmentId);
        e.updateFocusScore(newScore);
        return new EnrollmentResponseDto(enrollmentRepository.save(e));
    }

    // ── 학습 시간 누적 ──────────────────────────────────────────────────
    @Transactional
    public EnrollmentResponseDto addStudyMinutes(Long courseId, Long studentId, int minutes) {
        Enrollment e = enrollmentRepository.findByCourseIdAndStudentId(courseId, studentId)
                .orElseThrow(() -> new IllegalArgumentException("수강 신청 정보를 찾을 수 없습니다."));
        e.addStudyMinutes(minutes);
        return new EnrollmentResponseDto(enrollmentRepository.save(e));
    }

    // ── 강의별 전체 통계 (강사용) ─────────────────────────────────────
    public Map<String, Object> getCourseEnrollmentStats(Long courseId) {
        var enrollments = enrollmentRepository.findActiveByCourseId(courseId);
        double avgFocus = enrollmentRepository.avgFocusScoreByCourseId(courseId) != null
                ? enrollmentRepository.avgFocusScoreByCourseId(courseId) : 0.0;
        int totalStudents = enrollments.size();
        double avgStudyMinutes = enrollments.stream()
                .mapToInt(e -> e.getTotalStudyMinutes() != null ? e.getTotalStudyMinutes() : 0)
                .average().orElse(0.0);

        return Map.of(
                "courseId",         courseId,
                "totalStudents",    totalStudents,
                "avgFocusScore",    Math.round(avgFocus * 10.0) / 10.0,
                "avgStudyMinutes",  Math.round(avgStudyMinutes)
        );
    }

    // ── 수강 접근 권한 확인 ───────────────────────────────────────────
    public boolean isEnrolled(Long courseId, Long studentId) {
        return enrollmentRepository.existsByCourseIdAndStudentIdAndIsActiveTrue(courseId, studentId);
    }

    // ── 내부 헬퍼 ──────────────────────────────────────────────────────
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
}
