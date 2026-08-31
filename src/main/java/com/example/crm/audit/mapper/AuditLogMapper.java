package com.example.crm.audit.mapper;

import com.example.crm.audit.dto.AuditLogResponse;
import com.example.crm.audit.entity.AuditLog;
import com.example.crm.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AuditLogMapper {

    @Mapping(target = "user", expression = "java(mapUser(auditLog.getUser()))")
    AuditLogResponse toResponse(AuditLog auditLog);

    default AuditLogResponse.UserSummary mapUser(User user) {
        if (user == null) {
            return null;
        }
        AuditLogResponse.UserSummary summary = new AuditLogResponse.UserSummary();
        summary.setId(user.getId());
        summary.setName(user.getFirstName() + " " + user.getLastName());
        summary.setEmail(user.getEmail());
        return summary;
    }
}
