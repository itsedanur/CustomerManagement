package com.example.crm.customer.dto;

import com.example.crm.customer.entity.CustomerStatus;
import com.example.crm.customer.entity.CustomerType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CustomerResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String company;
    private CustomerStatus status;
    private CustomerType customerType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
