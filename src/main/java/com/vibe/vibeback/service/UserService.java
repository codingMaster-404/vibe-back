package com.vibe.vibeback.service;

import com.vibe.vibeback.domain.User;
import com.vibe.vibeback.dto.UserRequestDto;
import com.vibe.vibeback.dto.UserResponseDto;
import com.vibe.vibeback.dto.WeeklyProgressDto;
import com.vibe.vibeback.repository.StudyLogRepository;
import com.vibe.vibeback.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final StudyLogRepository studyLogRepository;

    // ─────────────────────────────────────────
    //  회원가입
    // ─────────────────────────────────────────

    @Transactional
    public UserResponseDto register(UserRequestDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다: " + dto.getEmail());
        }
        if (userRepository.existsByNickname(dto.getNickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다: " + dto.getNickname());
        }

        User user = User.builder()
                .email(dto.getEmail())
                .password(dto.getPassword())   // TODO: BCrypt 암호화 추가 예정
                .nickname(dto.getNickname())
                .weeklyGoalMinutes(dto.getWeeklyGoalMinutes() != null
                        ? dto.getWeeklyGoalMinutes() : 0)
                .build();

        return new UserResponseDto(userRepository.save(user));
    }

    // ─────────────────────────────────────────
    //  단건 조회
    // ─────────────────────────────────────────

    public UserResponseDto findById(Long userId) {
        User user = getUser(userId);
        return new UserResponseDto(user);
    }

    public List<UserResponseDto> findAll() {
        return userRepository.findAll()
                .stream()
                .map(UserResponseDto::new)
                .toList();
    }

    // ─────────────────────────────────────────
    //  주간 목표 달성률 계산
    // ─────────────────────────────────────────

    /**
     * 현재 주(이번 월요일 00:00 ~ 다음 월요일 00:00)의 달성률을 반환합니다.
     */
    public WeeklyProgressDto getWeeklyProgress(Long userId) {
        User user = getUser(userId);

        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd   = weekStart.plusDays(6); // 일요일

        LocalDateTime startDt = weekStart.atStartOfDay();
        LocalDateTime endDt   = weekEnd.plusDays(1).atStartOfDay(); // exclusive end

        Integer actualMinutes = studyLogRepository.sumDurationMinutesByUserIdAndPeriod(
                userId, startDt, endDt);
        if (actualMinutes == null) actualMinutes = 0;

        return new WeeklyProgressDto(
                user.getId(),
                user.getNickname(),
                user.getWeeklyGoalMinutes(),
                actualMinutes,
                weekStart,
                weekEnd
        );
    }

    /**
     * 특정 날짜가 속한 주의 달성률을 반환합니다. (과거 주 조회용)
     */
    public WeeklyProgressDto getWeeklyProgressByDate(Long userId, LocalDate referenceDate) {
        User user = getUser(userId);

        LocalDate weekStart = referenceDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd   = weekStart.plusDays(6);

        LocalDateTime startDt = weekStart.atStartOfDay();
        LocalDateTime endDt   = weekEnd.plusDays(1).atStartOfDay();

        Integer actualMinutes = studyLogRepository.sumDurationMinutesByUserIdAndPeriod(
                userId, startDt, endDt);
        if (actualMinutes == null) actualMinutes = 0;

        return new WeeklyProgressDto(
                user.getId(),
                user.getNickname(),
                user.getWeeklyGoalMinutes(),
                actualMinutes,
                weekStart,
                weekEnd
        );
    }

    // ─────────────────────────────────────────
    //  주간 목표 시간 수정
    // ─────────────────────────────────────────

    @Transactional
    public UserResponseDto updateWeeklyGoal(Long userId, Integer weeklyGoalMinutes) {
        User user = getUser(userId);
        user.setWeeklyGoalMinutes(weeklyGoalMinutes);
        return new UserResponseDto(userRepository.save(user));
    }

    // ─────────────────────────────────────────
    //  내부 헬퍼
    // ─────────────────────────────────────────

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. id=" + userId));
    }
}
