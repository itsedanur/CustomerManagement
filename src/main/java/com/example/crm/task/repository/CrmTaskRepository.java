package com.example.crm.task.repository;

import com.example.crm.task.entity.CrmTask;
import com.example.crm.task.entity.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CrmTaskRepository extends JpaRepository<CrmTask, Long>, JpaSpecificationExecutor<CrmTask> {

    @Override
    @EntityGraph(attributePaths = {"customer", "ticket", "assignedUser", "createdByUser"})
    Page<CrmTask> findAll(Specification<CrmTask> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"customer", "ticket", "assignedUser"})
    List<CrmTask> findByAssignedUserIdAndDueDateBetweenAndStatusNot(Long userId, LocalDateTime start, LocalDateTime end, TaskStatus excludedStatus);

    @EntityGraph(attributePaths = {"customer", "ticket", "assignedUser"})
    List<CrmTask> findByAssignedUserIdAndDueDateBeforeAndStatusNotIn(Long userId, LocalDateTime now, List<TaskStatus> excludedStatuses);

    @EntityGraph(attributePaths = {"customer", "ticket", "assignedUser"})
    List<CrmTask> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    @EntityGraph(attributePaths = {"customer", "ticket", "assignedUser"})
    List<CrmTask> findByTicketIdOrderByCreatedAtDesc(Long ticketId);

    long countByAssignedUserIdAndStatusNot(Long userId, TaskStatus status);
}
