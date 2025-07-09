package com.catdogeats.shipsimul.shipmentsimulator.controller;

import com.catdogeats.shipsimul.shipmentsimulator.dto.ActiveTrackingResponse;
import com.catdogeats.shipsimul.shipmentsimulator.dto.DashboardStatsDto;
import com.catdogeats.shipsimul.shipmentsimulator.service.TrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class DashboardController {

    private final TrackingService trackingService;

    // 택배사 코드-이름 매핑
    private static final Map<String, String> CARRIER_NAMES = Map.of(
            "01", "우체국택배",
            "04", "CJ대한통운",
            "05", "한진택배",
            "06", "로젠택배",
            "08", "롯데택배"
    );

    // 메인 대시보드 페이지 표시
    @GetMapping("/")
    public String dashboard(Model model) {
        // 서비스에서 통계 데이터 및 첫 페이지(10개)의 운송장 데이터 조회
        DashboardStatsDto stats = trackingService.getDashboardStats();
        Page<ActiveTrackingResponse> recentTrackingsPage = trackingService.getActiveTrackings(PageRequest.of(0, 10));

        // 모델에 데이터 추가
        model.addAttribute("stats", stats);
        model.addAttribute("recentTrackingsPage", recentTrackingsPage); // Page 객체 전체를 전달
        model.addAttribute("carrierNames", CARRIER_NAMES); // Thymeleaf에서 사용하기 위함

        return "dashboard";
    }

    // 대시보드 루트 경로 추가 매핑
    @GetMapping("/dashboard")
    public String dashboardAlias(Model model) {
        return dashboard(model);
    }
}