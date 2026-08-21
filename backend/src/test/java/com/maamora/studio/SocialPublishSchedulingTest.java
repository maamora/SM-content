package com.maamora.studio;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.maamora.studio.dto.request.CreatePublishRequest;
import com.maamora.studio.dto.response.PublishJobResponse;
import com.maamora.studio.model.Post;
import com.maamora.studio.model.Product;
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
import com.maamora.studio.service.SocialPublishService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SocialPublishSchedulingTest {

    @Mock private PublishJobRepository publishJobRepository;
    @Mock private SocialConnectionRepository connectionRepository;
    @Mock private PostRepository postRepository;
    @Mock private UserRepository userRepository;
    @Mock private SecretCipher cipher;
    @Mock private Post post;
    @Mock private Product product;

    @Test
    void persistsFutureDeliveryWithoutDispatchingItImmediately() {
        SocialPublishService service = new SocialPublishService(
                publishJobRepository, connectionRepository, postRepository, userRepository, cipher, new ObjectMapper());
        Instant deliveryTime = Instant.now().plusSeconds(120);
        User user = User.builder().id("user-1").build();
        SocialConnection connection = SocialConnection.builder()
                .id("connection-1")
                .user(user)
                .provider(SocialProvider.META)
                .externalAccountId("account-1")
                .accountName("STUDIO")
                .accessTokenEncrypted("encrypted")
                .build();

        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(postRepository.findById("post-1")).thenReturn(Optional.of(post));
        when(post.getProduct()).thenReturn(product);
        when(product.getCreatedBy()).thenReturn(user);
        when(post.getStatus()).thenReturn(PostStatus.APPROVED);
        when(connectionRepository.findByIdAndUserId("connection-1", "user-1")).thenReturn(Optional.of(connection));
        when(publishJobRepository.save(any(PublishJob.class))).thenAnswer(invocation -> {
            PublishJob job = invocation.getArgument(0);
            job.setId("job-1");
            return job;
        });

        PublishJobResponse response = service.queue("user-1", new CreatePublishRequest("post-1", "connection-1", deliveryTime));

        ArgumentCaptor<PublishJob> jobCaptor = ArgumentCaptor.forClass(PublishJob.class);
        verify(publishJobRepository).save(jobCaptor.capture());
        PublishJob saved = jobCaptor.getValue();
        assertThat(saved.getStatus()).isEqualTo(DeliveryStatus.QUEUED);
        assertThat(saved.getScheduledFor()).isEqualTo(deliveryTime);
        assertThat(response.scheduledFor()).isEqualTo(deliveryTime);
        assertThat(response.status()).isEqualTo(DeliveryStatus.QUEUED.name());
    }
}
