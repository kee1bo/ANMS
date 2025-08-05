<?php

declare(strict_types=1);

/**
 * Simple Database Seeding Script for ANMS
 * This script populates the database with sample data
 */

// Database configuration from environment or defaults
$dbHost = $_ENV['DB_HOST'] ?? 'database';
$dbPort = $_ENV['DB_PORT'] ?? '3306';
$dbName = $_ENV['DB_DATABASE'] ?? 'anms_db';
$dbUser = $_ENV['DB_USERNAME'] ?? 'anms_user';
$dbPass = $_ENV['DB_PASSWORD'] ?? 'anms_password';

echo "🌱 ANMS Database Seeding\n";
echo "========================\n\n";

// Function to create database connection
function createConnection($host, $port, $user, $pass, $dbname) {
    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    return new PDO($dsn, $user, $pass, $options);
}

try {
    echo "📡 Connecting to database...\n";
    $pdo = createConnection($dbHost, $dbPort, $dbUser, $dbPass, $dbName);
    echo "✅ Connected successfully\n\n";
    
    // Check if data already exists
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $userCount = $stmt->fetch()['count'];
    
    if ($userCount > 0) {
        echo "ℹ️ Database already contains {$userCount} users. Skipping seeding.\n";
        echo "To re-seed, truncate tables first or delete existing data.\n";
        exit(0);
    }
    
    echo "🌱 Seeding database with sample data...\n\n";
    
    $pdo->beginTransaction();
    
    // Seed Users
    echo "👥 Creating sample users...\n";
    $users = [
        [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => password_hash('password123', PASSWORD_DEFAULT),
            'location' => 'New York, NY'
        ],
        [
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'password' => password_hash('password123', PASSWORD_DEFAULT),
            'location' => 'Los Angeles, CA'
        ],
        [
            'name' => 'Dr. Sarah Wilson',
            'email' => 'dr.wilson@vetclinic.com',
            'password' => password_hash('vetpass123', PASSWORD_DEFAULT),
            'location' => 'Chicago, IL'
        ]
    ];
    
    $userStmt = $pdo->prepare("
        INSERT INTO users (name, email, password, location) 
        VALUES (?, ?, ?, ?)
    ");
    
    $userIds = [];
    foreach ($users as $user) {
        $userStmt->execute([$user['name'], $user['email'], $user['password'], $user['location']]);
        $userIds[] = $pdo->lastInsertId();
        echo "  ✅ Created user: {$user['name']} (ID: {$pdo->lastInsertId()})\n";
    }
    
    // Seed Pets
    echo "\n🐾 Creating sample pets...\n";
    $pets = [
        [
            'user_id' => $userIds[0], // John Doe
            'name' => 'Buddy',
            'species' => 'Dog',
            'breed' => 'Golden Retriever',
            'age' => 3,
            'weight' => 25.5,
            'ideal_weight' => 24.0,
            'activity_level' => 'Medium',
            'health_status' => 'Healthy',
            'photo' => '🐕',
            'personality' => 'Friendly and energetic, loves to play fetch and swim'
        ],
        [
            'user_id' => $userIds[0], // John Doe
            'name' => 'Whiskers',
            'species' => 'Cat',
            'breed' => 'Persian',
            'age' => 2,
            'weight' => 4.2,
            'ideal_weight' => 4.0,
            'activity_level' => 'Low',
            'health_status' => 'Healthy',
            'photo' => '🐱',
            'personality' => 'Calm and loves to sleep, enjoys being petted'
        ],
        [
            'user_id' => $userIds[1], // Jane Smith
            'name' => 'Max',
            'species' => 'Dog',
            'breed' => 'German Shepherd',
            'age' => 5,
            'weight' => 32.0,
            'ideal_weight' => 30.0,
            'activity_level' => 'High',
            'health_status' => 'Slightly Overweight',
            'photo' => '🐕‍🦺',
            'personality' => 'Very active and intelligent, needs mental stimulation'
        ],
        [
            'user_id' => $userIds[1], // Jane Smith
            'name' => 'Luna',
            'species' => 'Cat',
            'breed' => 'Siamese',
            'age' => 1,
            'weight' => 3.8,
            'ideal_weight' => 4.2,
            'activity_level' => 'High',
            'health_status' => 'Underweight',
            'photo' => '🐈',
            'personality' => 'Playful kitten, very curious and vocal'
        ],
        [
            'user_id' => $userIds[2], // Dr. Sarah Wilson
            'name' => 'Charlie',
            'species' => 'Dog',
            'breed' => 'Labrador',
            'age' => 7,
            'weight' => 28.5,
            'ideal_weight' => 27.0,
            'activity_level' => 'Medium',
            'health_status' => 'Senior - Joint Issues',
            'photo' => '🦮',
            'personality' => 'Gentle senior dog, still loves walks but tires easily'
        ]
    ];
    
    $petStmt = $pdo->prepare("
        INSERT INTO pets (user_id, name, species, breed, age, weight, ideal_weight, 
                         activity_level, health_status, photo, personality) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $petIds = [];
    foreach ($pets as $pet) {
        $petStmt->execute([
            $pet['user_id'], $pet['name'], $pet['species'], $pet['breed'],
            $pet['age'], $pet['weight'], $pet['ideal_weight'], $pet['activity_level'],
            $pet['health_status'], $pet['photo'], $pet['personality']
        ]);
        $petIds[] = $pdo->lastInsertId();
        echo "  ✅ Created pet: {$pet['name']} ({$pet['species']}) (ID: {$pdo->lastInsertId()})\n";
    }
    
    // Seed Diet Plans
    echo "\n🍽️ Creating sample diet plans...\n";
    $dietPlans = [
        [
            'pet_id' => $petIds[0], // Buddy
            'daily_calories' => 1200,
            'meals_per_day' => 2,
            'protein_percentage' => 22.0,
            'fat_percentage' => 8.0,
            'fiber_percentage' => 4.0,
            'moisture_percentage' => 10.0
        ],
        [
            'pet_id' => $petIds[1], // Whiskers
            'daily_calories' => 250,
            'meals_per_day' => 3,
            'protein_percentage' => 32.0,
            'fat_percentage' => 12.0,
            'fiber_percentage' => 2.0,
            'moisture_percentage' => 78.0
        ],
        [
            'pet_id' => $petIds[2], // Max (overweight)
            'daily_calories' => 1400,
            'meals_per_day' => 3,
            'protein_percentage' => 25.0,
            'fat_percentage' => 6.0,
            'fiber_percentage' => 6.0,
            'moisture_percentage' => 10.0
        ],
        [
            'pet_id' => $petIds[3], // Luna (underweight)
            'daily_calories' => 300,
            'meals_per_day' => 4,
            'protein_percentage' => 35.0,
            'fat_percentage' => 15.0,
            'fiber_percentage' => 2.0,
            'moisture_percentage' => 78.0
        ],
        [
            'pet_id' => $petIds[4], // Charlie (senior)
            'daily_calories' => 1000,
            'meals_per_day' => 2,
            'protein_percentage' => 20.0,
            'fat_percentage' => 7.0,
            'fiber_percentage' => 5.0,
            'moisture_percentage' => 10.0
        ]
    ];
    
    $dietStmt = $pdo->prepare("
        INSERT INTO diet_plans (pet_id, daily_calories, meals_per_day, 
                               protein_percentage, fat_percentage, fiber_percentage, moisture_percentage) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    $dietPlanIds = [];
    foreach ($dietPlans as $index => $plan) {
        $dietStmt->execute([
            $plan['pet_id'], $plan['daily_calories'], $plan['meals_per_day'],
            $plan['protein_percentage'], $plan['fat_percentage'], 
            $plan['fiber_percentage'], $plan['moisture_percentage']
        ]);
        $dietPlanIds[] = $pdo->lastInsertId();
        echo "  ✅ Created diet plan for pet ID {$plan['pet_id']} (Diet Plan ID: {$pdo->lastInsertId()})\n";
    }
    
    // Seed Diet Plan Recommendations
    echo "\n📋 Creating sample meal recommendations...\n";
    $recommendations = [
        // Buddy's recommendations
        [
            'diet_plan_id' => $dietPlanIds[0], // Buddy's diet plan
            'time' => '08:00',
            'meal' => 'Breakfast',
            'food' => 'Premium Adult Dog Food',
            'portion' => '1.5 cups',
            'calories' => 600,
            'tips' => 'Serve at room temperature, ensure fresh water is available'
        ],
        [
            'diet_plan_id' => $dietPlanIds[0], // Buddy's diet plan
            'time' => '18:00',
            'meal' => 'Dinner',
            'food' => 'Premium Adult Dog Food',
            'portion' => '1.5 cups',
            'calories' => 600,
            'tips' => 'Add a small amount of wet food for variety'
        ],
        // Whiskers' recommendations
        [
            'diet_plan_id' => $dietPlanIds[1], // Whiskers' diet plan
            'time' => '07:00',
            'meal' => 'Breakfast',
            'food' => 'High-Protein Cat Food (Wet)',
            'portion' => '1/3 can',
            'calories' => 85,
            'tips' => 'Wet food helps with hydration'
        ],
        [
            'diet_plan_id' => $dietPlanIds[1], // Whiskers' diet plan
            'time' => '13:00',
            'meal' => 'Lunch',
            'food' => 'High-Protein Cat Food (Wet)',
            'portion' => '1/3 can',
            'calories' => 85,
            'tips' => 'Room temperature food is preferred'
        ],
        [
            'diet_plan_id' => $dietPlanIds[1], // Whiskers' diet plan
            'time' => '19:00',
            'meal' => 'Dinner',
            'food' => 'High-Protein Cat Food (Wet)',
            'portion' => '1/3 can',
            'calories' => 80,
            'tips' => 'Slightly smaller evening portion'
        ]
    ];
    
    $recStmt = $pdo->prepare("
        INSERT INTO diet_plan_recommendations (diet_plan_id, time, meal, food, portion, calories, tips) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    foreach ($recommendations as $rec) {
        $recStmt->execute([
            $rec['diet_plan_id'], $rec['time'], $rec['meal'], 
            $rec['food'], $rec['portion'], $rec['calories'], $rec['tips']
        ]);
        echo "  ✅ Created recommendation: {$rec['meal']} for diet plan {$rec['diet_plan_id']}\n";
    }
    
    $pdo->commit();
    
    echo "\n🎉 Database seeding completed successfully!\n\n";
    
    // Show summary
    echo "📊 Seeding Summary:\n";
    echo "==================\n";
    
    $tables = ['users', 'pets', 'diet_plans', 'diet_plan_recommendations'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM {$table}");
        $count = $stmt->fetch()['count'];
        echo "  {$table}: {$count} records\n";
    }
    
    echo "\n🔑 Test Login Credentials:\n";
    echo "==========================\n";
    echo "Email: john@example.com\n";
    echo "Password: password123\n";
    echo "\nEmail: jane@example.com\n";
    echo "Password: password123\n";
    echo "\nEmail: dr.wilson@vetclinic.com (Veterinarian)\n";
    echo "Password: vetpass123\n";
    
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "❌ Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n🚀 Seeding completed successfully!\n";