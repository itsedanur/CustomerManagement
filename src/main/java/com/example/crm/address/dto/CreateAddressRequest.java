package com.example.crm.address.dto;

import com.example.crm.address.entity.AddressType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateAddressRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    private String title;

    @NotBlank(message = "Country is required")
    @Size(max = 255, message = "Country cannot exceed 255 characters")
    private String country;

    @NotBlank(message = "City is required")
    @Size(max = 255, message = "City cannot exceed 255 characters")
    private String city;

    @Size(max = 255, message = "District cannot exceed 255 characters")
    private String district;

    @Size(max = 50, message = "Postal code cannot exceed 50 characters")
    private String postalCode;

    @NotBlank(message = "Address line is required")
    private String addressLine;

    @NotNull(message = "Address type is required")
    private AddressType addressType;
}
