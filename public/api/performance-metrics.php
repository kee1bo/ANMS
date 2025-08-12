<?php
/**
 * Performance Metrics Endpoint
 * Receives and logs performance metrics from the frontend
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Get the raw POST data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Invalid JSON data');
    }
    
    // Validate required fields
    if (!isset($data['type']) || !isset($data['data'])) {
        throw new Exception('Missing required fields');
    }
    
    // Create log entry
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'type' => $data['type'],
        'data' => $data['data'],
        'user_agent' => $data['userAgent'] ?? $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
        'url' => $data['url'] ?? 'Unknown',
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown'
    ];
    
    // Log to file (you might want to use a proper logging system)
    $logFile = __DIR__ . '/../logs/performance.log';
    $logDir = dirname($logFile);
    
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    // Write to log file
    file_put_contents(
        $logFile, 
        json_encode($logEntry) . "\n", 
        FILE_APPEND | LOCK_EX
    );
    
    // Optional: Store in database for analysis
    if (isset($GLOBALS['pdo'])) {
        try {
            $stmt = $GLOBALS['pdo']->prepare("
                INSERT INTO performance_metrics 
                (timestamp, type, data, user_agent, url, ip) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $logEntry['timestamp'],
                $logEntry['type'],
                json_encode($logEntry['data']),
                $logEntry['user_agent'],
                $logEntry['url'],
                $logEntry['ip']
            ]);
        } catch (PDOException $e) {
            // Database storage failed, but file logging succeeded
            error_log("Failed to store performance metrics in database: " . $e->getMessage());
        }
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Performance metrics recorded'
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
    
    // Log the error
    error_log("Performance metrics endpoint error: " . $e->getMessage());
}
?>