package com.example.crm;

import com.example.crm.customer.entity.Customer;
import com.example.crm.customer.entity.CustomerStatus;
import com.example.crm.customer.entity.CustomerType;
import com.example.crm.customer.repository.CustomerRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import static org.assertj.core.api.Assertions.assertThat;

import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CrmApplicationTests {

    @Autowired
    private CustomerRepository customerRepository;

	@Test
	void contextLoadsAndPersistenceWorks() {
        String randomEmail = UUID.randomUUID().toString() + "@example.com";
        Customer customer = Customer.builder()
            .firstName("Test")
            .lastName("User")
            .email(randomEmail)
            .company("ACME")
            .status(CustomerStatus.ACTIVE)
            .customerType(CustomerType.INDIVIDUAL)
            .build();
        
        Customer saved = customerRepository.save(customer);
        assertThat(saved.getId()).isNotNull();
        
        Customer fetched = customerRepository.findById(saved.getId()).orElse(null);
        assertThat(fetched).isNotNull();
        assertThat(fetched.getEmail()).isEqualTo(randomEmail);
	}
}
