<?php

declare(strict_types=1);

namespace App\Infrastructure\Cache;

use App\Infrastructure\Config\Config;
use Redis;
use RuntimeException;

class CacheManager
{
    private Config $config;
    private ?Redis $redis = null;
    private array $memoryCache = [];
    private int $memoryCacheLimit = 1000;

    public function __construct(Config $config)
    {
        $this->config = $config;
    }

    /**
     * Get Redis connection
     */
    private function getRedis(): Redis
    {
        if ($this->redis === null) {
            if (!class_exists('Redis')) {
                throw new RuntimeException('Redis extension not available');
            }
            $this->redis = new Redis();
            
            $host = $this->config->get('redis.host', 'localhost');
            $port = $this->config->get('redis.port', 6379);
            $password = $this->config->get('redis.password');
            $database = $this->config->get('redis.database', 0);
            
            if (!$this->redis->connect($host, $port)) {
                throw new RuntimeException('Failed to connect to Redis');
            }
            
            if ($password) {
                $this->redis->auth($password);
            }
            
            $this->redis->select($database);
        }
        
        return $this->redis;
    }

    /**
     * Store data in cache
     */
    public function set(string $key, mixed $value, int $ttl = 3600): bool
    {
        $serializedValue = serialize($value);
        
        // Store in memory cache for quick access
        if (count($this->memoryCache) < $this->memoryCacheLimit) {
            $this->memoryCache[$key] = [
                'value' => $value,
                'expires' => time() + $ttl
            ];
        }
        
        // Store in Redis for persistence
        try {
            return $this->getRedis()->setex($key, $ttl, $serializedValue);
        } catch (\Exception $e) {
            // Fallback to file cache if Redis fails
            return $this->setFileCache($key, $serializedValue, $ttl);
        }
    }

    /**
     * Get data from cache
     */
    public function get(string $key): mixed
    {
        // Check memory cache first
        if (isset($this->memoryCache[$key])) {
            $cached = $this->memoryCache[$key];
            if ($cached['expires'] > time()) {
                return $cached['value'];
            } else {
                unset($this->memoryCache[$key]);
            }
        }
        
        // Check Redis cache
        try {
            $value = $this->getRedis()->get($key);
            if ($value !== false) {
                $unserialized = unserialize($value);
                
                // Store in memory cache for next access
                if (count($this->memoryCache) < $this->memoryCacheLimit) {
                    $this->memoryCache[$key] = [
                        'value' => $unserialized,
                        'expires' => time() + 3600 // Default 1 hour for memory cache
                    ];
                }
                
                return $unserialized;
            }
        } catch (\Exception $e) {
            // Fallback to file cache
            return $this->getFileCache($key);
        }
        
        return null;
    }

    /**
     * Check if key exists in cache
     */
    public function has(string $key): bool
    {
        // Check memory cache
        if (isset($this->memoryCache[$key])) {
            if ($this->memoryCache[$key]['expires'] > time()) {
                return true;
            } else {
                unset($this->memoryCache[$key]);
            }
        }
        
        // Check Redis cache
        try {
            return $this->getRedis()->exists($key) > 0;
        } catch (\Exception $e) {
            return $this->hasFileCache($key);
        }
    }

    /**
     * Delete from cache
     */
    public function delete(string $key): bool
    {
        // Remove from memory cache
        unset($this->memoryCache[$key]);
        
        // Remove from Redis
        try {
            $this->getRedis()->del($key);
        } catch (\Exception $e) {
            // Continue to file cache deletion
        }
        
        // Remove from file cache
        return $this->deleteFileCache($key);
    }

    /**
     * Clear all cache
     */
    public function clear(): bool
    {
        $this->memoryCache = [];
        
        try {
            $this->getRedis()->flushDB();
        } catch (\Exception $e) {
            // Continue to file cache clearing
        }
        
        return $this->clearFileCache();
    }

    /**
     * Get or set cache with callback
     */
    public function remember(string $key, callable $callback, int $ttl = 3600): mixed
    {
        $value = $this->get($key);
        
        if ($value === null) {
            $value = $callback();
            $this->set($key, $value, $ttl);
        }
        
        return $value;
    }

    /**
     * Increment cache value
     */
    public function increment(string $key, int $value = 1): int
    {
        try {
            return $this->getRedis()->incrBy($key, $value);
        } catch (\Exception $e) {
            $current = (int) $this->get($key);
            $new = $current + $value;
            $this->set($key, $new);
            return $new;
        }
    }

    /**
     * Set cache with tags for group invalidation
     */
    public function tags(array $tags): self
    {
        // Store tag associations for later invalidation
        foreach ($tags as $tag) {
            $tagKey = "tag:{$tag}";
            $keys = $this->get($tagKey) ?: [];
            // This would need to be implemented with the actual key when set() is called
        }
        
        return $this;
    }

    /**
     * File cache fallback methods
     */
    private function setFileCache(string $key, string $value, int $ttl): bool
    {
        $cacheDir = 'storage/cache';
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }
        
        $filename = $cacheDir . '/' . md5($key) . '.cache';
        $data = [
            'value' => $value,
            'expires' => time() + $ttl
        ];
        
        return file_put_contents($filename, serialize($data)) !== false;
    }

    private function getFileCache(string $key): mixed
    {
        $filename = 'storage/cache/' . md5($key) . '.cache';
        
        if (!file_exists($filename)) {
            return null;
        }
        
        $data = unserialize(file_get_contents($filename));
        
        if ($data['expires'] < time()) {
            unlink($filename);
            return null;
        }
        
        return unserialize($data['value']);
    }

    private function hasFileCache(string $key): bool
    {
        $filename = 'storage/cache/' . md5($key) . '.cache';
        
        if (!file_exists($filename)) {
            return false;
        }
        
        $data = unserialize(file_get_contents($filename));
        
        if ($data['expires'] < time()) {
            unlink($filename);
            return false;
        }
        
        return true;
    }

    private function deleteFileCache(string $key): bool
    {
        $filename = 'storage/cache/' . md5($key) . '.cache';
        
        if (file_exists($filename)) {
            return unlink($filename);
        }
        
        return true;
    }

    private function clearFileCache(): bool
    {
        $cacheDir = 'storage/cache';
        
        if (!is_dir($cacheDir)) {
            return true;
        }
        
        $files = glob($cacheDir . '/*.cache');
        
        foreach ($files as $file) {
            unlink($file);
        }
        
        return true;
    }

    /**
     * Get cache statistics
     */
    public function getStats(): array
    {
        $stats = [
            'memory_cache_size' => count($this->memoryCache),
            'memory_cache_limit' => $this->memoryCacheLimit,
        ];
        
        try {
            $redisInfo = $this->getRedis()->info();
            $stats['redis_connected'] = true;
            $stats['redis_memory_usage'] = $redisInfo['used_memory_human'] ?? 'unknown';
            $stats['redis_keys'] = $this->getRedis()->dbSize();
        } catch (\Exception $e) {
            $stats['redis_connected'] = false;
        }
        
        return $stats;
    }
}