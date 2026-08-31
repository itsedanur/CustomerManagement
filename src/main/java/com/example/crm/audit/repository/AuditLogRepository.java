package com.example.crm.audit.repository;

import com.example.crm.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @EntityGraph(attributePaths = {"user"})
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
