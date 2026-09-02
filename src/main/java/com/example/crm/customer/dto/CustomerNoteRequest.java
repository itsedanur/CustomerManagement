package com.example.crm.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerNoteRequest {

    @NotBlank(message = "Not içeriği boş olamaz.")
    @Size(max = 2000, message = "Not içeriği en fazla 2000 karakter olabilir.")
    private String content;
}
