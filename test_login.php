<?php
session_start();

// Include the mock data functions
require_once __DIR__ . '/src/includes/mock_data.php';

echo "Testing login functionality...\n";

// Test mock login
if (mockLogin('test@example.com', 'password')) {
    echo "✓ Mock login successful\n";
    echo "User ID: " . $_SESSION['user_id'] . "\n";
    echo "User Name: " . $_SESSION['user_name'] . "\n";
    echo "User Email: " . $_SESSION['user_email'] . "\n";
    
    // Test getting pets
    $pets = getMockPets(1);
    echo "✓ Retrieved " . count($pets) . " pets\n";
    foreach ($pets as $pet) {
        echo "  - " . $pet['name'] . " (" . $pet['species'] . ")\n";
    }
} else {
    echo "✗ Mock login failed\n";
}

echo "\nTesting different credentials...\n";
if (!mockLogin('wrong@email.com', 'wrongpassword')) {
    echo "✓ Correctly rejected invalid credentials\n";
} else {
    echo "✗ Should have rejected invalid credentials\n";
}

echo "\nApplication is ready to use!\n";
echo "Visit: http://localhost:8002\n";
echo "Login with: test@example.com / password\n";
?>