package com.maamora.studio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.model.SocialConnection;
import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.SocialConnectionStatus;
import com.maamora.studio.model.enums.SocialProvider;
import com.maamora.studio.repository.SocialConnectionRepository;
import com.maamora.studio.repository.UserRepository;
import com.maamora.studio.security.OAuthStateService;
import com.maamora.studio.security.SecretCipher;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class SocialOAuthService {
    private final SocialConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final OAuthStateService stateService;
    private final SecretCipher cipher;
    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.builder().build();
    private final String frontendUrl;
    private final String metaAppId;
    private final String metaAppSecret;
    private final String metaRedirectUri;
    private final String metaGraphVersion;
    private final String tiktokClientKey;
    private final String tiktokClientSecret;
    private final String tiktokRedirectUri;
    private final String linkedinClientId;
    private final String linkedinClientSecret;
    private final String linkedinRedirectUri;
    private final String xClientId;
    private final String xClientSecret;
    private final String xRedirectUri;

    public SocialOAuthService(
            SocialConnectionRepository connectionRepository,
            UserRepository userRepository,
            OAuthStateService stateService,
            SecretCipher cipher,
            ObjectMapper objectMapper,
            @Value("${app.social.frontend-url}") String frontendUrl,
            @Value("${app.social.meta.app-id:}") String metaAppId,
            @Value("${META_APP_SECRET:}") String metaAppSecret,
            @Value("${app.social.meta.redirect-uri}") String metaRedirectUri,
            @Value("${app.social.meta.graph-version:v23.0}") String metaGraphVersion,
            @Value("${app.social.tiktok.client-key:}") String tiktokClientKey,
            @Value("${TIKTOK_CLIENT_SECRET:}") String tiktokClientSecret,
            @Value("${app.social.tiktok.redirect-uri}") String tiktokRedirectUri,
            @Value("${app.social.linkedin.client-id:}") String linkedinClientId,
            @Value("${LINKEDIN_CLIENT_SECRET:}") String linkedinClientSecret,
            @Value("${app.social.linkedin.redirect-uri}") String linkedinRedirectUri,
            @Value("${app.social.x.client-id:}") String xClientId,
            @Value("${X_CLIENT_SECRET:}") String xClientSecret,
            @Value("${app.social.x.redirect-uri}") String xRedirectUri) {
        this.connectionRepository = connectionRepository;
        this.userRepository = userRepository;
        this.stateService = stateService;
        this.cipher = cipher;
        this.objectMapper = objectMapper;
        this.frontendUrl = trimTrailingSlash(frontendUrl);
        this.metaAppId = metaAppId;
        this.metaAppSecret = metaAppSecret;
        this.metaRedirectUri = metaRedirectUri;
        this.metaGraphVersion = metaGraphVersion;
        this.tiktokClientKey = tiktokClientKey;
        this.tiktokClientSecret = tiktokClientSecret;
        this.tiktokRedirectUri = tiktokRedirectUri;
        this.linkedinClientId = linkedinClientId;
        this.linkedinClientSecret = linkedinClientSecret;
        this.linkedinRedirectUri = linkedinRedirectUri;
        this.xClientId = xClientId;
        this.xClientSecret = xClientSecret;
        this.xRedirectUri = xRedirectUri;
    }

    public String startUrl(String userId, SocialProvider provider) {
        if (!configured(provider)) throw new IllegalStateException(provider + " OAuth is not configured");
        OAuthStateService.Issued issued = stateService.issue(userId, provider);
        String state = issued.value();
        return switch (provider) {
            case META -> "https://www.facebook.com/" + metaGraphVersion + "/dialog/oauth?client_id=" + enc(metaAppId)
                    + "&redirect_uri=" + enc(metaRedirectUri) + "&state=" + enc(state)
                    + "&scope=" + enc("pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish");
            case TIKTOK -> "https://www.tiktok.com/v2/auth/authorize/?client_key=" + enc(tiktokClientKey)
                    + "&response_type=code&scope=" + enc("user.info.basic,video.upload,video.publish")
                    + "&redirect_uri=" + enc(tiktokRedirectUri) + "&state=" + enc(state);
            case LINKEDIN -> "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=" + enc(linkedinClientId)
                    + "&redirect_uri=" + enc(linkedinRedirectUri) + "&state=" + enc(state)
                    + "&scope=" + enc("openid profile w_member_social");
            case X -> "https://twitter.com/i/oauth2/authorize?response_type=code&client_id=" + enc(xClientId)
                    + "&redirect_uri=" + enc(xRedirectUri) + "&scope=" + enc("tweet.read tweet.write users.read offline.access")
                    + "&state=" + enc(state) + "&code_challenge=" + enc(issued.codeVerifier()) + "&code_challenge_method=plain";
        };
    }

    public SocialConnection complete(SocialProvider provider, String code, String state) {
        OAuthStateService.State stateValue = stateService.verify(state);
        if (stateValue.provider() != provider) throw new IllegalArgumentException("OAuth provider mismatch");
        User user = userRepository.findById(stateValue.userId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        TokenIdentity identity = exchange(provider, code, stateValue.codeVerifier());
        SocialConnection connection = connectionRepository
                .findByUserIdAndProviderAndExternalAccountId(user.getId(), provider, identity.externalId())
                .orElseGet(SocialConnection::new);
        connection.setUser(user);
        connection.setProvider(provider);
        connection.setExternalAccountId(identity.externalId());
        connection.setAccountName(identity.accountName());
        connection.setAccessTokenEncrypted(cipher.encrypt(identity.accessToken()));
        connection.setRefreshTokenEncrypted(cipher.encrypt(identity.refreshToken()));
        connection.setExpiresAt(identity.expiresAt());
        connection.setMetadataJson(identity.metadataJson());
        connection.setStatus(SocialConnectionStatus.ACTIVE);
        return connectionRepository.save(connection);
    }

    public List<SocialConnection> list(String userId) { return connectionRepository.findAllByUserIdOrderByUpdatedAtDesc(userId); }

    public void disconnect(String userId, String connectionId) {
        SocialConnection connection = connectionRepository.findByIdAndUserId(connectionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Social connection not found"));
        connection.setStatus(SocialConnectionStatus.DISCONNECTED);
        connectionRepository.save(connection);
    }

    private TokenIdentity exchange(SocialProvider provider, String code, String codeVerifier) {
        return switch (provider) {
            case META -> exchangeMeta(code);
            case TIKTOK -> exchangeTikTok(code);
            case LINKEDIN -> exchangeLinkedIn(code);
            case X -> exchangeX(code, codeVerifier);
        };
    }

    private TokenIdentity exchangeMeta(String code) {
        String shortTokenResponse = restClient.get().uri("https://graph.facebook.com/" + metaGraphVersion + "/oauth/access_token?client_id=" + enc(metaAppId) + "&client_secret=" + enc(metaAppSecret) + "&redirect_uri=" + enc(metaRedirectUri) + "&code=" + enc(code)).retrieve().body(String.class);
        String shortLivedAccessToken = text(json(shortTokenResponse), "access_token");

        // The code exchange above only ever returns a SHORT-LIVED (~1-2 hour)
        // User Access Token. A Page token minted from that (below) inherits
        // the same short lifetime — so without this extra hop, every
        // connection looked healthy right after connecting and then silently
        // failed to publish anything from an hour or two later onward, with
        // nothing in the UI ever explaining why. Exchanging first for a
        // LONG-LIVED (~60 day) User token makes the resulting Page token
        // effectively non-expiring instead (Meta doesn't return an
        // expires_in for Page tokens derived from a long-lived User token —
        // they last until the user revokes access or changes their
        // password, not on a fixed clock).
        // If the upgrade call itself fails for some reason (rate limit,
        // transient Graph error), fall back to the short-lived token rather
        // than failing the whole connect attempt over an optional upgrade —
        // worse token lifetime, but still a working connection today.
        String longLivedAccessToken;
        try {
            String longLivedResponse = restClient.get().uri("https://graph.facebook.com/" + metaGraphVersion + "/oauth/access_token?grant_type=fb_exchange_token&client_id=" + enc(metaAppId) + "&client_secret=" + enc(metaAppSecret) + "&fb_exchange_token=" + enc(shortLivedAccessToken)).retrieve().body(String.class);
            longLivedAccessToken = text(json(longLivedResponse), "access_token");
        } catch (Exception exception) {
            longLivedAccessToken = "";
        }
        String accessToken = longLivedAccessToken.isBlank() ? shortLivedAccessToken : longLivedAccessToken;

        String accounts = restClient.get().uri("https://graph.facebook.com/" + metaGraphVersion + "/me/accounts?fields=id,name,access_token&access_token=" + enc(accessToken)).retrieve().body(String.class);
        JsonNode data = json(accounts).path("data").path(0);
        String pageToken = text(data, "access_token");
        String pageId = text(data, "id");
        String pageName = text(data, "name");
        if (pageToken.isBlank() || pageId.isBlank()) throw new IllegalStateException("No Facebook Page was available for this Meta account");
        String instagram = restClient.get().uri("https://graph.facebook.com/" + metaGraphVersion + "/" + pageId + "?fields=instagram_business_account&access_token=" + enc(pageToken)).retrieve().body(String.class);
        String instagramId = text(json(instagram).path("instagram_business_account"), "id");
        Map<String, String> metadata = instagramId.isBlank() ? Map.of("pageId", pageId) : Map.of("pageId", pageId, "instagramBusinessAccountId", instagramId);
        return new TokenIdentity(pageId, pageName, pageToken, null, null, object(metadata));
    }

    private TokenIdentity exchangeTikTok(String code) {
        // TikTok's token endpoint rejects the exchange without redirect_uri —
        // it must exactly match the one used in the authorize call above.
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_key", tiktokClientKey); form.add("client_secret", tiktokClientSecret); form.add("code", code); form.add("grant_type", "authorization_code"); form.add("redirect_uri", tiktokRedirectUri);
        JsonNode token = json(restClient.post().uri("https://open.tiktokapis.com/v2/oauth/token/").contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve().body(String.class));
        String accessToken = text(token, "access_token");
        JsonNode user = json(restClient.get().uri("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name").header("Authorization", "Bearer " + accessToken).retrieve().body(String.class)).path("data").path("user");
        return new TokenIdentity(text(user, "open_id"), text(user, "display_name"), accessToken, text(token, "refresh_token"), expires(token), user.toString());
    }

    private TokenIdentity exchangeLinkedIn(String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code"); form.add("code", code); form.add("redirect_uri", linkedinRedirectUri); form.add("client_id", linkedinClientId); form.add("client_secret", linkedinClientSecret);
        JsonNode token = json(restClient.post().uri("https://www.linkedin.com/oauth/v2/accessToken").contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve().body(String.class));
        String accessToken = text(token, "access_token");
        JsonNode user = json(restClient.get().uri("https://api.linkedin.com/v2/userinfo").header("Authorization", "Bearer " + accessToken).retrieve().body(String.class));
        return new TokenIdentity(text(user, "sub"), text(user, "name"), accessToken, null, expires(token), user.toString());
    }

    private TokenIdentity exchangeX(String code, String codeVerifier) {
        // X treats an app with a client secret as a "confidential client" —
        // the token endpoint requires HTTP Basic auth (base64 client_id:secret)
        // on top of the form body, or it rejects the exchange as
        // unauthorized_client. The previous version never sent this header.
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code); form.add("grant_type", "authorization_code"); form.add("redirect_uri", xRedirectUri); form.add("code_verifier", codeVerifier);
        String basicAuth = Base64.getEncoder().encodeToString((xClientId + ":" + xClientSecret).getBytes(StandardCharsets.UTF_8));
        JsonNode token = json(restClient.post().uri("https://api.x.com/2/oauth2/token").header("Authorization", "Basic " + basicAuth).contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve().body(String.class));
        String accessToken = text(token, "access_token");
        JsonNode user = json(restClient.get().uri("https://api.x.com/2/users/me").header("Authorization", "Bearer " + accessToken).retrieve().body(String.class)).path("data");
        return new TokenIdentity(text(user, "id"), text(user, "name"), accessToken, text(token, "refresh_token"), expires(token), user.toString());
    }

    private boolean configured(SocialProvider provider) {
        return switch (provider) {
            case META -> nonBlank(metaAppId, metaAppSecret, metaRedirectUri);
            case TIKTOK -> nonBlank(tiktokClientKey, tiktokClientSecret, tiktokRedirectUri);
            case LINKEDIN -> nonBlank(linkedinClientId, linkedinClientSecret, linkedinRedirectUri);
            case X -> nonBlank(xClientId, xClientSecret, xRedirectUri);
        };
    }

    private static boolean nonBlank(String... values) { for (String value : values) if (value == null || value.isBlank()) return false; return true; }
    private static String enc(String value) { return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8); }
    private static String trimTrailingSlash(String value) { return value == null ? "" : value.replaceAll("/+$", ""); }
    private JsonNode json(String raw) { try { return objectMapper.readTree(raw == null ? "{}" : raw); } catch (Exception exception) { throw new IllegalStateException("Provider returned invalid JSON", exception); } }
    private static String text(JsonNode node, String field) { JsonNode value = node == null ? null : node.get(field); return value == null || value.isNull() ? "" : value.asText(""); }
    private static Instant expires(JsonNode token) { long seconds = token == null || token.get("expires_in") == null ? 0 : token.get("expires_in").asLong(0); return seconds <= 0 ? null : Instant.now().plusSeconds(seconds); }
    private static String object(Object value) { try { return new ObjectMapper().writeValueAsString(value); } catch (Exception exception) { return "{}"; } }

    public String frontendRedirect(boolean success, String message) { return frontendUrl + "/dashboard/social?oauth=" + (success ? "success" : "error") + "&message=" + enc(message); }
    private record TokenIdentity(String externalId, String accountName, String accessToken, String refreshToken, Instant expiresAt, String metadataJson) {}
}
