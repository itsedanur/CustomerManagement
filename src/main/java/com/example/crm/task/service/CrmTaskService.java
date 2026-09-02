package com.example.crm.task.service;

import com.example.crm.task.dto.CrmTaskRequest;
import com.example.crm.task.dto.CrmTaskResponse;
import com.example.crm.task.dto.CrmTaskStatusUpdateRequest;
import com.example.crm.task.entity.TaskPriority;
import com.example.crm.task.entity.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CrmTaskService {
    Page<CrmTaskResponse> getAllTasks(String search, TaskStatus status, TaskPriority priority, Long assignedUserId, Long customerId, Long ticketId, Pageable pageable);
    CrmTaskResponse getTaskById(Long id);
    CrmTaskResponse createTask(CrmTaskRequest request, Long createdByUserId);
    CrmTaskResponse updateTask(Long id, CrmTaskRequest request, Long currentUserId);
    CrmTaskResponse updateTaskStatus(Long id, CrmTaskStatusUpdateRequest request, Long currentUserId);
    void deleteTask(Long id, Long currentUserId);
    List<CrmTaskResponse> getMyTasksDueToday(Long userId);
    List<CrmTaskResponse> getMyOverdueTasks(Long userId);
    List<CrmTaskResponse> getCustomerTasks(Long customerId);
    List<CrmTaskResponse> getTicketTasks(Long ticketId);
}
