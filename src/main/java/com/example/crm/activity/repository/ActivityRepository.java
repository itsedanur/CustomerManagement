package com.example.crm.activity.repository;

import com.example.crm.activity.entity.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    
    @EntityGraph(attributePaths = {"performedBy"})
    List<Activity> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    @EntityGraph(attributePaths = {"performedBy"})
    List<Activity> findByEntityIdOrderByCreatedAtDesc(Long entityId);
    
    @EntityGraph(attributePaths = {"performedBy"})
    Page<Activity> findByCustomerIdOrderByCreatedAtDesc(Long customerId, Pageable pageable);

    @EntityGraph(attributePaths = {"performedBy"})
    List<Activity> findTop10ByOrderByCreatedAtDesc();
}
