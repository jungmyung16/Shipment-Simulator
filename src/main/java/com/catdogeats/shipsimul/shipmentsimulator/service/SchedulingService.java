package com.catdogeats.shipsimul.shipmentsimulator.service;

// 스케줄링 서비스 인터페이스
public interface SchedulingService {

    // 2시간마다 운송장 생성
    void createTrackingScheduled();

    // 1시간마다 배송 로그 생성
    void generateLogsScheduled();

    // 1시간마다 만료된 운송장 삭제 확인
    void deleteExpiredTrackingsScheduled();
}