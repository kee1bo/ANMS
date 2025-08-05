<?php
// Mock data for when database is not available
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Mock user login function
function mockLogin($email, $password) {
    if ($email === 'test@example.com' && $password === 'password') {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_name'] = 'Test User';
        $_SESSION['user_email'] = 'test@example.com';
        $_SESSION['user_location'] = 'Test Location';
        $_SESSION['member_since'] = '2024-01-01 00:00:00';
        return true;
    }
    return false;
}

// Mock pets data
function getMockPets($user_id = 1) {
    return [
        [
            'id' => 1,
            'name' => 'Buddy',
            'species' => 'Dog',
            'breed' => 'Golden Retriever',
            'age' => 3,
            'weight' => 25.5,
            'ideal_weight' => 24.0,
            'activity_level' => 'Medium',
            'health_status' => 'Healthy',
            'photo' => 'DOG',
            'personality' => 'Friendly and energetic'
        ],
        [
            'id' => 2,
            'name' => 'Whiskers',
            'species' => 'Cat',
            'breed' => 'Persian',
            'age' => 2,
            'weight' => 4.2,
            'ideal_weight' => 4.0,
            'activity_level' => 'Low',
            'health_status' => 'Healthy',
            'photo' => 'CAT',
            'personality' => 'Calm and loves to sleep'
        ]
    ];
}

// Check if we should use mock data (when database is not available)
function useMockData() {
    // Try to connect to MySQL to see if it's available
    try {
        $configs = [
            ['', ''],           // No username/password
            ['root', ''],       // Root with no password  
            ['root', 'root'],   // Root with root password
            ['root', 'password'] // Root with password
        ];
        
        foreach ($configs as $config) {
            try {
                $pdo = new PDO('mysql:host=localhost', $config[0], $config[1]);
                return false; // Database is available
            } catch (PDOException $e) {
                continue; // Try next config
            }
        }
        return true; // No working database config found
    } catch (Exception $e) {
        return true; // Use mock data if any error
    }
}
?>