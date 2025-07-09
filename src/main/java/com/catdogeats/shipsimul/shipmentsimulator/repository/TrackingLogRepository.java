package com.catdogeats.shipsimul.shipmentsimulator.repository;

import com.catdogeats.shipsimul.shipmentsimulator.domain.TrackingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

// 배송 로그 Repository
@Repository
public interface TrackingLogRepository extends JpaRepository<TrackingLog, String> {

    // 특정 운송장의 모든 로그 조회 (시간순 정렬)
    List<TrackingLog> findByTrackingNumberOrderByTimestampAsc(String trackingNumber);

    // 특정 운송장의 로그 개수 조회
    long countByTrackingNumber(String trackingNumber);

    // 특정 운송장의 모든 로그 삭제
    @Modifying
    @Query("DELETE FROM TrackingLog tl WHERE tl.trackingNumber = :trackingNumber")
    void deleteByTrackingNumber(@Param("trackingNumber") String trackingNumber);

    // 여러 운송장의 로그 일괄 삭제
    @Modifying
    @Query("DELETE FROM TrackingLog tl WHERE tl.trackingNumber IN :trackingNumbers")
    void deleteByTrackingNumberIn(@Param("trackingNumbers") List<String> trackingNumbers);
}