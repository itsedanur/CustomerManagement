package com.example.crm.dashboard.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardSummaryResponse {
    private long totalCustomers;
    private long activeCustomers;
    private long openTickets;
    private long criticalTickets;
    
    private java.util.Map<String, Long> ticketStatusDistribution;
    private java.util.Map<String, Long> customerStatusDistribution;
}
