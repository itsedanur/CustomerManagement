package com.example.crm.task.repository;

import com.example.crm.task.entity.CrmTask;
import com.example.crm.task.entity.TaskPriority;
import com.example.crm.task.entity.TaskStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class CrmTaskSpecification {

    public static Specification<CrmTask> filterTasks(
            String search,
            TaskStatus status,
            TaskPriority priority,
            Long assignedUserId,
            Long customerId,
            Long ticketId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search)) {
                String searchLower = "%" + search.trim().toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), searchLower);
                Predicate descLike = cb.like(cb.lower(root.get("description")), searchLower);
                
                // Join customer if search matches customer name
                Predicate customerFn = cb.like(cb.lower(root.join("customer", jakarta.persistence.criteria.JoinType.LEFT).get("firstName")), searchLower);
                Predicate customerLn = cb.like(cb.lower(root.join("customer", jakarta.persistence.criteria.JoinType.LEFT).get("lastName")), searchLower);
                Predicate ticketNum = cb.like(cb.lower(root.join("ticket", jakarta.persistence.criteria.JoinType.LEFT).get("ticketNumber")), searchLower);

                predicates.add(cb.or(titleLike, descLike, customerFn, customerLn, ticketNum));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }

            if (assignedUserId != null) {
                predicates.add(cb.equal(root.get("assignedUser").get("id"), assignedUserId));
            }

            if (customerId != null) {
                predicates.add(cb.equal(root.get("customer").get("id"), customerId));
            }

            if (ticketId != null) {
                predicates.add(cb.equal(root.get("ticket").get("id"), ticketId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
