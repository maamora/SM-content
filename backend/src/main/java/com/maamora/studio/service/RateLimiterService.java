package com.maamora.studio.service;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Minimal in-memory sliding-window rate limiter — no external dependency
 * (Redis/Bucket4j) needed at this app's scale. Keyed by whatever the caller
 * chooses (client IP for registration spam), so a handful of bots hammering
 * the same endpoint can't burn through the /api/auth/register brand-creation
 * flow or brute-force a brand's join code.
 *
 * Note: the attempts map grows with the number of distinct keys seen and is
 * never pruned — fine for this app's real-world traffic, but worth revisiting
 * (e.g. a periodic sweep) if this ever sees internet-scale abuse traffic.
 */
@Service
public class RateLimiterService {

    private final Map<String, Deque<Long>> attempts = new ConcurrentHashMap<>();

    /**
     * Records an attempt for {@code key} and returns whether it's allowed —
     * i.e. whether fewer than {@code maxAttempts} attempts have happened
     * within the trailing {@code window}. Call this once per real attempt;
     * it both checks and records in one step so callers can't race past it.
     */
    public synchronized boolean allow(String key, int maxAttempts, Duration window) {
        long now = System.currentTimeMillis();
        long windowStart = now - window.toMillis();

        Deque<Long> timestamps = attempts.computeIfAbsent(key, k -> new ArrayDeque<>());
        while (!timestamps.isEmpty() && timestamps.peekFirst() < windowStart) {
            timestamps.pollFirst();
        }

        if (timestamps.size() >= maxAttempts) {
            return false;
        }

        timestamps.addLast(now);
        return true;
    }
}
