package com.example.crm.ticket.repository;

import com.example.crm.ticket.entity.Ticket;
import com.example.crm.ticket.entity.TicketPriority;
import com.example.crm.ticket.entity.TicketStatus;
import org.springframework.data.jpa.domain.Specification;

public class TicketSpecification {

    public static Specification<Ticket> hasStatus(TicketStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<Ticket> hasPriority(TicketPriority priority) {
        return (root, query, cb) -> priority == null ? null : cb.equal(root.get("priority"), priority);
    }

    public static Specification<Ticket> hasCustomerId(Long customerId) {
        return (root, query, cb) -> customerId == null ? null : cb.equal(root.get("customer").get("id"), customerId);
    }

    public static Specification<Ticket> hasAssignedUserId(Long assignedUserId) {
        return (root, query, cb) -> assignedUserId == null ? null : cb.equal(root.get("assignedUser").get("id"), assignedUserId);
    }

    public static Specification<Ticket> hasTicketNumber(String ticketNumber) {
        return (root, query, cb) -> ticketNumber == null || ticketNumber.isBlank() ? null : cb.equal(root.get("ticketNumber"), ticketNumber);
    }
}
