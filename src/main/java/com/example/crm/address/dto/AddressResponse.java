package com.example.crm.address.dto;

import com.example.crm.address.entity.AddressType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AddressResponse {
    private Long id;
    private String title;
    private String country;
    private String city;
    private String district;
    private String postalCode;
    private String addressLine;
    private AddressType addressType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
