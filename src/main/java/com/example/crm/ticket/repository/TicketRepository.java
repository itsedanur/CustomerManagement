package com.example.crm.ticket.repository;

import com.example.crm.ticket.entity.Ticket;
import com.example.crm.ticket.entity.TicketStatus;
import com.example.crm.ticket.entity.TicketPriority;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {
    Optional<Ticket> findByTicketNumber(String ticketNumber);
    long countByStatus(TicketStatus status);
    long countByPriority(TicketPriority priority);
    long countByCreatedAtAfter(LocalDateTime date);
    List<Ticket> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Override
    @EntityGraph(attributePaths = {"customer", "assignedUser"})
    Page<Ticket> findAll(Specification<Ticket> spec, Pageable pageable);
}
