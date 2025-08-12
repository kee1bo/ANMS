<?php
/**
 * Pet Allergies Table Migration
 * Creates the pet_allergies table for comprehensive allergy tracking
 */

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo \"Creating pet_allergies table...\\n\";
    
    // Create pet_allergies table
    $sql = \"
        CREATE TABLE IF NOT EXISTS pet_allergies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pet_id INT NOT NULL,
            category ENUM('food', 'environmental', 'medication', 'other') NOT NULL,
            allergen VARCHAR(255) NOT NULL,
            severity ENUM('mild', 'moderate', 'severe') NOT NULL,
            reaction_type ENUM('skin', 'digestive', 'respiratory', 'behavioral', 'systemic', 'other') NULL,
            symptoms TEXT NULL,
            treatment TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
            INDEX idx_pet_allergies_pet_id (pet_id),
            INDEX idx_pet_allergies_category (category),
            INDEX idx_pet_allergies_severity (severity),
            UNIQUE KEY unique_pet_allergen (pet_id, category, allergen)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    \";
    
    $db->exec($sql);
    echo \"✓ pet_allergies table created successfully\\n\";
    
    // Insert sample allergy data
    echo \"\\nInserting sample allergy data...\\n\";
    
    $sampleAllergies = [
        // Pet 1 (Buddy) - Golden Retriever
        [
            'pet_id' => 1,
            'category' => 'food',
            'allergen' => 'Chicken',
            'severity' => 'moderate',
            'reaction_type' => 'digestive',
            'symptoms' => 'Vomiting and diarrhea within 2-4 hours of eating chicken-based foods',
            'treatment' => 'Avoid all chicken products, use lamb or fish-based foods instead'
        ],
        [
            'pet_id' => 1,
            'category' => 'environmental',
            'allergen' => 'Grass Pollen',
            'severity' => 'mild',
            'reaction_type' => 'skin',
            'symptoms' => 'Mild itching and red patches on belly during spring season',
            'treatment' => 'Antihistamines during high pollen days, regular baths'
        ],
        
        // Pet 2 (Whiskers) - Persian Cat
        [
            'pet_id' => 2,
            'category' => 'food',
            'allergen' => 'Dairy Products',
            'severity' => 'severe',
            'reaction_type' => 'digestive',
            'symptoms' => 'Severe vomiting, diarrhea, lethargy, and dehydration',
            'treatment' => 'Strict dairy-free diet, immediate vet attention if consumed'
        ],
        [
            'pet_id' => 2,
            'category' => 'medication',
            'allergen' => 'Penicillin',
            'severity' => 'severe',
            'reaction_type' => 'systemic',
            'symptoms' => 'Difficulty breathing, facial swelling, hives all over body',
            'treatment' => 'Avoid all penicillin-based antibiotics, use alternative antibiotics only'
        ],
        
        // Pet 3 (Charlie) - Labrador Retriever with chronic condition
        [
            'pet_id' => 3,
            'category' => 'environmental',
            'allergen' => 'Dust Mites',
            'severity' => 'moderate',
            'reaction_type' => 'respiratory',
            'symptoms' => 'Coughing, wheezing, especially worse at night',
            'treatment' => 'Regular cleaning, air purifier, hypoallergenic bedding'
        ],
        [
            'pet_id' => 3,
            'category' => 'food',
            'allergen' => 'Beef',
            'severity' => 'mild',
            'reaction_type' => 'skin',
            'symptoms' => 'Mild skin irritation and scratching after beef meals',
            'treatment' => 'Switch to poultry or fish-based diet'
        ],
        
        // Pet 4 (Luna) - Maine Coon
        [
            'pet_id' => 4,
            'category' => 'environmental',
            'allergen' => 'Cigarette Smoke',
            'severity' => 'moderate',
            'reaction_type' => 'respiratory',
            'symptoms' => 'Sneezing, watery eyes, coughing when exposed to smoke',
            'treatment' => 'Keep away from smoking areas, ensure good ventilation'
        ],
        
        // Pet 5 (Max) - German Shepherd
        [
            'pet_id' => 5,
            'category' => 'food',
            'allergen' => 'Wheat',
            'severity' => 'moderate',
            'reaction_type' => 'digestive',
            'symptoms' => 'Loose stools, gas, occasional vomiting with wheat-containing foods',
            'treatment' => 'Grain-free diet, avoid wheat-based treats and foods'
        ],
        [
            'pet_id' => 5,
            'category' => 'medication',
            'allergen' => 'Flea Shampoo',
            'severity' => 'mild',
            'reaction_type' => 'skin',
            'symptoms' => 'Red, irritated skin where shampoo was applied',
            'treatment' => 'Use hypoallergenic flea treatments, oral medications preferred'
        ],
        
        // Pet 6 (Bella) - Bulldog
        [
            'pet_id' => 6,
            'category' => 'environmental',
            'allergen' => 'Mold',
            'severity' => 'mild',
            'reaction_type' => 'respiratory',
            'symptoms' => 'Occasional sneezing and nasal discharge in damp conditions',
            'treatment' => 'Keep environment dry, use dehumidifier, regular cleaning'
        ]
    ];
    
    $insertSql = \"
        INSERT INTO pet_allergies (pet_id, category, allergen, severity, reaction_type, symptoms, treatment)
        VALUES (:pet_id, :category, :allergen, :severity, :reaction_type, :symptoms, :treatment)
    \";
    
    $stmt = $db->prepare($insertSql);
    
    foreach ($sampleAllergies as $allergy) {
        try {
            $stmt->execute($allergy);
            echo \"✓ Added {$allergy['allergen']} allergy for pet {$allergy['pet_id']}\\n\";
        } catch (PDOException $e) {
            // Skip if pet doesn't exist or duplicate entry
            if ($e->getCode() != 23000) { // Not a constraint violation
                echo \"⚠ Warning: Could not add {$allergy['allergen']} allergy: {$e->getMessage()}\\n\";
            }
        }
    }
    
    echo \"\\n✅ Pet allergies migration completed successfully!\\n\";
    echo \"\\nTable structure:\\n\";
    echo \"- id: Primary key\\n\";
    echo \"- pet_id: Foreign key to pets table\\n\";
    echo \"- category: food, environmental, medication, other\\n\";
    echo \"- allergen: Name of the allergen\\n\";
    echo \"- severity: mild, moderate, severe\\n\";
    echo \"- reaction_type: skin, digestive, respiratory, behavioral, systemic, other\\n\";
    echo \"- symptoms: Detailed description of symptoms\\n\";
    echo \"- treatment: Treatment and management notes\\n\";
    echo \"- created_at/updated_at: Timestamps\\n\";
    echo \"\\nIndexes created for optimal query performance.\\n\";
    
} catch (PDOException $e) {
    echo \"❌ Error creating pet_allergies table: \" . $e->getMessage() . \"\\n\";
    exit(1);
} catch (Exception $e) {
    echo \"❌ Unexpected error: \" . $e->getMessage() . \"\\n\";
    exit(1);
}
?>"