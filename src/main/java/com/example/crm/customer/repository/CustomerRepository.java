package com.example.crm.customer.repository;

import com.example.crm.customer.entity.Customer;
import com.example.crm.customer.entity.CustomerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long>, JpaSpecificationExecutor<Customer> {
    boolean existsByEmail(String email);
    java.util.Optional<Customer> findByEmail(String email);
    long countByStatus(CustomerStatus status);
    long countByCreatedAtAfter(LocalDateTime date);
}
