package com.vibe.vibeback.controller;

import com.vibe.vibeback.dto.UserRequestDto;
import com.vibe.vibeback.dto.UserResponseDto;
import com.vibe.vibeback.dto.WeeklyProgressDto;
import com.vibe.vibeback.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ─────────────────────────────────────────
    //  POST /api/users/register  — 회원가입
    // ─────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<UserResponseDto> register(@RequestBody UserRequestDto dto) {
        UserResponseDto response = userService.register(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─────────────────────────────────────────
    //  GET /api/users  — 전체 사용자 목록
    // ─────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<UserResponseDto>> findAll() {
        return ResponseEntity.ok(userService.findAll());
    }

    // ─────────────────────────────────────────
    //  GET /api/users/{userId}  — 단건 조회
    // ─────────────────────────────────────────
    @GetMapping("/{userId}")
    public ResponseEntity<UserResponseDto> findById(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.findById(userId));
    }

    // ─────────────────────────────────────────
    //  GET /api/users/{userId}/weekly-progress
    //  — 이번 주 학습 목표 달성률
    // ─────────────────────────────────────────
    @GetMapping("/{userId}/weekly-progress")
    public ResponseEntity<WeeklyProgressDto> getWeeklyProgress(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getWeeklyProgress(userId));
    }

    // ─────────────────────────────────────────
    //  GET /api/users/{userId}/weekly-progress?date=2024-01-15
    //  — 특정 날짜가 속한 주의 달성률
    // ─────────────────────────────────────────
    @GetMapping("/{userId}/weekly-progress/by-date")
    public ResponseEntity<WeeklyProgressDto> getWeeklyProgressByDate(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(userService.getWeeklyProgressByDate(userId, date));
    }

    // ─────────────────────────────────────────
    //  PATCH /api/users/{userId}/weekly-goal
    //  — 주간 목표 학습 시간 수정
    // ─────────────────────────────────────────
    @PatchMapping("/{userId}/weekly-goal")
    public ResponseEntity<UserResponseDto> updateWeeklyGoal(
            @PathVariable Long userId,
            @RequestParam Integer minutes) {
        return ResponseEntity.ok(userService.updateWeeklyGoal(userId, minutes));
    }
}
