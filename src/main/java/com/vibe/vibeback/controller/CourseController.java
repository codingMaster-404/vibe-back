package com.vibe.vibeback.controller;

import com.vibe.vibeback.dto.CourseRequestDto;
import com.vibe.vibeback.dto.CourseResponseDto;
import com.vibe.vibeback.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    // POST   /api/courses                    — 강의 개설 (강사용)
    @PostMapping
    public ResponseEntity<CourseResponseDto> create(@RequestBody CourseRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.create(dto));
    }

    // GET    /api/courses                    — 전체 강의 목록
    @GetMapping
    public ResponseEntity<List<CourseResponseDto>> findAll() {
        return ResponseEntity.ok(courseService.findAll());
    }

    // GET    /api/courses/{courseId}         — 강의 단건 조회
    @GetMapping("/{courseId}")
    public ResponseEntity<CourseResponseDto> findById(@PathVariable Long courseId) {
        return ResponseEntity.ok(courseService.findById(courseId));
    }

    // GET    /api/courses/enrolled?userId={userId}  — 수강 중인 강의 목록 (수강생용 레거시)
    @GetMapping("/enrolled")
    public ResponseEntity<List<CourseResponseDto>> findEnrolled(@RequestParam Long userId) {
        return ResponseEntity.ok(courseService.findEnrolled(userId));
    }

    // GET    /api/courses/instructor/{instructorId} — 강사의 개설 강의 목록 + 채점 대기 배지
    @GetMapping("/instructor/{instructorId}")
    public ResponseEntity<List<CourseResponseDto>> findByInstructor(@PathVariable Long instructorId) {
        return ResponseEntity.ok(courseService.findByInstructor(instructorId));
    }

    // GET    /api/courses/access-code/{code}        — 입장 코드로 강의 찾기
    @GetMapping("/access-code/{code}")
    public ResponseEntity<CourseResponseDto> findByAccessCode(@PathVariable String code) {
        return ResponseEntity.ok(courseService.findByAccessCode(code));
    }

    // POST   /api/courses/{courseId}/verify-password — 강의 비밀번호 검증
    @PostMapping("/{courseId}/verify-password")
    public ResponseEntity<Map<String, Object>> verifyPassword(
            @PathVariable Long courseId,
            @RequestBody Map<String, String> body) {
        String password = body.getOrDefault("password", "");
        return ResponseEntity.ok(courseService.verifyPassword(courseId, password));
    }

    // POST   /api/courses/{courseId}/enroll?userId={userId}  — 수강 신청 (레거시)
    @PostMapping("/{courseId}/enroll")
    public ResponseEntity<CourseResponseDto> enroll(
            @PathVariable Long courseId, @RequestParam Long userId) {
        return ResponseEntity.ok(courseService.enroll(courseId, userId));
    }

    // DELETE /api/courses/{courseId}/enroll?userId={userId}  — 수강 취소 (레거시)
    @DeleteMapping("/{courseId}/enroll")
    public ResponseEntity<CourseResponseDto> unenroll(
            @PathVariable Long courseId, @RequestParam Long userId) {
        return ResponseEntity.ok(courseService.unenroll(courseId, userId));
    }
}
