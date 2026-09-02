package com.example.crm.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerNoteResponse {
    private Long id;
    private Long customerId;
    private Long authorUserId;
    private String authorName;
    private String authorEmail;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
