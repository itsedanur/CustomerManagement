package com.example.crm.ticket.service;

import com.example.crm.common.dto.PageResponse;
import com.example.crm.ticket.dto.AssignTicketRequest;
import com.example.crm.ticket.dto.CreateTicketRequest;
import com.example.crm.ticket.dto.TicketResponse;
import com.example.crm.ticket.dto.UpdateTicketRequest;
import com.example.crm.ticket.entity.TicketPriority;
import com.example.crm.ticket.entity.TicketStatus;
import org.springframework.data.domain.Pageable;

public interface TicketService {

    TicketResponse createTicket(Long customerId, CreateTicketRequest request);

    PageResponse<TicketResponse> getTickets(TicketStatus status, TicketPriority priority, Long customerId, Long assignedUserId, String ticketNumber, String search, Pageable pageable);

    PageResponse<TicketResponse> getCustomerTickets(Long customerId, Pageable pageable);

    TicketResponse getTicketById(Long id);

    TicketResponse updateTicketContent(Long id, UpdateTicketRequest request);

    TicketResponse assignTicket(Long id, AssignTicketRequest request);

    TicketResponse startProgress(Long id);

    TicketResponse resolveTicket(Long ticketId);

    TicketResponse closeTicket(Long ticketId);

    TicketResponse reopenTicket(Long ticketId);

    TicketResponse changePriority(Long ticketId, com.example.crm.ticket.dto.ChangePriorityRequest request);

    byte[] exportTicketsCsv(TicketStatus status, TicketPriority priority, String search);
}
