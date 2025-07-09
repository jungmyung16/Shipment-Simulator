package com.catdogeats.shipsimul.shipmentsimulator.dto;

// 대시보드 통계 DTO
public record DashboardStatsDto(
        long totalCount,
        long pickedUpCount,
        long inTransitCount,
        long deliveredCount
) {
}