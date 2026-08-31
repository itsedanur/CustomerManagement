package com.example.crm.address.service;

import com.example.crm.address.dto.AddressResponse;
import com.example.crm.address.dto.CreateAddressRequest;
import com.example.crm.address.dto.UpdateAddressRequest;

import java.util.List;

public interface AddressService {
    AddressResponse createAddress(Long customerId, CreateAddressRequest request);
    AddressResponse getAddress(Long customerId, Long addressId);
    List<AddressResponse> getCustomerAddresses(Long customerId);
    AddressResponse updateAddress(Long customerId, Long addressId, UpdateAddressRequest request);
    void deleteAddress(Long customerId, Long addressId);
}
