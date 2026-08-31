package com.example.crm.user.dto;

import com.example.crm.user.entity.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChangeUserRoleRequest {
    @NotNull
    private UserRole role;
}
