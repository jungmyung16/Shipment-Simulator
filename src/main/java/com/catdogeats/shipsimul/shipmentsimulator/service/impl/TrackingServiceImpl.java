package com.catdogeats.shipsimul.shipmentsimulator.service.impl;

import com.catdogeats.shipsimul.shipmentsimulator.domain.Tracking;
import com.catdogeats.shipsimul.shipmentsimulator.domain.TrackingLog;
import com.catdogeats.shipsimul.shipmentsimulator.domain.enums.TrackingStatus;
import com.catdogeats.shipsimul.shipmentsimulator.dto.*;
import com.catdogeats.shipsimul.shipmentsimulator.repository.TrackingLogRepository;
import com.catdogeats.shipsimul.shipmentsimulator.repository.TrackingRepository;
import com.catdogeats.shipsimul.shipmentsimulator.service.TrackingService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Override
    public Optional<TrackingResponse> getTracking(String trackingNumber) {
        return trackingRepository.findById(trackingNumber)
                .map(this::convertToTrackingResponse);
    }

    @Override
    public Page<ActiveTrackingResponse> getActiveTrackings(Pageable pageable) {
        return trackingRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::convertToActiveTrackingResponse);
    }

    @Override
    public DashboardStatsDto getDashboardStats() {
        long total = trackingRepository.count();
        long pickedUp = trackingRepository.countByCurrentStatus(TrackingStatus.PICKED_UP);
        long inTransit = trackingRepository.countInTransit();
        long delivered = trackingRepository.countByCurrentStatus(TrackingStatus.DELIVERED);

        return new DashboardStatsDto(total, pickedUp, inTransit, delivered);
    }


    @Override
    @Transactional
    public String createTracking(TrackingCreateRequest request) {
        String trackingNumber = generateTrackingNumber();
        String carrierCode = request.carrierCode();

        Tracking tracking = new Tracking(trackingNumber, carrierCode);
        trackingRepository.save(tracking);

        // 첫 번째 로그 생성 (PICKED_UP)
        TrackingLog firstLog = new TrackingLog(
                trackingNumber,
                TrackingStatus.PICKED_UP,
                TrackingStatus.PICKED_UP.getDescription()
        );
        trackingLogRepository.save(firstLog);

        log.info("새 운송장 수동 생성: {}, 택배사: {}", trackingNumber, carrierCode);
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

            log.info("스케줄 로그 생성: {} - {}", tracking.getTrackingNumber(), nextStatus);
        }
    }

    @Override
    @Transactional
    public void generateNextLogManually(String trackingNumber) {
        Tracking tracking = trackingRepository.findById(trackingNumber)
                .orElseThrow(() -> new EntityNotFoundException("운송장을 찾을 수 없습니다: " + trackingNumber));

        if (tracking.getCurrentStatus().isDelivered()) {
            log.warn("이미 배송 완료된 운송장입니다: {}", trackingNumber);
            return;
        }

        TrackingStatus nextStatus = tracking.getCurrentStatus().getNextStatus();

        // 새 로그 생성 (현재 시간 기준)
        TrackingLog newLog = new TrackingLog(
                tracking.getTrackingNumber(),
                nextStatus,
                nextStatus.getDescription()
        );
        trackingLogRepository.save(newLog);

        // 운송장 상태 업데이트
        tracking.updateStatus(nextStatus);
        log.info("수동 로그 생성: {} - {}", tracking.getTrackingNumber(), nextStatus);
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

    @Override
    @Transactional
    public void deleteTracking(String trackingNumber) {
        if (!trackingRepository.existsById(trackingNumber)) {
            throw new EntityNotFoundException("삭제할 운송장을 찾을 수 없습니다: " + trackingNumber);
        }
        // 로그 먼저 삭제
        trackingLogRepository.deleteByTrackingNumber(trackingNumber);
        // 운송장 삭제
        trackingRepository.deleteById(trackingNumber);
        log.info("수동 운송장 삭제 완료: {}", trackingNumber);
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