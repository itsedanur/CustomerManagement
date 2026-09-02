package com.example.crm.ticket.service;

import com.example.crm.ticket.dto.TicketNoteRequest;
import com.example.crm.ticket.dto.TicketNoteResponse;

import java.util.List;

public interface TicketNoteService {
    List<TicketNoteResponse> getNotesByTicketId(Long ticketId, Long currentUserId);
    TicketNoteResponse createNote(Long ticketId, TicketNoteRequest request, Long authorUserId);
    TicketNoteResponse updateNote(Long noteId, TicketNoteRequest request, Long userId);
    void deleteNote(Long noteId, Long userId);
}
