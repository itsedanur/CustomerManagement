package com.example.crm.customer.service;

import com.example.crm.common.dto.PageResponse;
import com.example.crm.customer.dto.CreateCustomerRequest;
import com.example.crm.customer.dto.CustomerResponse;
import com.example.crm.customer.dto.UpdateCustomerRequest;
import com.example.crm.customer.entity.Customer;
import com.example.crm.customer.entity.CustomerStatus;
import com.example.crm.customer.entity.CustomerType;
import com.example.crm.common.exception.CustomerNotFoundException;
import com.example.crm.common.exception.EmailAlreadyExistsException;
import com.example.crm.customer.mapper.CustomerMapper;
import com.example.crm.customer.repository.CustomerRepository;
import com.example.crm.activity.service.ActivityService;
import com.example.crm.activity.entity.ActivityType;
import com.example.crm.audit.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;
    private final ActivityService activityService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CustomerResponse> getAllCustomers(String search, CustomerStatus status, CustomerType customerType, Pageable pageable) {
        Specification<Customer> spec = (root, query, cb) -> cb.conjunction();

        if (search != null && !search.trim().isEmpty()) {
            String likePattern = "%" + search.trim().toLowerCase() + "%";
            Specification<Customer> searchSpec = (root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("firstName")), likePattern),
                    cb.like(cb.lower(root.get("lastName")), likePattern),
                    cb.like(cb.lower(root.get("email")), likePattern),
                    cb.like(cb.lower(root.get("company")), likePattern)
            );
            spec = spec.and(searchSpec);
        }

        if (status != null) {
            Specification<Customer> statusSpec = (root, query, cb) -> cb.equal(root.get("status"), status);
            spec = spec.and(statusSpec);
        }

        if (customerType != null) {
            Specification<Customer> typeSpec = (root, query, cb) -> cb.equal(root.get("customerType"), customerType);
            spec = spec.and(typeSpec);
        }

        Page<Customer> customerPage = customerRepository.findAll(spec, pageable);
        List<CustomerResponse> content = customerPage.getContent().stream()
                .map(customerMapper::toResponse)
                .toList();

        return new PageResponse<>(
                content,
                customerPage.getNumber(),
                customerPage.getSize(),
                customerPage.getTotalElements(),
                customerPage.getTotalPages(),
                customerPage.isFirst(),
                customerPage.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with id: " + id));
        return customerMapper.toResponse(customer);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary", allEntries = true)
    public CustomerResponse createCustomer(CreateCustomerRequest request) {
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already exists: " + request.getEmail());
        }

        Customer customer = customerMapper.toEntity(request);
        Customer savedCustomer = customerRepository.save(customer);
        
        activityService.logActivity(savedCustomer, ActivityType.CUSTOMER_CREATED, savedCustomer.getId(), savedCustomer.getFirstName() + " " + savedCustomer.getLastName());
        auditLogService.log("CUSTOMER_CREATE", "CUSTOMER", savedCustomer.getId().toString(), "Yeni müşteri oluşturuldu: " + savedCustomer.getEmail());
        
        return customerMapper.toResponse(savedCustomer);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary", allEntries = true)
    public CustomerResponse updateCustomer(Long id, UpdateCustomerRequest request) {
        Customer existingCustomer = customerRepository.findById(id)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with id: " + id));

        if (!existingCustomer.getEmail().equals(request.getEmail()) && customerRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already exists: " + request.getEmail());
        }

        customerMapper.updateEntityFromRequest(request, existingCustomer);
        Customer updatedCustomer = customerRepository.save(existingCustomer);
        
        activityService.logActivity(updatedCustomer, ActivityType.CUSTOMER_UPDATED, updatedCustomer.getId(), "Müşteri bilgileri güncellendi");
        auditLogService.log("CUSTOMER_UPDATE", "CUSTOMER", updatedCustomer.getId().toString(), "Müşteri bilgileri güncellendi");
        
        return customerMapper.toResponse(updatedCustomer);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary", allEntries = true)
    public void deleteCustomer(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new CustomerNotFoundException("Customer not found with id: " + id);
        }
        customerRepository.deleteById(id);
        auditLogService.log("CUSTOMER_DELETE", "CUSTOMER", String.valueOf(id), "Müşteri silindi");
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportCustomersCsv(String search, CustomerStatus status, CustomerType customerType) {
        Specification<Customer> spec = Specification.where((root, query, cb) -> cb.conjunction());
        if (org.springframework.util.StringUtils.hasText(search)) {
            String searchLower = "%" + search.toLowerCase().trim() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("firstName")), searchLower),
                    cb.like(cb.lower(root.get("lastName")), searchLower),
                    cb.like(cb.lower(root.get("email")), searchLower),
                    cb.like(cb.lower(root.get("company")), searchLower)
            ));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (customerType != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("customerType"), customerType));
        }

        List<Customer> list = customerRepository.findAll(spec, Sort.by("createdAt").descending());

        StringBuilder sb = new StringBuilder();
        sb.append("\uFEFF");
        sb.append("ID,Adı,Soyadı,E-Posta,Telefon,Şirket,Müşteri Tipi,Durum,Kayıt Tarihi\n");

        for (Customer c : list) {
            sb.append(c.getId()).append(",")
                    .append("\"").append(c.getFirstName().replace("\"", "\"\"")).append("\",")
                    .append("\"").append(c.getLastName().replace("\"", "\"\"")).append("\",")
                    .append("\"").append(c.getEmail().replace("\"", "\"\"")).append("\",")
                    .append("\"").append(c.getPhone() != null ? c.getPhone().replace("\"", "\"\"") : "").append("\",")
                    .append("\"").append(c.getCompany() != null ? c.getCompany().replace("\"", "\"\"") : "").append("\",")
                    .append("\"").append(c.getCustomerType() == CustomerType.CORPORATE ? "Kurumsal" : "Bireysel").append("\",")
                    .append("\"").append(c.getStatus()).append("\",")
                    .append("\"").append(c.getCreatedAt() != null ? c.getCreatedAt() : "").append("\"\n");
        }

        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }
}
