package com.catdogeats.shipsimul.shipmentsimulator.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DashboardController {

    // 메인 대시보드 페이지 표시
    @GetMapping("/")
    public String dashboard(Model model) {
        // 더미 데이터로 초기화 (나중에 서비스에서 실제 데이터로 교체)
        model.addAttribute("totalCount", 0);
        model.addAttribute("receivedCount", 0);
        model.addAttribute("inTransitCount", 0);
        model.addAttribute("deliveredCount", 0);

        return "dashboard";
    }

    // 대시보드 루트 경로 추가 매핑
    @GetMapping("/dashboard")
    public String dashboardAlias(Model model) {
        return dashboard(model);
    }
}