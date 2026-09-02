package com.example.crm.task.dto;

import com.example.crm.task.entity.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmTaskRequest {

    @NotBlank(message = "Görev başlığı boş olamaz.")
    @Size(max = 255, message = "Görev başlığı en fazla 255 karakter olabilir.")
    private String title;

    private String description;

    private Long customerId;

    private Long ticketId;

    @NotNull(message = "Atanan kullanıcı seçilmelidir.")
    private Long assignedUserId;

    private LocalDateTime dueDate;

    @NotNull(message = "Öncelik seçilmelidir.")
    private TaskPriority priority;
}
