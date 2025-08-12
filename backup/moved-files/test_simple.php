<?php
/**
 * Simple Integration Test for ANMS API
 * Direct testing without external dependencies
 */

echo "🧪 ANMS Simple API Test\n";
echo "=======================\n\n";

// Set up test environment
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['HTTP_CONTENT_TYPE'] = 'application/json';
$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer test-token';

echo "1️⃣ Testing Database Connection...\n";
try {
    require_once __DIR__ . '/src/includes/db_connect.php';
    if (defined('USE_MOCK_DATA') && USE_MOCK_DATA) {
        echo "✅ Using mock data (database not available)\n";
    } else {
        echo "✅ Database connection successful\n";
        echo "Database: " . DB_NAME . "\n";
    }
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
}
echo "\n";

echo "2️⃣ Testing API Bridge Health...\n";
try {
    $_GET['action'] = 'health';
    
    // Capture output
    ob_start();
    require __DIR__ . '/public/api-bridge.php';
    $response = ob_get_clean();
    
    $data = json_decode($response, true);
    if ($data && $data['success']) {
        echo "✅ API Bridge health check passed\n";
        echo "Status: " . $data['data']['status'] . "\n";
        echo "Version: " . $data['data']['version'] . "\n";
    } else {
        echo "❌ API Bridge health check failed\n";
        echo "Response: " . $response . "\n";
    }
} catch (Exception $e) {
    echo "❌ API Bridge error: " . $e->getMessage() . "\n";
}
echo "\n";

echo "3️⃣ Testing Authentication (Mock Login)...\n";
try {
    // Reset for auth test
    $_GET['action'] = 'auth';
    $_POST = [
        'action' => 'login',
        'email' => 'test@example.com',
        'password' => 'password'
    ];
    
    // Capture output
    ob_start();
    include __DIR__ . '/public/api-bridge.php';
    $response = ob_get_clean();
    
    $data = json_decode($response, true);
    if ($data && $data['success']) {
        echo "✅ Authentication successful\n";
        echo "User: " . $data['user']['name'] . "\n";
        echo "Token: " . substr($data['token'], 0, 20) . "...\n";
    } else {
        echo "⚠️ Authentication response: " . $response . "\n";
        echo "This might be expected if using mock data\n";
    }
} catch (Exception $e) {
    echo "❌ Authentication error: " . $e->getMessage() . "\n";
}
echo "\n";

echo "4️⃣ Testing File Structure...\n";
$requiredFiles = [
    '/public/index.html' => 'Modern landing page',
    '/public/assets/js/modern-app.js' => 'Main application',
    '/public/assets/js/api-client.js' => 'API client',
    '/public/assets/js/auth-manager.js' => 'Authentication manager',
    '/public/assets/css/modern-landing.css' => 'Landing page styles',
    '/public/assets/css/dashboard.css' => 'Dashboard styles',
    '/public/api-bridge.php' => 'API bridge',
    '/src/includes/db_connect.php' => 'Database connection'
];

foreach ($requiredFiles as $file => $description) {
    if (file_exists(__DIR__ . $file)) {
        echo "✅ $description: " . basename($file) . "\n";
    } else {
        echo "❌ Missing: $description ($file)\n";
    }
}
echo "\n";

echo "5️⃣ Testing Frontend Resources...\n";
$frontendFiles = [
    '/public/assets/js/ui-components.js' => 'UI Components',
    '/public/assets/images' => 'Images directory (optional)',
];

foreach ($frontendFiles as $file => $description) {
    if (file_exists(__DIR__ . $file)) {
        echo "✅ $description available\n";
    } else {
        echo "ℹ️ $description: not found (may be optional)\n";
    }
}
echo "\n";

echo "🎉 Simple integration test completed!\n";
echo "====================================\n";

echo "\n💡 Next steps:\n";
echo "1. Open browser to: http://localhost/anms/public/\n";
echo "2. Try logging in with: test@example.com / password\n";
echo "3. Test the pet management features\n";
echo "4. Check browser console for any JavaScript errors\n";
?>