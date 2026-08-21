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
import com.maamora.studio.model.enums.SocialProvider;
import com.maamora.studio.repository.PostRepository;
import com.maamora.studio.repository.PublishJobRepository;
import com.maamora.studio.repository.SocialConnectionRepository;
import com.maamora.studio.repository.UserRepository;
import com.maamora.studio.security.SecretCipher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;
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

    public SocialPublishService(PublishJobRepository publishJobRepository,
                                 SocialConnectionRepository connectionRepository,
                                 PostRepository postRepository,
                                 UserRepository userRepository,
                                 SecretCipher cipher,
                                 ObjectMapper objectMapper) {
        this.publishJobRepository = publishJobRepository;
        this.connectionRepository = connectionRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.cipher = cipher;
        this.objectMapper = objectMapper;
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
            PublishResult result = publish(connection.getProvider(), token, connection.getExternalAccountId(), job.getPost());
            job.setStatus(DeliveryStatus.SENT);
            job.setExternalPostId(result.externalId());
            job.setPublishedAt(Instant.now());
            job.setErrorMessage(null);
        } catch (Exception exception) {
            job.setStatus(DeliveryStatus.FAILED);
            job.setErrorMessage(safeMessage(exception));
        }
        publishJobRepository.save(job);
    }

    /**
     * Durable polling for future posts. The job timestamp is stored in PostgreSQL;
     * a server restart therefore does not discard the planned delivery.
     */
    @Scheduled(fixedDelayString = "${studio.social.scheduler-delay-ms:30000}")
    public void processDueScheduledJobs() {
        publishJobRepository
                .findTop50ByStatusAndScheduledForLessThanEqualOrderByScheduledForAsc(DeliveryStatus.QUEUED, Instant.now())
                .forEach(job -> processAsync(job.getId()));
    }

    private PublishResult publish(SocialProvider provider, String token, String accountId, Post post) {
        String caption = firstText(post.getCaptionEn(), post.getCaptionFr(), post.getCaptionAr(), post.getCaptionDarija());
        if (!StringUtils.hasText(caption)) throw new IllegalArgumentException("Post has no caption");
        return switch (provider) {
            case META -> publishMeta(token, accountId, caption, post.getImageUrl());
            case TIKTOK -> publishTikTok(token, caption, post.getImageUrl());
            case LINKEDIN -> publishLinkedIn(token, accountId, caption, post.getImageUrl());
            case X -> publishX(token, caption, post.getImageUrl());
        };
    }

    private PublishResult publishMeta(String token, String accountId, String caption, String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) throw new IllegalArgumentException("Meta publishing requires a public image URL");
        String container = restClient.post().uri("https://graph.facebook.com/v20.0/" + accountId + "/media")
                .body(Map.of("image_url", imageUrl, "caption", caption, "access_token", token))
                .retrieve().body(String.class);
        String containerId = textField(container, "id");
        String published = restClient.post().uri("https://graph.facebook.com/v20.0/" + accountId + "/media_publish")
                .body(Map.of("creation_id", containerId, "access_token", token))
                .retrieve().body(String.class);
        return new PublishResult(textField(published, "id"));
    }

    private PublishResult publishTikTok(String token, String caption, String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) throw new IllegalArgumentException("TikTok publishing requires a media URL");
        String response = restClient.post().uri("https://open.tiktokapis.com/v2/post/publish/video/init/")
                .header("Authorization", "Bearer " + token)
                .body(Map.of("post_info", Map.of("title", caption, "privacy_level", "PUBLIC_TO_EVERYONE", "disable_duet", false, "disable_comment", false, "disable_stitch", false),
                        "source_info", Map.of("source", "PULL_FROM_URL", "video_url", imageUrl)))
                .retrieve().body(String.class);
        return new PublishResult(textField(response, "publish_id"));
    }

    private PublishResult publishLinkedIn(String token, String accountId, String caption, String imageUrl) {
        if (StringUtils.hasText(imageUrl)) {
            throw new IllegalArgumentException("LinkedIn image publishing requires an asset-upload registration; text publishing is available after connection");
        }
        String response = restClient.post().uri("https://api.linkedin.com/v2/ugcPosts")
                .header("Authorization", "Bearer " + token)
                .header("X-Restli-Protocol-Version", "2.0.0")
                .body(Map.of("author", "urn:li:person:" + accountId,
                        "lifecycleState", "PUBLISHED",
                        "specificContent", Map.of("com.linkedin.ugc.ShareContent", Map.of("shareCommentary", Map.of("text", caption), "shareMediaCategory", "NONE")),
                        "visibility", Map.of("com.linkedin.ugc.MemberNetworkVisibility", "PUBLIC")))
                .retrieve().body(String.class);
        return new PublishResult(textField(response, "id"));
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
