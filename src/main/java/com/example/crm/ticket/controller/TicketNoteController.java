package com.example.crm.ticket.controller;

import com.example.crm.ticket.dto.TicketNoteRequest;
import com.example.crm.ticket.dto.TicketNoteResponse;
import com.example.crm.ticket.service.TicketNoteService;
import com.example.crm.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketNoteController {

    private final TicketNoteService ticketNoteService;

    @GetMapping("/{ticketId}/notes")
    public ResponseEntity<List<TicketNoteResponse>> getTicketNotes(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketNoteService.getNotesByTicketId(ticketId, user.getId()));
    }

    @PostMapping("/{ticketId}/notes")
    public ResponseEntity<TicketNoteResponse> createTicketNote(
            @PathVariable Long ticketId,
            @Valid @RequestBody TicketNoteRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketNoteService.createNote(ticketId, request, user.getId()));
    }

    @PutMapping("/notes/{noteId}")
    public ResponseEntity<TicketNoteResponse> updateTicketNote(
            @PathVariable Long noteId,
            @Valid @RequestBody TicketNoteRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketNoteService.updateNote(noteId, request, user.getId()));
    }

    @DeleteMapping("/notes/{noteId}")
    public ResponseEntity<Void> deleteTicketNote(
            @PathVariable Long noteId,
            @AuthenticationPrincipal User user) {
        ticketNoteService.deleteNote(noteId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
