package com.example.crm.ticket.dto;

import com.example.crm.ticket.entity.TicketPriority;
import com.example.crm.ticket.entity.TicketStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TicketResponse {
    private Long id;
    private String ticketNumber;
    private CustomerSummaryResponse customer;
    private String subject;
    private String description;
    private TicketPriority priority;
    private TicketStatus status;
    private Long assignedUserId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private Long version;
}
