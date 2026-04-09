package com.vibe.vibeback.service;

import com.vibe.vibeback.dto.NotificationLogDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/**
 * SMS 대체: 콘솔 로그 + 인메모리 발송 이력 (운영자 알림함 연동)
 */
@Service
@Slf4j
public class NotificationService {

    private static final int MAX_HISTORY = 200;

    private final AtomicLong seq = new AtomicLong(0);
    private final List<NotificationLogDto> history = new ArrayList<>();

    /**
     * @param phone 수신 번호 (없으면 로그에 "(연락처 미등록)" 표기)
     * @param code  강의 입장 코드
     * @param name  수신자 표시 이름
     */
    public void sendAccessCode(String phone, String code, String name) {
        String to = (phone != null && !phone.isBlank()) ? phone.trim() : "(연락처 미등록)";
        String who = (name != null && !name.isBlank()) ? name.trim() : "회원";
        String c = (code != null && !code.isBlank()) ? code.trim() : "";

        log.info("[SMS 발송 성공] TO: {}, 내용: {}님, 강의 코드는 [{}]입니다.", to, who, c);

        String preview = who + "님, 강의 코드는 [" + c + "]입니다.";
        NotificationLogDto row = new NotificationLogDto(
                seq.incrementAndGet(),
                LocalDateTime.now(),
                to,
                who,
                c,
                preview
        );
        synchronized (history) {
            history.add(0, row);
            while (history.size() > MAX_HISTORY) {
                history.remove(history.size() - 1);
            }
        }
    }

    public List<NotificationLogDto> getRecent(int limit) {
        int n = Math.min(Math.max(limit, 1), MAX_HISTORY);
        synchronized (history) {
            return List.copyOf(history.subList(0, Math.min(n, history.size())));
        }
    }
}
