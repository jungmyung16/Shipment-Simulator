package com.catdogeats.shipsimul.shipmentsimulator.controller;

import com.catdogeats.shipsimul.shipmentsimulator.dto.ActiveTrackingResponse;
import com.catdogeats.shipsimul.shipmentsimulator.dto.TrackingCreateRequest;
import com.catdogeats.shipsimul.shipmentsimulator.dto.TrackingResponse;
import com.catdogeats.shipsimul.shipmentsimulator.service.TrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

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

    // 활성 운송장 목록 조회 (페이징 지원)
    @GetMapping("/active")
    public ResponseEntity<Page<ActiveTrackingResponse>> getActiveTrackings(@PageableDefault() Pageable pageable) {
        Page<ActiveTrackingResponse> activeTrackings = trackingService.getActiveTrackings(pageable);
        return ResponseEntity.ok(activeTrackings);
    }

    // 운송장 수동 생성
    @PostMapping
    public ResponseEntity<TrackingResponse> createTracking(@RequestBody TrackingCreateRequest request) {
        String trackingNumber = trackingService.createTracking(request);
        return trackingService.getTracking(trackingNumber)
                .map(response -> ResponseEntity.created(URI.create("/api/v1/trackings/" + trackingNumber)).body(response))
                .orElse(ResponseEntity.internalServerError().build());
    }

    // 배송 로그 수동 생성
    @PostMapping("/{trackingNumber}/generate-log")
    public ResponseEntity<Void> generateNextLog(@PathVariable String trackingNumber) {
        trackingService.generateNextLogManually(trackingNumber);
        return ResponseEntity.ok().build();
    }

    // 운송장 수동 삭제
    @DeleteMapping("/{trackingNumber}")
    public ResponseEntity<Void> deleteTracking(@PathVariable String trackingNumber) {
        trackingService.deleteTracking(trackingNumber);
        return ResponseEntity.noContent().build();
    }
}