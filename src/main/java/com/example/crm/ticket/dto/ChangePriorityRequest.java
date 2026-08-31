package com.example.crm.ticket.dto;

import com.example.crm.ticket.entity.TicketPriority;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChangePriorityRequest {
    @NotNull(message = "Priority is required")
    private TicketPriority priority;
}
