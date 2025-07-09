package com.catdogeats.shipsimul.shipmentsimulator.domain;

import com.catdogeats.shipsimul.shipmentsimulator.domain.enums.TrackingStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;

// 운송장 엔티티
@Entity
@Table(name = "tracking")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Tracking {

    @Id
    @Column(name = "tracking_number", length = 50)
    private String trackingNumber;

    @Column(name = "carrier_code", length = 2, nullable = false)
    private String carrierCode;

    @Column(name = "created_at", nullable = false)
    private ZonedDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_status", nullable = false)
    private TrackingStatus currentStatus;

    @Column(name = "delivered_at")
    private ZonedDateTime deliveredAt;

    // 생성자
    public Tracking(String trackingNumber, String carrierCode) {
        this.trackingNumber = trackingNumber;
        this.carrierCode = carrierCode;
        this.createdAt = ZonedDateTime.now();
        this.currentStatus = TrackingStatus.PICKED_UP;
    }

    // 상태 업데이트
    public void updateStatus(TrackingStatus status) {
        this.currentStatus = status;
        if (status.isDelivered()) {
            this.deliveredAt = ZonedDateTime.now();
        }
    }

    // 삭제 대상 여부 확인 - 배송완료 후 12시간 경과
    public boolean isDeletionTarget() {
        return deliveredAt != null &&
                deliveredAt.plusHours(12).isBefore(ZonedDateTime.now());
    }
}