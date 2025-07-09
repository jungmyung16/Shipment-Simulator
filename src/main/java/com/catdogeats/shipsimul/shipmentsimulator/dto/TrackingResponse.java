package com.catdogeats.shipsimul.shipmentsimulator.dto;

import com.catdogeats.shipsimul.shipmentsimulator.domain.enums.TrackingStatus;

import java.time.ZonedDateTime;
import java.util.List;

// 운송장 응답 DTO
public record TrackingResponse(
        String trackingNumber,
        String carrierCode,
        TrackingStatus currentStatus,
        ZonedDateTime createdAt,
        ZonedDateTime deliveredAt,
        List<TrackingLogResponse> logs
) {
}

// 배송 로그 응답 DTO
public record TrackingLogResponse(
        String id,
        TrackingStatus status,
        String description,
        ZonedDateTime timestamp
) {
}

// 활성 운송장 목록 응답 DTO
public record ActiveTrackingResponse(
        String trackingNumber,
        String carrierCode,
        TrackingStatus currentStatus,
        ZonedDateTime createdAt
) {
}