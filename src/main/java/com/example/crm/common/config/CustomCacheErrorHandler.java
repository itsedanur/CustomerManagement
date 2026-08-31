package com.example.crm.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.lang.Nullable;

@Slf4j
public class CustomCacheErrorHandler implements CacheErrorHandler {

    @Override
    public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
        log.warn("Cache GET failure: {} - Cache: {}, Key: {}. Falling back to database.", exception.getMessage(), cache.getName(), key);
    }

    @Override
    public void handleCachePutError(RuntimeException exception, Cache cache, Object key, @Nullable Object value) {
        log.warn("Cache PUT failure: {} - Cache: {}, Key: {}.", exception.getMessage(), cache.getName(), key);
    }

    @Override
    public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
        log.warn("Cache EVICT failure: {} - Cache: {}, Key: {}.", exception.getMessage(), cache.getName(), key);
    }

    @Override
    public void handleCacheClearError(RuntimeException exception, Cache cache) {
        log.warn("Cache CLEAR failure: {} - Cache: {}.", exception.getMessage(), cache.getName());
    }
}
