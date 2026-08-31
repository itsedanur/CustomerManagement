package com.example.crm.address.service;

import com.example.crm.address.dto.AddressResponse;
import com.example.crm.address.dto.CreateAddressRequest;
import com.example.crm.address.dto.UpdateAddressRequest;
import com.example.crm.address.entity.Address;
import com.example.crm.address.mapper.AddressMapper;
import com.example.crm.address.repository.AddressRepository;
import com.example.crm.common.exception.AddressNotFoundException;
import com.example.crm.common.exception.CustomerNotFoundException;
import com.example.crm.customer.entity.Customer;
import com.example.crm.customer.repository.CustomerRepository;
import com.example.crm.activity.service.ActivityService;
import com.example.crm.activity.entity.ActivityType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final CustomerRepository customerRepository;
    private final AddressMapper addressMapper;
    private final ActivityService activityService;

    private Customer getCustomerOrThrow(Long customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with id: " + customerId));
    }

    private Address getAddressAndVerifyOwnership(Long customerId, Long addressId) {
        return addressRepository.findByIdAndCustomer_Id(addressId, customerId)
                .orElseThrow(() -> new AddressNotFoundException("Address not found or does not belong to the specified customer."));
    }

    @Override
    @Transactional
    public AddressResponse createAddress(Long customerId, CreateAddressRequest request) {
        Customer customer = getCustomerOrThrow(customerId);
        Address address = addressMapper.toEntity(request);
        address.setCustomer(customer);
        Address savedAddress = addressRepository.save(address);
        
        activityService.logActivity(customer, ActivityType.ADDRESS_ADDED, savedAddress.getId(), "Adres eklendi: " + savedAddress.getTitle());
        
        return addressMapper.toResponse(savedAddress);
    }

    @Override
    @Transactional(readOnly = true)
    public AddressResponse getAddress(Long customerId, Long addressId) {
        getCustomerOrThrow(customerId);
        Address address = getAddressAndVerifyOwnership(customerId, addressId);
        return addressMapper.toResponse(address);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getCustomerAddresses(Long customerId) {
        getCustomerOrThrow(customerId);
        List<Address> addresses = addressRepository.findAllByCustomer_Id(customerId);
        return addresses.stream()
                .map(addressMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(Long customerId, Long addressId, UpdateAddressRequest request) {
        Customer customer = getCustomerOrThrow(customerId);
        Address address = getAddressAndVerifyOwnership(customerId, addressId);
        
        addressMapper.updateEntity(address, request);
        Address updatedAddress = addressRepository.save(address);
        
        activityService.logActivity(customer, ActivityType.ADDRESS_UPDATED, updatedAddress.getId(), "Adres güncellendi: " + updatedAddress.getTitle());
        
        return addressMapper.toResponse(updatedAddress);
    }

    @Override
    @Transactional
    public void deleteAddress(Long customerId, Long addressId) {
        Customer customer = getCustomerOrThrow(customerId);
        Address address = getAddressAndVerifyOwnership(customerId, addressId);
        addressRepository.delete(address);
        
        activityService.logActivity(customer, ActivityType.ADDRESS_DELETED, addressId, "Adres silindi: " + address.getTitle());
    }
}
