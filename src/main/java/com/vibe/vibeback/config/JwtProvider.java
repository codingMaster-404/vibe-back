package com.vibe.vibeback.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * 운영자 전용 JWT 생성 · 검증.
 *
 * payload:
 *   sub  — userId (Long, String 형태)
 *   role — "ADMIN"
 *   iat  — 발급 시각
 *   exp  — 만료 시각 (기본 8시간)
 */
@Component
public class JwtProvider {

    private final SecretKey secretKey;
    private final long      expirationMs;

    public JwtProvider(
            @Value("${jwt.admin.secret}") String secret,
            @Value("${jwt.admin.expiration-ms:28800000}") long expirationMs) {
        this.secretKey    = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    // ── 토큰 생성 ───────────────────────────────────────────────────

    public String generate(Long userId, String role) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("role", role)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expirationMs))
                .signWith(secretKey)
                .compact();
    }

    // ── 토큰 검증 ───────────────────────────────────────────────────

    /** @throws JwtException 토큰이 유효하지 않거나 만료된 경우 */
    public Claims validate(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** null-safe 검증 래퍼. 유효하면 Claims, 아니면 null. */
    public Claims validateQuiet(String token) {
        if (token == null || token.isBlank()) return null;
        try {
            return validate(token);
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    // ── 편의 메서드 ─────────────────────────────────────────────────

    public Long getUserId(Claims claims) {
        return Long.valueOf(claims.getSubject());
    }

    public String getRole(Claims claims) {
        return claims.get("role", String.class);
    }

    public boolean isAdminClaims(Claims claims) {
        return "ADMIN".equals(getRole(claims));
    }
}
