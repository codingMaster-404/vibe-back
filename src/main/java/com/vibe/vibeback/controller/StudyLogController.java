package com.vibe.vibeback.controller;

import com.vibe.vibeback.dto.StudyLogRequestDto;
import com.vibe.vibeback.dto.StudyLogResponseDto;
import com.vibe.vibeback.service.StudyLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/study-logs")
@RequiredArgsConstructor
public class StudyLogController {

    private final StudyLogService studyLogService;

    // ─────────────────────────────────────────
    //  POST /api/study-logs  — 학습 로그 등록
    // ─────────────────────────────────────────
    @PostMapping
    public ResponseEntity<StudyLogResponseDto> create(@RequestBody StudyLogRequestDto dto) {
        StudyLogResponseDto response = studyLogService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─────────────────────────────────────────
    //  GET /api/study-logs  — 전체 로그 목록
    // ─────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<StudyLogResponseDto>> findAll() {
        return ResponseEntity.ok(studyLogService.findAll());
    }

    // ─────────────────────────────────────────
    //  GET /api/study-logs/{logId}  — 단건 조회
    // ─────────────────────────────────────────
    @GetMapping("/{logId}")
    public ResponseEntity<StudyLogResponseDto> findById(@PathVariable Long logId) {
        return ResponseEntity.ok(studyLogService.findById(logId));
    }

    // ─────────────────────────────────────────
    //  GET /api/study-logs/user/{userId}
    //  — 특정 사용자의 로그 목록
    // ─────────────────────────────────────────
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<StudyLogResponseDto>> findByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(studyLogService.findByUser(userId));
    }

    // ─────────────────────────────────────────
    //  DELETE /api/study-logs/{logId}  — 로그 삭제
    // ─────────────────────────────────────────
    @DeleteMapping("/{logId}")
    public ResponseEntity<Void> delete(@PathVariable Long logId) {
        studyLogService.delete(logId);
        return ResponseEntity.noContent().build();
    }
}
