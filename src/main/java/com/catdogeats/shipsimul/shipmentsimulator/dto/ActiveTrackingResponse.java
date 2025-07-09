package com.catdogeats.shipsimul.shipmentsimulator.dto;

import com.catdogeats.shipsimul.shipmentsimulator.domain.enums.TrackingStatus;

import java.time.ZonedDateTime;

// 활성 운송장 목록 응답 DTO
public record ActiveTrackingResponse(
        String trackingNumber,
        String carrierCode,
        TrackingStatus currentStatus,
        ZonedDateTime createdAt
) {
}