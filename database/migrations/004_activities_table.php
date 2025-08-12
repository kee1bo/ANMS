<?php
/**
 * Activities Table Migration
 * Creates the activities table for tracking user actions across the application
 */

function createActivitiesTable($pdo) {
    try {
        // Create activities table
        $sql = "CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type VARCHAR(50) NOT NULL,
            description TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            pet_id INTEGER NULL,
            metadata TEXT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
        )";
        
        $pdo->exec($sql);
        
        // Create indexes for better performance
        $indexes = [
            "CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type)",
            "CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_activities_pet_id ON activities(pet_id)",
            "CREATE INDEX IF NOT EXISTS idx_activities_user_timestamp ON activities(user_id, timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_activities_user_type ON activities(user_id, type)"
        ];
        
        foreach ($indexes as $indexSql) {
            $pdo->exec($indexSql);
        }
        
        echo "✓ Activities table created successfully\n";
        
        // Insert some sample activities for testing
        insertSampleActivities($pdo);
        
        return true;
        
    } catch (PDOException $e) {
        echo "✗ Error creating activities table: " . $e->getMessage() . "\n";
        return false;
    }
}

function insertSampleActivities($pdo) {
    try {
        // Check if we have any users and pets to create sample activities for
        $stmt = $pdo->query("SELECT id FROM users LIMIT 1");
        $user = $stmt->fetch();
        
        if (!$user) {
            echo "  No users found, skipping sample activities\n";
            return;
        }
        
        $userId = $user['id'];
        
        // Get pets for this user
        $stmt = $pdo->prepare("SELECT id, name FROM pets WHERE user_id = ? LIMIT 3");
        $stmt->execute([$userId]);
        $pets = $stmt->fetchAll();
        
        $sampleActivities = [];
        
        if (!empty($pets)) {
            foreach ($pets as $pet) {
                $sampleActivities[] = [
                    'user_id' => $userId,
                    'type' => 'pet_added',
                    'description' => "Added new pet: {$pet['name']}",
                    'timestamp' => date('Y-m-d H:i:s', strtotime('-' . rand(1, 30) . ' days')),
                    'pet_id' => $pet['id'],
                    'metadata' => json_encode(['pet_name' => $pet['name'], 'pet_id' => $pet['id']])
                ];
                
                $sampleActivities[] = [
                    'user_id' => $userId,
                    'type' => 'weight_logged',
                    'description' => "Logged weight for {$pet['name']}: " . (rand(20, 80) / 10) . "kg",
                    'timestamp' => date('Y-m-d H:i:s', strtotime('-' . rand(1, 7) . ' days')),
                    'pet_id' => $pet['id'],
                    'metadata' => json_encode(['pet_name' => $pet['name'], 'weight' => rand(20, 80) / 10])
                ];
                
                $sampleActivities[] = [
                    'user_id' => $userId,
                    'type' => 'nutrition_calculated',
                    'description' => "Calculated nutrition plan for {$pet['name']}",
                    'timestamp' => date('Y-m-d H:i:s', strtotime('-' . rand(1, 14) . ' days')),
                    'pet_id' => $pet['id'],
                    'metadata' => json_encode(['pet_name' => $pet['name'], 'calories' => rand(800, 2000)])
                ];
            }
        }
        
        // Add some general activities
        $generalActivities = [
            [
                'user_id' => $userId,
                'type' => 'profile_updated',
                'description' => 'Updated profile information',
                'timestamp' => date('Y-m-d H:i:s', strtotime('-' . rand(1, 5) . ' days')),
                'pet_id' => null,
                'metadata' => json_encode(['section' => 'personal_info'])
            ],
            [
                'user_id' => $userId,
                'type' => 'report_generated',
                'description' => 'Generated health report',
                'timestamp' => date('Y-m-d H:i:s', strtotime('-' . rand(1, 3) . ' days')),
                'pet_id' => null,
                'metadata' => json_encode(['report_type' => 'health_summary'])
            ]
        ];
        
        $sampleActivities = array_merge($sampleActivities, $generalActivities);
        
        // Insert sample activities
        $sql = "INSERT INTO activities (user_id, type, description, timestamp, pet_id, metadata) 
                VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        
        $inserted = 0;
        foreach ($sampleActivities as $activity) {
            try {
                $stmt->execute([
                    $activity['user_id'],
                    $activity['type'],
                    $activity['description'],
                    $activity['timestamp'],
                    $activity['pet_id'],
                    $activity['metadata']
                ]);
                $inserted++;
            } catch (PDOException $e) {
                // Skip duplicates or errors
                continue;
            }
        }
        
        echo "  Inserted {$inserted} sample activities\n";
        
    } catch (PDOException $e) {
        echo "  Warning: Could not insert sample activities: " . $e->getMessage() . "\n";
    }
}

// Run migration if called directly
if (basename(__FILE__) == basename($_SERVER['SCRIPT_NAME'])) {
    require_once __DIR__ . '/../../src/includes/db_connect.php';
    
    if (isset($pdo)) {
        echo "Running activities table migration...\n";
        createActivitiesTable($pdo);
        echo "Migration completed.\n";
    } else {
        echo "Database connection not available.\n";
    }
}
?>