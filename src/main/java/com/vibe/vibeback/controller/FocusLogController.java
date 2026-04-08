package com.vibe.vibeback.controller;

import com.vibe.vibeback.dto.FocusLogRequestDto;
import com.vibe.vibeback.dto.FocusLogResponseDto;
import com.vibe.vibeback.service.FocusLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/focus-logs")
@RequiredArgsConstructor
public class FocusLogController {

    private final FocusLogService focusLogService;

    // POST  /api/focus-logs             — 몰입 로그 저장 (세션 종료 시)
    @PostMapping
    public ResponseEntity<FocusLogResponseDto> save(@RequestBody FocusLogRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(focusLogService.save(dto));
    }

    // GET   /api/focus-logs/user/{userId}  — 개인 몰입 이력
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<FocusLogResponseDto>> findByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(focusLogService.findByUser(userId));
    }

    // GET   /api/focus-logs/user/{userId}/recent — 최근 10개
    @GetMapping("/user/{userId}/recent")
    public ResponseEntity<List<FocusLogResponseDto>> findRecent(@PathVariable Long userId) {
        return ResponseEntity.ok(focusLogService.findRecentByUser(userId));
    }

    // GET   /api/focus-logs/course/{courseId}     — 강의별 전체 로그 (강사용)
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<FocusLogResponseDto>> findByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(focusLogService.findByCourse(courseId));
    }

    // GET   /api/focus-logs/course/{courseId}/stats — 클래스 평균 몰입도 요약 (강사용)
    @GetMapping("/course/{courseId}/stats")
    public ResponseEntity<Map<String, Object>> getCourseStats(@PathVariable Long courseId) {
        return ResponseEntity.ok(focusLogService.getCourseStats(courseId));
    }
}
