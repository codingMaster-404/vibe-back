package com.vibe.vibeback.config;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 운영자 전용 JWT 검증 필터.
 *
 * 동작:
 *   1. Authorization 헤더에서 "Bearer <token>" 추출
 *   2. JwtProvider 로 검증 — 실패 시 401
 *   3. role claim 이 "ADMIN" 이 아니면 403
 *   4. 통과 시 request attribute 에 userId, role 세팅
 *
 * shouldNotFilter() 로 /api/admin/auth/** 를 명시적으로 제외한다
 * (SecurityConfig 의 permitAll 은 Spring Security 인가 레이어만 제어하므로
 *  OncePerRequestFilter 는 별도로 경로 예외 처리가 필요).
 */
@Component
@RequiredArgsConstructor
public class AdminTokenFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    /**
     * - /api/admin/** 가 아닌 경로는 스킵 (일반 로그인 /api/login 등)
     * - /api/admin/auth/** 는 로그인·검증용으로 토큰 없이 허용
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/admin/")) {
            return true;
        }
        return path.startsWith("/api/admin/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        String token      = extractBearer(authHeader);

        // 토큰 없음 → 401
        if (token == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "인증 토큰이 필요합니다.");
            return;
        }

        Claims claims = jwtProvider.validateQuiet(token);

        // 유효하지 않거나 만료 → 401
        if (claims == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "토큰이 유효하지 않거나 만료되었습니다.");
            return;
        }

        // ADMIN role 아님 → 403
        if (!jwtProvider.isAdminClaims(claims)) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "운영자 권한이 없습니다.");
            return;
        }

        // 검증 완료 → 후속 컨트롤러에서 사용할 수 있도록 attribute 저장
        request.setAttribute("adminUserId", jwtProvider.getUserId(claims));
        request.setAttribute("adminRole",   jwtProvider.getRole(claims));

        chain.doFilter(request, response);
    }

    private String extractBearer(String header) {
        if (header != null && header.startsWith("Bearer ")) {
            String t = header.substring(7).trim();
            return t.isBlank() ? null : t;
        }
        return null;
    }
}
