package com.example.crm.ticket.controller;

import com.example.crm.common.dto.PageResponse;
import com.example.crm.ticket.dto.AssignTicketRequest;
import com.example.crm.ticket.dto.ChangePriorityRequest;
import com.example.crm.ticket.dto.CreateTicketRequest;
import com.example.crm.ticket.dto.TicketResponse;
import com.example.crm.ticket.dto.UpdateTicketRequest;
import com.example.crm.ticket.entity.TicketPriority;
import com.example.crm.ticket.entity.TicketStatus;
import com.example.crm.ticket.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping("/customers/{customerId}/tickets")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<TicketResponse> createTicket(
            @PathVariable Long customerId,
            @Valid @RequestBody CreateTicketRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.createTicket(customerId, request));
    }

    @GetMapping("/tickets")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
    public ResponseEntity<PageResponse<TicketResponse>> getTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long assignedUserId,
            @RequestParam(required = false) String ticketNumber,
            @RequestParam(required = false) String search,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ticketService.getTickets(status, priority, customerId, assignedUserId, ticketNumber, search, pageable));
    }

    @GetMapping("/customers/{customerId}/tickets")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
    public ResponseEntity<PageResponse<TicketResponse>> getCustomerTickets(
            @PathVariable Long customerId,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ticketService.getCustomerTickets(customerId, pageable));
    }

    @GetMapping("/tickets/{ticketId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable("ticketId") Long ticketId) {
        return ResponseEntity.ok(ticketService.getTicketById(ticketId));
    }

    @PutMapping("/tickets/{ticketId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
    public ResponseEntity<TicketResponse> updateTicketContent(
            @PathVariable("ticketId") Long ticketId,
            @Valid @RequestBody UpdateTicketRequest request) {
        return ResponseEntity.ok(ticketService.updateTicketContent(ticketId, request));
    }

    @PatchMapping("/tickets/{ticketId}/assignment")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable("ticketId") Long ticketId,
            @Valid @RequestBody AssignTicketRequest request) {
        return ResponseEntity.ok(ticketService.assignTicket(ticketId, request));
    }

    @PatchMapping("/tickets/{ticketId}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
    public ResponseEntity<TicketResponse> startProgress(@PathVariable("ticketId") Long ticketId) {
        return ResponseEntity.ok(ticketService.startProgress(ticketId));
    }

    @PatchMapping("/tickets/{ticketId}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
    public ResponseEntity<TicketResponse> resolveTicket(@PathVariable("ticketId") Long ticketId) {
        return ResponseEntity.ok(ticketService.resolveTicket(ticketId));
    }

    @PatchMapping("/tickets/{ticketId}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
    public ResponseEntity<TicketResponse> closeTicket(@PathVariable("ticketId") Long ticketId) {
        return ResponseEntity.ok(ticketService.closeTicket(ticketId));
    }

    @PatchMapping("/tickets/{ticketId}/reopen")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
    public ResponseEntity<TicketResponse> reopenTicket(@PathVariable("ticketId") Long ticketId) {
        return ResponseEntity.ok(ticketService.reopenTicket(ticketId));
    }

    @PatchMapping("/tickets/{ticketId}/priority")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<TicketResponse> changePriority(
            @PathVariable("ticketId") Long ticketId,
            @Valid @RequestBody ChangePriorityRequest request) {
        return ResponseEntity.ok(ticketService.changePriority(ticketId, request));
    }
}
