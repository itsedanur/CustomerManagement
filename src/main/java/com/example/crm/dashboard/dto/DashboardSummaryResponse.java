package com.example.crm.dashboard.dto;

import com.example.crm.activity.dto.ActivityResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private long totalCustomers;
    private long activeCustomers;
    private long openTickets;
    private long criticalTickets;

    // Operational KPI additions
    private long todayTicketsCount;
    private long newCustomersThisMonth;
    private double avgResolutionTimeHours;
    private double resolutionRate;
    
    private Map<String, Long> ticketStatusDistribution;
    private Map<String, Long> customerStatusDistribution;
    private Map<String, Long> ticketPriorityDistribution;
    private List<TicketTrendDto> ticketTrendLast30Days;
    private List<ActivityResponse> recentActivities;
}
