package com.example.crm.common.config;

import com.example.crm.dashboard.dto.DashboardSummaryResponse;
import com.example.crm.dashboard.service.DashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
class CacheFallbackTest {

    @Autowired
    private DashboardService dashboardService;

    @MockitoBean
    private RedisConnectionFactory redisConnectionFactory;

    @Autowired
    private CacheManager cacheManager;

    @Test
    void whenCachingErrors_fallbackGracefullySucceeds() {
        // This test simulates the environment when Redis connection factory throws exceptions
        // representing a down Redis instance. Thanks to CustomCacheErrorHandler, caching failures
        // should be caught and logged as warnings, while the business logic succeeds.
        
        // Trigger cacheable getSummary method
        DashboardSummaryResponse summary = dashboardService.getSummary();
        
        // Assert that the request succeeds and is not blocked by a Redis connection issue
        assertThat(summary).isNotNull();
        assertThat(summary.getTotalCustomers()).isGreaterThanOrEqualTo(0);
    }
}
