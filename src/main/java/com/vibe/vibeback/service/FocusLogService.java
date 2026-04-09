package com.vibe.vibeback.service;

import com.vibe.vibeback.domain.Course;
import com.vibe.vibeback.domain.Enrollment;
import com.vibe.vibeback.domain.FocusLog;
import com.vibe.vibeback.domain.User;
import com.vibe.vibeback.dto.FocusLogRequestDto;
import com.vibe.vibeback.dto.FocusLogResponseDto;
import com.vibe.vibeback.repository.CourseRepository;
import com.vibe.vibeback.repository.EnrollmentRepository;
import com.vibe.vibeback.repository.FocusLogRepository;
import com.vibe.vibeback.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FocusLogService {

    private final FocusLogRepository    focusLogRepository;
    private final UserRepository        userRepository;
    private final CourseRepository      courseRepository;
    private final EnrollmentRepository  enrollmentRepository;   // ← Enrollment 동기화용

    // ─── 몰입 로그 저장 + Enrollment 누적 동기화 ─────────────────────
    @Transactional
    public FocusLogResponseDto save(FocusLogRequestDto dto) {
        validateScore(dto.getOverallScore());

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "사용자를 찾을 수 없습니다. id=" + dto.getUserId()));

        Course course = null;
        if (dto.getCourseId() != null) {
            course = courseRepository.findById(dto.getCourseId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "강의를 찾을 수 없습니다. id=" + dto.getCourseId()));
        }

        // ① FocusLog 저장
        FocusLog log = FocusLog.builder()
                .user(user)
                .course(course)
                .overallScore(dto.getOverallScore())
                .minuteScoresJson(dto.getMinuteScoresJson())
                .reviewTimestampsJson(dto.getReviewTimestampsJson())  // 복습 타임스탬프
                .totalMinutes(dto.getTotalMinutes())
                .focusedMinutes(dto.getFocusedMinutes())
                .drowsyMinutes(dto.getDrowsyMinutes())
                .awayMinutes(dto.getAwayMinutes())
                .sessionType(dto.getSessionType() != null ? dto.getSessionType() : "VOD")
                .sessionDate(LocalDateTime.now())
                .build();

        FocusLog saved = focusLogRepository.save(log);

        // ② Enrollment 누적 동기화 (강의 수강 중인 경우)
        //    — 세션 종료마다 수강생의 cumulativeFocusScore, totalStudyMinutes 갱신
        if (course != null) {
            enrollmentRepository
                    .findByCourseIdAndStudentId(course.getId(), user.getId())
                    .ifPresent(enrollment -> {
                        enrollment.updateFocusScore(dto.getOverallScore());
                        if (dto.getTotalMinutes() != null) {
                            enrollment.addStudyMinutes(dto.getTotalMinutes());
                        }
                        enrollmentRepository.save(enrollment);
                    });
        }

        return new FocusLogResponseDto(saved);
    }

    // ─── 개인 몰입 이력 조회 ───────────────────────────────────────
    public List<FocusLogResponseDto> findByUser(Long userId) {
        return focusLogRepository.findByUserId(userId).stream()
                .map(FocusLogResponseDto::new).toList();
    }

    // ─── 강의별 몰입 이력 (강사용) ────────────────────────────────
    public List<FocusLogResponseDto> findByCourse(Long courseId) {
        return focusLogRepository.findByCourseId(courseId).stream()
                .map(FocusLogResponseDto::new).toList();
    }

    // ─── 강사용: 클래스 평균 몰입도 요약 ─────────────────────────
    public Map<String, Object> getCourseStats(Long courseId) {
        Double avgScore    = focusLogRepository.avgOverallScoreByCourseId(courseId);
        List<FocusLog> logs = focusLogRepository.findByCourseId(courseId);

        double avgFocused = logs.stream()
                .filter(l -> l.getTotalMinutes() != null && l.getTotalMinutes() > 0)
                .mapToDouble(FocusLog::getFocusRatio)
                .average().orElse(0.0);

        return Map.of(
                "courseId",        courseId,
                "avgOverallScore", avgScore != null ? Math.round(avgScore * 10) / 10.0 : 0.0,
                "avgFocusRatio",   Math.round(avgFocused * 10) / 10.0,
                "sessionCount",    (long) logs.size()
        );
    }

    // ─── 개인 최근 10개 조회 ──────────────────────────────────────
    public List<FocusLogResponseDto> findRecentByUser(Long userId) {
        return focusLogRepository.findTop10ByUserIdOrderBySessionDateDesc(userId).stream()
                .map(FocusLogResponseDto::new).toList();
    }

    private void validateScore(Double score) {
        if (score == null || score < 0 || score > 100) {
            throw new IllegalArgumentException("몰입도 점수는 0~100 사이여야 합니다.");
        }
    }
}
