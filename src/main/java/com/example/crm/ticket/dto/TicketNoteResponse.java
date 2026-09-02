package com.example.crm.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketNoteResponse {
    private Long id;
    private Long ticketId;
    private Long authorUserId;
    private String authorName;
    private String authorEmail;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
