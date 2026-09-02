package com.example.crm.activity.controller;

import com.example.crm.activity.dto.ActivityResponse;
import com.example.crm.activity.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class GlobalActivityController {

    private final ActivityService activityService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<ActivityResponse>> getAllActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(activityService.getAllActivities(pageable));
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<java.util.List<ActivityResponse>> getTicketActivities(@org.springframework.web.bind.annotation.PathVariable Long ticketId) {
        return ResponseEntity.ok(activityService.getTicketActivities(ticketId));
    }
}
