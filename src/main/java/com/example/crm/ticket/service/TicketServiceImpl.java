package com.example.crm.ticket.service;

import com.example.crm.common.dto.PageResponse;
import com.example.crm.common.exception.CustomerNotFoundException;
import com.example.crm.common.exception.InvalidTicketTransitionException;
import com.example.crm.common.exception.TicketNotFoundException;
import com.example.crm.customer.entity.Customer;
import com.example.crm.customer.repository.CustomerRepository;
import com.example.crm.ticket.dto.AssignTicketRequest;
import com.example.crm.ticket.dto.CreateTicketRequest;
import com.example.crm.ticket.dto.TicketResponse;
import com.example.crm.ticket.dto.UpdateTicketRequest;
import com.example.crm.ticket.entity.Ticket;
import com.example.crm.ticket.entity.TicketPriority;
import com.example.crm.ticket.entity.TicketStatus;
import com.example.crm.auth.service.CurrentUserService;
import com.example.crm.ticket.mapper.TicketMapper;
import com.example.crm.ticket.repository.TicketRepository;
import com.example.crm.ticket.repository.TicketSpecification;
import com.example.crm.user.repository.UserRepository;
import com.example.crm.user.entity.User;
import com.example.crm.activity.service.ActivityService;
import com.example.crm.activity.entity.ActivityType;
import com.example.crm.notification.service.NotificationService;
import com.example.crm.audit.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final TicketMapper ticketMapper;
    private final JdbcTemplate jdbcTemplate;
    private final ActivityService activityService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary", allEntries = true)
    public TicketResponse createTicket(Long customerId, CreateTicketRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with id: " + customerId));

        Ticket ticket = ticketMapper.toEntity(request);
        ticket.setCustomer(customer);
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setTicketNumber(generateTicketNumber());

        Ticket savedTicket = ticketRepository.save(ticket);
        
        activityService.logActivity(customer, ActivityType.TICKET_CREATED, savedTicket.getId(), "Destek talebi oluşturuldu: " + savedTicket.getTicketNumber());
        auditLogService.log("TICKET_CREATE", "TICKET", savedTicket.getId().toString(), "Destek talebi oluşturuldu: " + savedTicket.getTicketNumber());
        
        return ticketMapper.toResponse(savedTicket);
    }

    private String generateTicketNumber() {
        Long seq = jdbcTemplate.queryForObject("SELECT nextval('ticket_number_seq')", Long.class);
        return String.format("CRM-%d-%06d", Year.now().getValue(), seq);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TicketResponse> getTickets(TicketStatus status, TicketPriority priority, Long customerId, Long assignedUserId, String ticketNumber, String search, Pageable pageable) {
        Specification<Ticket> spec = Specification.where(TicketSpecification.hasStatus(status))
                .and(TicketSpecification.hasPriority(priority))
                .and(TicketSpecification.hasCustomerId(customerId))
                .and(TicketSpecification.hasAssignedUserId(assignedUserId))
                .and(TicketSpecification.hasTicketNumber(ticketNumber))
                .and(TicketSpecification.hasSearch(search));

        Page<Ticket> ticketPage = ticketRepository.findAll(spec, pageable);
        return PageResponse.of(ticketPage.map(ticketMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TicketResponse> getCustomerTickets(Long customerId, Pageable pageable) {
        Specification<Ticket> spec = Specification.where(TicketSpecification.hasCustomerId(customerId));
        Page<Ticket> ticketPage = ticketRepository.findAll(spec, pageable);
        return PageResponse.of(ticketPage.map(ticketMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long id) {
        return ticketMapper.toResponse(getTicketEntity(id));
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary", allEntries = true)
    public TicketResponse updateTicketContent(Long id, UpdateTicketRequest request) {
        Ticket ticket = getTicketEntity(id);
        checkAgentOwnership(ticket);
        ticketMapper.updateEntityFromRequest(request, ticket);
        return ticketMapper.toResponse(ticketRepository.save(ticket));
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary", allEntries = true)
    public TicketResponse assignTicket(Long id, AssignTicketRequest request) {
        Ticket ticket = getTicketEntity(id);
        
        User user = userRepository.findById(request.getAssignedUserId())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
        ticket.setAssignedUser(user);
        
        Ticket savedTicket = ticketRepository.save(ticket);
        activityService.logActivity(ticket.getCustomer(), ActivityType.TICKET_ASSIGNED, savedTicket.getId(), "Destek talebi atandı: " + user.getFirstName() + " " + user.getLastName());
        auditLogService.log("TICKET_ASSIGN", "TICKET", savedTicket.getId().toString(), "Destek talebi atandı: " + user.getEmail());
        
        notificationService.createNotification(
            user.getId(),
            "Yeni Talep Atandı",
            String.format("Size %s numaralı talep atandı.", savedTicket.getTicketNumber()),
            "/tickets/" + savedTicket.getId()
        );
        
        return ticketMapper.toResponse(savedTicket);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary", allEntries = true)
    public TicketResponse startProgress(Long id) {
        Ticket ticket = getTicketEntity(id);
        checkAgentOwnership(ticket);
        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new InvalidTicketTransitionException("Cannot start progress on ticket in status: " + ticket.getStatus());
        }
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        Ticket savedTicket = ticketRepository.save(ticket);
        activityService.logActivity(ticket.getCustomer(), ActivityType.TICKET_STARTED, savedTicket.getId(), "Destek talebi işleme alındı");
        auditLogService.log("TICKET_STATUS_CHANGE", "TICKET", savedTicket.getId().toString(), "Durum IN_PROGRESS yapıldı");
        return ticketMapper.toResponse(savedTicket);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary", allEntries = true)
    public TicketResponse resolveTicket(Long id) {
        Ticket ticket = getTicketEntity(id);
        checkAgentOwnership(ticket);
        if (ticket.getStatus() != TicketStatus.IN_PROGRESS) {
            throw new InvalidTicketTransitionException("Only tickets in IN_PROGRESS state can be resolved.");
        }
        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());
        Ticket savedTicket = ticketRepository.save(ticket);
        activityService.logActivity(ticket.getCustomer(), ActivityType.TICKET_RESOLVED, savedTicket.getId(), "Destek talebi çözüldü");
        auditLogService.log("TICKET_STATUS_CHANGE", "TICKET", savedTicket.getId().toString(), "Durum RESOLVED yapıldı");
        return ticketMapper.toResponse(savedTicket);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary", allEntries = true)
    public TicketResponse closeTicket(Long id) {
        Ticket ticket = getTicketEntity(id);
        checkAgentOwnership(ticket);
        if (ticket.getStatus() != TicketStatus.OPEN && ticket.getStatus() != TicketStatus.RESOLVED) {
            throw new InvalidTicketTransitionException("Cannot close ticket from current status: " + ticket.getStatus());
        }
        ticket.setStatus(TicketStatus.CLOSED);
        ticket.setClosedAt(LocalDateTime.now());
        Ticket savedTicket = ticketRepository.save(ticket);
        activityService.logActivity(ticket.getCustomer(), ActivityType.TICKET_CLOSED, savedTicket.getId(), "Destek talebi kapatıldı");
        auditLogService.log("TICKET_STATUS_CHANGE", "TICKET", savedTicket.getId().toString(), "Durum CLOSED yapıldı");
        return ticketMapper.toResponse(savedTicket);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary", allEntries = true)
    public TicketResponse reopenTicket(Long id) {
        Ticket ticket = getTicketEntity(id);
        checkAgentOwnership(ticket);
        if (ticket.getStatus() != TicketStatus.RESOLVED) {
            throw new InvalidTicketTransitionException("Only RESOLVED tickets can be reopened.");
        }
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket.setResolvedAt(null);
        Ticket savedTicket = ticketRepository.save(ticket);
        activityService.logActivity(ticket.getCustomer(), ActivityType.TICKET_REOPENED, savedTicket.getId(), "Destek talebi yeniden açıldı");
        auditLogService.log("TICKET_STATUS_CHANGE", "TICKET", savedTicket.getId().toString(), "Durum OPEN yapıldı (Yeniden Açıldı)");
        return ticketMapper.toResponse(savedTicket);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary", allEntries = true)
    public TicketResponse changePriority(Long ticketId, com.example.crm.ticket.dto.ChangePriorityRequest request) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new EntityNotFoundException("Destek talebi bulunamadı: " + ticketId));

        ticket.setPriority(request.getPriority());
        Ticket savedTicket = ticketRepository.save(ticket);
        
        activityService.logActivity(ticket.getCustomer(), ActivityType.TICKET_PRIORITY_CHANGED, savedTicket.getId(), "Destek talebi önceliği değiştirildi: " + request.getPriority());
        auditLogService.log("TICKET_PRIORITY_CHANGE", "TICKET", savedTicket.getId().toString(), "Öncelik değiştirildi: " + request.getPriority());

        return ticketMapper.toResponse(savedTicket);
    }

    private Ticket getTicketEntity(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found with id: " + id));
    }

    private void checkAgentOwnership(Ticket ticket) {
        String role = currentUserService.getCurrentUserRole();
        if ("AGENT".equals(role)) {
            Long currentUserId = currentUserService.getCurrentUserId();
            if (ticket.getAssignedUser() == null || !ticket.getAssignedUser().getId().equals(currentUserId)) {
                throw new org.springframework.security.access.AccessDeniedException("Agents can only modify their own assigned tickets");
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportTicketsCsv(TicketStatus status, TicketPriority priority, String search) {
        Specification<Ticket> spec = Specification.where((root, query, cb) -> cb.conjunction());
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (priority != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("priority"), priority));
        }
        if (org.springframework.util.StringUtils.hasText(search)) {
            spec = spec.and(TicketSpecification.hasSearch(search));
        }

        List<Ticket> list = ticketRepository.findAll(spec, Sort.by("createdAt").descending());

        StringBuilder sb = new StringBuilder();
        sb.append("\uFEFF");
        sb.append("Bilet No,Konu,Müşteri,Atanan Temsilci,Öncelik,Durum,Oluşturulma Tarihi,Çözülme Tarihi\n");

        for (Ticket t : list) {
            String customerName = t.getCustomer() != null ? (t.getCustomer().getFirstName() + " " + t.getCustomer().getLastName()).trim() : "";
            String assignedName = t.getAssignedUser() != null ? (t.getAssignedUser().getFirstName() + " " + t.getAssignedUser().getLastName()).trim() : "Atanmadı";
            if ("System Admin".equalsIgnoreCase(assignedName)) assignedName = "Sistem Yöneticisi";

            sb.append("\"").append(t.getTicketNumber()).append("\",")
                    .append("\"").append(t.getSubject().replace("\"", "\"\"")).append("\",")
                    .append("\"").append(customerName.replace("\"", "\"\"")).append("\",")
                    .append("\"").append(assignedName.replace("\"", "\"\"")).append("\",")
                    .append("\"").append(t.getPriority()).append("\",")
                    .append("\"").append(t.getStatus()).append("\",")
                    .append("\"").append(t.getCreatedAt() != null ? t.getCreatedAt() : "").append("\",")
                    .append("\"").append(t.getResolvedAt() != null ? t.getResolvedAt() : "").append("\"\n");
        }

        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }
}
