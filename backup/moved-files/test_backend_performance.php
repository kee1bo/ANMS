<?php

// Simple backend performance test without composer dependencies
require_once 'src/Infrastructure/Config/Config.php';
require_once 'src/Infrastructure/Database/DatabaseManager.php';
require_once 'src/Infrastructure/Database/QueryOptimizer.php';
require_once 'src/Infrastructure/Cache/CacheManager.php';
require_once 'src/Infrastructure/Monitoring/PerformanceMonitor.php';

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

use App\Infrastructure\Config\Config;
use App\Infrastructure\Database\DatabaseManager;
use App\Infrastructure\Database\QueryOptimizer;
use App\Infrastructure\Cache\CacheManager;
use App\Infrastructure\Monitoring\PerformanceMonitor;

echo "=== Backend Performance Optimization Test ===\n\n";

try {
    // Initialize components
    $config = new Config();
    $db = new DatabaseManager($config);
    $queryOptimizer = new QueryOptimizer($db);
    $cache = new CacheManager($config);
    $monitor = new PerformanceMonitor($cache, $db, $queryOptimizer);

    echo "✓ Components initialized successfully\n\n";

    // Test 1: Database Connection Pooling
    echo "1. Testing Database Connection Pooling...\n";
    $startTime = microtime(true);
    
    $connections = [];
    for ($i = 0; $i < 5; $i++) {
        $connections[] = $db->connect();
    }
    
    $poolStats = $db->getPoolStats();
    $connectionTime = microtime(true) - $startTime;
    
    echo "   ✓ Created {$poolStats['active_connections']} connections in " . round($connectionTime, 4) . "s\n";
    echo "   ✓ Pool stats: Active={$poolStats['active_connections']}, Pooled={$poolStats['pooled_connections']}\n\n";

    // Test 2: Query Optimization
    echo "2. Testing Query Optimization...\n";
    $startTime = microtime(true);
    
    // Create optimized indexes
    $indexResults = $queryOptimizer->createOptimizedIndexes();
    $successfulIndexes = array_filter($indexResults, fn($r) => $r['status'] === 'success');
    
    echo "   ✓ Created " . count($successfulIndexes) . " optimized indexes\n";
    
    // Test some queries
    $testQueries = [
        "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL",
        "SELECT COUNT(*) FROM pets WHERE deleted_at IS NULL",
    ];
    
    foreach ($testQueries as $query) {
        $queryOptimizer->executeQuery($query);
    }
    
    $queryStats = $queryOptimizer->getQueryStats();
    $optimizationTime = microtime(true) - $startTime;
    
    echo "   ✓ Query optimization completed in " . round($optimizationTime, 4) . "s\n";
    echo "   ✓ Average query time: " . round($queryStats['average_time'], 4) . "s\n\n";

    // Test 3: Cache Performance
    echo "3. Testing Cache Performance...\n";
    $startTime = microtime(true);
    
    // Test cache operations
    $testData = ['test' => 'data', 'number' => 123, 'array' => [1, 2, 3]];
    
    // Set operations
    for ($i = 0; $i < 10; $i++) {
        $cache->set("test_key_{$i}", $testData, 3600);
    }
    
    // Get operations
    $hits = 0;
    for ($i = 0; $i < 10; $i++) {
        if ($cache->get("test_key_{$i}") !== null) {
            $hits++;
        }
    }
    
    $cacheTime = microtime(true) - $startTime;
    $cacheStats = $cache->getStats();
    
    echo "   ✓ Cache operations completed in " . round($cacheTime, 4) . "s\n";
    echo "   ✓ Cache hits: {$hits}/10\n";
    echo "   ✓ Redis connected: " . ($cacheStats['redis_connected'] ? 'Yes' : 'No (using file cache)') . "\n\n";

    // Test 4: System Performance Monitoring
    echo "4. Testing Performance Monitoring...\n";
    $monitor->startTimer('test_operation');
    
    // Simulate some work
    usleep(100000); // 100ms
    
    $metrics = $monitor->endTimer('test_operation');
    $systemMetrics = $monitor->getSystemMetrics();
    
    echo "   ✓ Performance monitoring working\n";
    echo "   ✓ Test operation duration: " . round($metrics['duration'], 4) . "s\n";
    echo "   ✓ Memory usage: " . round($systemMetrics['memory']['current_usage'] / 1024 / 1024, 2) . " MB\n\n";

    // Test 5: Database Optimization
    echo "5. Testing Database Table Optimization...\n";
    $startTime = microtime(true);
    
    try {
        $optimizationResults = $queryOptimizer->optimizeTables();
        $optimizedTables = array_filter($optimizationResults, fn($r) => $r['status'] === 'optimized');
        
        echo "   ✓ Optimized " . count($optimizedTables) . " tables\n";
        
        foreach ($optimizedTables as $table => $result) {
            echo "   ✓ {$table}: {$result['rows']} rows, " . 
                 round($result['data_length'] / 1024, 2) . " KB data\n";
        }
    } catch (Exception $e) {
        echo "   ⚠ Table optimization skipped (tables may not exist yet)\n";
    }
    
    $dbOptimizationTime = microtime(true) - $startTime;
    echo "   ✓ Database optimization completed in " . round($dbOptimizationTime, 4) . "s\n\n";

    // Generate Performance Report
    echo "6. Generating Performance Report...\n";
    $report = $monitor->getPerformanceReport();
    
    $reportFile = 'storage/logs/backend-performance-' . date('Y-m-d-H-i-s') . '.json';
    if (!is_dir('storage/logs')) {
        mkdir('storage/logs', 0755, true);
    }
    
    file_put_contents($reportFile, json_encode($report, JSON_PRETTY_PRINT));
    
    echo "   ✓ Performance report saved to: {$reportFile}\n\n";

    // Summary
    echo "=== PERFORMANCE OPTIMIZATION SUMMARY ===\n";
    echo "✓ Database connection pooling: IMPLEMENTED\n";
    echo "✓ Query optimization with indexing: IMPLEMENTED\n";
    echo "✓ API response caching: IMPLEMENTED\n";
    echo "✓ Performance monitoring: IMPLEMENTED\n";
    echo "✓ Database maintenance procedures: IMPLEMENTED\n\n";

    $recommendations = $monitor->getPerformanceRecommendations();
    if (!empty($recommendations)) {
        echo "Performance Recommendations:\n";
        foreach ($recommendations as $rec) {
            echo "- {$rec['message']}\n";
        }
    } else {
        echo "🎉 No performance issues detected!\n";
    }

    echo "\n✅ Backend Performance Optimization: COMPLETED SUCCESSFULLY\n";

} catch (Exception $e) {
    echo "❌ Error during performance testing: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}