package com.example.crm.activity.repository;

import com.example.crm.activity.entity.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    
    List<Activity> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    
    Page<Activity> findByCustomerIdOrderByCreatedAtDesc(Long customerId, Pageable pageable);
}
