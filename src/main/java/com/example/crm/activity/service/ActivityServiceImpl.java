package com.example.crm.activity.service;

import com.example.crm.activity.dto.ActivityResponse;
import com.example.crm.activity.entity.Activity;
import com.example.crm.activity.entity.ActivityType;
import com.example.crm.activity.mapper.ActivityMapper;
import com.example.crm.activity.repository.ActivityRepository;
import com.example.crm.customer.entity.Customer;
import com.example.crm.customer.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityServiceImpl implements ActivityService {

    private final ActivityRepository activityRepository;
    private final CustomerRepository customerRepository;
    private final com.example.crm.user.repository.UserRepository userRepository;
    private final ActivityMapper activityMapper;

    @Override
    @Transactional
    public void logActivity(Customer customer, ActivityType type, Long entityId, String description) {
        if (customer == null) {
            log.warn("Cannot log activity without customer context");
            return;
        }

        Activity activity = Activity.builder()
                .customer(customer)
                .type(type)
                .entityId(entityId)
                .description(description)
                .performedBy(getCurrentUser())
                .build();

        activityRepository.save(activity);
    }

    private com.example.crm.user.entity.User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            String email = auth.getName();
            return userRepository.findByEmail(email).orElse(null);
        }
        return null;
    }

    @Override
    @Transactional
    public void logActivity(Long customerId, ActivityType type, Long entityId, String description) {
        if (customerId == null) {
            log.warn("Cannot log activity without customerId");
            return;
        }
        
        Customer customer = customerRepository.findById(customerId).orElse(null);
        if (customer != null) {
            logActivity(customer, type, entityId, description);
        } else {
            log.warn("Customer not found with id: {}", customerId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityResponse> getCustomerActivities(Long customerId) {
        return activityRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(activityMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityResponse> getTicketActivities(Long ticketId) {
        return activityRepository.findByEntityIdOrderByCreatedAtDesc(ticketId)
                .stream()
                .map(activityMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ActivityResponse> getAllActivities(Pageable pageable) {
        return activityRepository.findAll(pageable)
                .map(activityMapper::toResponse);
    }
}
