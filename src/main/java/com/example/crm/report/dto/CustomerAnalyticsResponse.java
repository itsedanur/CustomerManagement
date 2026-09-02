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
public class CustomerAnalyticsResponse {
    private long totalCustomers;
    private Map<String, Long> statusDistribution;
    private Map<String, Long> typeDistribution;
    private Map<String, Long> monthlyTrend;
}
