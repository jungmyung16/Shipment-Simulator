package com.catdogeats.shipsimul.shipmentsimulator.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

// 서버 상태 확인용 컨트롤러
/*
Uptime Robot이 접속할 때마다 현재의 루트 URL(/)로 접속하게 하면,
매번 데이터베이스를 조회하고 Thymeleaf로 HTML 페이지를 렌더링하는 무거운 작업이 일어남
따라서 아무 작업도 하지 않고 단순히 "서버가 살아있음" 상태만 알려주는 가벼운 API 엔드포인트
 */
@RestController
public class HealthCheckController {

    @GetMapping("/api/v1/health")
    public ResponseEntity<String> healthCheck() {
        // DB 조회나 복잡한 로직 없이 단순히 200 OK 응답과 문자열만 반환
        return ResponseEntity.ok("OK");
    }
}