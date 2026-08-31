package com.example.crm.auth.service;

import com.example.crm.auth.dto.JwtAuthenticationResponse;
import com.example.crm.auth.dto.LoginRequest;
import com.example.crm.auth.security.JwtTokenProvider;
import com.example.crm.user.dto.UserResponse;
import com.example.crm.user.entity.User;
import com.example.crm.user.mapper.UserMapper;
import com.example.crm.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final UserMapper userMapper;
    private final com.example.crm.audit.service.AuditLogService auditLogService;

    @Value("${jwt.expiration:3600000}")
    private long jwtExpirationMs;

    public JwtAuthenticationResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!user.getEnabled()) {
            throw new BadCredentialsException("User account is disabled");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = tokenProvider.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        UserResponse userResponse = userMapper.toResponse(user);

        auditLogService.log(user, "LOGIN", "USER", user.getId().toString(), "Kullanıcı sisteme giriş yaptı");

        return JwtAuthenticationResponse.builder()
                .accessToken(token)
                .expiresIn(jwtExpirationMs / 1000)
                .user(userResponse)
                .build();
    }
}
