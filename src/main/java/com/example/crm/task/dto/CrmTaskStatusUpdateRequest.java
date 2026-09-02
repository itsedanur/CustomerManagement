package com.example.crm.task.dto;

import com.example.crm.task.entity.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmTaskStatusUpdateRequest {

    @NotNull(message = "Görev durumu boş olamaz.")
    private TaskStatus status;
}
