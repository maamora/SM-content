package com.maamora.studio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.maamora.studio.dto.response.AuthResponse;
import com.maamora.studio.exception.UnauthorizedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
public class GoogleAuthService {
    private final AuthService authService;
    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.builder().build();
    private final SecureRandom random = new SecureRandom();
    private final byte[] stateSecret;
    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;
    private final String frontendUrl;

    public GoogleAuthService(
            AuthService authService,
            ObjectMapper objectMapper,
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.google.client-id:}") String clientId,
            @Value("${app.google.client-secret:}") String clientSecret,
            @Value("${app.google.redirect-uri:http://localhost:8080/api/auth/google/callback}") String redirectUri,
            @Value("${app.google.frontend-url:http://localhost:3000}") String frontendUrl) {
        this.authService = authService;
        this.objectMapper = objectMapper;
        this.stateSecret = jwtSecret.getBytes(StandardCharsets.UTF_8);
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    public boolean configured() {
        return nonBlank(clientId, clientSecret, redirectUri);
    }

    public String authorizationUrl() {
        ensureConfigured();
        String state = issueState();
        return "https://accounts.google.com/o/oauth2/v2/auth?client_id=" + enc(clientId)
                + "&redirect_uri=" + enc(redirectUri)
                + "&response_type=code&scope=" + enc("openid email profile")
                + "&state=" + enc(state)
                + "&access_type=online&prompt=select_account";
    }

    public String complete(String code, String state) {
        try {
            ensureConfigured();
            verifyState(state);
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("code", code);
            form.add("client_id", clientId);
            form.add("client_secret", clientSecret);
            form.add("redirect_uri", redirectUri);
            form.add("grant_type", "authorization_code");
            JsonNode token = json(restClient.post().uri("https://oauth2.googleapis.com/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve().body(String.class));
            String accessToken = text(token, "access_token");
            if (accessToken.isBlank()) throw new UnauthorizedException("Google did not return an access token.");
            JsonNode profile = json(restClient.get().uri("https://openidconnect.googleapis.com/v1/userinfo")
                    .header("Authorization", "Bearer " + accessToken).retrieve().body(String.class));
            String email = text(profile, "email");
            boolean verified = profile.path("email_verified").asBoolean(false);
            if (email.isBlank() || !verified) throw new UnauthorizedException("Google returned an unverified account.");
            AuthResponse auth = authService.loginOrCreateGoogle(email, text(profile, "name"));
            return frontendUrl + "/oauth/callback#token=" + enc(auth.getToken());
        } catch (UnauthorizedException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Google authentication could not be completed.", exception);
        }
    }

    public String errorRedirect(String message) {
        return frontendUrl + "/login?oauth=error&message=" + enc(message);
    }

    private String issueState() {
        long expiry = Instant.now().plusSeconds(600).getEpochSecond();
        byte[] nonce = new byte[32];
        random.nextBytes(nonce);
        String payload = expiry + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(nonce);
        return b64(payload) + "." + sign(payload);
    }

    private void verifyState(String value) {
        try {
            String[] parts = value.split("\\.", -1);
            if (parts.length != 2) throw new IllegalArgumentException("Invalid Google OAuth state");
            String payload = dec(parts[0]);
            if (!MessageDigest.isEqual(sign(payload).getBytes(StandardCharsets.UTF_8), parts[1].getBytes(StandardCharsets.UTF_8))) {
                throw new IllegalArgumentException("Invalid Google OAuth state");
            }
            String[] values = payload.split("\\.", -1);
            if (values.length != 2 || Long.parseLong(values[0]) < Instant.now().getEpochSecond()) {
                throw new IllegalArgumentException("Expired Google OAuth state");
            }
        } catch (Exception exception) {
            throw new IllegalArgumentException("Invalid Google OAuth state", exception);
        }
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(stateSecret, "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign Google OAuth state", exception);
        }
    }

    private void ensureConfigured() {
        if (!configured()) throw new IllegalStateException("Google OAuth is not configured");
    }

    private JsonNode json(String raw) {
        try { return objectMapper.readTree(raw == null ? "{}" : raw); }
        catch (Exception exception) { throw new IllegalStateException("Google returned invalid JSON", exception); }
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() ? "" : value.asText("");
    }

    private static String enc(String value) { return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8); }
    private static String b64(String value) { return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8)); }
    private static String dec(String value) { return new String(Base64.getUrlDecoder().decode(value), StandardCharsets.UTF_8); }
    private static boolean nonBlank(String... values) { for (String value : values) if (value == null || value.isBlank()) return false; return true; }
}
