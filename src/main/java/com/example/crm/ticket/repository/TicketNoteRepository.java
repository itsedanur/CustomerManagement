package com.example.crm.ticket.repository;

import com.example.crm.ticket.entity.TicketNote;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketNoteRepository extends JpaRepository<TicketNote, Long> {

    @EntityGraph(attributePaths = {"authorUser"})
    List<TicketNote> findByTicketIdOrderByCreatedAtDesc(Long ticketId);
}
