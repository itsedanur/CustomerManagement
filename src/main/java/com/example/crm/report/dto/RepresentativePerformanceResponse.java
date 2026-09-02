package com.example.crm.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepresentativePerformanceResponse {
    private Long userId;
    private String userName;
    private String userEmail;
    private String role;
    private long totalAssignedTickets;
    private long openTickets;
    private long resolvedTickets;
    private double avgResolutionTimeHours;
    private long activeTasks;
}
