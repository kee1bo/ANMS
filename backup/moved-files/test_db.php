<?php
echo "Testing database connection...\n";

// Test basic PHP functionality
echo "✅ PHP is working\n";

// Test database connection
try {
    require_once __DIR__ . '/src/includes/db_connect.php';
    
    if (defined('USE_MOCK_DATA') && USE_MOCK_DATA) {
        echo "✅ Using mock data (database not available)\n";
        
        // Test mock login
        require_once __DIR__ . '/src/includes/mock_data.php';
        if (mockLogin('test@example.com', 'password')) {
            echo "✅ Mock login working\n";
        } else {
            echo "❌ Mock login failed\n";
        }
    } else {
        echo "✅ Database connection successful\n";
        echo "Database: " . DB_NAME . "\n";
        
        // Test user query
        $sql = "SELECT COUNT(*) as count FROM users";
        if ($stmt = $mysqli->prepare($sql)) {
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            echo "✅ Users table accessible, count: " . $row['count'] . "\n";
            $stmt->close();
        }
    }
    
} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
}

echo "\nTesting API endpoint...\n";

// Test API bridge directly
$_GET['action'] = 'health';
ob_start();
try {
    require __DIR__ . '/public/api-bridge.php';
    $output = ob_get_clean();
    echo "✅ API bridge output: " . substr($output, 0, 100) . "\n";
} catch (Exception $e) {
    ob_end_clean();
    echo "❌ API bridge error: " . $e->getMessage() . "\n";
}

echo "\nDone!\n";
?>