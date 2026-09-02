package com.maamora.studio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.maamora.studio.dto.request.CreatePublishRequest;
import com.maamora.studio.dto.response.PublishJobResponse;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.model.Post;
import com.maamora.studio.model.PublishJob;
import com.maamora.studio.model.SocialConnection;
import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.DeliveryStatus;
import com.maamora.studio.model.enums.PostStatus;
import com.maamora.studio.model.enums.SocialConnectionStatus;
import com.maamora.studio.model.enums.SocialProvider;
import com.maamora.studio.repository.PostRepository;
import com.maamora.studio.repository.PublishJobRepository;
import com.maamora.studio.repository.SocialConnectionRepository;
import com.maamora.studio.repository.UserRepository;
import com.maamora.studio.security.SecretCipher;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class SocialPublishService {
    private final PublishJobRepository publishJobRepository;
    private final SocialConnectionRepository connectionRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final SecretCipher cipher;
    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.builder().build();
    // Was hardcoded as a literal "v20.0" in every Graph API call below,
    // independent of SocialOAuthService's own (configurable)
    // app.social.meta.graph-version — meaning bumping that setting silently
    // did nothing for publishing. Both now read the same property.
    private final String metaGraphVersion;

    public SocialPublishService(PublishJobRepository publishJobRepository,
                                 SocialConnectionRepository connectionRepository,
                                 PostRepository postRepository,
                                 UserRepository userRepository,
                                 SecretCipher cipher,
                                 ObjectMapper objectMapper,
                                 @Value("${app.social.meta.graph-version:v23.0}") String metaGraphVersion) {
        this.publishJobRepository = publishJobRepository;
        this.connectionRepository = connectionRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.cipher = cipher;
        this.objectMapper = objectMapper;
        this.metaGraphVersion = metaGraphVersion;
    }

    @Transactional
    public PublishJobResponse queue(String userId, CreatePublishRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Post post = postRepository.findById(request.postId())
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        assertPostOwnership(post, userId);
        if (post.getStatus() != PostStatus.APPROVED) {
            throw new IllegalArgumentException("Only approved posts can be published");
        }
        SocialConnection connection = connectionRepository.findByIdAndUserId(request.connectionId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Social connection not found"));
        if (connection.getStatus().name().equals("DISCONNECTED")) {
            throw new IllegalArgumentException("Social connection is disconnected");
        }
        if (request.scheduledFor() != null && !request.scheduledFor().isAfter(Instant.now().plusSeconds(30))) {
            throw new IllegalArgumentException("Scheduled publishing must be at least 30 seconds in the future.");
        }

        PublishJob job = PublishJob.builder()
                .user(user)
                .post(post)
                .connection(connection)
                .provider(connection.getProvider())
                .metaTarget(connection.getProvider() == SocialProvider.META ? resolveMetaTarget(connection, request.metaTarget()) : null)
                .status(DeliveryStatus.QUEUED)
                .scheduledFor(request.scheduledFor())
                .build();
        PublishJob saved = publishJobRepository.save(job);
        if (saved.getScheduledFor() == null) {
            processAsync(saved.getId());
        }
        return PublishJobResponse.from(saved);
    }

    public List<PublishJobResponse> list(String userId) {
        return publishJobRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(PublishJobResponse::from).toList();
    }

    public PublishJobResponse get(String userId, String jobId) {
        return PublishJobResponse.from(publishJobRepository.findByIdAndUserId(jobId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Publish job not found")));
    }

    @Async("creativeTaskExecutor")
    @Transactional
    public void processAsync(String jobId) {
        PublishJob job = publishJobRepository.findById(jobId).orElse(null);
        if (job == null) return;
        if (job.getStatus() != DeliveryStatus.QUEUED) return;
        if (job.getScheduledFor() != null && job.getScheduledFor().isAfter(Instant.now())) return;
        job.setStatus(DeliveryStatus.PROCESSING);
        publishJobRepository.save(job);
        try {
            SocialConnection connection = job.getConnection();
            String token = cipher.decrypt(connection.getAccessTokenEncrypted());
            PublishResult result = publish(connection, job.getMetaTarget(), token, job.getPost());
            job.setStatus(DeliveryStatus.SENT);
            job.setExternalPostId(result.externalId());
            job.setPublishedAt(Instant.now());
            job.setErrorMessage(null);
        } catch (Exception exception) {
            job.setStatus(DeliveryStatus.FAILED);
            job.setErrorMessage(safeMessage(exception));
            // SocialConnectionStatus.EXPIRED existed as an enum value but
            // nothing ever set it — a connection with a dead token (revoked,
            // password changed, or the pre-fix short-lived Page token from
            // before the long-lived-exchange change above) stayed "ACTIVE"
            // forever, so the UI kept offering it as a working channel and
            // every future publish attempt just failed again the same way
            // with no signal to reconnect. Flag it here instead so it's
            // visible and future queue() calls could route around it.
            if (looksLikeExpiredToken(exception)) {
                SocialConnection connection = job.getConnection();
                connection.setStatus(SocialConnectionStatus.EXPIRED);
                connectionRepository.save(connection);
            }
        }
        publishJobRepository.save(job);
    }

    private boolean looksLikeExpiredToken(Exception exception) {
        String message = exception.getMessage();
        if (message == null) return false;
        String lower = message.toLowerCase(Locale.ROOT);
        return lower.contains("oauthexception")
                || lower.contains("\"code\":190")
                || lower.contains("code\\\":190")
                || (lower.contains("access token") && (lower.contains("expired") || lower.contains("invalid") || lower.contains("session")));
    }

    private PublishResult publish(SocialConnection connection, String metaTarget, String token, Post post) {
        String caption = firstText(post.getCaptionEn(), post.getCaptionFr(), post.getCaptionAr(), post.getCaptionDarija());
        if (!StringUtils.hasText(caption)) throw new IllegalArgumentException("Post has no caption");
        String accountId = connection.getExternalAccountId();
        return switch (connection.getProvider()) {
            case META -> publishMeta(token, connection, metaTarget, caption, post.getImageUrl());
            case TIKTOK -> publishTikTok(token, caption, post.getImageUrl());
            case LINKEDIN -> publishLinkedIn(token, accountId, caption, post.getImageUrl());
            case X -> publishX(token, caption, post.getImageUrl());
        };
    }

    /**
     * exchangeMeta() connects a Facebook Page (its id is the connection's
     * externalAccountId) and, when one exists, also records the Page's
     * linked Instagram professional account id in metadataJson. Those are
     * two different publishing targets with two different Graph API shapes:
     * a Page photo post uses POST /{page-id}/photos, while an Instagram feed
     * post is the two-step /media (create container) + /media_publish flow —
     * and /media only exists for Instagram Business Account ids, not Page
     * ids. The previous version of this method always called /media +
     * /media_publish against the Page id, which is invalid for a real Page
     * and would only "work" (against the wrong surface) if Meta silently
     * treated the ids interchangeably, which it doesn't.
     */
    private PublishResult publishMeta(String token, SocialConnection connection, String metaTarget, String caption, String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) throw new IllegalArgumentException("Meta publishing requires a public image URL");
        Map<String, String> metadata = parseMetaMetadata(connection.getMetadataJson());

        if ("INSTAGRAM".equals(metaTarget)) {
            String igUserId = metadata.get("instagramBusinessAccountId");
            if (!StringUtils.hasText(igUserId)) {
                throw new IllegalArgumentException(
                        "This Meta connection has no Instagram professional account linked to its Facebook Page. Link one in Meta Business Suite, then reconnect.");
            }
            String container = restClient.post().uri("https://graph.facebook.com/" + metaGraphVersion + "/" + igUserId + "/media")
                    .body(Map.of("image_url", imageUrl, "caption", caption, "access_token", token))
                    .retrieve().body(String.class);
            String containerId = textField(container, "id");
            String published = restClient.post().uri("https://graph.facebook.com/" + metaGraphVersion + "/" + igUserId + "/media_publish")
                    .body(Map.of("creation_id", containerId, "access_token", token))
                    .retrieve().body(String.class);
            return new PublishResult(textField(published, "id"));
        }

        // Facebook Page post — a Page's photo edge is /photos (image_url is
        // called "url" here, unlike Instagram's "image_url"), never /media.
        String pageId = connection.getExternalAccountId();
        String published = restClient.post().uri("https://graph.facebook.com/" + metaGraphVersion + "/" + pageId + "/photos")
                .body(Map.of("url", imageUrl, "caption", caption, "access_token", token))
                .retrieve().body(String.class);
        return new PublishResult(textFieldAny(published, "post_id", "id"));
    }

    private String resolveMetaTarget(SocialConnection connection, String requested) {
        if ("INSTAGRAM".equals(requested) || "FACEBOOK_PAGE".equals(requested)) return requested;
        // No explicit choice — default to Instagram when this connection has
        // one linked (matches "post to Instagram" being the more common ask),
        // otherwise fall back to the Facebook Page itself.
        Map<String, String> metadata = parseMetaMetadata(connection.getMetadataJson());
        return StringUtils.hasText(metadata.get("instagramBusinessAccountId")) ? "INSTAGRAM" : "FACEBOOK_PAGE";
    }

    private Map<String, String> parseMetaMetadata(String metadataJson) {
        if (!StringUtils.hasText(metadataJson)) return Map.of();
        try {
            JsonNode node = objectMapper.readTree(metadataJson);
            java.util.Map<String, String> result = new java.util.HashMap<>();
            node.fieldNames().forEachRemaining(field -> result.put(field, node.path(field).asText("")));
            return result;
        } catch (Exception exception) {
            return Map.of();
        }
    }

    /**
     * post.getImageUrl() is always a still image — this app has no video
     * generation feature. The previous version sent that image URL to
     * /v2/post/publish/video/init/ as "video_url", which is TikTok's
     * video-only Direct Post endpoint; a real image there would be rejected
     * (or, at best, silently mis-handled) since it isn't a video file.
     * TikTok's Content Posting API has a separate photo endpoint —
     * /v2/post/publish/content/init/ with post_mode "DIRECT_POST" and
     * media_type "PHOTO" — for exactly this case.
     */
    private PublishResult publishTikTok(String token, String caption, String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) throw new IllegalArgumentException("TikTok publishing requires a media URL");
        String response = restClient.post().uri("https://open.tiktokapis.com/v2/post/publish/content/init/")
                .header("Authorization", "Bearer " + token)
                .body(Map.of("post_info", Map.of("title", caption, "privacy_level", "PUBLIC_TO_EVERYONE", "disable_comment", false),
                        "source_info", Map.of("source", "PULL_FROM_URL", "photo_cover_index", 0, "photo_images", List.of(imageUrl)),
                        "post_mode", "DIRECT_POST", "media_type", "PHOTO"))
                .retrieve().body(String.class);
        return new PublishResult(textField(response, "publish_id"));
    }

    // LinkedIn retired /v2/ugcPosts for new integrations in favor of
    // /rest/posts, which requires an explicit LinkedIn-Version header and, on
    // success, returns the new post's id in the x-restli-id *response
    // header* rather than the JSON body — a caller still reading `id` out of
    // the body (as the old ugcPosts response provided) would silently record
    // no external post id.
    private static final String LINKEDIN_API_VERSION = "202601";

    private PublishResult publishLinkedIn(String token, String accountId, String caption, String imageUrl) {
        if (StringUtils.hasText(imageUrl)) {
            throw new IllegalArgumentException("LinkedIn image publishing requires an asset-upload registration; text publishing is available after connection");
        }
        ResponseEntity<String> response = restClient.post().uri("https://api.linkedin.com/rest/posts")
                .header("Authorization", "Bearer " + token)
                .header("X-Restli-Protocol-Version", "2.0.0")
                .header("LinkedIn-Version", LINKEDIN_API_VERSION)
                .body(Map.of("author", "urn:li:person:" + accountId,
                        "commentary", caption,
                        "visibility", "PUBLIC",
                        "distribution", Map.of("feedDistribution", "MAIN_FEED", "targetEntities", List.of(), "thirdPartyDistributionChannels", List.of()),
                        "lifecycleState", "PUBLISHED",
                        "isReshareDisabledByAuthor", false))
                .retrieve().toEntity(String.class);
        String postId = response.getHeaders().getFirst("x-restli-id");
        if (!StringUtils.hasText(postId)) throw new IllegalStateException("LinkedIn did not return a post id");
        return new PublishResult(postId);
    }

    private PublishResult publishX(String token, String caption, String imageUrl) {
        if (StringUtils.hasText(imageUrl)) {
            throw new IllegalArgumentException("X media publishing requires an X media upload adapter; text publishing is available");
        }
        String response = restClient.post().uri("https://api.x.com/2/tweets")
                .header("Authorization", "Bearer " + token)
                .body(Map.of("text", caption))
                .retrieve().body(String.class);
        return new PublishResult(textField(response, "id"));
    }

    private void assertPostOwnership(Post post, String userId) {
        if (post.getProduct() == null || post.getProduct().getCreatedBy() == null
                || !userId.equals(post.getProduct().getCreatedBy().getId())) {
            throw new ResourceNotFoundException("Post not found");
        }
    }

    private String textFieldAny(String rawJson, String... names) {
        IllegalStateException last = null;
        for (String name : names) {
            try {
                return textField(rawJson, name);
            } catch (IllegalStateException exception) {
                last = exception;
            }
        }
        throw last != null ? last : new IllegalStateException("Provider response did not include " + String.join("/", names));
    }

    private String textField(String rawJson, String name) {
        try {
            JsonNode node = objectMapper.readTree(rawJson);
            JsonNode value = node.path("data").path(name);
            if (value.isMissingNode()) value = node.path(name);
            if (value.isMissingNode() || value.isNull() || !StringUtils.hasText(value.asText())) {
                throw new IllegalStateException("Provider response did not include " + name);
            }
            return value.asText();
        } catch (Exception exception) {
            throw new IllegalStateException("Invalid provider response", exception);
        }
    }

    private String firstText(String... values) {
        for (String value : values) if (StringUtils.hasText(value)) return value;
        return "";
    }

    private String safeMessage(Exception exception) {
        String message = exception.getMessage();
        if (!StringUtils.hasText(message)) return "Provider delivery failed";
        return message.length() > 900 ? message.substring(0, 900) : message;
    }

    private record PublishResult(String externalId) {}
}
