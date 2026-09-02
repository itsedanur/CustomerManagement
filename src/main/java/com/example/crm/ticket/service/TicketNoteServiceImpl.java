package com.example.crm.ticket.service;

import com.example.crm.audit.service.AuditLogService;
import com.example.crm.common.exception.ResourceNotFoundException;
import com.example.crm.ticket.dto.TicketNoteRequest;
import com.example.crm.ticket.dto.TicketNoteResponse;
import com.example.crm.ticket.entity.Ticket;
import com.example.crm.ticket.entity.TicketNote;
import com.example.crm.ticket.repository.TicketNoteRepository;
import com.example.crm.ticket.repository.TicketRepository;
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
public class TicketNoteServiceImpl implements TicketNoteService {

    private final TicketNoteRepository ticketNoteRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public List<TicketNoteResponse> getNotesByTicketId(Long ticketId, Long currentUserId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        checkTicketAccess(ticket, currentUser);

        return ticketNoteRepository.findByTicketIdOrderByCreatedAtDesc(ticketId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TicketNoteResponse createNote(Long ticketId, TicketNoteRequest request, Long authorUserId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));
        User author = userRepository.findById(authorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", authorUserId));

        checkTicketAccess(ticket, author);

        TicketNote note = TicketNote.builder()
                .ticket(ticket)
                .authorUser(author)
                .content(request.getContent().trim())
                .build();

        note = ticketNoteRepository.save(note);

        auditLogService.log(author, "TICKET_NOTE_CREATED", "TICKET", String.valueOf(ticketId),
                "Talep için iç not eklendi: " + ticket.getTicketNumber());

        return mapToResponse(note);
    }

    @Override
    @Transactional
    public TicketNoteResponse updateNote(Long noteId, TicketNoteRequest request, Long userId) {
        TicketNote note = ticketNoteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("TicketNote", "id", noteId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!note.getAuthorUser().getId().equals(userId) && user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Sadece kendi eklediğiniz iç notları düzenleyebilirsiniz.");
        }

        note.setContent(request.getContent().trim());
        note = ticketNoteRepository.save(note);

        return mapToResponse(note);
    }

    @Override
    @Transactional
    public void deleteNote(Long noteId, Long userId) {
        TicketNote note = ticketNoteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("TicketNote", "id", noteId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!note.getAuthorUser().getId().equals(userId) && user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.MANAGER) {
            throw new AccessDeniedException("Bu iç notu silme yetkiniz bulunmamaktadır.");
        }

        ticketNoteRepository.delete(note);
    }

    private void checkTicketAccess(Ticket ticket, User user) {
        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.MANAGER) {
            return;
        }
        if (ticket.getAssignedUser() != null && ticket.getAssignedUser().getId().equals(user.getId())) {
            return;
        }
        // Agents can also access unassigned tickets or assigned to them
        if (ticket.getAssignedUser() == null) {
            return;
        }
        throw new AccessDeniedException("Bu talebe ait iç notlara erişim yetkiniz bulunmamaktadır.");
    }

    private TicketNoteResponse mapToResponse(TicketNote note) {
        String authorName = (note.getAuthorUser().getFirstName() + " " + note.getAuthorUser().getLastName()).trim();
        if ("System Admin".equalsIgnoreCase(authorName)) {
            authorName = "Sistem Yöneticisi";
        }

        return TicketNoteResponse.builder()
                .id(note.getId())
                .ticketId(note.getTicket().getId())
                .authorUserId(note.getAuthorUser().getId())
                .authorName(authorName)
                .authorEmail(note.getAuthorUser().getEmail())
                .content(note.getContent())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}
