package com.example.crm.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChangeUserStatusRequest {
    @NotNull
    private Boolean enabled;
}
