package com.example.crm.address.repository;

import com.example.crm.address.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findAllByCustomer_Id(Long customerId);
    Optional<Address> findByIdAndCustomer_Id(Long id, Long customerId);
}
