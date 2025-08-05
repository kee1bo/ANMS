<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Include our optimized backend components
require_once '../src/Infrastructure/Config/Config.php';
require_once '../src/Infrastructure/Cache/CacheManager.php';
require_once '../src/Infrastructure/Monitoring/PerformanceMonitor.php';

use App\Infrastructure\Config\Config;
use App\Infrastructure\Cache\CacheManager;

try {
    $config = new Config();
    $cache = new CacheManager($config);
    
    $action = $_GET['action'] ?? 'demo';
    $response = ['status' => 'success'];
    
    switch ($action) {
        case 'cache_test':
            // Demonstrate caching performance
            $key = 'expensive_operation_' . ($_GET['id'] ?? '1');
            
            $startTime = microtime(true);
            $result = $cache->remember($key, function() {
                // Simulate expensive operation
                usleep(100000); // 100ms delay
                return [
                    'data' => 'This is expensive data that took 100ms to generate',
                    'timestamp' => date('Y-m-d H:i:s'),
                    'random' => rand(1000, 9999),
                    'complex_data' => range(1, 100)
                ];
            }, 300); // Cache for 5 minutes
            
            $executionTime = microtime(true) - $startTime;
            
            $response['result'] = $result;
            $response['execution_time'] = round($executionTime, 4);
            $response['cached'] = $executionTime < 0.05; // If less than 50ms, likely cached
            break;
            
        case 'cache_stats':
            $response['cache_stats'] = $cache->getStats();
            break;
            
        case 'performance_test':
            $operations = (int)($_GET['operations'] ?? 50);
            $startTime = microtime(true);
            
            // Perform multiple cache operations
            for ($i = 0; $i < $operations; $i++) {
                $cache->set("perf_test_{$i}", ['data' => $i, 'timestamp' => time()], 60);
                $cache->get("perf_test_{$i}");
            }
            
            $totalTime = microtime(true) - $startTime;
            
            $response['operations'] = $operations;
            $response['total_time'] = round($totalTime, 4);
            $response['avg_time'] = round($totalTime / $operations, 6);
            $response['ops_per_second'] = round($operations / $totalTime, 2);
            break;
            
        case 'memory_usage':
            $response['memory'] = [
                'current' => round(memory_get_usage(true) / 1024 / 1024, 2) . ' MB',
                'peak' => round(memory_get_peak_usage(true) / 1024 / 1024, 2) . ' MB',
                'limit' => ini_get('memory_limit')
            ];
            break;
            
        case 'system_info':
            $response['system'] = [
                'php_version' => PHP_VERSION,
                'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
                'cache_files' => count(glob('../storage/cache/*.cache')),
                'uptime' => round(microtime(true) - $_SERVER['REQUEST_TIME_FLOAT'], 4) . 's'
            ];
            break;
            
        default:
            // Demo endpoint showing all features
            $demoData = $cache->remember('demo_data', function() {
                return [
                    'message' => 'Backend performance optimizations are working!',
                    'features' => [
                        'Multi-tier caching (Memory → Redis → File)',
                        'Database connection pooling',
                        'Query optimization and monitoring',
                        'Performance monitoring and alerts',
                        'Automatic backup and maintenance'
                    ],
                    'generated_at' => date('Y-m-d H:i:s'),
                    'cache_demo' => 'This data is cached for better performance'
                ];
            }, 300);
            
            $response['demo'] = $demoData;
            $response['cache_stats'] = $cache->getStats();
            break;
    }
    
} catch (Exception $e) {
    $response = [
        'status' => 'error',
        'message' => $e->getMessage()
    ];
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>