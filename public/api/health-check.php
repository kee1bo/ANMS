<?php
/**
 * Health Check Endpoint
 * Simple endpoint to check if the server is responding
 */

// Set headers for health check
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Simple health check response
$response = [
    'status' => 'ok',
    'timestamp' => time(),
    'server_time' => date('Y-m-d H:i:s')
];

// Add some basic server info if needed
if (isset($_GET['detailed'])) {
    $response['php_version'] = PHP_VERSION;
    $response['memory_usage'] = memory_get_usage(true);
    $response['load_average'] = sys_getloadavg();
}

echo json_encode($response);
exit;
?>