package com.catdogeats.shipsimul.shipmentsimulator.service;

import com.catdogeats.shipsimul.shipmentsimulator.dto.ActiveTrackingResponse;
import com.catdogeats.shipsimul.shipmentsimulator.dto.TrackingResponse;

import java.util.List;
import java.util.Optional;

// 운송장 서비스 인터페이스
public interface TrackingService {

    // 운송장 조회
    Optional<TrackingResponse> getTracking(String trackingNumber);

    // 활성 운송장 목록 조회
    List<ActiveTrackingResponse> getActiveTrackings();

    // 운송장 생성
    String createTracking();

    // 배송 로그 생성
    void generateTrackingLogs();

    // 만료된 운송장 삭제
    void deleteExpiredTrackings();
}