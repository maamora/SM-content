package com.maamora.studio.controller;

import com.maamora.studio.dto.request.CreateEmailDeliveryRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.EmailDeliveryResponse;
import com.maamora.studio.security.CurrentUserProvider;
import com.maamora.studio.service.SmtpDeliveryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
public class EmailController {
    private final SmtpDeliveryService deliveryService;
    private final CurrentUserProvider currentUser;

    @PostMapping("/send")
    public ApiResponse<EmailDeliveryResponse> send(@Valid @RequestBody CreateEmailDeliveryRequest request) {
        return ApiResponse.ok(deliveryService.queue(currentUser.getCurrentUserId(), request));
    }

    @GetMapping("/deliveries")
    public ApiResponse<List<EmailDeliveryResponse>> deliveries() {
        return ApiResponse.ok(deliveryService.list(currentUser.getCurrentUserId()));
    }
}
