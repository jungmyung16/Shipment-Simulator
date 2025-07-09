package com.catdogeats.shipsimul.shipmentsimulator.domain.enums;

import lombok.Getter;

// 배송 상태 enum - 5단계 배송 프로세스 정의
@Getter
public enum TrackingStatus {
    PICKED_UP("물품 접수 완료"),
    AT_SORT_HUB("물류센터 도착"),
    DEPARTED_HUB("물류센터 출발"),
    OUT_FOR_DELIVERY("배송지 근처 도착"),
    DELIVERED("배송 완료");

    private final String description;

    TrackingStatus(String description) {
        this.description = description;
    }

    // 다음 상태 반환 - 배송 진행 순서에 따라
    public TrackingStatus getNextStatus() {
        return switch (this) {
            case PICKED_UP -> AT_SORT_HUB;
            case AT_SORT_HUB -> DEPARTED_HUB;
            case DEPARTED_HUB -> OUT_FOR_DELIVERY;
            case OUT_FOR_DELIVERY -> DELIVERED;
            case DELIVERED -> DELIVERED; // 마지막 상태는 변경 없음
        };
    }

    // 배송 완료 여부 확인
    public boolean isDelivered() {
        return this == DELIVERED;
    }
}