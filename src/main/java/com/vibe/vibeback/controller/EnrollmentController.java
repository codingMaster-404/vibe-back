package com.vibe.vibeback.controller;

import com.vibe.vibeback.dto.EnrollmentResponseDto;
import com.vibe.vibeback.dto.StudentFocusDto;
import com.vibe.vibeback.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 수강 신청(Enrollment) API
 *
 * POST   /api/enrollments                               — 수강 신청 (비밀번호 검증)
 * DELETE /api/enrollments/course/{courseId}             — 수강 취소
 * GET    /api/enrollments/student/{studentId}           — 내 수강 목록 (수강생용)
 * GET    /api/enrollments/course/{courseId}/students?instructorId=1 — 수강생 명단 + 신호등 (강사용, 소유권 검증)
 * GET    /api/enrollments/course/{courseId}/stats?instructorId=1    — 강의별 수강 통계 (강사용, 소유권 검증)
 * GET    /api/enrollments/instructor/{instructorId}/courses-stats — 강사 개설 강의 통계 일괄
 * GET    /api/enrollments/instructor/{instructorId}/monitor-grid  — 강사 관제탑 카드 데이터
 * PATCH  /api/enrollments/{enrollmentId}/focus          — 몰입도 누적 업데이트
 * PATCH  /api/enrollments/study-minutes                 — 학습 시간 누적
 * GET    /api/enrollments/check                         — 수강 권한 확인
 */
@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    /** 수강 신청 (비밀번호 포함) */
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
            @PathVariable Long courseId, @RequestParam Long studentId) {
        enrollmentService.unenroll(courseId, studentId);
        return ResponseEntity.noContent().build();
    }

    /** 내 수강 목록 (수강생 대시보드용) */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<EnrollmentResponseDto>> getMyEnrollments(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(enrollmentService.getMyEnrollments(studentId));
    }

    /**
     * 수강생 명단 + AI 몰입도 신호등 (강사 전용)
     * 응답: [{studentId, nickname, phone, cumulativeFocusScore, focusSignal, isUnderperforming, ...}]
     */
    @GetMapping("/course/{courseId}/students")
    public ResponseEntity<List<StudentFocusDto>> getStudentRoster(
            @PathVariable Long courseId,
            @RequestParam Long instructorId) {
        return ResponseEntity.ok(enrollmentService.getStudentRoster(courseId, instructorId));
    }

    /** 강의별 수강 통계 (강사 대시보드용) */
    @GetMapping("/course/{courseId}/stats")
    public ResponseEntity<Map<String, Object>> getCourseStats(
            @PathVariable Long courseId,
            @RequestParam Long instructorId) {
        return ResponseEntity.ok(enrollmentService.getCourseEnrollmentStats(courseId, instructorId));
    }

    /** 강사 개설 강의 전체 수강 통계 일괄 (대시보드 N회 호출 방지) */
    @GetMapping("/instructor/{instructorId}/courses-stats")
    public ResponseEntity<Map<Long, Map<String, Object>>> getInstructorCoursesStats(
            @PathVariable Long instructorId) {
        return ResponseEntity.ok(enrollmentService.getBulkCourseEnrollmentStats(instructorId));
    }

    /** 강사 관제탑 카드 데이터 (수강생별 현재 점수 + 최근 5분 추세) */
    @GetMapping("/instructor/{instructorId}/monitor-grid")
    public ResponseEntity<List<Map<String, Object>>> getInstructorMonitorGrid(
            @PathVariable Long instructorId) {
        return ResponseEntity.ok(enrollmentService.getInstructorMonitorGrid(instructorId));
    }

    /** 몰입도 누적 업데이트 */
    @PatchMapping("/{enrollmentId}/focus")
    public ResponseEntity<EnrollmentResponseDto> updateFocus(
            @PathVariable Long enrollmentId,
            @RequestBody Map<String, Double> body) {
        return ResponseEntity.ok(enrollmentService.updateFocusScore(enrollmentId, body.get("focusScore")));
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
            @RequestParam Long courseId, @RequestParam Long studentId) {
        boolean enrolled = enrollmentService.isEnrolled(courseId, studentId);
        return ResponseEntity.ok(Map.of("courseId", courseId, "studentId", studentId, "enrolled", enrolled));
    }
}
