package com.maamora.studio.controller;

import com.maamora.studio.dto.request.LoginRequest;
import com.maamora.studio.dto.request.PasswordRecoveryRequest;
import com.maamora.studio.dto.request.PasswordResetRequest;
import com.maamora.studio.dto.request.RegisterRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.AuthResponse;
import com.maamora.studio.dto.response.UserProfileResponse;
import com.maamora.studio.security.CurrentUserProvider;
import com.maamora.studio.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final com.maamora.studio.service.PasswordRecoveryService passwordRecoveryService;
    private final CurrentUserProvider currentUserProvider;
    private final com.maamora.studio.service.GoogleAuthService googleAuthService;

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @PostMapping("/password-recovery")
    public ApiResponse<String> requestPasswordRecovery(@Valid @RequestBody PasswordRecoveryRequest request) {
        passwordRecoveryService.requestReset(request.email());
        return ApiResponse.ok("If an account exists for that email, a reset link is on its way.");
    }

    @PostMapping("/reset-password")
    public ApiResponse<String> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        passwordRecoveryService.resetPassword(request.token(), request.password());
        return ApiResponse.ok("Your password has been reset. You can now sign in.");
    }

    @GetMapping("/google/start")
    public ResponseEntity<Void> googleStart() {
        String location = googleAuthService.configured()
                ? googleAuthService.authorizationUrl()
                : googleAuthService.errorRedirect("Google sign-in is not configured on this server.");
        return ResponseEntity.status(302).header(HttpHeaders.LOCATION, location).build();
    }

    @GetMapping("/google/callback")
    public ResponseEntity<Void> googleCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error) {
        if (error != null || code == null || state == null) {
            return redirect(googleAuthService.errorRedirect("Google sign-in was cancelled or denied."));
        }
        try {
            return redirect(googleAuthService.complete(code, state));
        } catch (Exception exception) {
            return redirect(googleAuthService.errorRedirect(exception.getMessage() == null ? "Google sign-in failed." : exception.getMessage()));
        }
    }

    @GetMapping("/me")
    public ApiResponse<UserProfileResponse> me() {
        return ApiResponse.ok(authService.currentUser(currentUserProvider.getCurrentUserId()));
    }

    private ResponseEntity<Void> redirect(String location) {
        return ResponseEntity.status(302).header(HttpHeaders.LOCATION, location).build();
    }
}
