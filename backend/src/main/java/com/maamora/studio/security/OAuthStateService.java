package com.maamora.studio.security;

import com.maamora.studio.model.enums.SocialProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
public class OAuthStateService {
    private final byte[] secret;
    private final SecureRandom random = new SecureRandom();

    public OAuthStateService(@Value("${app.jwt.secret}") String jwtSecret) {
        this.secret = jwtSecret.getBytes(StandardCharsets.UTF_8);
    }

    public Issued issue(String userId, SocialProvider provider) {
        String nonce = Long.toHexString(random.nextLong());
        String codeVerifier = encode(randomBytes(32));
        String payload = String.join(".", userId, provider.name(), Long.toString(Instant.now().plusSeconds(600).getEpochSecond()), nonce, codeVerifier);
        try {
            return new Issued(encode(payload) + "." + encode(sign(payload)), codeVerifier);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to issue OAuth state", exception);
        }
    }

    public State verify(String state) {
        try {
            String[] parts = state.split("\\.", -1);
            if (parts.length != 2) throw new IllegalArgumentException("Invalid OAuth state");
            String payload = decode(parts[0]);
            String expected = encode(sign(payload));
            if (!MessageDigestHolder.constantTimeEquals(expected, parts[1])) throw new IllegalArgumentException("Invalid OAuth state");
            String[] values = payload.split("\\.", -1);
            if (values.length != 5 || Long.parseLong(values[2]) < Instant.now().getEpochSecond()) throw new IllegalArgumentException("Expired OAuth state");
            return new State(values[0], SocialProvider.valueOf(values[1]), values[4]);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Invalid OAuth state", exception);
        }
    }

    private String encode(String value) { return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8)); }
    private String encode(byte[] value) { return Base64.getUrlEncoder().withoutPadding().encodeToString(value); }
    private String decode(String value) { return new String(Base64.getUrlDecoder().decode(value), StandardCharsets.UTF_8); }

    private byte[] sign(String payload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
    }

    private byte[] randomBytes(int length) {
        byte[] bytes = new byte[length];
        random.nextBytes(bytes);
        return bytes;
    }

    public record Issued(String value, String codeVerifier) {}
    public record State(String userId, SocialProvider provider, String codeVerifier) {}

    private static final class MessageDigestHolder {
        private static boolean constantTimeEquals(String left, String right) {
            return java.security.MessageDigest.isEqual(left.getBytes(StandardCharsets.UTF_8), right.getBytes(StandardCharsets.UTF_8));
        }
    }
}
