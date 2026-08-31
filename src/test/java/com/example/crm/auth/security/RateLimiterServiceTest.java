package com.example.crm.auth.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class RateLimiterServiceTest {

    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOperations;
    private RateLimiterService rateLimiterService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        redisTemplate = mock(StringRedisTemplate.class);
        valueOperations = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        rateLimiterService = new RateLimiterService(redisTemplate);
        ReflectionTestUtils.setField(rateLimiterService, "loginLimit", 3);
        ReflectionTestUtils.setField(rateLimiterService, "durationSeconds", 60);
    }

    @Test
    void whenRedisIsHealthy_andLimitNotExceeded_returnsTrue() {
        when(valueOperations.increment(anyString())).thenReturn(1L);

        boolean allowed = rateLimiterService.isAllowed("192.168.1.1");

        assertThat(allowed).isTrue();
        verify(redisTemplate, times(1)).expire(eq("rate:login:192.168.1.1"), eq(60L), any());
    }

    @Test
    void whenRedisIsHealthy_andLimitExceeded_returnsFalse() {
        when(valueOperations.increment(anyString())).thenReturn(4L); // limit is 3

        boolean allowed = rateLimiterService.isAllowed("192.168.1.1");

        assertThat(allowed).isFalse();
    }

    @Test
    void whenRedisFails_fallsBackToInMemoryRateLimiting() {
        // Mock Redis throwing a connection failure
        when(valueOperations.increment(anyString())).thenThrow(new RedisConnectionFailureException("Redis connection refused"));

        // First 3 requests should be allowed in-memory
        assertThat(rateLimiterService.isAllowed("192.168.1.2")).isTrue();
        assertThat(rateLimiterService.isAllowed("192.168.1.2")).isTrue();
        assertThat(rateLimiterService.isAllowed("192.168.1.2")).isTrue();

        // 4th request exceeds in-memory limit of 3, should be rejected
        assertThat(rateLimiterService.isAllowed("192.168.1.2")).isFalse();
    }
}
