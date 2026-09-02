package com.example.crm.customer.controller;

import com.example.crm.customer.dto.CustomerNoteRequest;
import com.example.crm.customer.dto.CustomerNoteResponse;
import com.example.crm.customer.service.CustomerNoteService;
import com.example.crm.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerNoteController {

    private final CustomerNoteService customerNoteService;

    @GetMapping("/{customerId}/notes")
    public ResponseEntity<List<CustomerNoteResponse>> getCustomerNotes(@PathVariable Long customerId) {
        return ResponseEntity.ok(customerNoteService.getNotesByCustomerId(customerId));
    }

    @PostMapping("/{customerId}/notes")
    public ResponseEntity<CustomerNoteResponse> createCustomerNote(
            @PathVariable Long customerId,
            @Valid @RequestBody CustomerNoteRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(customerNoteService.createNote(customerId, request, user.getId()));
    }

    @PutMapping("/notes/{noteId}")
    public ResponseEntity<CustomerNoteResponse> updateCustomerNote(
            @PathVariable Long noteId,
            @Valid @RequestBody CustomerNoteRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(customerNoteService.updateNote(noteId, request, user.getId()));
    }

    @DeleteMapping("/notes/{noteId}")
    public ResponseEntity<Void> deleteCustomerNote(
            @PathVariable Long noteId,
            @AuthenticationPrincipal User user) {
        customerNoteService.deleteNote(noteId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
