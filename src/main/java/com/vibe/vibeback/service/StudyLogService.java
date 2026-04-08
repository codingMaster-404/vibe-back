package com.vibe.vibeback.service;

import com.vibe.vibeback.domain.StudyLog;
import com.vibe.vibeback.domain.User;
import com.vibe.vibeback.dto.StudyLogRequestDto;
import com.vibe.vibeback.dto.StudyLogResponseDto;
import com.vibe.vibeback.repository.StudyLogRepository;
import com.vibe.vibeback.repository.UserRepository;
import com.vibe.vibeback.exception.StudyLogNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudyLogService {

    private final StudyLogRepository studyLogRepository;
    private final UserRepository userRepository;

    // ─────────────────────────────────────────
    //  StudyLog 등록
    // ─────────────────────────────────────────

    @Transactional
    public StudyLogResponseDto create(StudyLogRequestDto dto) {
        if (dto.getStartTime() == null || dto.getEndTime() == null) {
            throw new IllegalArgumentException("시작 시간과 종료 시간은 필수입니다.");
        }
        if (!dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new IllegalArgumentException("종료 시간은 시작 시간 이후여야 합니다.");
        }

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "사용자를 찾을 수 없습니다. id=" + dto.getUserId()));

        // averageFocusScore: 0~100 범위 검증 (AI 캠 미사용 시 null 허용)
        Integer focusScore = dto.getAverageFocusScore();
        if (focusScore != null && (focusScore < 0 || focusScore > 100)) {
            throw new IllegalArgumentException("몰입도 점수는 0~100 사이여야 합니다.");
        }

        StudyLog log = StudyLog.builder()
                .meetingTitle(dto.getMeetingTitle())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .durationMinutes(0)         // @PrePersist 에서 자동 계산
                .averageFocusScore(focusScore)
                .user(user)
                .build();

        return new StudyLogResponseDto(studyLogRepository.save(log));
    }

    // ─────────────────────────────────────────
    //  조회
    // ─────────────────────────────────────────

    public StudyLogResponseDto findById(Long logId) {
        StudyLog log = getLog(logId);
        return new StudyLogResponseDto(log);
    }

    public List<StudyLogResponseDto> findByUser(Long userId) {
        return studyLogRepository.findByUserId(userId)
                .stream()
                .map(StudyLogResponseDto::new)
                .toList();
    }

    public List<StudyLogResponseDto> findAll() {
        return studyLogRepository.findAll()
                .stream()
                .map(StudyLogResponseDto::new)
                .toList();
    }

    // ─────────────────────────────────────────
    //  삭제
    // ─────────────────────────────────────────

    @Transactional
    public void delete(Long logId) {
        StudyLog log = getLog(logId);
        studyLogRepository.delete(log);
    }

    // ─────────────────────────────────────────
    //  내부 헬퍼
    // ─────────────────────────────────────────

    private StudyLog getLog(Long logId) {
        return studyLogRepository.findById(logId)
                .orElseThrow(() -> new StudyLogNotFoundException(logId));
    }
}
