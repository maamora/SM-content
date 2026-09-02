package com.maamora.studio.controller;

import com.maamora.studio.dto.request.LoginRequest;
import com.maamora.studio.dto.request.PasswordRecoveryRequest;
import com.maamora.studio.dto.request.PasswordResetRequest;
import com.maamora.studio.dto.request.RegisterRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.AuthResponse;
import com.maamora.studio.dto.response.UserProfileResponse;
import com.maamora.studio.exception.RateLimitExceededException;
import com.maamora.studio.security.CurrentUserProvider;
import com.maamora.studio.service.AuthService;
import com.maamora.studio.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RateLimiterService rateLimiter;
    private final CurrentUserProvider currentUserProvider;
    private final com.maamora.studio.service.GoogleAuthService googleAuthService;
    private final PasswordRecoveryService passwordRecoveryService;

    // Covers both spam brand-creation (a bot registering many brands) and
    // brute-forcing a specific brand's join code: 6 tries per IP per 15
    // minutes is nothing against a real user registering once, but against
    // an 8-character/32-alphabet join code (~1.1 trillion combinations) it
    // makes guessing completely impractical long before rate limits reset.
    private static final int REGISTER_MAX_ATTEMPTS = 6;
    private static final Duration REGISTER_WINDOW = Duration.ofMinutes(15);

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        String ip = clientIp(httpRequest);
        if (!rateLimiter.allow("register:" + ip, REGISTER_MAX_ATTEMPTS, REGISTER_WINDOW)) {
            throw new RateLimitExceededException("Too many registration attempts from this network. Please wait a few minutes and try again.");
        }
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

    // Trusts X-Forwarded-For when present (set by a reverse proxy in front of
    // the app) and falls back to the raw socket address otherwise. Only
    // trustworthy if that header can't be spoofed by the client directly —
    // fine for now since there's no proxy in front of local/dev deployments,
    // worth revisiting (strip/validate the header at the edge) before this
    // sits behind a real load balancer in production.
    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private ResponseEntity<Void> redirect(String location) {
        return ResponseEntity.status(302).header(HttpHeaders.LOCATION, location).build();
    }
}
