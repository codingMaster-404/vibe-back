package com.vibe.vibeback.controller;

import com.vibe.vibeback.dto.AdminCourseRequestDto;
import com.vibe.vibeback.dto.AdminStatsDto;
import com.vibe.vibeback.dto.CourseResponseDto;
import com.vibe.vibeback.dto.InstructorSummaryDto;
import com.vibe.vibeback.dto.NotificationLogDto;
import com.vibe.vibeback.service.AdminService;
import com.vibe.vibeback.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final NotificationService notificationService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getAdminStats());
    }

    /** 운영자: SMS 대체 발송 이력 (인메모리) */
    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationLogDto>> getNotifications(
            @RequestParam(defaultValue = "40") int limit) {
        return ResponseEntity.ok(notificationService.getRecent(limit));
    }

    @PostMapping("/users/import-csv")
    public ResponseEntity<Map<String, Object>> importUsersCsv(
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(adminService.importUsersCsv(file));
    }

    /** 운영자: 특정 강의에 학생 벌크 매핑 */
    @PostMapping("/courses/{courseId}/enrollments/bulk")
    public ResponseEntity<Map<String, Object>> bulkEnrollStudents(
            @PathVariable Long courseId,
            @RequestBody Map<String, List<Long>> body
    ) {
        List<Long> studentIds = body.getOrDefault("studentIds", List.of());
        return ResponseEntity.ok(adminService.bulkEnrollStudents(courseId, studentIds));
    }

    /**
     * 운영자: 강사 풀 조회 (강의 개설 셀렉터용)
     *
     * GET /api/admin/instructors              → 인증 완료 강사 전체
     * GET /api/admin/instructors?keyword=스프링 → 이름·이메일·전문분야 검색
     */
    @GetMapping("/instructors")
    public ResponseEntity<List<InstructorSummaryDto>> getInstructors(
            @RequestParam(required = false) String keyword) {
        List<InstructorSummaryDto> result = (keyword == null || keyword.isBlank())
                ? adminService.getVerifiedInstructors()
                : adminService.searchInstructors(keyword);
        return ResponseEntity.ok(result);
    }

    /**
     * 운영자: 강의 개설 — instructorId 필수, 학생 즉시 배정 선택
     *
     * POST /api/admin/courses
     * Body: AdminCourseRequestDto (title·instructorId 필수, studentIds 선택)
     */
    @PostMapping("/courses")
    public ResponseEntity<CourseResponseDto> createCourse(
            @Valid @RequestBody AdminCourseRequestDto body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createCourseWithInstructor(body));
    }
}

