package com.example.crm.user.service;

import com.example.crm.common.exception.EmailAlreadyExistsException;
import com.example.crm.ticket.entity.TicketStatus;
import com.example.crm.ticket.repository.TicketRepository;
import com.example.crm.task.entity.TaskStatus;
import com.example.crm.task.repository.CrmTaskRepository;
import com.example.crm.user.dto.ChangeUserRoleRequest;
import com.example.crm.user.dto.ChangeUserStatusRequest;
import com.example.crm.user.dto.CreateUserRequest;
import com.example.crm.user.dto.UpdateUserRequest;
import com.example.crm.user.dto.UserResponse;
import com.example.crm.user.entity.User;
import com.example.crm.user.mapper.UserMapper;
import com.example.crm.user.repository.UserRepository;
import com.example.crm.audit.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final CrmTaskRepository crmTaskRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponseWithStats)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(value = "assignableUsers", key = "'list'")
    public List<UserResponse> getAssignableUsers() {
        return userRepository.findByEnabledTrue().stream()
                .map(this::mapToResponseWithStats)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        return mapToResponseWithStats(getUserEntity(id));
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "assignableUsers", allEntries = true)
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("USER_EMAIL_ALREADY_EXISTS");
        }

        User user = userMapper.toEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setEnabled(true);
        User savedUser = userRepository.save(user);
        
        auditLogService.log("USER_CREATE", "USER", savedUser.getId().toString(), "Yeni kullanıcı oluşturuldu: " + savedUser.getEmail());
        
        return mapToResponseWithStats(savedUser);
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "assignableUsers", allEntries = true)
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = getUserEntity(id);
        userMapper.updateEntityFromRequest(request, user);
        User updatedUser = userRepository.save(user);
        
        auditLogService.log("USER_UPDATE", "USER", updatedUser.getId().toString(), "Kullanıcı bilgileri güncellendi");
        
        return mapToResponseWithStats(updatedUser);
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "assignableUsers", allEntries = true)
    public UserResponse changeUserRole(Long id, ChangeUserRoleRequest request) {
        User user = getUserEntity(id);
        user.setRole(request.getRole());
        User updatedUser = userRepository.save(user);
        
        auditLogService.log("USER_ROLE_CHANGE", "USER", updatedUser.getId().toString(), "Kullanıcı rolü değiştirildi: " + request.getRole());
        
        return mapToResponseWithStats(updatedUser);
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "assignableUsers", allEntries = true)
    public UserResponse changeUserStatus(Long id, ChangeUserStatusRequest request) {
        User user = getUserEntity(id);
        user.setEnabled(request.getEnabled());
        User updatedUser = userRepository.save(user);
        
        String action = request.getEnabled() ? "USER_ENABLE" : "USER_DISABLE";
        String status = request.getEnabled() ? "Aktif edildi" : "Devre dışı bırakıldı";
        auditLogService.log(action, "USER", updatedUser.getId().toString(), "Kullanıcı durumu değiştirildi: " + status);
        
        return mapToResponseWithStats(updatedUser);
    }

    private UserResponse mapToResponseWithStats(User user) {
        UserResponse response = userMapper.toResponse(user);
        if (user != null && user.getId() != null) {
            long openTickets = ticketRepository.countByAssignedUserIdAndStatusIn(
                    user.getId(), List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS));
            long activeTasks = crmTaskRepository.countByAssignedUserIdAndStatusNot(
                    user.getId(), TaskStatus.COMPLETED);
            response.setOpenTicketsCount(openTickets);
            response.setActiveTasksCount(activeTasks);
        }
        return response;
    }

    private User getUserEntity(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }
}
