package com.vibe.vibeback.service;

import com.vibe.vibeback.domain.User;
import com.vibe.vibeback.domain.UserRole;
import com.vibe.vibeback.repository.CourseRepository;
import com.vibe.vibeback.repository.InstructorProfileRepository;
import com.vibe.vibeback.dto.UserResponseDto;
import com.vibe.vibeback.exception.LoginFailedException;
import com.vibe.vibeback.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final InstructorProfileRepository instructorProfileRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 로그인:
     * - 학생: 강의 코드(accessCode)에 등록된 수강생 중 birthDate(YYMMDD) 일치
     * - 강사/기타: 이메일 + 비밀번호 검증
     */
    public UserResponseDto login(String email, String rawPassword, String birthDate, String accessCode) {
        // 학생 로그인 (생년월일 6자리)
        if ((email == null || email.isBlank()) && birthDate != null && !birthDate.isBlank()) {
            String normalizedBirth = birthDate.trim();
            if (!normalizedBirth.matches("\\d{6}")) {
                throw new LoginFailedException();
            }
            if (accessCode == null || accessCode.isBlank()) {
                throw new LoginFailedException();
            }
            String normalizedCode = accessCode.trim().toUpperCase();
            var course = courseRepository.findByAccessCodeAndIsActiveTrue(normalizedCode)
                    .orElseThrow(LoginFailedException::new);
            List<User> candidates = userRepository.findByCourseIdAndBirthDateAndRole(
                    course.getId(), normalizedBirth, UserRole.STUDENT);
            if (candidates.isEmpty()) {
                throw new LoginFailedException();
            }
            if (candidates.size() > 1) {
                log.warn(
                        "같은 강의·생년월일로 활성 수강 학생이 {}명입니다. 가장 최근 수강 등록(enrolledAt) 계정으로 로그인합니다. courseId={}, accessCode={}",
                        candidates.size(),
                        course.getId(),
                        normalizedCode);
            }
            User user = candidates.getFirst();
            return new UserResponseDto(user);
        }

        // 기본: 이메일 로그인 (강사/학생 공통)
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new LoginFailedException();
        }
        if (email == null || email.isBlank()) {
            throw new LoginFailedException();
        }
        String normalized = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalized)
                .orElseThrow(LoginFailedException::new);
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new LoginFailedException();
        }
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new LoginFailedException();
        }

        boolean requirePasswordChange = false;
        if (user.getRole() == UserRole.INSTRUCTOR) {
            requirePasswordChange = instructorProfileRepository.findByUserId(user.getId())
                    .map(p -> Boolean.TRUE.equals(p.getForcePwChange()))
                    .orElse(false);
        }
        return new UserResponseDto(user, requirePasswordChange);
    }

    @Transactional
    public UserResponseDto changeInstructorPassword(Long userId, String newPassword) {
        if (userId == null || newPassword == null || newPassword.length() < 4) {
            throw new IllegalArgumentException("비밀번호는 4자 이상이어야 합니다.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. id=" + userId));
        if (user.getRole() != UserRole.INSTRUCTOR) {
            throw new IllegalArgumentException("강사 계정만 비밀번호 변경 워크플로우를 사용할 수 있습니다.");
        }
        var profile = instructorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("강사 프로필을 찾을 수 없습니다. userId=" + userId));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        profile.setForcePwChange(false);
        instructorProfileRepository.save(profile);
        return new UserResponseDto(user, false);
    }
}
