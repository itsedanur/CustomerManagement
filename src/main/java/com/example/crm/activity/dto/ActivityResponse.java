package com.example.crm.activity.dto;

import com.example.crm.activity.entity.ActivityType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ActivityResponse {
    private Long id;
    private Long customerId;
    private ActivityType type;
    private Long entityId;
    private String description;
    private LocalDateTime createdAt;
    private PerformedByDto performedBy;

    @Data
    public static class PerformedByDto {
        private Long id;
        private String name;
    }
}
