package com.maamora.studio.controller;

import com.maamora.studio.dto.request.LoginRequest;
import com.maamora.studio.dto.request.RegisterRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.AuthResponse;
import com.maamora.studio.exception.RateLimitExceededException;
import com.maamora.studio.service.AuthService;
import com.maamora.studio.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RateLimiterService rateLimiter;

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
}
