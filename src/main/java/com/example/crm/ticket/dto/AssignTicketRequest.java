package com.example.crm.ticket.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class AssignTicketRequest {
    @NotNull
    @Positive
    private Long assignedUserId;
}
