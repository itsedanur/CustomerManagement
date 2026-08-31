package com.example.crm.auth.controller;

import com.example.crm.auth.dto.JwtAuthenticationResponse;
import com.example.crm.auth.dto.LoginRequest;
import com.example.crm.auth.security.CustomUserDetails;
import com.example.crm.auth.service.AuthService;
import com.example.crm.user.dto.UserResponse;
import com.example.crm.user.entity.User;
import com.example.crm.user.mapper.UserMapper;
import com.example.crm.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @PostMapping("/login")
    public ResponseEntity<JwtAuthenticationResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal CustomUserDetails currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(userMapper.toResponse(user));
    }
}
