<?php
/**
 * Integration Test for ANMS API
 * Tests the modern frontend API integration with backend
 */

// Set up test environment
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "🧪 ANMS API Integration Test\n";
echo "================================\n\n";

// Test configuration
$baseUrl = 'http://localhost/anms/public/api.php';

// Test helper function
function testAPI($endpoint, $data = null, $method = 'GET', $token = null) {
    global $baseUrl;
    
    $url = $baseUrl . '?action=' . $endpoint;
    $curl = curl_init();
    
    $headers = [
        'Content-Type: application/json',
        'HTTP_AUTHORIZATION: Bearer test-token' // Trigger modern API
    ];
    
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 10
    ]);
    
    if ($method === 'POST' && $data) {
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    curl_close($curl);
    
    if ($error) {
        return ['error' => $error, 'http_code' => 0];
    }
    
    return [
        'data' => json_decode($response, true),
        'http_code' => $httpCode,
        'raw' => $response
    ];
}

echo "1️⃣ Testing API Health Check...\n";
$health = testAPI('health');
if ($health['http_code'] === 200 && $health['data']['success']) {
    echo "✅ API Health: " . $health['data']['message'] . "\n";
} else {
    echo "❌ API Health Failed: HTTP " . $health['http_code'] . "\n";
    echo "Response: " . ($health['raw'] ?? 'No response') . "\n";
}
echo "\n";

echo "2️⃣ Testing User Authentication...\n";

// Test login with default test user
$loginData = [
    'action' => 'login',
    'email' => 'test@example.com',
    'password' => 'password'
];

$login = testAPI('auth', $loginData, 'POST');
if ($login['http_code'] === 200 && $login['data']['success']) {
    echo "✅ Login successful\n";
    $token = $login['data']['token'];
    echo "User: " . $login['data']['user']['name'] . "\n";
    echo "Token: " . substr($token, 0, 20) . "...\n";
} else {
    echo "❌ Login failed: HTTP " . $login['http_code'] . "\n";
    echo "Response: " . ($login['raw'] ?? 'No response') . "\n";
    $token = null;
}
echo "\n";

if ($token) {
    echo "3️⃣ Testing User Profile...\n";
    $profile = testAPI('auth', ['action' => 'profile'], 'POST', $token);
    if ($profile['http_code'] === 200 && $profile['data']['success']) {
        echo "✅ Profile retrieved\n";
        echo "Name: " . $profile['data']['user']['name'] . "\n";
        echo "Email: " . $profile['data']['user']['email'] . "\n";
    } else {
        echo "❌ Profile failed: HTTP " . $profile['http_code'] . "\n";
    }
    echo "\n";
    
    echo "4️⃣ Testing Pet Management...\n";
    
    // Get pets
    $pets = testAPI('get_pets', null, 'GET', $token);
    if ($pets['http_code'] === 200 && $pets['data']['success']) {
        echo "✅ Get pets successful\n";
        echo "Pets found: " . count($pets['data']['pets']) . "\n";
        foreach ($pets['data']['pets'] as $pet) {
            echo "  - " . $pet['name'] . " (" . $pet['species'] . ")\n";
        }
    } else {
        echo "❌ Get pets failed: HTTP " . $pets['http_code'] . "\n";
    }
    echo "\n";
    
    // Add a new pet
    echo "5️⃣ Testing Add Pet...\n";
    $newPet = [
        'name' => 'Test Pet',
        'species' => 'Dog',
        'breed' => 'Test Breed',
        'age' => 2,
        'weight' => 15.5,
        'ideal_weight' => 15.0,
        'activity_level' => 'medium',
        'photo' => '🐕‍🦺'
    ];
    
    $addPet = testAPI('add_pet', $newPet, 'POST', $token);
    if ($addPet['http_code'] === 200 && $addPet['data']['success']) {
        echo "✅ Add pet successful\n";
        echo "Pet ID: " . $addPet['data']['pet']['id'] . "\n";
        $testPetId = $addPet['data']['pet']['id'];
    } else {
        echo "❌ Add pet failed: HTTP " . $addPet['http_code'] . "\n";
        echo "Response: " . ($addPet['raw'] ?? 'No response') . "\n";
        $testPetId = null;
    }
    echo "\n";
    
    // Test nutrition plan
    if ($testPetId) {
        echo "6️⃣ Testing Nutrition Plan...\n";
        $nutrition = testAPI('diet_plan', ['pet_id' => $testPetId], 'POST', $token);
        if ($nutrition['http_code'] === 200 && $nutrition['data']['success']) {
            echo "✅ Nutrition plan generated\n";
            echo "Daily calories: " . $nutrition['data']['nutrition_plan']['daily_calories'] . "\n";
        } else {
            echo "❌ Nutrition plan failed: HTTP " . $nutrition['http_code'] . "\n";
        }
        echo "\n";
        
        // Clean up - delete test pet
        echo "7️⃣ Cleaning up test data...\n";
        $deletePet = testAPI('delete_pet', ['pet_id' => $testPetId], 'POST', $token);
        if ($deletePet['http_code'] === 200 && $deletePet['data']['success']) {
            echo "✅ Test pet deleted\n";
        } else {
            echo "⚠️ Failed to delete test pet\n";
        }
    }
} else {
    echo "Skipping authenticated tests due to login failure\n";
}

echo "\n🎉 Integration test completed!\n";
echo "================================\n";

// Output suggestions for any failures
echo "\n💡 If tests failed:\n";
echo "1. Make sure MySQL is running\n";
echo "2. Run: php setup_database.php\n";
echo "3. Check web server is running on localhost\n";
echo "4. Verify file permissions\n";
?>