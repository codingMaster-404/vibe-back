package com.vibe.vibeback.controller;

import com.vibe.vibeback.dto.AssignmentRequestDto;
import com.vibe.vibeback.dto.AssignmentResponseDto;
import com.vibe.vibeback.dto.AssignmentSubmissionResponseDto;
import com.vibe.vibeback.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    // POST   /api/assignments                           — 과제 생성 (강사)
    @PostMapping
    public ResponseEntity<AssignmentResponseDto> create(@RequestBody AssignmentRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assignmentService.create(dto));
    }

    // GET    /api/assignments?courseId={courseId}       — 강의별 과제 목록
    @GetMapping
    public ResponseEntity<List<AssignmentResponseDto>> findByCourse(@RequestParam Long courseId) {
        return ResponseEntity.ok(assignmentService.findByCourse(courseId));
    }

    // GET    /api/assignments/{assignmentId}            — 과제 단건 조회
    @GetMapping("/{assignmentId}")
    public ResponseEntity<AssignmentResponseDto> findById(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(assignmentService.findById(assignmentId));
    }

    // POST   /api/assignments/{assignmentId}/submit     — 과제 제출 (파일 업로드)
    @PostMapping(value = "/{assignmentId}/submit", consumes = "multipart/form-data")
    public ResponseEntity<AssignmentSubmissionResponseDto> submit(
            @PathVariable Long assignmentId,
            @RequestParam Long studentId,
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assignmentService.submit(assignmentId, studentId, file));
    }

    // GET    /api/assignments/{assignmentId}/submissions — 제출물 목록 (강사)
    @GetMapping("/{assignmentId}/submissions")
    public ResponseEntity<List<AssignmentSubmissionResponseDto>> findSubmissions(
            @PathVariable Long assignmentId) {
        return ResponseEntity.ok(assignmentService.findSubmissions(assignmentId));
    }

    // GET    /api/assignments/my-submissions?studentId={id} — 내 제출 목록 (학생)
    @GetMapping("/my-submissions")
    public ResponseEntity<List<AssignmentSubmissionResponseDto>> findMySubmissions(
            @RequestParam Long studentId) {
        return ResponseEntity.ok(assignmentService.findMySubmissions(studentId));
    }

    // PATCH  /api/assignments/submissions/{submissionId}/grade — 채점 (강사)
    @PatchMapping("/submissions/{submissionId}/grade")
    public ResponseEntity<AssignmentSubmissionResponseDto> grade(
            @PathVariable Long submissionId,
            @RequestBody Map<String, Object> body) {
        Integer grade    = (Integer) body.get("grade");
        String  feedback = (String)  body.get("feedback");
        return ResponseEntity.ok(assignmentService.grade(submissionId, grade, feedback));
    }
}
