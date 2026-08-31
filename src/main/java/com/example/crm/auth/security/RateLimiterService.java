package com.example.crm.auth.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class RateLimiterService {

    private final StringRedisTemplate redisTemplate;

    @Value("${app.rate-limiting.login.limit:5}")
    private int loginLimit;

    @Value("${app.rate-limiting.login.duration-seconds:60}")
    private int durationSeconds;

    // Fallback in-memory rate limiting stores when Redis is offline
    private final ConcurrentHashMap<String, Long> ipRequestCounts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> ipExpiryTimes = new ConcurrentHashMap<>();

    public RateLimiterService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Checks if the given IP address is allowed to make a login request.
     * Uses Redis if available, and falls back to thread-safe in-memory rate limiting if not.
     */
    public boolean isAllowed(String ipAddress) {
        String key = "rate:login:" + ipAddress;
        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1) {
                redisTemplate.expire(key, durationSeconds, TimeUnit.SECONDS);
            }
            return count != null && count <= loginLimit;
        } catch (Exception e) {
            log.warn("Redis is unavailable for rate limiting. Falling back to in-memory store. Error: {}", e.getMessage());
            return isAllowedInMemory(ipAddress);
        }
    }

    private synchronized boolean isAllowedInMemory(String ipAddress) {
        long now = System.currentTimeMillis();
        Long expiry = ipExpiryTimes.get(ipAddress);

        if (expiry == null || now > expiry) {
            // Reset the rate limit window
            ipRequestCounts.put(ipAddress, 1L);
            ipExpiryTimes.put(ipAddress, now + (durationSeconds * 1000L));
            return true;
        } else {
            long count = ipRequestCounts.getOrDefault(ipAddress, 0L) + 1;
            ipRequestCounts.put(ipAddress, count);
            return count <= loginLimit;
        }
    }
}
