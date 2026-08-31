package com.example.crm.customer.controller;

import com.example.crm.customer.dto.CreateCustomerRequest;
import com.example.crm.customer.entity.CustomerStatus;
import com.example.crm.customer.entity.CustomerType;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import com.example.crm.customer.repository.CustomerRepository;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.security.test.context.support.WithMockUser;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
@WithMockUser(roles = "ADMIN")
public class CustomerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CustomerRepository customerRepository;

    @Test
    public void createCustomer_ValidRequest_ReturnsCreated() throws Exception {
        String randomEmail = UUID.randomUUID().toString() + "@example.com";
        CreateCustomerRequest request = new CreateCustomerRequest();
        request.setFirstName("John");
        request.setLastName("Doe");
        request.setEmail(randomEmail);
        request.setStatus(CustomerStatus.ACTIVE);
        request.setCustomerType(CustomerType.INDIVIDUAL);

        mockMvc.perform(post("/api/customers").with(user("admin").roles("ADMIN", "MANAGER", "AGENT"))
                
                .with(user("admin").roles("ADMIN", "MANAGER", "AGENT")).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.email").value(randomEmail));
    }

    @Test
    public void createCustomer_InvalidEmail_ReturnsBadRequest() throws Exception {
        CreateCustomerRequest request = new CreateCustomerRequest();
        request.setFirstName("John");
        request.setLastName("Doe");
        request.setEmail("invalid-email");
        request.setStatus(CustomerStatus.ACTIVE);
        request.setCustomerType(CustomerType.INDIVIDUAL);

        mockMvc.perform(post("/api/customers").with(user("admin").roles("ADMIN", "MANAGER", "AGENT"))
                .with(user("admin").roles("ADMIN", "MANAGER", "AGENT")).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.email").exists());
    }

    @Test
    public void createCustomer_BlankFirstName_ReturnsBadRequest() throws Exception {
        CreateCustomerRequest request = new CreateCustomerRequest();
        request.setFirstName("");
        request.setLastName("Doe");
        request.setEmail("john.doe2@example.com");
        request.setStatus(CustomerStatus.ACTIVE);
        request.setCustomerType(CustomerType.INDIVIDUAL);

        mockMvc.perform(post("/api/customers").with(user("admin").roles("ADMIN", "MANAGER", "AGENT"))
                .with(user("admin").roles("ADMIN", "MANAGER", "AGENT")).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.firstName").exists());
    }
}
