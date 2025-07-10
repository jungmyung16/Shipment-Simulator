package com.catdogeats.shipsimul.shipmentsimulator.dto;

import com.catdogeats.shipsimul.shipmentsimulator.domain.enums.TrackingStatus;

import java.time.ZonedDateTime;

// 배송 로그 응답 DTO
public record TrackingLogResponse(
        String id,
        String  status,
        String description,
        ZonedDateTime timestamp
) {
}