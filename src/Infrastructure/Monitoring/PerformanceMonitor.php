<?php

declare(strict_types=1);

namespace App\Infrastructure\Monitoring;

use App\Infrastructure\Cache\CacheManager;
use App\Infrastructure\Database\DatabaseManager;
use App\Infrastructure\Database\QueryOptimizer;

class PerformanceMonitor
{
    private CacheManager $cache;
    private DatabaseManager $db;
    private QueryOptimizer $queryOptimizer;
    private array $metrics = [];
    private float $requestStartTime;

    public function __construct(
        CacheManager $cache,
        DatabaseManager $db,
        QueryOptimizer $queryOptimizer
    ) {
        $this->cache = $cache;
        $this->db = $db;
        $this->queryOptimizer = $queryOptimizer;
        $this->requestStartTime = microtime(true);
    }

    /**
     * Start monitoring a specific operation
     */
    public function startTimer(string $operation): void
    {
        $this->metrics[$operation] = [
            'start_time' => microtime(true),
            'memory_start' => memory_get_usage(true)
        ];
    }

    /**
     * End monitoring and record metrics
     */
    public function endTimer(string $operation): array
    {
        if (!isset($this->metrics[$operation])) {
            return ['error' => 'Timer not started for operation: ' . $operation];
        }

        $endTime = microtime(true);
        $endMemory = memory_get_usage(true);

        $metrics = [
            'operation' => $operation,
            'duration' => round($endTime - $this->metrics[$operation]['start_time'], 4),
            'memory_used' => $endMemory - $this->metrics[$operation]['memory_start'],
            'memory_peak' => memory_get_peak_usage(true),
            'timestamp' => time()
        ];

        // Store metrics in cache for analysis
        $this->storeMetrics($operation, $metrics);

        unset($this->metrics[$operation]);

        return $metrics;
    }

    /**
     * Monitor database performance
     */
    public function getDatabaseMetrics(): array
    {
        $poolStats = $this->db->getPoolStats();
        $queryStats = $this->queryOptimizer->getQueryStats();

        return [
            'connection_pool' => $poolStats,
            'query_performance' => $queryStats,
            'slow_queries' => $this->queryOptimizer->suggestIndexes()
        ];
    }

    /**
     * Monitor cache performance
     */
    public function getCacheMetrics(): array
    {
        return $this->cache->getStats();
    }

    /**
     * Monitor system resources
     */
    public function getSystemMetrics(): array
    {
        return [
            'memory' => [
                'current_usage' => memory_get_usage(true),
                'peak_usage' => memory_get_peak_usage(true),
                'limit' => ini_get('memory_limit')
            ],
            'cpu' => [
                'load_average' => sys_getloadavg(),
                'process_time' => microtime(true) - $this->requestStartTime
            ],
            'disk' => [
                'free_space' => disk_free_space('.'),
                'total_space' => disk_total_space('.')
            ],
            'php' => [
                'version' => PHP_VERSION,
                'max_execution_time' => ini_get('max_execution_time'),
                'opcache_enabled' => function_exists('opcache_get_status') && opcache_get_status()
            ]
        ];
    }

    /**
     * Get comprehensive performance report
     */
    public function getPerformanceReport(): array
    {
        return [
            'request_time' => microtime(true) - $this->requestStartTime,
            'database' => $this->getDatabaseMetrics(),
            'cache' => $this->getCacheMetrics(),
            'system' => $this->getSystemMetrics(),
            'recommendations' => $this->getPerformanceRecommendations()
        ];
    }

    /**
     * Get performance recommendations
     */
    public function getPerformanceRecommendations(): array
    {
        $recommendations = [];
        $systemMetrics = $this->getSystemMetrics();
        $dbMetrics = $this->getDatabaseMetrics();
        $cacheMetrics = $this->getCacheMetrics();

        // Memory recommendations
        $memoryUsage = $systemMetrics['memory']['current_usage'];
        $memoryLimit = $this->parseMemoryLimit($systemMetrics['memory']['limit']);
        
        if ($memoryUsage > $memoryLimit * 0.8) {
            $recommendations[] = [
                'type' => 'memory',
                'severity' => 'high',
                'message' => 'Memory usage is high. Consider increasing memory_limit or optimizing code.',
                'current' => $memoryUsage,
                'limit' => $memoryLimit
            ];
        }

        // Database recommendations
        if ($dbMetrics['query_performance']['slow_queries'] > 0) {
            $recommendations[] = [
                'type' => 'database',
                'severity' => 'medium',
                'message' => 'Slow queries detected. Consider optimizing queries or adding indexes.',
                'slow_queries' => $dbMetrics['query_performance']['slow_queries']
            ];
        }

        // Cache recommendations
        if (!$cacheMetrics['redis_connected']) {
            $recommendations[] = [
                'type' => 'cache',
                'severity' => 'medium',
                'message' => 'Redis is not connected. Using file cache fallback which is slower.',
            ];
        }

        // CPU recommendations
        $loadAverage = $systemMetrics['cpu']['load_average'][0];
        if ($loadAverage > 2.0) {
            $recommendations[] = [
                'type' => 'cpu',
                'severity' => 'high',
                'message' => 'High CPU load detected. Consider optimizing code or scaling resources.',
                'load_average' => $loadAverage
            ];
        }

        return $recommendations;
    }

    /**
     * Store metrics for historical analysis
     */
    private function storeMetrics(string $operation, array $metrics): void
    {
        $key = "performance_metrics:{$operation}:" . date('Y-m-d-H');
        $existing = $this->cache->get($key) ?: [];
        $existing[] = $metrics;

        // Keep only last 100 entries per hour
        if (count($existing) > 100) {
            $existing = array_slice($existing, -100);
        }

        $this->cache->set($key, $existing, 3600); // Store for 1 hour
    }

    /**
     * Get historical metrics
     */
    public function getHistoricalMetrics(string $operation, int $hours = 24): array
    {
        $metrics = [];
        
        for ($i = 0; $i < $hours; $i++) {
            $timestamp = time() - ($i * 3600);
            $key = "performance_metrics:{$operation}:" . date('Y-m-d-H', $timestamp);
            $hourlyMetrics = $this->cache->get($key);
            
            if ($hourlyMetrics) {
                $metrics = array_merge($metrics, $hourlyMetrics);
            }
        }

        return $metrics;
    }

    /**
     * Generate performance alerts
     */
    public function checkPerformanceAlerts(): array
    {
        $alerts = [];
        $recommendations = $this->getPerformanceRecommendations();

        foreach ($recommendations as $recommendation) {
            if ($recommendation['severity'] === 'high') {
                $alerts[] = [
                    'type' => 'performance_alert',
                    'severity' => $recommendation['severity'],
                    'message' => $recommendation['message'],
                    'timestamp' => time(),
                    'details' => $recommendation
                ];
            }
        }

        return $alerts;
    }

    /**
     * Parse memory limit string to bytes
     */
    private function parseMemoryLimit(string $limit): int
    {
        $limit = trim($limit);
        $last = strtolower($limit[strlen($limit) - 1]);
        $value = (int) $limit;

        switch ($last) {
            case 'g':
                $value *= 1024;
            case 'm':
                $value *= 1024;
            case 'k':
                $value *= 1024;
        }

        return $value;
    }

    /**
     * Log performance metrics to file
     */
    public function logMetrics(array $metrics): void
    {
        $logDir = 'storage/logs';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        $logFile = $logDir . '/performance-' . date('Y-m-d') . '.log';
        $logEntry = date('Y-m-d H:i:s') . ' ' . json_encode($metrics) . PHP_EOL;
        
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }

    /**
     * Cleanup old performance logs
     */
    public function cleanupOldLogs(int $daysToKeep = 30): void
    {
        $logDir = 'storage/logs';
        if (!is_dir($logDir)) {
            return;
        }

        $files = glob($logDir . '/performance-*.log');
        $cutoffTime = time() - ($daysToKeep * 24 * 3600);

        foreach ($files as $file) {
            if (filemtime($file) < $cutoffTime) {
                unlink($file);
            }
        }
    }
}