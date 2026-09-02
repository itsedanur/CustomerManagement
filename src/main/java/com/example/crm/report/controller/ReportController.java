package com.example.crm.report.controller;

import com.example.crm.report.dto.CustomerAnalyticsResponse;
import com.example.crm.report.dto.RepresentativePerformanceResponse;
import com.example.crm.report.dto.TicketAnalyticsResponse;
import com.example.crm.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/customer-analytics")
    public ResponseEntity<CustomerAnalyticsResponse> getCustomerAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(reportService.getCustomerAnalytics(startDate, endDate));
    }

    @GetMapping("/ticket-analytics")
    public ResponseEntity<TicketAnalyticsResponse> getTicketAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(reportService.getTicketAnalytics(startDate, endDate));
    }

    @GetMapping("/representative-performance")
    public ResponseEntity<List<RepresentativePerformanceResponse>> getRepresentativePerformance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(reportService.getRepresentativePerformance(startDate, endDate));
    }
}
