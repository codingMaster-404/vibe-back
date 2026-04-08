package com.vibe.vibeback.controller;

import com.vibe.vibeback.dto.EnrollmentResponseDto;
import com.vibe.vibeback.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 수강 신청(Enrollment) API
 *
 * POST   /api/enrollments                            — 수강 신청 (비밀번호 검증 포함)
 * DELETE /api/enrollments/course/{courseId}          — 수강 취소
 * GET    /api/enrollments/student/{studentId}        — 내 수강 목록 (수강생용)
 * GET    /api/enrollments/course/{courseId}/stats    — 강의별 수강 통계 (강사용)
 * PATCH  /api/enrollments/{enrollmentId}/focus       — 몰입도 누적 업데이트
 * PATCH  /api/enrollments/study-minutes              — 학습 시간 누적
 * GET    /api/enrollments/check                      — 수강 권한 확인
 */
@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    /** 수강 신청 */
    @PostMapping
    public ResponseEntity<EnrollmentResponseDto> enroll(@RequestBody Map<String, Object> body) {
        Long   courseId  = Long.valueOf(body.get("courseId").toString());
        Long   studentId = Long.valueOf(body.get("studentId").toString());
        String password  = body.containsKey("password") ? body.get("password").toString() : null;
        return ResponseEntity.ok(enrollmentService.enroll(courseId, studentId, password));
    }

    /** 수강 취소 */
    @DeleteMapping("/course/{courseId}")
    public ResponseEntity<Void> unenroll(
            @PathVariable Long courseId,
            @RequestParam Long studentId) {
        enrollmentService.unenroll(courseId, studentId);
        return ResponseEntity.noContent().build();
    }

    /** 수강생의 수강 목록 조회 */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<EnrollmentResponseDto>> getMyEnrollments(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(enrollmentService.getMyEnrollments(studentId));
    }

    /** 강의별 수강 통계 (강사용) */
    @GetMapping("/course/{courseId}/stats")
    public ResponseEntity<Map<String, Object>> getCourseStats(@PathVariable Long courseId) {
        return ResponseEntity.ok(enrollmentService.getCourseEnrollmentStats(courseId));
    }

    /** 몰입도 누적 업데이트 */
    @PatchMapping("/{enrollmentId}/focus")
    public ResponseEntity<EnrollmentResponseDto> updateFocus(
            @PathVariable Long enrollmentId,
            @RequestBody Map<String, Double> body) {
        double score = body.get("focusScore");
        return ResponseEntity.ok(enrollmentService.updateFocusScore(enrollmentId, score));
    }

    /** 학습 시간 누적 */
    @PatchMapping("/study-minutes")
    public ResponseEntity<EnrollmentResponseDto> addStudyMinutes(
            @RequestBody Map<String, Object> body) {
        Long courseId  = Long.valueOf(body.get("courseId").toString());
        Long studentId = Long.valueOf(body.get("studentId").toString());
        int  minutes   = Integer.parseInt(body.get("minutes").toString());
        return ResponseEntity.ok(enrollmentService.addStudyMinutes(courseId, studentId, minutes));
    }

    /** 수강 권한 확인 */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkEnrollment(
            @RequestParam Long courseId,
            @RequestParam Long studentId) {
        boolean enrolled = enrollmentService.isEnrolled(courseId, studentId);
        return ResponseEntity.ok(Map.of("courseId", courseId, "studentId", studentId, "enrolled", enrolled));
    }
}
