package com.maamora.studio.service;

import com.maamora.studio.dto.request.CreateEmailDeliveryRequest;
import com.maamora.studio.dto.response.EmailDeliveryResponse;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.model.EmailDelivery;
import com.maamora.studio.model.Post;
import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.DeliveryStatus;
import com.maamora.studio.repository.EmailDeliveryRepository;
import com.maamora.studio.repository.PostRepository;
import com.maamora.studio.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;

@Service
public class SmtpDeliveryService {
    private final EmailDeliveryRepository deliveryRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final JavaMailSender mailSender;
    private final String fromAddress;

    public SmtpDeliveryService(EmailDeliveryRepository deliveryRepository,
                               UserRepository userRepository,
                               PostRepository postRepository,
                               JavaMailSender mailSender,
                               @Value("${app.mail.from:}") String fromAddress) {
        this.deliveryRepository = deliveryRepository;
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    @Transactional
    public EmailDeliveryResponse queue(String userId, CreateEmailDeliveryRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Post post = null;
        if (StringUtils.hasText(request.postId())) {
            post = postRepository.findById(request.postId())
                    .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
            if (post.getProduct() == null || post.getProduct().getCreatedBy() == null
                    || !userId.equals(post.getProduct().getCreatedBy().getId())) {
                throw new ResourceNotFoundException("Post not found");
            }
        }
        EmailDelivery delivery = EmailDelivery.builder()
                .user(user).post(post).toAddress(request.toAddress())
                .subject(request.subject()).body(request.body()).status(DeliveryStatus.QUEUED).build();
        EmailDelivery saved = deliveryRepository.save(delivery);
        if (!StringUtils.hasText(fromAddress)) {
            saved.setStatus(DeliveryStatus.FAILED);
            saved.setErrorMessage("SMTP sender address is not configured");
            deliveryRepository.save(saved);
        } else {
            scheduleProcessingAfterCommit(saved.getId());
        }
        return EmailDeliveryResponse.from(saved);
    }

    private void scheduleProcessingAfterCommit(String deliveryId) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    processAsync(deliveryId);
                }
            });
        } else {
            processAsync(deliveryId);
        }
    }

    public List<EmailDeliveryResponse> list(String userId) {
        return deliveryRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(EmailDeliveryResponse::from).toList();
    }

    @Async("creativeTaskExecutor")
    @Transactional
    public void processAsync(String deliveryId) {
        EmailDelivery delivery = deliveryRepository.findById(deliveryId).orElse(null);
        if (delivery == null) return;
        delivery.setStatus(DeliveryStatus.PROCESSING);
        deliveryRepository.save(delivery);
        try {
            if (!StringUtils.hasText(fromAddress)) throw new IllegalStateException("SMTP sender address is not configured");
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(delivery.getToAddress());
            message.setSubject(delivery.getSubject());
            message.setText(delivery.getBody());
            mailSender.send(message);
            delivery.setStatus(DeliveryStatus.SENT);
            delivery.setSentAt(Instant.now());
            delivery.setErrorMessage(null);
        } catch (Exception exception) {
            delivery.setStatus(DeliveryStatus.FAILED);
            String message = exception.getMessage();
            delivery.setErrorMessage(StringUtils.hasText(message) ? message.substring(0, Math.min(message.length(), 900)) : "SMTP delivery failed");
        }
        deliveryRepository.save(delivery);
    }
}
