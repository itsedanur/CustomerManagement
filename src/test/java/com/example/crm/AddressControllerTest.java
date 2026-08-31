package com.example.crm;

import com.example.crm.address.dto.CreateAddressRequest;
import com.example.crm.address.dto.UpdateAddressRequest;
import com.example.crm.address.entity.Address;
import com.example.crm.address.entity.AddressType;
import com.example.crm.address.repository.AddressRepository;
import com.example.crm.customer.entity.Customer;
import com.example.crm.customer.entity.CustomerStatus;
import com.example.crm.customer.entity.CustomerType;
import com.example.crm.customer.repository.CustomerRepository;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.springframework.test.context.ActiveProfiles;

import org.springframework.test.context.ActiveProfiles;
import org.springframework.security.test.context.support.WithMockUser;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
@WithMockUser(roles = "ADMIN")
public class AddressControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AddressRepository addressRepository;

    private Customer testCustomer;
    private Customer anotherCustomer;
    private Address testAddress;

    @BeforeEach
    void setUp() {
        testCustomer = customerRepository.save(Customer.builder()
                .firstName("Test")
                .lastName("AddressOwner")
                .email(UUID.randomUUID().toString() + "@example.com")
                .status(CustomerStatus.ACTIVE)
                .customerType(CustomerType.INDIVIDUAL)
                .build());

        anotherCustomer = customerRepository.save(Customer.builder()
                .firstName("Another")
                .lastName("Customer")
                .email(UUID.randomUUID().toString() + "@example.com")
                .status(CustomerStatus.ACTIVE)
                .customerType(CustomerType.INDIVIDUAL)
                .build());

        testAddress = addressRepository.save(Address.builder()
                .customer(testCustomer)
                .title("Home")
                .country("USA")
                .city("New York")
                .district("Manhattan")
                .postalCode("10001")
                .addressLine("123 Test St")
                .addressType(AddressType.HOME)
                .build());
    }

    @Test
    public void createAddress_ValidRequest_ReturnsCreated() throws Exception {
        CreateAddressRequest request = new CreateAddressRequest();
        request.setTitle("Work");
        request.setCountry("USA");
        request.setCity("Boston");
        request.setAddressLine("456 Corp Blvd");
        request.setAddressType(AddressType.WORK);

        mockMvc.perform(post("/api/customers/{customerId}/addresses", testCustomer.getId()).with(user("admin").roles("ADMIN", "MANAGER", "AGENT"))
                .with(user("admin").roles("ADMIN", "MANAGER", "AGENT")).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Work"))
                .andExpect(jsonPath("$.city").value("Boston"));
    }

    @Test
    public void createAddress_CustomerNotFound_Returns404() throws Exception {
        CreateAddressRequest request = new CreateAddressRequest();
        request.setTitle("Work");
        request.setCountry("USA");
        request.setCity("Boston");
        request.setAddressLine("456 Corp Blvd");
        request.setAddressType(AddressType.WORK);

        mockMvc.perform(post("/api/customers/{customerId}/addresses", 99999L).with(user("admin").roles("ADMIN", "MANAGER", "AGENT"))
                .with(user("admin").roles("ADMIN", "MANAGER", "AGENT")).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("CUSTOMER_NOT_FOUND"));
    }

    @Test
    public void getCustomerAddresses_ReturnsList() throws Exception {
        mockMvc.perform(get("/api/customers/{customerId}/addresses", testCustomer.getId()).with(user("admin").roles("ADMIN", "MANAGER", "AGENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Home"));
    }

    @Test
    public void getAddress_ValidOwnership_ReturnsAddress() throws Exception {
        mockMvc.perform(get("/api/customers/{customerId}/addresses/{addressId}", testCustomer.getId(), testAddress.getId()).with(user("admin").roles("ADMIN", "MANAGER", "AGENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Home"));
    }

    @Test
    public void getAddress_InvalidOwnership_Returns404() throws Exception {
        // Attempting to access testCustomer's address via anotherCustomer's ID
        mockMvc.perform(get("/api/customers/{customerId}/addresses/{addressId}", anotherCustomer.getId(), testAddress.getId()).with(user("admin").roles("ADMIN", "MANAGER", "AGENT")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("ADDRESS_NOT_FOUND"));
    }

    @Test
    public void updateAddress_ValidOwnership_ReturnsUpdated() throws Exception {
        UpdateAddressRequest request = new UpdateAddressRequest();
        request.setTitle("Updated Home");
        request.setCountry("USA");
        request.setCity("New York");
        request.setAddressLine("789 New St");
        request.setAddressType(AddressType.HOME);

        mockMvc.perform(put("/api/customers/{customerId}/addresses/{addressId}", testCustomer.getId(), testAddress.getId())
                .with(user("admin").roles("ADMIN", "MANAGER", "AGENT")).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Home"))
                .andExpect(jsonPath("$.addressLine").value("789 New St"));
    }

    @Test
    public void updateAddress_InvalidOwnership_Returns404() throws Exception {
        UpdateAddressRequest request = new UpdateAddressRequest();
        request.setTitle("Updated Home");
        request.setCountry("USA");
        request.setCity("New York");
        request.setAddressLine("789 New St");
        request.setAddressType(AddressType.HOME);

        mockMvc.perform(put("/api/customers/{customerId}/addresses/{addressId}", anotherCustomer.getId(), testAddress.getId())
                .with(user("admin").roles("ADMIN", "MANAGER", "AGENT")).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("ADDRESS_NOT_FOUND"));
    }

    @Test
    public void deleteAddress_ValidOwnership_ReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/customers/{customerId}/addresses/{addressId}", testCustomer.getId(), testAddress.getId()).with(user("admin").roles("ADMIN", "MANAGER", "AGENT")))
                .andExpect(status().isNoContent());

        // Verify it was deleted
        mockMvc.perform(get("/api/customers/{customerId}/addresses/{addressId}", testCustomer.getId(), testAddress.getId()).with(user("admin").roles("ADMIN", "MANAGER", "AGENT")))
                .andExpect(status().isNotFound());
    }

    @Test
    public void createAddress_ValidationFailure_Returns400() throws Exception {
        CreateAddressRequest request = new CreateAddressRequest();
        // Missing required fields

        mockMvc.perform(post("/api/customers/{customerId}/addresses", testCustomer.getId()).with(user("admin").roles("ADMIN", "MANAGER", "AGENT"))
                .with(user("admin").roles("ADMIN", "MANAGER", "AGENT")).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }
}
