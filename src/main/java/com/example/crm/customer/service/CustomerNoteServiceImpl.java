package com.example.crm.customer.service;

import com.example.crm.audit.service.AuditLogService;
import com.example.crm.common.exception.ResourceNotFoundException;
import com.example.crm.customer.dto.CustomerNoteRequest;
import com.example.crm.customer.dto.CustomerNoteResponse;
import com.example.crm.customer.entity.Customer;
import com.example.crm.customer.entity.CustomerNote;
import com.example.crm.customer.repository.CustomerNoteRepository;
import com.example.crm.customer.repository.CustomerRepository;
import com.example.crm.user.entity.User;
import com.example.crm.user.entity.UserRole;
import com.example.crm.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerNoteServiceImpl implements CustomerNoteService {

    private final CustomerNoteRepository customerNoteRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public List<CustomerNoteResponse> getNotesByCustomerId(Long customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer", "id", customerId);
        }
        return customerNoteRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CustomerNoteResponse createNote(Long customerId, CustomerNoteRequest request, Long authorUserId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));
        User author = userRepository.findById(authorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", authorUserId));

        CustomerNote note = CustomerNote.builder()
                .customer(customer)
                .authorUser(author)
                .content(request.getContent().trim())
                .build();

        note = customerNoteRepository.save(note);

        auditLogService.log(author, "CUSTOMER_NOTE_CREATED", "CUSTOMER", String.valueOf(customerId), "Müşteri için not eklendi: ID #" + note.getId());

        return mapToResponse(note);
    }

    @Override
    @Transactional
    public CustomerNoteResponse updateNote(Long noteId, CustomerNoteRequest request, Long userId) {
        CustomerNote note = customerNoteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("CustomerNote", "id", noteId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!note.getAuthorUser().getId().equals(userId) && user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Sadece kendi eklediğiniz notları düzenleyebilirsiniz.");
        }

        note.setContent(request.getContent().trim());
        note = customerNoteRepository.save(note);

        auditLogService.log(user, "CUSTOMER_NOTE_UPDATED", "CUSTOMER", String.valueOf(note.getCustomer().getId()),
                "Müşteri notu güncellendi: ID #" + note.getId());

        return mapToResponse(note);
    }

    @Override
    @Transactional
    public void deleteNote(Long noteId, Long userId) {
        CustomerNote note = customerNoteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("CustomerNote", "id", noteId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!note.getAuthorUser().getId().equals(userId) && user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.MANAGER) {
            throw new AccessDeniedException("Bu notu silmek için yetkiniz bulunmamaktadır.");
        }

        Long customerId = note.getCustomer().getId();
        customerNoteRepository.delete(note);

        auditLogService.log(user, "CUSTOMER_NOTE_DELETED", "CUSTOMER", String.valueOf(customerId),
                "Müşteri notu silindi: ID #" + noteId);
    }

    private CustomerNoteResponse mapToResponse(CustomerNote note) {
        String authorName = (note.getAuthorUser().getFirstName() + " " + note.getAuthorUser().getLastName()).trim();
        if ("System Admin".equalsIgnoreCase(authorName)) {
            authorName = "Sistem Yöneticisi";
        }

        return CustomerNoteResponse.builder()
                .id(note.getId())
                .customerId(note.getCustomer().getId())
                .authorUserId(note.getAuthorUser().getId())
                .authorName(authorName)
                .authorEmail(note.getAuthorUser().getEmail())
                .content(note.getContent())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}
