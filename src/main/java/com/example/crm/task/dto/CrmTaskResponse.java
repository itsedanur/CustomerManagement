package com.example.crm.task.dto;

import com.example.crm.task.entity.TaskPriority;
import com.example.crm.task.entity.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmTaskResponse {
    private Long id;
    private String title;
    private String description;
    private Long customerId;
    private String customerName;
    private Long ticketId;
    private String ticketNumber;
    private Long assignedUserId;
    private String assignedUserName;
    private Long createdByUserId;
    private String createdByUserName;
    private LocalDateTime dueDate;
    private TaskPriority priority;
    private TaskStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
    private boolean isOverdue;
}
