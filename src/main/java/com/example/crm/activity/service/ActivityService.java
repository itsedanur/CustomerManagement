package com.example.crm.activity.service;

import com.example.crm.activity.entity.ActivityType;
import com.example.crm.activity.dto.ActivityResponse;
import com.example.crm.customer.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ActivityService {
    
    void logActivity(Customer customer, ActivityType type, Long entityId, String description);
    
    void logActivity(Long customerId, ActivityType type, Long entityId, String description);

    List<ActivityResponse> getCustomerActivities(Long customerId);

    Page<ActivityResponse> getAllActivities(Pageable pageable);
}
