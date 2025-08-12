<?php
/**
 * Pet Weight Logs Table Migration
 * Creates the pet_weight_logs table for weight tracking
 */

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Creating pet_weight_logs table...\n";
    
    // Create pet_weight_logs table
    $sql = "
        CREATE TABLE IF NOT EXISTS pet_weight_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pet_id INT NOT NULL,
            weight DECIMAL(5,2) NOT NULL,
            body_condition_score TINYINT NULL CHECK (body_condition_score BETWEEN 1 AND 9),
            notes TEXT NULL,
            recorded_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
            INDEX idx_pet_weight_logs_pet_id (pet_id),
            INDEX idx_pet_weight_logs_date (recorded_date),
            INDEX idx_pet_weight_logs_pet_date (pet_id, recorded_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $db->exec($sql);
    echo "✓ pet_weight_logs table created successfully\n";
    
    // Insert sample weight data
    echo "\nInserting sample weight data...\n";
    
    $sampleWeights = [
        // Pet 1 (Buddy) - Golden Retriever weight progression
        [
            'pet_id' => 1,
            'weight' => 28.5,
            'body_condition_score' => 5,
            'notes' => 'Healthy weight, good muscle tone',
            'recorded_date' => '2024-01-15'
        ],
        [
            'pet_id' => 1,
            'weight' => 28.2,
            'body_condition_score' => 5,
            'notes' => 'Slight decrease after increased exercise',
            'recorded_date' => '2024-01-22'
        ],
        [
            'pet_id' => 1,
            'weight' => 28.8,
            'body_condition_score' => 5,
            'notes' => 'Back to normal weight',
            'recorded_date' => '2024-01-29'
        ],
        
        // Pet 2 (Whiskers) - Persian Cat weight tracking
        [
            'pet_id' => 2,
            'weight' => 4.2,
            'body_condition_score' => 4,
            'notes' => 'Slightly underweight, increasing food portions',
            'recorded_date' => '2024-01-10'
        ],
        [
            'pet_id' => 2,
            'weight' => 4.4,
            'body_condition_score' => 5,
            'notes' => 'Good progress, ideal weight achieved',
            'recorded_date' => '2024-01-17'
        ],
        [
            'pet_id' => 2,
            'weight' => 4.3,
            'body_condition_score' => 5,
            'notes' => 'Maintaining healthy weight',
            'recorded_date' => '2024-01-24'
        ],
        
        // Pet 3 (Charlie) - Labrador with weight management
        [
            'pet_id' => 3,
            'weight' => 32.1,
            'body_condition_score' => 6,
            'notes' => 'Slightly overweight, starting diet plan',
            'recorded_date' => '2024-01-08'
        ],
        [
            'pet_id' => 3,
            'weight' => 31.5,
            'body_condition_score' => 6,
            'notes' => 'Good progress on weight loss plan',
            'recorded_date' => '2024-01-15'
        ],
        [
            'pet_id' => 3,
            'weight' => 31.0,
            'body_condition_score' => 5,
            'notes' => 'Reached target weight, maintaining diet',
            'recorded_date' => '2024-01-22'
        ],
        
        // Pet 4 (Luna) - Maine Coon growth tracking
        [
            'pet_id' => 4,
            'weight' => 5.8,
            'body_condition_score' => 5,
            'notes' => 'Healthy young cat, good growth rate',
            'recorded_date' => '2024-01-12'
        ],
        [
            'pet_id' => 4,
            'weight' => 6.0,
            'body_condition_score' => 5,
            'notes' => 'Continued healthy growth',
            'recorded_date' => '2024-01-19'
        ],
        
        // Pet 5 (Max) - German Shepherd weight monitoring
        [
            'pet_id' => 5,
            'weight' => 35.7,
            'body_condition_score' => 5,
            'notes' => 'Ideal weight for breed and age',
            'recorded_date' => '2024-01-14'
        ],
        [
            'pet_id' => 5,
            'weight' => 35.9,
            'body_condition_score' => 5,
            'notes' => 'Slight increase, monitoring closely',
            'recorded_date' => '2024-01-21'
        ],
        
        // Pet 6 (Bella) - Bulldog weight management
        [
            'pet_id' => 6,
            'weight' => 22.8,
            'body_condition_score' => 5,
            'notes' => 'Good weight for bulldog breed',
            'recorded_date' => '2024-01-11'
        ],
        [
            'pet_id' => 6,
            'weight' => 23.1,
            'body_condition_score' => 6,
            'notes' => 'Slight weight gain, adjusting portions',
            'recorded_date' => '2024-01-18'
        ]
    ];
    
    $insertSql = "
        INSERT INTO pet_weight_logs (pet_id, weight, body_condition_score, notes, recorded_date)
        VALUES (:pet_id, :weight, :body_condition_score, :notes, :recorded_date)
    ";
    
    $stmt = $db->prepare($insertSql);
    
    foreach ($sampleWeights as $weight) {
        try {
            $stmt->execute($weight);
            echo "✓ Added weight record for pet {$weight['pet_id']}: {$weight['weight']}kg on {$weight['recorded_date']}\n";
        } catch (PDOException $e) {
            // Skip if pet doesn't exist
            if ($e->getCode() != 23000) { // Not a constraint violation
                echo "⚠ Warning: Could not add weight record: {$e->getMessage()}\n";
            }
        }
    }
    
    echo "\n✅ Pet weight logs migration completed successfully!\n";
    echo "\nTable structure:\n";
    echo "- id: Primary key\n";
    echo "- pet_id: Foreign key to pets table\n";
    echo "- weight: Pet weight in kg (decimal 5,2)\n";
    echo "- body_condition_score: BCS score 1-9 (optional)\n";
    echo "- notes: Additional notes about the weight record\n";
    echo "- recorded_date: Date when weight was recorded\n";
    echo "- created_at/updated_at: Timestamps\n";
    echo "\nIndexes created for optimal query performance.\n";
    
} catch (PDOException $e) {
    echo "❌ Error creating pet_weight_logs table: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Unexpected error: " . $e->getMessage() . "\n";
    exit(1);
}
?>"