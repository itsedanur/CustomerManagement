package com.example.crm.customer.service;

import com.example.crm.customer.dto.CustomerNoteRequest;
import com.example.crm.customer.dto.CustomerNoteResponse;

import java.util.List;

public interface CustomerNoteService {
    List<CustomerNoteResponse> getNotesByCustomerId(Long customerId);
    CustomerNoteResponse createNote(Long customerId, CustomerNoteRequest request, Long authorUserId);
    CustomerNoteResponse updateNote(Long noteId, CustomerNoteRequest request, Long userId);
    void deleteNote(Long noteId, Long userId);
}
