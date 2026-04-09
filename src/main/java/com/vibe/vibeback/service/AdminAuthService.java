package com.vibe.vibeback.service;

import com.vibe.vibeback.config.JwtProvider;
import com.vibe.vibeback.domain.User;
import com.vibe.vibeback.domain.UserRole;
import com.vibe.vibeback.exception.AdminAuthException;
import com.vibe.vibeback.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 운영자 전용 인증 서비스.
 *
 * 보안 정책:
 *   - ADMIN role 만 로그인 허용
 *   - 5회 연속 실패 시 30분 계정 잠금
 *   - 성공 시 실패 횟수 초기화, lastLoginIp / lastLoginAt 갱신
 *   - 응답: JWT 토큰 + 기본 사용자 정보
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminAuthService {

    private static final int    MAX_FAIL      = 5;
    private static final int    LOCK_MINUTES  = 30;

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider     jwtProvider;

    // ── 로그인 ────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> login(String email, String password, String clientIp) {
        log.info("AdminAuthService.login 시작 clientIp={} email={}", clientIp, email);

        // 1) 사용자 조회
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new AdminAuthException(
                        "INVALID_CREDENTIALS",
                        "이메일 또는 비밀번호를 확인해 주세요.",
                        null,
                        null
                ));

        // 2) ADMIN role 확인
        if (user.getRole() != UserRole.ADMIN) {
            throw new AdminAuthException(
                    "ADMIN_ONLY",
                    "운영자 계정이 아닙니다.",
                    null,
                    null
            );
        }

        // 3) 계정 잠금 확인
        if (isLocked(user)) {
            long remaining = java.time.Duration.between(LocalDateTime.now(), user.getLockedUntil()).toMinutes() + 1;
            throw new AdminAuthException(
                    "ACCOUNT_LOCKED",
                    "계정이 잠겼습니다. " + remaining + "분 후 다시 시도하세요.",
                    0,
                    (int) remaining
            );
        }

        // 4) 비밀번호 검증
        if (!passwordEncoder.matches(password, user.getPassword())) {
            recordFailure(user);
            int remaining = MAX_FAIL - user.getLoginFailCount();
            if (remaining <= 0) {
                throw new AdminAuthException(
                        "ACCOUNT_LOCKED",
                        "비밀번호 5회 오류로 계정이 30분 잠겼습니다.",
                        0,
                        LOCK_MINUTES
                );
            }
            throw new AdminAuthException(
                    "INVALID_CREDENTIALS",
                    "이메일 또는 비밀번호를 확인해 주세요.",
                    remaining,
                    null
            );
        }

        // 5) 성공 처리
        recordSuccess(user, clientIp);

        // 6) JWT 발급
        String token = jwtProvider.generate(user.getId(), "ADMIN");

        log.info("AdminAuthService.login 성공 userId={} email={}", user.getId(), user.getEmail());

        return Map.of(
                "token",    token,
                "userId",   user.getId(),
                "nickname", user.getNickname(),
                "email",    user.getEmail(),
                "role",     user.getRole().name()
        );
    }

    // ── 내부 헬퍼 ─────────────────────────────────────────────────────

    private boolean isLocked(User user) {
        return user.getLockedUntil() != null
                && LocalDateTime.now().isBefore(user.getLockedUntil());
    }

    private void recordFailure(User user) {
        int fails = user.getLoginFailCount() + 1;
        user.setLoginFailCount(fails);
        if (fails >= MAX_FAIL) {
            user.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_MINUTES));
        }
        userRepository.save(user);
    }

    private void recordSuccess(User user, String clientIp) {
        user.setLoginFailCount(0);
        user.setLockedUntil(null);
        user.setLastLoginIp(clientIp);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
    }

    // ── 토큰 검증 (관제탑 상태 확인용) ───────────────────────────────

    public Map<String, Object> verifyToken(String token) {
        var claims = jwtProvider.validate(token); // throws if invalid
        return Map.of(
                "userId", jwtProvider.getUserId(claims),
                "role",   jwtProvider.getRole(claims),
                "valid",  true
        );
    }
}
