package com.catdogeats.shipsimul.shipmentsimulator.dto;

import java.time.ZonedDateTime;
import java.util.List;

// 운송장 응답 DTO
public record TrackingResponse(
        String trackingNumber,
        String carrierCode,
        String  currentStatus,
        ZonedDateTime createdAt,
        ZonedDateTime deliveredAt,
        List<TrackingLogResponse> logs
) {
}