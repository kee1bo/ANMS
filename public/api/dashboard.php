<?php
/**
 * Enhanced Dashboard Data API
 * Provides dynamic dashboard statistics, recent activity, and insights
 */

session_start();

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include required files
require_once __DIR__ . '/../../src/includes/db_connect.php';
require_once __DIR__ . '/../../src/Application/Services/DashboardService.php';
require_once __DIR__ . '/../../src/Infrastructure/Repository/ActivityRepository.php';

// Check authentication
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Authentication required'
    ]);
    exit();
}

try {
    $userId = $_SESSION['user_id'];
    $action = $_GET['action'] ?? 'dashboard';
    
    // Initialize services
    $dashboardService = new DashboardService($pdo);
    $activityRepository = new ActivityRepository($pdo);
    
    switch ($action) {
        case 'stats':
            handleStatsRequest($dashboardService, $userId);
            break;
            
        case 'activities':
            handleActivitiesRequest($activityRepository, $userId);
            break;
            
        case 'insights':
            handleInsightsRequest($dashboardService, $userId);
            break;
            
        case 'log_activity':
            handleLogActivityRequest($activityRepository, $userId);
            break;
            
        case 'nutrition_insights':
            handleNutritionInsightsRequest($userId);
            break;
            
        case 'health_metrics':
            handleHealthMetricsRequest($userId);
            break;
            
        case 'dashboard':
        default:
            handleDashboardRequest($dashboardService, $activityRepository, $userId);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to load dashboard data',
        'message' => $e->getMessage()
    ]);
}

/**
 * Handle main dashboard request
 */
function handleDashboardRequest($dashboardService, $activityRepository, $userId) {
    $stats = $dashboardService->getDashboardStatistics($userId);
    $recentActivity = $activityRepository->getRecentActivitiesWithPetNames($userId, 10);
    $insights = $dashboardService->getDashboardInsights($userId);
    
    echo json_encode([
        'success' => true,
        'stats' => $stats,
        'recent_activity' => $recentActivity,
        'insights' => $insights,
        'timestamp' => date('c')
    ]);
}

/**
 * Handle statistics-only request
 */
function handleStatsRequest($dashboardService, $userId) {
    $stats = $dashboardService->getDashboardStatistics($userId);
    
    echo json_encode([
        'success' => true,
        'stats' => $stats,
        'timestamp' => date('c')
    ]);
}

/**
 * Handle activities-only request
 */
function handleActivitiesRequest($activityRepository, $userId) {
    $limit = min(50, max(1, (int)($_GET['limit'] ?? 10)));
    $offset = max(0, (int)($_GET['offset'] ?? 0));
    $type = $_GET['type'] ?? null;
    
    if ($type) {
        $activities = $activityRepository->findByType($userId, $type, $limit);
    } else {
        $activities = $activityRepository->getRecentActivitiesWithPetNames($userId, $limit);
    }
    
    // Convert activities to arrays
    $activitiesData = [];
    foreach ($activities as $activity) {
        if (is_array($activity)) {
            $activitiesData[] = $activity;
        } else {
            $activitiesData[] = $activity->toArray();
        }
    }
    
    echo json_encode([
        'success' => true,
        'activities' => $activitiesData,
        'total' => $activityRepository->countByUserId($userId),
        'timestamp' => date('c')
    ]);
}

/**
 * Handle insights request
 */
function handleInsightsRequest($dashboardService, $userId) {
    $insights = $dashboardService->getDashboardInsights($userId);
    
    echo json_encode([
        'success' => true,
        'insights' => $insights,
        'timestamp' => date('c')
    ]);
}

/**
 * Handle activity logging request
 */
function handleLogActivityRequest($activityRepository, $userId) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed'
        ]);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['type']) || !isset($input['description'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Missing required fields: type and description'
        ]);
        return;
    }
    
    try {
        $activity = $activityRepository->create([
            'user_id' => $userId,
            'type' => $input['type'],
            'description' => $input['description'],
            'pet_id' => $input['pet_id'] ?? null,
            'metadata' => json_encode($input['metadata'] ?? [])
        ]);
        
        echo json_encode([
            'success' => true,
            'activity' => $activity->toArray(),
            'message' => 'Activity logged successfully'
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to log activity',
            'message' => $e->getMessage()
        ]);
    }
}

/**
 * Handle nutrition insights request
 */
function handleNutritionInsightsRequest($userId) {
    try {
        // Include the NutritionInsightsService
        require_once __DIR__ . '/../../src/Application/Services/NutritionInsightsService.php';
        
        $insightsService = new NutritionInsightsService($GLOBALS['pdo']);
        $insights = $insightsService->getUserNutritionInsights($userId);
        
        echo json_encode([
            'success' => true,
            'insights' => $insights,
            'timestamp' => date('c')
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to load nutrition insights',
            'message' => $e->getMessage()
        ]);
    }
}

/**
 * Handle health metrics request
 */
function handleHealthMetricsRequest($userId) {
    try {
        // Include the HealthMetricsCalculator
        require_once __DIR__ . '/../../src/Application/Services/HealthMetricsCalculator.php';
        
        $healthCalculator = new HealthMetricsCalculator($GLOBALS['pdo']);
        $metrics = $healthCalculator->calculateUserHealthMetrics($userId);
        
        echo json_encode([
            'success' => true,
            'health_metrics' => $metrics,
            'timestamp' => date('c')
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to load health metrics',
            'message' => $e->getMessage()
        ]);
    }
}

// Legacy functions kept for backward compatibility
function getDashboardStats(PDO $pdo, int $userId): array {
    $dashboardService = new DashboardService($pdo);
    return $dashboardService->getDashboardStatistics($userId);
}

function getRecentActivity($pdo, $userId) {
    $activityRepository = new ActivityRepository($pdo);
    return $activityRepository->getRecentActivitiesWithPetNames($userId, 10);
}

function getTimeAgo($datetime) {
    $time = time() - strtotime($datetime);
    
    if ($time < 60) return 'just now';
    if ($time < 3600) return floor($time/60) . ' minutes ago';
    if ($time < 86400) return floor($time/3600) . ' hours ago';
    if ($time < 2592000) return floor($time/86400) . ' days ago';
    if ($time < 31536000) return floor($time/2592000) . ' months ago';
    return floor($time/31536000) . ' years ago';
}
?>