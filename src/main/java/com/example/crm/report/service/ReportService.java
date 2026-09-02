package com.example.crm.report.service;

import com.example.crm.report.dto.CustomerAnalyticsResponse;
import com.example.crm.report.dto.RepresentativePerformanceResponse;
import com.example.crm.report.dto.TicketAnalyticsResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface ReportService {
    CustomerAnalyticsResponse getCustomerAnalytics(LocalDateTime startDate, LocalDateTime endDate);
    TicketAnalyticsResponse getTicketAnalytics(LocalDateTime startDate, LocalDateTime endDate);
    List<RepresentativePerformanceResponse> getRepresentativePerformance(LocalDateTime startDate, LocalDateTime endDate);
}
