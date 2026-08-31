package com.example.crm.dashboard.service;

import com.example.crm.dashboard.dto.DashboardSummaryResponse;
import com.example.crm.customer.repository.CustomerRepository;
import com.example.crm.customer.entity.CustomerStatus;
import com.example.crm.ticket.repository.TicketRepository;
import com.example.crm.ticket.entity.TicketStatus;
import com.example.crm.ticket.entity.TicketPriority;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final CustomerRepository customerRepository;
    private final TicketRepository ticketRepository;

    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(value = "dashboardSummary", key = "'summary'")
    public DashboardSummaryResponse getSummary() {
        java.util.Map<String, Long> ticketDist = new java.util.HashMap<>();
        for (TicketStatus status : TicketStatus.values()) {
            ticketDist.put(status.name(), ticketRepository.countByStatus(status));
        }

        java.util.Map<String, Long> customerDist = new java.util.HashMap<>();
        for (CustomerStatus status : CustomerStatus.values()) {
            customerDist.put(status.name(), customerRepository.countByStatus(status));
        }

        return DashboardSummaryResponse.builder()
                .totalCustomers(customerRepository.count())
                .activeCustomers(customerRepository.countByStatus(CustomerStatus.ACTIVE))
                .openTickets(ticketRepository.countByStatus(TicketStatus.OPEN))
                .criticalTickets(ticketRepository.countByPriority(TicketPriority.CRITICAL))
                .ticketStatusDistribution(ticketDist)
                .customerStatusDistribution(customerDist)
                .build();
    }
}
