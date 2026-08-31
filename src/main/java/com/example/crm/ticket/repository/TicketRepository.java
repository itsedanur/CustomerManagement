package com.example.crm.ticket.repository;

import com.example.crm.ticket.entity.Ticket;
import com.example.crm.ticket.entity.TicketStatus;
import com.example.crm.ticket.entity.TicketPriority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {
    Optional<Ticket> findByTicketNumber(String ticketNumber);
    long countByStatus(TicketStatus status);
    long countByPriority(TicketPriority priority);
}
