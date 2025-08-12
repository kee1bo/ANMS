<?php
/**
 * Pet Management System Database Seeder
 * Creates sample pet data for testing and development
 */

require_once __DIR__ . '/../../src/includes/db_connect.php';

function seedPetManagementData() {
    global $pdo;
    
    try {
        $pdo->beginTransaction();
        
        echo "Starting Pet Management System data seeding...\n";
        
        // Get the test user ID
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute(['test@example.com']);
        $testUserId = $stmt->fetchColumn();
        
        if (!$testUserId) {
            echo "❌ Test user not found. Please run the main database setup first.\n";
            return false;
        }
        
        // Sample pets data
        $samplePets = [
            [
                'name' => 'Luna',
                'species' => 'cat',
                'breed' => 'Persian',
                'gender' => 'female',
                'birth_date' => date('Y-m-d', strtotime('-2 years')),
                'weight' => 4.2,
                'ideal_weight' => 4.0,
                'activity_level' => 'low',
                'body_condition_score' => 6,
                'health_status' => 'healthy',
                'spay_neuter_status' => 'spayed',
                'personality' => 'Calm and affectionate, loves to sleep in sunny spots'
            ],
            [
                'name' => 'Max',
                'species' => 'dog',
                'breed' => 'Labrador Retriever',
                'gender' => 'male',
                'birth_date' => date('Y-m-d', strtotime('-5 years')),
                'weight' => 32.0,
                'ideal_weight' => 30.0,
                'activity_level' => 'high',
                'body_condition_score' => 7,
                'health_status' => 'healthy',
                'spay_neuter_status' => 'neutered',
                'personality' => 'Very energetic, loves fetch and swimming'
            ]
        ];
        
        // Insert sample pets
        echo "Inserting sample pets...\n";
        $petIds = [];
        
        foreach ($samplePets as $pet) {
            // Check if pet already exists
            $stmt = $pdo->prepare("SELECT id FROM pets WHERE user_id = ? AND name = ?");
            $stmt->execute([$testUserId, $pet['name']]);
            
            if ($stmt->fetchColumn()) {
                echo "  - Pet '{$pet['name']}' already exists, skipping\n";
                continue;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO pets (
                    user_id, name, species, breed, gender, birth_date, weight, ideal_weight,
                    activity_level, body_condition_score, health_status, spay_neuter_status,
                    personality, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ");
            
            $stmt->execute([
                $testUserId,
                $pet['name'],
                $pet['species'],
                $pet['breed'],
                $pet['gender'],
                $pet['birth_date'],
                $pet['weight'],
                $pet['ideal_weight'],
                $pet['activity_level'],
                $pet['body_condition_score'],
                $pet['health_status'],
                $pet['spay_neuter_status'],
                $pet['personality']
            ]);
            
            $petId = $pdo->lastInsertId();
            $petIds[$pet['name']] = $petId;
            echo "  ✓ Created pet: {$pet['name']} (ID: $petId)\n";
        }
        
        $pdo->commit();
        echo "\n✅ Pet Management System data seeding completed successfully!\n";
        
        return true;
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo "\n❌ Seeding failed: " . $e->getMessage() . "\n";
        return false;
    }
}

// Run seeding if called directly
if (basename(__FILE__) == basename($_SERVER['SCRIPT_NAME'])) {
    echo "Pet Management System Database Seeder\n";
    echo "===================================\n\n";
    
    if (seedPetManagementData()) {
        echo "\nSeeding completed successfully!\n";
        exit(0);
    } else {
        echo "\nSeeding failed. Please check the error messages above.\n";
        exit(1);
    }
}
?>