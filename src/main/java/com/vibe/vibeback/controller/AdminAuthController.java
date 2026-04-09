package com.vibe.vibeback.controller;

import com.vibe.vibeback.service.AdminAuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        String email = requireField(body, "email", "이메일은 필수입니다.");
        String password = requireField(body, "password", "비밀번호는 필수입니다.");
        String clientIp = resolveClientIp(request);

        log.info("POST /api/admin/auth/login clientIp={} email={}", clientIp, email);

        Map<String, Object> result = new HashMap<>(adminAuthService.login(email, password, clientIp));
        // 프론트 공통 스토어 호환성: userId를 id로도 노출
        Object userId = result.get("userId");
        if (userId != null) result.put("id", userId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verify(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("valid", false, "reason", "토큰 없음"));
        }
        String token = authHeader.substring(7).trim();
        try {
            return ResponseEntity.ok(adminAuthService.verifyToken(token));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("valid", false, "reason", e.getMessage()));
        }
    }

    private String requireField(Map<String, String> body, String key, String message) {
        String value = body.get(key);
        if (value == null || value.isBlank()) throw new IllegalArgumentException(message);
        return value;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
