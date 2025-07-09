package com.catdogeats.shipsimul.shipmentsimulator.dto;

// 운송장 생성 요청 DTO
public record TrackingCreateRequest(
        String carrierCode
) {
}