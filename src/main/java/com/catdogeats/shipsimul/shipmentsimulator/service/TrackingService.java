package com.catdogeats.shipsimul.shipmentsimulator.service;

import com.catdogeats.shipsimul.shipmentsimulator.dto.ActiveTrackingResponse;
import com.catdogeats.shipsimul.shipmentsimulator.dto.DashboardStatsDto;
import com.catdogeats.shipsimul.shipmentsimulator.dto.TrackingCreateRequest;
import com.catdogeats.shipsimul.shipmentsimulator.dto.TrackingResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


import java.util.Optional;

// 운송장 서비스 인터페이스
public interface TrackingService {

    // 운송장 조회
    Optional<TrackingResponse> getTracking(String trackingNumber);

    // 활성 운송장 목록 조회 (페이징)
    Page<ActiveTrackingResponse> getActiveTrackings(Pageable pageable);

    // 대시보드 통계 조회
    DashboardStatsDto getDashboardStats();

    // 운송장 수동 생성
    String createTracking(TrackingCreateRequest request);

    // 배송 로그 생성 (스케줄링용)
    void generateTrackingLogs();

    // 배송 로그 수동 생성
    void generateNextLogManually(String trackingNumber);

    // 만료된 운송장 삭제 (스케줄링용)
    void deleteExpiredTrackings();

    // 운송장 수동 삭제
    void deleteTracking(String trackingNumber);
}