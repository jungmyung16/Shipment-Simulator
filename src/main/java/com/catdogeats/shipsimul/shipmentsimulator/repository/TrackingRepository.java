package com.catdogeats.shipsimul.shipmentsimulator.repository;

import com.catdogeats.shipsimul.shipmentsimulator.domain.Tracking;
import com.catdogeats.shipsimul.shipmentsimulator.domain.enums.TrackingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;
import java.util.List;

// 운송장 Repository
@Repository
public interface TrackingRepository extends JpaRepository<Tracking, String> {

    // 삭제 대상 조회 - 배송완료 후 12시간 경과
    @Query("SELECT t FROM Tracking t WHERE t.deliveredAt IS NOT NULL AND t.deliveredAt < :cutoffTime")
    List<Tracking> findTrackingsToDelete(ZonedDateTime cutoffTime);

    // 활성 운송장 목록 조회 (삭제되지 않은 것들) - 페이징 적용
    Page<Tracking> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // 특정 상태의 운송장 개수 조회
    long countByCurrentStatus(TrackingStatus status);

    // '배송 중' 상태인 운송장 개수 조회 (복수 상태)
    @Query("SELECT COUNT(t) FROM Tracking t WHERE t.currentStatus IN ('AT_SORT_HUB', 'DEPARTED_HUB', 'OUT_FOR_DELIVERY')")
    long countInTransit();

    // 로그 생성이 필요한 운송장 조회 (배송완료가 아닌 것들)
    @Query("SELECT t FROM Tracking t WHERE t.currentStatus != 'DELIVERED'")
    List<Tracking> findTrackingsNeedingLogGeneration();
}