package com.example.crm.ticket.controller;

import com.example.crm.customer.entity.Customer;
import com.example.crm.customer.entity.CustomerStatus;
import com.example.crm.customer.entity.CustomerType;

import com.example.crm.user.entity.User;
import com.example.crm.user.entity.UserRole;
import com.example.crm.user.repository.UserRepository;

import com.example.crm.customer.repository.CustomerRepository;
import com.example.crm.ticket.dto.AssignTicketRequest;
import com.example.crm.ticket.dto.CreateTicketRequest;
import com.example.crm.ticket.entity.Ticket;
import com.example.crm.ticket.entity.TicketPriority;
import com.example.crm.ticket.entity.TicketStatus;
import com.example.crm.ticket.repository.TicketRepository;
import com.example.crm.ticket.service.TicketService;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
@WithMockUser(roles = "ADMIN")
public class TicketControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private TicketService ticketService;

    private Customer testCustomer;

    @Autowired
    private UserRepository userRepository;

    private User testUser;


    @BeforeEach
    void setUp() {
        testCustomer = Customer.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john.ticket@example.com")
                .status(CustomerStatus.ACTIVE)
                .customerType(CustomerType.INDIVIDUAL)
                .build();
                testCustomer = customerRepository.save(testCustomer);
        testUser = new User();
        testUser.setFirstName("Agent");
        testUser.setLastName("Smith");
        testUser.setEmail("agent.smith.test@example.com");
        testUser.setPasswordHash("hashedpassword");
        testUser.setRole(UserRole.AGENT);
        testUser.setEnabled(true);
        testUser = userRepository.save(testUser);

    }

    @Test
    void createTicket_ValidRequest_ReturnsCreated() throws Exception {
        CreateTicketRequest request = new CreateTicketRequest();
        request.setSubject("Need help");
        request.setDescription("I can't login to my account.");
        request.setPriority(TicketPriority.HIGH);

        mockMvc.perform(post("/api/customers/{customerId}/tickets", testCustomer.getId()).with(user("admin").roles("ADMIN", "MANAGER", "AGENT"))
                .with(user("admin").roles("ADMIN", "MANAGER", "AGENT")).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.ticketNumber").exists())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.customer.id").value(testCustomer.getId()));
    }

    @Test
    void startProgress_OpenTicket_ChangesStatus() throws Exception {
        Ticket ticket = createTestTicket(TicketStatus.OPEN);

        mockMvc.perform(patch("/api/tickets/{ticketId}/start", ticket.getId()).with(user("admin").roles("ADMIN", "MANAGER", "AGENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    void resolveTicket_InProgressTicket_ChangesStatusAndSetsResolvedAt() throws Exception {
        Ticket ticket = createTestTicket(TicketStatus.IN_PROGRESS);

        mockMvc.perform(patch("/api/tickets/{ticketId}/resolve", ticket.getId()).with(user("admin").roles("ADMIN", "MANAGER", "AGENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolvedAt").exists());
    }

    @Test
    void resolveTicket_OpenTicket_ThrowsBusinessRuleException() throws Exception {
        Ticket ticket = createTestTicket(TicketStatus.OPEN);

        mockMvc.perform(patch("/api/tickets/{ticketId}/resolve", ticket.getId()).with(user("admin").roles("ADMIN", "MANAGER", "AGENT")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INVALID_TICKET_TRANSITION"));
    }

    @Test
    void closeTicket_ResolvedTicket_ChangesStatusAndSetsClosedAt() throws Exception {
        Ticket ticket = createTestTicket(TicketStatus.RESOLVED);

        mockMvc.perform(patch("/api/tickets/{ticketId}/close", ticket.getId()).with(user("admin").roles("ADMIN", "MANAGER", "AGENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.closedAt").exists());
    }

    @Test
    void assignTicket_ValidRequest_AssignsUser() throws Exception {
        Ticket ticket = createTestTicket(TicketStatus.OPEN);
        AssignTicketRequest request = new AssignTicketRequest();
        request.setAssignedUserId(testUser.getId());

        mockMvc.perform(patch("/api/tickets/{ticketId}/assignment", ticket.getId()).with(user("admin").roles("ADMIN", "MANAGER", "AGENT"))
                .with(user("admin").roles("ADMIN", "MANAGER", "AGENT")).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedUserId").value(testUser.getId()));
    }

    @Test
    void getTickets_WithPaginationAndFilter_ReturnsPage() throws Exception {
        createTestTicket(TicketStatus.OPEN);
        createTestTicket(TicketStatus.CLOSED);

        mockMvc.perform(get("/api/tickets?status=OPEN&page=0&size=10").with(user("admin").roles("ADMIN", "MANAGER", "AGENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].status").value("OPEN"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    private Ticket createTestTicket(TicketStatus status) {
        CreateTicketRequest request = new CreateTicketRequest();
        request.setSubject("Test");
        request.setDescription("Test Desc");
        request.setPriority(TicketPriority.LOW);
        
        Ticket ticket = ticketRepository.findById(
                ticketService.createTicket(testCustomer.getId(), request).getId()
        ).orElseThrow();
        
        ticket.setStatus(status);
        return ticketRepository.save(ticket);
    }
}
