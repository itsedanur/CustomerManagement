package com.example.crm.audit.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AuditLogResponse {
    private Long id;
    private UserSummary user;
    private String action;
    private String entityType;
    private String entityId;
    private String ipAddress;
    private String details;
    private LocalDateTime createdAt;

    @Data
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
    }
}
