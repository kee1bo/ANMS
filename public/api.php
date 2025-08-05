<?php
/**
 * Main API Router - Routes to modern API bridge
 * This maintains backward compatibility while using the new modern API
 */

// For modern frontend, use the new API bridge
$contentType = $_SERVER['HTTP_CONTENT_TYPE'] ?? $_SERVER['CONTENT_TYPE'] ?? '';
if (strpos($contentType, 'application/json') !== false ||
    isset($_SERVER['HTTP_AUTHORIZATION']) ||
    (isset($_GET['modern']) && $_GET['modern'] === '1') ||
    !empty(file_get_contents('php://input'))) {
    
    // Route to modern API bridge
    require_once __DIR__ . '/api-bridge.php';
    exit();
}

// Legacy API routing (for backward compatibility)
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'auth':
        require_once __DIR__ . '/../src/api/auth.php';
        break;
    case 'get_pets':
        require_once __DIR__ . '/../src/api/get_pets.php';
        break;
    case 'add_pet':
        require_once __DIR__ . '/../src/api/add_pet.php';
        break;
    case 'diet_plan':
        require_once __DIR__ . '/../src/api/diet_plan.php';
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'API endpoint not found']);
        break;
}
?>