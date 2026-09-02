package com.example.crm.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketAnalyticsResponse {
    private long totalTickets;
    private Map<String, Long> statusDistribution;
    private Map<String, Long> priorityDistribution;
    private Map<String, Long> dailyTrend;
    private double avgResolutionTimeHours;
    private double resolutionRatePercentage;
}
