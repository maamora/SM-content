package com.maamora.studio.controller;

import com.maamora.studio.dto.request.CreatePublishRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.PublishJobResponse;
import com.maamora.studio.dto.response.SocialConnectionResponse;
import com.maamora.studio.model.enums.SocialProvider;
import com.maamora.studio.security.CurrentUserProvider;
import com.maamora.studio.service.SocialOAuthService;
import com.maamora.studio.service.SocialPublishService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class SocialController {
    private final SocialOAuthService oauthService;
    private final SocialPublishService publishService;
    private final CurrentUserProvider currentUser;

    @GetMapping("/connect/{provider}")
    public ApiResponse<Map<String, String>> connect(@PathVariable String provider) {
        SocialProvider socialProvider = parseProvider(provider);
        return ApiResponse.ok(Map.of("authorizationUrl", oauthService.startUrl(currentUser.getCurrentUserId(), socialProvider)));
    }

    @GetMapping("/callback/{provider}")
    public ResponseEntity<Void> callback(@PathVariable String provider,
                                         @RequestParam(required = false, defaultValue = "") String code,
                                         @RequestParam(required = false, defaultValue = "") String state,
                                         @RequestParam(required = false, defaultValue = "") String error,
                                         @RequestParam(required = false, defaultValue = "") String error_description) {
        SocialProvider socialProvider;
        try {
            socialProvider = parseProvider(provider);
            if (!error.isBlank()) {
                return redirect(oauthService.frontendRedirect(false, error_description.isBlank() ? error : error_description));
            }
            if (code.isBlank() || state.isBlank()) {
                return redirect(oauthService.frontendRedirect(false, "OAuth callback was missing code or state"));
            }
            oauthService.complete(socialProvider, code, state);
            return redirect(oauthService.frontendRedirect(true, socialProvider.name().toLowerCase(Locale.ROOT) + " connected"));
        } catch (Exception exception) {
            String message = exception.getMessage() == null ? "OAuth connection failed" : exception.getMessage();
            return redirect(oauthService.frontendRedirect(false, message));
        }
    }

    @GetMapping("/connections")
    public ApiResponse<List<SocialConnectionResponse>> connections() {
        return ApiResponse.ok(oauthService.list(currentUser.getCurrentUserId()).stream()
                .map(SocialConnectionResponse::from).toList());
    }

    @DeleteMapping("/connections/{id}")
    public ApiResponse<Void> disconnect(@PathVariable String id) {
        oauthService.disconnect(currentUser.getCurrentUserId(), id);
        return ApiResponse.ok(null);
    }

    @PostMapping("/publish")
    public ApiResponse<PublishJobResponse> publish(@Valid @RequestBody CreatePublishRequest request) {
        return ApiResponse.ok(publishService.queue(currentUser.getCurrentUserId(), request));
    }

    @GetMapping("/jobs")
    public ApiResponse<List<PublishJobResponse>> jobs() {
        return ApiResponse.ok(publishService.list(currentUser.getCurrentUserId()));
    }

    private SocialProvider parseProvider(String value) {
        try {
            return SocialProvider.valueOf(value.toUpperCase(Locale.ROOT));
        } catch (Exception exception) {
            throw new IllegalArgumentException("Unsupported social provider: " + value);
        }
    }

    private ResponseEntity<Void> redirect(String location) {
        return ResponseEntity.status(302).header(HttpHeaders.LOCATION, location).build();
    }
}
