package com.example.crm.audit.service;

import com.example.crm.audit.dto.AuditLogResponse;
import com.example.crm.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditLogService {
    void log(String action, String entityType, String entityId, String details);
    void log(User user, String action, String entityType, String entityId, String details);
    Page<AuditLogResponse> getAllLogs(Pageable pageable);
}
