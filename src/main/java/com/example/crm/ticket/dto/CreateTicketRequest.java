package com.example.crm.ticket.dto;

import com.example.crm.ticket.entity.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTicketRequest {
    @NotBlank
    @Size(max = 255)
    private String subject;

    @NotBlank
    @Size(max = 5000)
    private String description;

    @NotNull
    private TicketPriority priority;
}
