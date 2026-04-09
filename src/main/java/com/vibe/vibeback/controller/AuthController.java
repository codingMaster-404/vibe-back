package com.vibe.vibeback.controller;

import com.vibe.vibeback.dto.ChangePasswordRequestDto;
import com.vibe.vibeback.dto.LoginRequestDto;
import com.vibe.vibeback.dto.UserResponseDto;
import com.vibe.vibeback.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<UserResponseDto> login(@RequestBody LoginRequestDto body) {
        if (body == null) {
            throw new com.vibe.vibeback.exception.LoginFailedException();
        }
        UserResponseDto user = authService.login(
                body.email(),
                body.password(),
                body.birthDate(),
                body.accessCode()
        );
        return ResponseEntity.ok(user);
    }

    /** 세션/토큰 미사용 시 noop — 클라이언트가 로컬 상태만 비우면 됨 */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }

    /** 강사 비밀번호 변경(초기 강제 변경 플로우) */
    @PostMapping("/change-password")
    public ResponseEntity<UserResponseDto> changePassword(@RequestBody ChangePasswordRequestDto body) {
        if (body == null) {
            throw new IllegalArgumentException("요청 본문이 비어 있습니다.");
        }
        return ResponseEntity.ok(authService.changeInstructorPassword(body.userId(), body.newPassword()));
    }
}
