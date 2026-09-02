package com.example.crm.task.controller;

import com.example.crm.task.dto.CrmTaskRequest;
import com.example.crm.task.dto.CrmTaskResponse;
import com.example.crm.task.dto.CrmTaskStatusUpdateRequest;
import com.example.crm.task.entity.TaskPriority;
import com.example.crm.task.entity.TaskStatus;
import com.example.crm.task.service.CrmTaskService;
import com.example.crm.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class CrmTaskController {

    private final CrmTaskService crmTaskService;

    @GetMapping
    public ResponseEntity<Page<CrmTaskResponse>> getAllTasks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) Long assignedUserId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long ticketId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(crmTaskService.getAllTasks(search, status, priority, assignedUserId, customerId, ticketId, PageRequest.of(page, size, sort)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CrmTaskResponse> getTaskById(@PathVariable Long id) {
        return ResponseEntity.ok(crmTaskService.getTaskById(id));
    }

    @PostMapping
    public ResponseEntity<CrmTaskResponse> createTask(
            @Valid @RequestBody CrmTaskRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(crmTaskService.createTask(request, user.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CrmTaskResponse> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody CrmTaskRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(crmTaskService.updateTask(id, request, user.getId()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CrmTaskResponse> updateTaskStatus(
            @PathVariable Long id,
            @Valid @RequestBody CrmTaskStatusUpdateRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(crmTaskService.updateTaskStatus(id, request, user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        crmTaskService.deleteTask(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-due-today")
    public ResponseEntity<List<CrmTaskResponse>> getMyTasksDueToday(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(crmTaskService.getMyTasksDueToday(user.getId()));
    }

    @GetMapping("/my-overdue")
    public ResponseEntity<List<CrmTaskResponse>> getMyOverdueTasks(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(crmTaskService.getMyOverdueTasks(user.getId()));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<CrmTaskResponse>> getCustomerTasks(@PathVariable Long customerId) {
        return ResponseEntity.ok(crmTaskService.getCustomerTasks(customerId));
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<List<CrmTaskResponse>> getTicketTasks(@PathVariable Long ticketId) {
        return ResponseEntity.ok(crmTaskService.getTicketTasks(ticketId));
    }
}
