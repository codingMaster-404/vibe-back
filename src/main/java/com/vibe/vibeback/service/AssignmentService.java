package com.vibe.vibeback.service;

import com.vibe.vibeback.domain.Assignment;
import com.vibe.vibeback.domain.AssignmentSubmission;
import com.vibe.vibeback.domain.Course;
import com.vibe.vibeback.domain.User;
import com.vibe.vibeback.dto.AssignmentRequestDto;
import com.vibe.vibeback.dto.AssignmentResponseDto;
import com.vibe.vibeback.dto.AssignmentSubmissionResponseDto;
import com.vibe.vibeback.repository.AssignmentRepository;
import com.vibe.vibeback.repository.AssignmentSubmissionRepository;
import com.vibe.vibeback.repository.CourseRepository;
import com.vibe.vibeback.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssignmentService {

    private final AssignmentRepository           assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final CourseRepository               courseRepository;
    private final UserRepository                 userRepository;
    private final FileStorageService             fileStorageService;

    // ─── 과제 생성 (강사용) ────────────────────────────────────────
    @Transactional
    public AssignmentResponseDto create(AssignmentRequestDto dto) {
        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new IllegalArgumentException("강의를 찾을 수 없습니다. id=" + dto.getCourseId()));

        Assignment assignment = Assignment.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .dueDate(dto.getDueDate())
                .maxScore(dto.getMaxScore() != null ? dto.getMaxScore() : 100)
                .course(course)
                .build();

        return new AssignmentResponseDto(assignmentRepository.save(assignment));
    }

    // ─── 강의별 과제 목록 ──────────────────────────────────────────
    public List<AssignmentResponseDto> findByCourse(Long courseId) {
        return assignmentRepository.findByCourseIdAndIsVisibleTrue(courseId).stream()
                .map(AssignmentResponseDto::new).toList();
    }

    // ─── 과제 단건 조회 ────────────────────────────────────────────
    public AssignmentResponseDto findById(Long assignmentId) {
        return new AssignmentResponseDto(getAssignment(assignmentId));
    }

    // ─── 과제 제출 (학생용 — 파일 업로드) ─────────────────────────
    @Transactional
    public AssignmentSubmissionResponseDto submit(Long assignmentId, Long studentId, MultipartFile file) {
        Assignment assignment = getAssignment(assignmentId);
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. id=" + studentId));

        // 기존 제출 여부 확인 (재제출 처리)
        AssignmentSubmission submission = submissionRepository
                .findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElse(null);

        String subDir    = "course-" + assignment.getCourse().getId() + "/assignment-" + assignmentId;
        String filePath  = fileStorageService.store(file, subDir);

        if (submission != null) {
            // 재제출: 기존 파일 삭제 후 덮어쓰기
            fileStorageService.delete(submission.getFilePath());
            submission.setFilePath(filePath);
            submission.setOriginalFileName(file.getOriginalFilename());
            submission.setFileSize(file.getSize());
            submission.setContentType(file.getContentType());
            submission.setStatus(assignment.isOverdue() ? "LATE" : "SUBMITTED");
        } else {
            // 최초 제출
            submission = AssignmentSubmission.builder()
                    .assignment(assignment)
                    .student(student)
                    .filePath(filePath)
                    .originalFileName(file.getOriginalFilename())
                    .fileSize(file.getSize())
                    .contentType(file.getContentType())
                    .build();
        }

        return new AssignmentSubmissionResponseDto(submissionRepository.save(submission));
    }

    // ─── 과제별 제출물 목록 (강사용) ──────────────────────────────
    public List<AssignmentSubmissionResponseDto> findSubmissions(Long assignmentId) {
        return submissionRepository.findByAssignmentId(assignmentId).stream()
                .map(AssignmentSubmissionResponseDto::new).toList();
    }

    // ─── 내 제출 목록 (학생용) ─────────────────────────────────────
    public List<AssignmentSubmissionResponseDto> findMySubmissions(Long studentId) {
        return submissionRepository.findByStudentId(studentId).stream()
                .map(AssignmentSubmissionResponseDto::new).toList();
    }

    // ─── 채점 (강사용) ─────────────────────────────────────────────
    @Transactional
    public AssignmentSubmissionResponseDto grade(Long submissionId, Integer grade, String feedback) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("제출물을 찾을 수 없습니다. id=" + submissionId));

        if (grade < 0 || grade > submission.getAssignment().getMaxScore()) {
            throw new IllegalArgumentException("점수는 0 ~ " + submission.getAssignment().getMaxScore() + " 사이여야 합니다.");
        }

        submission.setGrade(grade);
        submission.setFeedback(feedback);
        submission.setStatus("GRADED");

        return new AssignmentSubmissionResponseDto(submissionRepository.save(submission));
    }

    private Assignment getAssignment(Long id) {
        return assignmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("과제를 찾을 수 없습니다. id=" + id));
    }
}
