<?php

declare(strict_types=1);

namespace Tests\Performance;

use App\Infrastructure\Cache\CacheManager;
use App\Infrastructure\Config\Config;
use App\Infrastructure\Database\DatabaseManager;
use App\Infrastructure\Database\QueryOptimizer;
use App\Infrastructure\Database\BackupManager;
use App\Infrastructure\Monitoring\PerformanceMonitor;
use App\Infrastructure\Repository\PetRepository;
use App\Infrastructure\Repository\HealthRecordRepository;
use App\Infrastructure\Repository\UserRepository;

class BackendPerformanceTest
{
    private Config $config;
    private DatabaseManager $db;
    private QueryOptimizer $queryOptimizer;
    private CacheManager $cache;
    private PerformanceMonitor $monitor;
    private array $testResults = [];

    public function __construct()
    {
        // Load environment variables
        if (file_exists('.env')) {
            $lines = file('.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '=') !== false && !str_starts_with($line, '#')) {
                    [$key, $value] = explode('=', $line, 2);
                    $_ENV[trim($key)] = trim($value);
                }
            }
        }

        $this->config = new Config();
        $this->db = new DatabaseManager($this->config);
        $this->queryOptimizer = new QueryOptimizer($this->db);
        $this->cache = new CacheManager($this->config);
        $this->monitor = new PerformanceMonitor($this->cache, $this->db, $this->queryOptimizer);
    }

    /**
     * Run all performance tests
     */
    public function runAllTests(): array
    {
        echo "Starting Backend Performance Tests...\n\n";

        $this->testDatabaseConnectionPooling();
        $this->testQueryOptimization();
        $this->testCachePerformance();
        $this->testRepositoryPerformance();
        $this->testLoadTesting();
        $this->testBackupPerformance();
        $this->generatePerformanceReport();

        return $this->testResults;
    }

    /**
     * Test database connection pooling
     */
    private function testDatabaseConnectionPooling(): void
    {
        echo "Testing Database Connection Pooling...\n";
        
        $this->monitor->startTimer('connection_pooling');
        
        // Test multiple connections
        $connections = [];
        for ($i = 0; $i < 10; $i++) {
            $connections[] = $this->db->connect();
        }
        
        $poolStats = $this->db->getPoolStats();
        
        $metrics = $this->monitor->endTimer('connection_pooling');
        
        $this->testResults['connection_pooling'] = [
            'status' => 'completed',
            'pool_stats' => $poolStats,
            'performance' => $metrics,
            'connections_created' => count($connections),
            'passed' => $poolStats['active_connections'] <= $poolStats['max_connections']
        ];
        
        echo "✓ Connection pooling test completed\n";
        echo "  Active connections: {$poolStats['active_connections']}\n";
        echo "  Pooled connections: {$poolStats['pooled_connections']}\n\n";
    }

    /**
     * Test query optimization
     */
    private function testQueryOptimization(): void
    {
        echo "Testing Query Optimization...\n";
        
        $this->monitor->startTimer('query_optimization');
        
        // Create optimized indexes
        $indexResults = $this->queryOptimizer->createOptimizedIndexes();
        
        // Test slow query detection
        $testQueries = [
            "SELECT * FROM pets WHERE user_id = 1",
            "SELECT * FROM health_records WHERE pet_id = 1 AND record_type = 'weight'",
            "SELECT COUNT(*) FROM pets WHERE species = 'dog'",
        ];
        
        foreach ($testQueries as $query) {
            $this->queryOptimizer->executeQuery($query);
        }
        
        $queryStats = $this->queryOptimizer->getQueryStats();
        $suggestions = $this->queryOptimizer->suggestIndexes();
        
        $metrics = $this->monitor->endTimer('query_optimization');
        
        $this->testResults['query_optimization'] = [
            'status' => 'completed',
            'indexes_created' => count(array_filter($indexResults, fn($r) => $r['status'] === 'success')),
            'query_stats' => $queryStats,
            'suggestions' => count($suggestions),
            'performance' => $metrics,
            'passed' => $queryStats['average_time'] < 0.1 // Less than 100ms average
        ];
        
        echo "✓ Query optimization test completed\n";
        echo "  Average query time: {$queryStats['average_time']}s\n";
        echo "  Slow queries: {$queryStats['slow_queries']}\n\n";
    }

    /**
     * Test cache performance
     */
    private function testCachePerformance(): void
    {
        echo "Testing Cache Performance...\n";
        
        $this->monitor->startTimer('cache_performance');
        
        // Test cache operations
        $testData = ['test' => 'data', 'number' => 123, 'array' => [1, 2, 3]];
        
        // Set operations
        $setStartTime = microtime(true);
        for ($i = 0; $i < 100; $i++) {
            $this->cache->set("test_key_{$i}", $testData, 3600);
        }
        $setTime = microtime(true) - $setStartTime;
        
        // Get operations
        $getStartTime = microtime(true);
        for ($i = 0; $i < 100; $i++) {
            $this->cache->get("test_key_{$i}");
        }
        $getTime = microtime(true) - $getStartTime;
        
        $cacheStats = $this->cache->getStats();
        
        $metrics = $this->monitor->endTimer('cache_performance');
        
        $this->testResults['cache_performance'] = [
            'status' => 'completed',
            'set_time' => round($setTime, 4),
            'get_time' => round($getTime, 4),
            'cache_stats' => $cacheStats,
            'performance' => $metrics,
            'passed' => $setTime < 1.0 && $getTime < 0.5 // Reasonable thresholds
        ];
        
        echo "✓ Cache performance test completed\n";
        echo "  Set operations (100): {$setTime}s\n";
        echo "  Get operations (100): {$getTime}s\n\n";
    }

    /**
     * Test repository performance with caching
     */
    private function testRepositoryPerformance(): void
    {
        echo "Testing Repository Performance...\n";
        
        $this->monitor->startTimer('repository_performance');
        
        $petRepo = new PetRepository($this->db, $this->queryOptimizer, $this->cache);
        
        // Test cached vs non-cached queries
        $testUserId = 1;
        
        // First call (should hit database)
        $startTime = microtime(true);
        $pets1 = $petRepo->findByUserId($testUserId);
        $firstCallTime = microtime(true) - $startTime;
        
        // Second call (should hit cache)
        $startTime = microtime(true);
        $pets2 = $petRepo->findByUserId($testUserId);
        $secondCallTime = microtime(true) - $startTime;
        
        $metrics = $this->monitor->endTimer('repository_performance');
        
        $this->testResults['repository_performance'] = [
            'status' => 'completed',
            'first_call_time' => round($firstCallTime, 4),
            'second_call_time' => round($secondCallTime, 4),
            'cache_improvement' => round(($firstCallTime - $secondCallTime) / $firstCallTime * 100, 2),
            'results_consistent' => count($pets1) === count($pets2),
            'performance' => $metrics,
            'passed' => $secondCallTime < $firstCallTime && count($pets1) === count($pets2)
        ];
        
        echo "✓ Repository performance test completed\n";
        echo "  First call: {$firstCallTime}s\n";
        echo "  Second call (cached): {$secondCallTime}s\n";
        echo "  Cache improvement: " . round(($firstCallTime - $secondCallTime) / $firstCallTime * 100, 2) . "%\n\n";
    }

    /**
     * Test application under load
     */
    private function testLoadTesting(): void
    {
        echo "Testing Load Performance...\n";
        
        $this->monitor->startTimer('load_testing');
        
        $petRepo = new PetRepository($this->db, $this->queryOptimizer, $this->cache);
        
        // Simulate concurrent requests
        $operations = 50;
        $startTime = microtime(true);
        
        for ($i = 0; $i < $operations; $i++) {
            // Mix of different operations
            switch ($i % 4) {
                case 0:
                    $petRepo->findByUserId(1);
                    break;
                case 1:
                    $petRepo->findById($i % 10 + 1);
                    break;
                case 2:
                    $petRepo->countByUserId(1);
                    break;
                case 3:
                    $petRepo->findOverweightPets();
                    break;
            }
        }
        
        $totalTime = microtime(true) - $startTime;
        $avgTime = $totalTime / $operations;
        
        $systemMetrics = $this->monitor->getSystemMetrics();
        $dbMetrics = $this->monitor->getDatabaseMetrics();
        
        $metrics = $this->monitor->endTimer('load_testing');
        
        $this->testResults['load_testing'] = [
            'status' => 'completed',
            'operations' => $operations,
            'total_time' => round($totalTime, 4),
            'average_time' => round($avgTime, 4),
            'operations_per_second' => round($operations / $totalTime, 2),
            'system_metrics' => $systemMetrics,
            'db_metrics' => $dbMetrics,
            'performance' => $metrics,
            'passed' => $avgTime < 0.1 // Less than 100ms per operation
        ];
        
        echo "✓ Load testing completed\n";
        echo "  Operations: {$operations}\n";
        echo "  Total time: {$totalTime}s\n";
        echo "  Average time per operation: {$avgTime}s\n";
        echo "  Operations per second: " . round($operations / $totalTime, 2) . "\n\n";
    }

    /**
     * Test backup performance
     */
    private function testBackupPerformance(): void
    {
        echo "Testing Backup Performance...\n";
        
        $this->monitor->startTimer('backup_performance');
        
        $backupManager = new BackupManager($this->config, $this->db);
        
        // Test full backup
        $backupResult = $backupManager->createFullBackup();
        
        // Test backup listing
        $backups = $backupManager->listBackups();
        
        // Test backup verification
        $verification = null;
        if ($backupResult['status'] === 'success') {
            $verification = $backupManager->verifyBackupIntegrity($backupResult['filename']);
        }
        
        $metrics = $this->monitor->endTimer('backup_performance');
        
        $this->testResults['backup_performance'] = [
            'status' => 'completed',
            'backup_result' => $backupResult,
            'backup_count' => count($backups),
            'verification' => $verification,
            'performance' => $metrics,
            'passed' => $backupResult['status'] === 'success' && 
                       ($verification['overall'] ?? 'fail') === 'pass'
        ];
        
        echo "✓ Backup performance test completed\n";
        echo "  Backup status: {$backupResult['status']}\n";
        if ($backupResult['status'] === 'success') {
            echo "  Backup size: " . round($backupResult['size'] / 1024, 2) . " KB\n";
        }
        echo "\n";
    }

    /**
     * Generate comprehensive performance report
     */
    private function generatePerformanceReport(): void
    {
        echo "Generating Performance Report...\n";
        
        $report = $this->monitor->getPerformanceReport();
        $report['test_results'] = $this->testResults;
        
        // Calculate overall score
        $passedTests = array_filter($this->testResults, fn($test) => $test['passed'] ?? false);
        $overallScore = count($passedTests) / count($this->testResults) * 100;
        
        $report['overall_score'] = round($overallScore, 2);
        $report['total_tests'] = count($this->testResults);
        $report['passed_tests'] = count($passedTests);
        
        // Save report to file
        $reportFile = 'storage/logs/performance-report-' . date('Y-m-d-H-i-s') . '.json';
        if (!is_dir('storage/logs')) {
            mkdir('storage/logs', 0755, true);
        }
        
        file_put_contents($reportFile, json_encode($report, JSON_PRETTY_PRINT));
        
        $this->testResults['performance_report'] = [
            'status' => 'completed',
            'report_file' => $reportFile,
            'overall_score' => $overallScore,
            'passed' => $overallScore >= 80 // 80% pass rate required
        ];
        
        echo "✓ Performance report generated\n";
        echo "  Overall score: {$overallScore}%\n";
        echo "  Passed tests: " . count($passedTests) . "/" . count($this->testResults) . "\n";
        echo "  Report saved to: {$reportFile}\n\n";
    }

    /**
     * Display test summary
     */
    public function displaySummary(): void
    {
        echo "=== BACKEND PERFORMANCE TEST SUMMARY ===\n\n";
        
        foreach ($this->testResults as $testName => $result) {
            $status = $result['passed'] ? '✓ PASS' : '✗ FAIL';
            echo "{$status} {$testName}\n";
            
            if (isset($result['performance']['duration'])) {
                echo "    Duration: {$result['performance']['duration']}s\n";
            }
            
            if (!$result['passed'] && isset($result['message'])) {
                echo "    Issue: {$result['message']}\n";
            }
            
            echo "\n";
        }
        
        $passedTests = array_filter($this->testResults, fn($test) => $test['passed'] ?? false);
        $overallScore = count($passedTests) / count($this->testResults) * 100;
        
        echo "Overall Performance Score: " . round($overallScore, 2) . "%\n";
        echo "Tests Passed: " . count($passedTests) . "/" . count($this->testResults) . "\n\n";
        
        if ($overallScore >= 80) {
            echo "🎉 Backend performance optimization SUCCESSFUL!\n";
        } else {
            echo "⚠️  Backend performance needs improvement.\n";
        }
    }
}

// Run the tests if this file is executed directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $tester = new BackendPerformanceTest();
    $results = $tester->runAllTests();
    $tester->displaySummary();
}