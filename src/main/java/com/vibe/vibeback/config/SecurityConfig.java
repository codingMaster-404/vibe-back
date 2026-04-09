package com.vibe.vibeback.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Boot 4 + 다중 SecurityFilterChain(securityMatcher) 조합 시 일부 경로가
 * DispatcherServlet에 도달하지 못하고 정적 리소스로 처리되는 문제가 있어,
 * 단일 체인으로 통합한다. 운영자 전용 동작은 필터의 shouldNotFilter 로 경로 제한.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final AdminIpWhitelistFilter adminIpWhitelistFilter;
    private final AdminTokenFilter adminTokenFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .addFilterBefore(adminIpWhitelistFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(adminTokenFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
