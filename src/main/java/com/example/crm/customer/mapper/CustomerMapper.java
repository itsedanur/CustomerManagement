package com.example.crm.customer.mapper;

import com.example.crm.customer.dto.CreateCustomerRequest;
import com.example.crm.customer.dto.CustomerResponse;
import com.example.crm.customer.dto.UpdateCustomerRequest;
import com.example.crm.customer.entity.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface CustomerMapper {

    Customer toEntity(CreateCustomerRequest request);

    CustomerResponse toResponse(Customer customer);

    void updateEntityFromRequest(UpdateCustomerRequest request, @MappingTarget Customer customer);
}
