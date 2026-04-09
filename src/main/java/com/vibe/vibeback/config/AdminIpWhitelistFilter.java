package com.vibe.vibeback.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.web.util.matcher.IpAddressMatcher;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * /api/admin/** 전용 IP 화이트리스트 필터.
 * - admin.allowed-ip-ranges가 비어 있으면 fail-closed(전부 403)
 * - 값이 존재하면 매칭되지 않는 요청은 즉시 403 반환
 * - 단순 IP(예: 1.2.3.4), CIDR(예: 10.0.0.0/8) 모두 허용
 */
@Component
public class AdminIpWhitelistFilter extends OncePerRequestFilter {

    private final List<IpAddressMatcher> allowMatchers;

    public AdminIpWhitelistFilter(
            @Value("${admin.allowed-ip-ranges:}") String allowedRanges) {
        this.allowMatchers = parseMatchers(allowedRanges);
    }

    /** /api/admin/** 가 아닌 요청에는 적용하지 않음 (일반 API·정적 리소스와 분리) */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/admin/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        if (allowMatchers.isEmpty()) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        String clientIp = resolveClientIp(request);
        boolean allowed = allowMatchers.stream().anyMatch(m -> m.matches(clientIp));
        if (!allowed) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }
        chain.doFilter(request, response);
    }

    private List<IpAddressMatcher> parseMatchers(String raw) {
        List<IpAddressMatcher> list = new ArrayList<>();
        if (raw == null || raw.isBlank()) return list;
        String[] tokens = raw.split(",");
        for (String token : tokens) {
            String value = token.trim();
            if (!value.isEmpty()) {
                list.add(new IpAddressMatcher(value));
            }
        }
        return list;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

