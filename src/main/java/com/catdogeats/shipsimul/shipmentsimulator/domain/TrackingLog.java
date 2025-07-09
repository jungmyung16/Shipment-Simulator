package com.catdogeats.shipsimul.shipmentsimulator.domain;

import com.catdogeats.shipsimul.shipmentsimulator.domain.enums.TrackingStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;
import java.util.UUID;

// 배송 로그 엔티티
@Entity
@Table(name = "tracking_log")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TrackingLog {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "tracking_number", length = 50, nullable = false)
    private String trackingNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TrackingStatus status;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "timestamp", nullable = false)
    private ZonedDateTime timestamp;

    // 생성자
    public TrackingLog(String trackingNumber, TrackingStatus status, String description) {
        this.id = UUID.randomUUID().toString();
        this.trackingNumber = trackingNumber;
        this.status = status;
        this.description = description;
        this.timestamp = ZonedDateTime.now();
    }

    // 특정 시간으로 로그 생성 (스케줄링 용)
    public TrackingLog(String trackingNumber, TrackingStatus status, String description, ZonedDateTime timestamp) {
        this.id = UUID.randomUUID().toString();
        this.trackingNumber = trackingNumber;
        this.status = status;
        this.description = description;
        this.timestamp = timestamp;
    }
}