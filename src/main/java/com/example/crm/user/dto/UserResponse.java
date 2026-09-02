package com.example.crm.user.dto;

import com.example.crm.user.entity.UserRole;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private UserRole role;
    private Boolean enabled;
    private Long openTicketsCount;
    private Long activeTasksCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
