package com.example.crm.report.service;

import com.example.crm.customer.entity.Customer;
import com.example.crm.customer.repository.CustomerRepository;
import com.example.crm.report.dto.CustomerAnalyticsResponse;
import com.example.crm.report.dto.RepresentativePerformanceResponse;
import com.example.crm.report.dto.TicketAnalyticsResponse;
import com.example.crm.task.entity.TaskStatus;
import com.example.crm.task.repository.CrmTaskRepository;
import com.example.crm.ticket.entity.Ticket;
import com.example.crm.ticket.entity.TicketStatus;
import com.example.crm.ticket.repository.TicketRepository;
import com.example.crm.user.entity.User;
import com.example.crm.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final CustomerRepository customerRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final CrmTaskRepository crmTaskRepository;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "reportsCache", key = "'customer_' + #startDate + '_' + #endDate")
    public CustomerAnalyticsResponse getCustomerAnalytics(LocalDateTime startDate, LocalDateTime endDate) {
        List<Customer> allCustomers = customerRepository.findAll();

        long total = allCustomers.size();

        Map<String, Long> statusDist = allCustomers.stream()
                .collect(Collectors.groupingBy(c -> c.getStatus().name(), Collectors.counting()));

        Map<String, Long> typeDist = allCustomers.stream()
                .collect(Collectors.groupingBy(c -> c.getCustomerType().name(), Collectors.counting()));

        Map<String, Long> monthlyTrend = new LinkedHashMap<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy", new Locale("tr"));
        LocalDateTime currentMonth = java.time.LocalDate.now().minusMonths(5).withDayOfMonth(1).atStartOfDay();

        for (int i = 0; i < 6; i++) {
            LocalDateTime nextMonth = currentMonth.plusMonths(1);
            final LocalDateTime mStart = currentMonth;
            final LocalDateTime mEnd = nextMonth;
            long count = allCustomers.stream()
                    .filter(c -> c.getCreatedAt() != null && !c.getCreatedAt().isBefore(mStart) && c.getCreatedAt().isBefore(mEnd))
                    .count();
            monthlyTrend.put(currentMonth.format(monthFormatter), count);
            currentMonth = nextMonth;
        }

        return CustomerAnalyticsResponse.builder()
                .totalCustomers(total)
                .statusDistribution(statusDist)
                .typeDistribution(typeDist)
                .monthlyTrend(monthlyTrend)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "reportsCache", key = "'ticket_' + #startDate + '_' + #endDate")
    public TicketAnalyticsResponse getTicketAnalytics(LocalDateTime startDate, LocalDateTime endDate) {
        List<Ticket> allTickets = ticketRepository.findAll();

        if (startDate != null) {
            allTickets = allTickets.stream()
                    .filter(t -> t.getCreatedAt() != null && !t.getCreatedAt().isBefore(startDate))
                    .collect(Collectors.toList());
        }
        if (endDate != null) {
            allTickets = allTickets.stream()
                    .filter(t -> t.getCreatedAt() != null && !t.getCreatedAt().isAfter(endDate))
                    .collect(Collectors.toList());
        }

        long total = allTickets.size();

        Map<String, Long> statusDist = allTickets.stream()
                .collect(Collectors.groupingBy(t -> t.getStatus().name(), Collectors.counting()));

        Map<String, Long> priorityDist = allTickets.stream()
                .collect(Collectors.groupingBy(t -> t.getPriority().name(), Collectors.counting()));

        Map<String, Long> dailyTrend = new LinkedHashMap<>();
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("dd MMM", new Locale("tr"));
        LocalDateTime startDay = java.time.LocalDate.now().minusDays(29).atStartOfDay();

        for (int i = 0; i < 30; i++) {
            LocalDateTime nextDay = startDay.plusDays(1);
            final LocalDateTime dStart = startDay;
            final LocalDateTime dEnd = nextDay;
            long count = allTickets.stream()
                    .filter(t -> t.getCreatedAt() != null && !t.getCreatedAt().isBefore(dStart) && t.getCreatedAt().isBefore(dEnd))
                    .count();
            dailyTrend.put(startDay.format(dayFormatter), count);
            startDay = nextDay;
        }

        List<Ticket> resolvedOrClosed = allTickets.stream()
                .filter(t -> (t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED) && t.getResolvedAt() != null)
                .collect(Collectors.toList());

        double avgResolutionTime = 0.0;
        if (!resolvedOrClosed.isEmpty()) {
            double totalHours = resolvedOrClosed.stream()
                    .mapToDouble(t -> Duration.between(t.getCreatedAt(), t.getResolvedAt()).toMinutes() / 60.0)
                    .sum();
            avgResolutionTime = Math.round((totalHours / resolvedOrClosed.size()) * 10.0) / 10.0;
        }

        double resolutionRate = total > 0 ? Math.round(((double) resolvedOrClosed.size() / total * 100.0) * 10.0) / 10.0 : 0.0;

        return TicketAnalyticsResponse.builder()
                .totalTickets(total)
                .statusDistribution(statusDist)
                .priorityDistribution(priorityDist)
                .dailyTrend(dailyTrend)
                .avgResolutionTimeHours(avgResolutionTime)
                .resolutionRatePercentage(resolutionRate)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RepresentativePerformanceResponse> getRepresentativePerformance(LocalDateTime startDate, LocalDateTime endDate) {
        List<User> users = userRepository.findAll();
        List<Ticket> allTickets = ticketRepository.findAll();

        return users.stream().map(user -> {
            List<Ticket> userTickets = allTickets.stream()
                    .filter(t -> t.getAssignedUser() != null && t.getAssignedUser().getId().equals(user.getId()))
                    .collect(Collectors.toList());

            long totalAssigned = userTickets.size();
            long openCount = userTickets.stream().filter(t -> t.getStatus() == TicketStatus.OPEN || t.getStatus() == TicketStatus.IN_PROGRESS).count();
            List<Ticket> resolvedList = userTickets.stream().filter(t -> (t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED) && t.getResolvedAt() != null).collect(Collectors.toList());
            long resolvedCount = resolvedList.size();

            double avgHours = 0.0;
            if (!resolvedList.isEmpty()) {
                double hours = resolvedList.stream().mapToDouble(t -> Duration.between(t.getCreatedAt(), t.getResolvedAt()).toMinutes() / 60.0).sum();
                avgHours = Math.round((hours / resolvedList.size()) * 10.0) / 10.0;
            }

            long activeTasks = crmTaskRepository.countByAssignedUserIdAndStatusNot(user.getId(), TaskStatus.COMPLETED);

            String userName = (user.getFirstName() + " " + user.getLastName()).trim();
            if ("System Admin".equalsIgnoreCase(userName)) userName = "Sistem Yöneticisi";

            return RepresentativePerformanceResponse.builder()
                    .userId(user.getId())
                    .userName(userName)
                    .userEmail(user.getEmail())
                    .role(user.getRole().name())
                    .totalAssignedTickets(totalAssigned)
                    .openTickets(openCount)
                    .resolvedTickets(resolvedCount)
                    .avgResolutionTimeHours(avgHours)
                    .activeTasks(activeTasks)
                    .build();
        }).collect(Collectors.toList());
    }
}
