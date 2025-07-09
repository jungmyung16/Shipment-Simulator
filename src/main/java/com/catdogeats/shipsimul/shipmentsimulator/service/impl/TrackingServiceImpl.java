package com.catdogeats.shipsimul.shipmentsimulator.service.impl;

import com.catdogeats.shipsimul.shipmentsimulator.domain.Tracking;
import com.catdogeats.shipsimul.shipmentsimulator.domain.TrackingLog;
import com.catdogeats.shipsimul.shipmentsimulator.domain.enums.TrackingStatus;
import com.catdogeats.shipsimul.shipmentsimulator.dto.ActiveTrackingResponse;
import com.catdogeats.shipsimul.shipmentsimulator.dto.TrackingLogResponse;
import com.catdogeats.shipsimul.shipmentsimulator.dto.TrackingResponse;
import com.catdogeats.shipsimul.shipmentsimulator.repository.TrackingLogRepository;
import com.catdogeats.shipsimul.shipmentsimulator.repository.TrackingRepository;
import com.catdogeats.shipsimul.shipmentsimulator.service.TrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Random;

// 운송장 서비스 구현체
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TrackingServiceImpl implements TrackingService {

    private final TrackingRepository trackingRepository;
    private final TrackingLogRepository trackingLogRepository;
    private final Random random = new Random();

    // 택배사 코드 배열
    private static final String[] CARRIER_CODES = {"01", "04", "05", "06", "08"};

    @Override
    public Optional<TrackingResponse> getTracking(String trackingNumber) {
        return trackingRepository.findById(trackingNumber)
                .map(this::convertToTrackingResponse);
    }

    @Override
    public List<ActiveTrackingResponse> getActiveTrackings() {
        return trackingRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToActiveTrackingResponse)
                .toList();
    }

    @Override
    @Transactional
    public String createTracking() {
        String trackingNumber = generateTrackingNumber();
        String carrierCode = CARRIER_CODES[random.nextInt(CARRIER_CODES.length)];

        Tracking tracking = new Tracking(trackingNumber, carrierCode);
        trackingRepository.save(tracking);

        // 첫 번째 로그 생성 (PICKED_UP)
        TrackingLog firstLog = new TrackingLog(
                trackingNumber,
                TrackingStatus.PICKED_UP,
                TrackingStatus.PICKED_UP.getDescription()
        );
        trackingLogRepository.save(firstLog);

        log.info("새 운송장 생성: {}, 택배사: {}", trackingNumber, carrierCode);
        return trackingNumber;
    }

    @Override
    @Transactional
    public void generateTrackingLogs() {
        List<Tracking> trackingsNeedingLogs = trackingRepository.findTrackingsNeedingLogGeneration();

        for (Tracking tracking : trackingsNeedingLogs) {
            long existingLogCount = trackingLogRepository.countByTrackingNumber(tracking.getTrackingNumber());

            // 이미 5개 로그가 있으면 스킵
            if (existingLogCount >= 5) {
                continue;
            }

            // 다음 상태로 진행
            TrackingStatus nextStatus = tracking.getCurrentStatus().getNextStatus();

            // 새 로그 생성
            TrackingLog newLog = new TrackingLog(
                    tracking.getTrackingNumber(),
                    nextStatus,
                    nextStatus.getDescription(),
                    tracking.getCreatedAt().plusHours(existingLogCount + 1)
            );
            trackingLogRepository.save(newLog);

            // 운송장 상태 업데이트
            tracking.updateStatus(nextStatus);
            trackingRepository.save(tracking);

            log.info("로그 생성: {} - {}", tracking.getTrackingNumber(), nextStatus);
        }
    }

    @Override
    @Transactional
    public void deleteExpiredTrackings() {
        ZonedDateTime cutoffTime = ZonedDateTime.now().minusHours(12);
        List<Tracking> expiredTrackings = trackingRepository.findTrackingsToDelete(cutoffTime);

        if (!expiredTrackings.isEmpty()) {
            List<String> trackingNumbers = expiredTrackings.stream()
                    .map(Tracking::getTrackingNumber)
                    .toList();

            // 로그 먼저 삭제
            trackingLogRepository.deleteByTrackingNumberIn(trackingNumbers);

            // 운송장 삭제
            trackingRepository.deleteAll(expiredTrackings);

            log.info("만료된 운송장 {}개 삭제: {}", expiredTrackings.size(), trackingNumbers);
        }
    }

    // 운송장 번호 생성 - yyyyMMddHHmmss-####
    private String generateTrackingNumber() {
        String timestamp = ZonedDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String randomSuffix = String.format("%04d", random.nextInt(10000));
        return timestamp + "-" + randomSuffix;
    }

    // Tracking → TrackingResponse 변환
    private TrackingResponse convertToTrackingResponse(Tracking tracking) {
        List<TrackingLogResponse> logs = trackingLogRepository
                .findByTrackingNumberOrderByTimestampAsc(tracking.getTrackingNumber())
                .stream()
                .map(this::convertToTrackingLogResponse)
                .toList();

        return new TrackingResponse(
                tracking.getTrackingNumber(),
                tracking.getCarrierCode(),
                tracking.getCurrentStatus(),
                tracking.getCreatedAt(),
                tracking.getDeliveredAt(),
                logs
        );
    }

    // TrackingLog → TrackingLogResponse 변환
    private TrackingLogResponse convertToTrackingLogResponse(TrackingLog log) {
        return new TrackingLogResponse(
                log.getId(),
                log.getStatus(),
                log.getDescription(),
                log.getTimestamp()
        );
    }

    // Tracking → ActiveTrackingResponse 변환
    private ActiveTrackingResponse convertToActiveTrackingResponse(Tracking tracking) {
        return new ActiveTrackingResponse(
                tracking.getTrackingNumber(),
                tracking.getCarrierCode(),
                tracking.getCurrentStatus(),
                tracking.getCreatedAt()
        );
    }
}