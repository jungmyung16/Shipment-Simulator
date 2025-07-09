package com.catdogeats.shipsimul.shipmentsimulator.service.impl;

import com.catdogeats.shipsimul.shipmentsimulator.service.TrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

// 스케줄링 서비스
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "scheduling.enabled", havingValue = "true", matchIfMissing = true)
public class SchedulingService {

    private final TrackingService trackingService;

    // 2시간마다 운송장 생성
    @Scheduled(fixedRate = 2 * 60 * 60 * 1000) // 2시간 = 7,200,000ms
    public void createTrackingScheduled() {
        try {
            String trackingNumber = trackingService.createTracking();
            log.info("스케줄 운송장 생성 완료: {}", trackingNumber);
        } catch (Exception e) {
            log.error("스케줄 운송장 생성 실패", e);
        }
    }

    // 1시간마다 배송 로그 생성
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