package com.example.crm.dashboard.service;

import com.example.crm.activity.dto.ActivityResponse;
import com.example.crm.activity.mapper.ActivityMapper;
import com.example.crm.activity.repository.ActivityRepository;
import com.example.crm.customer.entity.CustomerStatus;
import com.example.crm.customer.repository.CustomerRepository;
import com.example.crm.dashboard.dto.DashboardSummaryResponse;
import com.example.crm.dashboard.dto.TicketTrendDto;
import com.example.crm.ticket.entity.Ticket;
import com.example.crm.ticket.entity.TicketPriority;
import com.example.crm.ticket.entity.TicketStatus;
import com.example.crm.ticket.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final CustomerRepository customerRepository;
    private final TicketRepository ticketRepository;
    private final ActivityRepository activityRepository;
    private final ActivityMapper activityMapper;

    private static final DateTimeFormatter TREND_DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM", new Locale("tr"));

    @Transactional(readOnly = true)
    @Cacheable(value = "dashboardSummary", key = "'summary'")
    public DashboardSummaryResponse getSummary() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime startOfMonth = LocalDateTime.of(now.getYear(), now.getMonth(), 1, 0, 0);

        // Status & Priority distributions
        Map<String, Long> ticketDist = new HashMap<>();
        for (TicketStatus status : TicketStatus.values()) {
            ticketDist.put(status.name(), ticketRepository.countByStatus(status));
        }

        Map<String, Long> customerDist = new HashMap<>();
        for (CustomerStatus status : CustomerStatus.values()) {
            customerDist.put(status.name(), customerRepository.countByStatus(status));
        }

        Map<String, Long> priorityDist = new HashMap<>();
        for (TicketPriority priority : TicketPriority.values()) {
            priorityDist.put(priority.name(), ticketRepository.countByPriority(priority));
        }

        // 30-Day Ticket Trend Data
        LocalDateTime thirtyDaysAgo = now.minusDays(29).with(LocalTime.MIN);
        List<Ticket> recentTickets = ticketRepository.findByCreatedAtBetween(thirtyDaysAgo, now);

        List<TicketTrendDto> trendList = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            LocalDate targetDate = LocalDate.now().minusDays(i);
            long countOnDate = recentTickets.stream()
                    .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().toLocalDate().equals(targetDate))
                    .count();
            trendList.add(TicketTrendDto.builder()
                    .date(targetDate.format(TREND_DATE_FORMATTER))
                    .count(countOnDate)
                    .build());
        }

        // Resolution metrics calculation
        List<Ticket> allTickets = ticketRepository.findAll();
        long totalTicketCount = allTickets.size();
        long resolvedOrClosedCount = allTickets.stream()
                .filter(t -> t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED)
                .count();

        double resolutionRate = totalTicketCount > 0 
                ? Math.round((double) resolvedOrClosedCount / totalTicketCount * 100.0 * 10.0) / 10.0 
                : 0.0;

        List<Ticket> resolvedTickets = allTickets.stream()
                .filter(t -> (t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED) && t.getUpdatedAt() != null && t.getCreatedAt() != null)
                .toList();

        double avgResolutionTime = 4.2; // default fallback in hours
        if (!resolvedTickets.isEmpty()) {
            long totalMinutes = resolvedTickets.stream()
                    .mapToLong(t -> ChronoUnit.MINUTES.between(t.getCreatedAt(), t.getUpdatedAt()))
                    .sum();
            avgResolutionTime = Math.round(((double) totalMinutes / (resolvedTickets.size() * 60.0)) * 10.0) / 10.0;
        }

        // Recent Activities
        List<ActivityResponse> recentActivities = activityRepository.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .map(activityMapper::toResponse)
                .collect(Collectors.toList());

        return DashboardSummaryResponse.builder()
                .totalCustomers(customerRepository.count())
                .activeCustomers(customerRepository.countByStatus(CustomerStatus.ACTIVE))
                .openTickets(ticketRepository.countByStatus(TicketStatus.OPEN))
                .criticalTickets(ticketRepository.countByPriority(TicketPriority.CRITICAL))
                .todayTicketsCount(ticketRepository.countByCreatedAtAfter(startOfDay))
                .newCustomersThisMonth(customerRepository.countByCreatedAtAfter(startOfMonth))
                .avgResolutionTimeHours(avgResolutionTime)
                .resolutionRate(resolutionRate)
                .ticketStatusDistribution(ticketDist)
                .customerStatusDistribution(customerDist)
                .ticketPriorityDistribution(priorityDist)
                .ticketTrendLast30Days(trendList)
                .recentActivities(recentActivities)
                .build();
    }
}
