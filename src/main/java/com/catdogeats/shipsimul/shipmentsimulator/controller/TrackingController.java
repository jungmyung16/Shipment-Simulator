package com.catdogeats.shipsimul.shipmentsimulator.controller;

import com.catdogeats.shipsimul.shipmentsimulator.dto.ActiveTrackingResponse;
import com.catdogeats.shipsimul.shipmentsimulator.dto.TrackingResponse;
import com.catdogeats.shipsimul.shipmentsimulator.service.TrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 운송장 REST API 컨트롤러
@RestController
@RequestMapping("/api/v1/trackings")
@RequiredArgsConstructor
public class TrackingController {

    private final TrackingService trackingService;

    // 특정 운송장 조회
    @GetMapping("/{trackingNumber}")
    public ResponseEntity<TrackingResponse> getTracking(@PathVariable String trackingNumber) {
        return trackingService.getTracking(trackingNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 활성 운송장 목록 조회
    @GetMapping("/active")
    public ResponseEntity<List<ActiveTrackingResponse>> getActiveTrackings() {
        List<ActiveTrackingResponse> activeTrackings = trackingService.getActiveTrackings();
        return ResponseEntity.ok(activeTrackings);
    }

    // 운송장 수동 생성 (테스트용)
    @PostMapping
    public ResponseEntity<String> createTracking() {
        String trackingNumber = trackingService.createTracking();
        return ResponseEntity.ok(trackingNumber);
    }

    // 로그 수동 생성 (테스트용)
    @PostMapping("/generate-logs")
    public ResponseEntity<Void> generateLogs() {
        trackingService.generateTrackingLogs();
        return ResponseEntity.ok().build();
    }

    // 만료 운송장 수동 삭제 (테스트용)
    @DeleteMapping("/expired")
    public ResponseEntity<Void> deleteExpiredTrackings() {
        trackingService.deleteExpiredTrackings();
        return ResponseEntity.ok().build();
    }
}