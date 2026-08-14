package com.maamora.studio.controller;

import com.maamora.studio.dto.request.LoginRequest;
import com.maamora.studio.dto.request.RegisterRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.AuthResponse;
import com.maamora.studio.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }
}
