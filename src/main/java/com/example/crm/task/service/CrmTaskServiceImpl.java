package com.example.crm.task.service;

import com.example.crm.audit.service.AuditLogService;
import com.example.crm.common.exception.ResourceNotFoundException;
import com.example.crm.customer.entity.Customer;
import com.example.crm.customer.repository.CustomerRepository;
import com.example.crm.notification.service.NotificationService;
import com.example.crm.task.dto.CrmTaskRequest;
import com.example.crm.task.dto.CrmTaskResponse;
import com.example.crm.task.dto.CrmTaskStatusUpdateRequest;
import com.example.crm.task.entity.CrmTask;
import com.example.crm.task.entity.TaskPriority;
import com.example.crm.task.entity.TaskStatus;
import com.example.crm.task.repository.CrmTaskRepository;
import com.example.crm.task.repository.CrmTaskSpecification;
import com.example.crm.ticket.entity.Ticket;
import com.example.crm.ticket.repository.TicketRepository;
import com.example.crm.user.entity.User;
import com.example.crm.user.entity.UserRole;
import com.example.crm.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CrmTaskServiceImpl implements CrmTaskService {

    private final CrmTaskRepository crmTaskRepository;
    private final CustomerRepository customerRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public Page<CrmTaskResponse> getAllTasks(
            String search, TaskStatus status, TaskPriority priority,
            Long assignedUserId, Long customerId, Long ticketId, Pageable pageable) {
        Specification<CrmTask> spec = CrmTaskSpecification.filterTasks(search, status, priority, assignedUserId, customerId, ticketId);
        return crmTaskRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CrmTaskResponse getTaskById(Long id) {
        CrmTask task = crmTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CrmTask", "id", id));
        return mapToResponse(task);
    }

    @Override
    @Transactional
    public CrmTaskResponse createTask(CrmTaskRequest request, Long createdByUserId) {
        User creator = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", createdByUserId));
        User assignedUser = userRepository.findById(request.getAssignedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedUserId()));

        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));
        }

        Ticket ticket = null;
        if (request.getTicketId() != null) {
            ticket = ticketRepository.findById(request.getTicketId())
                    .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", request.getTicketId()));
        }

        CrmTask task = CrmTask.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .customer(customer)
                .ticket(ticket)
                .assignedUser(assignedUser)
                .createdByUser(creator)
                .dueDate(request.getDueDate())
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM)
                .status(TaskStatus.TODO)
                .build();

        task = crmTaskRepository.save(task);

        auditLogService.log(creator, "TASK_CREATED", "TASK", String.valueOf(task.getId()),
                "Yeni görev oluşturuldu: '" + task.getTitle() + "'");

        if (!assignedUser.getId().equals(createdByUserId)) {
            notificationService.createNotification(
                    assignedUser.getId(),
                    "Size yeni bir görev atandı: " + task.getTitle(),
                    "Görev Detayı: " + (task.getDescription() != null ? task.getDescription() : "Açıklama belirtilmedi"),
                    "/tasks"
            );
        }

        return mapToResponse(task);
    }

    @Override
    @Transactional
    public CrmTaskResponse updateTask(Long id, CrmTaskRequest request, Long currentUserId) {
        CrmTask task = crmTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CrmTask", "id", id));
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        checkTaskPermission(task, currentUser);

        User assignedUser = userRepository.findById(request.getAssignedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedUserId()));

        boolean assignmentChanged = !task.getAssignedUser().getId().equals(assignedUser.getId());

        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));
        }

        Ticket ticket = null;
        if (request.getTicketId() != null) {
            ticket = ticketRepository.findById(request.getTicketId())
                    .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", request.getTicketId()));
        }

        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        task.setCustomer(customer);
        task.setTicket(ticket);
        task.setAssignedUser(assignedUser);
        task.setDueDate(request.getDueDate());
        task.setPriority(request.getPriority());

        task = crmTaskRepository.save(task);

        auditLogService.log(currentUser, "TASK_UPDATED", "TASK", String.valueOf(task.getId()),
                "Görev bilgileri güncellendi: #" + task.getId());

        if (assignmentChanged && !assignedUser.getId().equals(currentUserId)) {
            notificationService.createNotification(
                    assignedUser.getId(),
                    "Görev Size Devredildi: " + task.getTitle(),
                    "Görev atamanız güncellendi.",
                    "/tasks"
            );
        }

        return mapToResponse(task);
    }

    @Override
    @Transactional
    public CrmTaskResponse updateTaskStatus(Long id, CrmTaskStatusUpdateRequest request, Long currentUserId) {
        CrmTask task = crmTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CrmTask", "id", id));
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        checkTaskPermission(task, currentUser);

        TaskStatus newStatus = request.getStatus();
        TaskStatus oldStatus = task.getStatus();

        if (oldStatus == newStatus) {
            return mapToResponse(task);
        }

        // State Machine validation
        if (oldStatus == TaskStatus.COMPLETED && newStatus == TaskStatus.TODO && currentUser.getRole() == UserRole.AGENT) {
            throw new IllegalArgumentException("Tamamlanmış bir görev doğrudan TODO durumuna çekilemez.");
        }

        task.setStatus(newStatus);
        if (newStatus == TaskStatus.COMPLETED) {
            task.setCompletedAt(LocalDateTime.now());
        } else {
            task.setCompletedAt(null);
        }

        task = crmTaskRepository.save(task);

        auditLogService.log(currentUser, "TASK_STATUS_CHANGE", "TASK", String.valueOf(task.getId()),
                "Görev durumu değiştirildi: " + oldStatus + " -> " + newStatus);

        return mapToResponse(task);
    }

    @Override
    @Transactional
    public void deleteTask(Long id, Long currentUserId) {
        CrmTask task = crmTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CrmTask", "id", id));
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        if (currentUser.getRole() != UserRole.ADMIN && currentUser.getRole() != UserRole.MANAGER && !task.getCreatedByUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Sadece yöneticiler veya görevi oluşturan kişi silebilir.");
        }

        crmTaskRepository.delete(task);

        auditLogService.log(currentUser, "TASK_DELETED", "TASK", String.valueOf(id),
                "Görev silindi: ID #" + id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CrmTaskResponse> getMyTasksDueToday(Long userId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        return crmTaskRepository.findByAssignedUserIdAndDueDateBetweenAndStatusNot(userId, startOfDay, endOfDay, TaskStatus.COMPLETED)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CrmTaskResponse> getMyOverdueTasks(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        List<TaskStatus> excluded = List.of(TaskStatus.COMPLETED, TaskStatus.CANCELLED);
        return crmTaskRepository.findByAssignedUserIdAndDueDateBeforeAndStatusNotIn(userId, now, excluded)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CrmTaskResponse> getCustomerTasks(Long customerId) {
        return crmTaskRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CrmTaskResponse> getTicketTasks(Long ticketId) {
        return crmTaskRepository.findByTicketIdOrderByCreatedAtDesc(ticketId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void checkTaskPermission(CrmTask task, User user) {
        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.MANAGER) {
            return;
        }
        if (task.getAssignedUser().getId().equals(user.getId()) || task.getCreatedByUser().getId().equals(user.getId())) {
            return;
        }
        throw new AccessDeniedException("Bu görevi düzenleme yetkiniz yok.");
    }

    private CrmTaskResponse mapToResponse(CrmTask task) {
        String assignedName = (task.getAssignedUser().getFirstName() + " " + task.getAssignedUser().getLastName()).trim();
        if ("System Admin".equalsIgnoreCase(assignedName)) assignedName = "Sistem Yöneticisi";

        String createdByName = (task.getCreatedByUser().getFirstName() + " " + task.getCreatedByUser().getLastName()).trim();
        if ("System Admin".equalsIgnoreCase(createdByName)) createdByName = "Sistem Yöneticisi";

        String customerName = null;
        if (task.getCustomer() != null) {
            customerName = (task.getCustomer().getFirstName() + " " + task.getCustomer().getLastName()).trim();
            if (task.getCustomer().getCompany() != null && !task.getCustomer().getCompany().isEmpty()) {
                customerName += " (" + task.getCustomer().getCompany() + ")";
            }
        }

        boolean isOverdue = task.getDueDate() != null
                && task.getDueDate().isBefore(LocalDateTime.now())
                && task.getStatus() != TaskStatus.COMPLETED
                && task.getStatus() != TaskStatus.CANCELLED;

        return CrmTaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .customerId(task.getCustomer() != null ? task.getCustomer().getId() : null)
                .customerName(customerName)
                .ticketId(task.getTicket() != null ? task.getTicket().getId() : null)
                .ticketNumber(task.getTicket() != null ? task.getTicket().getTicketNumber() : null)
                .assignedUserId(task.getAssignedUser().getId())
                .assignedUserName(assignedName)
                .createdByUserId(task.getCreatedByUser().getId())
                .createdByUserName(createdByName)
                .dueDate(task.getDueDate())
                .priority(task.getPriority())
                .status(task.getStatus())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .completedAt(task.getCompletedAt())
                .isOverdue(isOverdue)
                .build();
    }
}
