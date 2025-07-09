package com.catdogeats.shipsimul.shipmentsimulator.service.impl;

import com.catdogeats.shipsimul.shipmentsimulator.service.SchedulingService;
import com.catdogeats.shipsimul.shipmentsimulator.service.TrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

// 스케줄링 서비스 구현체
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "scheduling.enabled", havingValue = "true", matchIfMissing = true)
public class SchedulingServiceImpl implements SchedulingService {

    private final TrackingService trackingService;

    // 1시간마다 배송 로그 생성
    @Override
    @Scheduled(fixedRate = 60 * 60 * 1000) // 1시간 = 3,600,000ms
    public void generateLogsScheduled() {
        try {
            trackingService.generateTrackingLogs();
            log.info("스케줄 로그 생성 완료");
        } catch (Exception e) {
            log.error("스케줄 로그 생성 실패", e);
        }
    }

    // 1시간마다 만료된 운송장 삭제 확인
    @Override
    @Scheduled(fixedRate = 60 * 60 * 1000) // 1시간 = 3,600,000ms
    public void deleteExpiredTrackingsScheduled() {
        try {
            trackingService.deleteExpiredTrackings();
            log.info("스케줄 만료 운송장 삭제 확인 완료");
        } catch (Exception e) {
            log.error("스케줄 만료 운송장 삭제 실패", e);
        }
    }
}