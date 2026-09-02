package com.example.crm.customer.repository;

import com.example.crm.customer.entity.CustomerNote;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerNoteRepository extends JpaRepository<CustomerNote, Long> {

    @EntityGraph(attributePaths = {"authorUser"})
    List<CustomerNote> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
