package com.example.crm.customer.service;

import com.example.crm.common.dto.PageResponse;
import com.example.crm.customer.dto.CreateCustomerRequest;
import com.example.crm.customer.dto.CustomerResponse;
import com.example.crm.customer.dto.UpdateCustomerRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CustomerService {
    PageResponse<CustomerResponse> getAllCustomers(String search, Pageable pageable);
    CustomerResponse getCustomerById(Long id);
    CustomerResponse createCustomer(CreateCustomerRequest request);
    CustomerResponse updateCustomer(Long id, UpdateCustomerRequest request);
    void deleteCustomer(Long id);
}
