<?php
/**
 * Pet Management System Database Migration
 * Extends existing pets table and adds new tables for comprehensive pet management
 */

require_once __DIR__ . '/../../src/includes/db_connect.php';

function runPetManagementMigration() {
    global $pdo;
    
    try {
        $pdo->beginTransaction();
        
        echo "Starting Pet Management System database migration...\n";
        
        // 1. Extend pets table with new columns
        echo "Extending pets table with new columns...\n";
        
        // Check if columns already exist before adding them
        $existingColumns = [];
        $result = $pdo->query("PRAGMA table_info(pets)");
        while ($row = $result->fetch()) {
            $existingColumns[] = $row['name'];
        }
        
        $newColumns = [
            'gender' => "ALTER TABLE pets ADD COLUMN gender TEXT CHECK(gender IN ('male', 'female', 'unknown'))",
            'birth_date' => "ALTER TABLE pets ADD COLUMN birth_date DATE",
            'body_condition_score' => "ALTER TABLE pets ADD COLUMN body_condition_score INTEGER CHECK(body_condition_score BETWEEN 1 AND 9)",
            'spay_neuter_status' => "ALTER TABLE pets ADD COLUMN spay_neuter_status TEXT CHECK(spay_neuter_status IN ('spayed', 'neutered', 'intact', 'unknown'))",
            'microchip_id' => "ALTER TABLE pets ADD COLUMN microchip_id TEXT",
            'emergency_contact' => "ALTER TABLE pets ADD COLUMN emergency_contact TEXT"
        ];
        
        foreach ($newColumns as $columnName => $sql) {
            if (!in_array($columnName, $existingColumns)) {
                $pdo->exec($sql);
                echo "  ✓ Added column: $columnName\n";
            } else {
                echo "  - Column already exists: $columnName\n";
            }
        }
        
        // 2. Create pet_photos table
        echo "Creating pet_photos table...\n";
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS pet_photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pet_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                mime_type TEXT NOT NULL,
                is_primary BOOLEAN DEFAULT FALSE,
                upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
            )
        ");
        echo "  ✓ Created pet_photos table\n";
        
        // 3. Create pet_health_conditions table
        echo "Creating pet_health_conditions table...\n";
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS pet_health_conditions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pet_id INTEGER NOT NULL,
                condition_name TEXT NOT NULL,
                severity TEXT CHECK(severity IN ('mild', 'moderate', 'severe')),
                diagnosed_date DATE,
                notes TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
            )
        ");
        echo "  ✓ Created pet_health_conditions table\n";
        
        // 4. Create pet_allergies table
        echo "Creating pet_allergies table...\n";
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS pet_allergies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pet_id INTEGER NOT NULL,
                allergen TEXT NOT NULL,
                reaction_type TEXT,
                severity TEXT CHECK(severity IN ('mild', 'moderate', 'severe')),
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
            )
        ");
        echo "  ✓ Created pet_allergies table\n";
        
        // 5. Create pet_audit_log table
        echo "Creating pet_audit_log table...\n";
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS pet_audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pet_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                field_name TEXT,
                old_value TEXT,
                new_value TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ");
        echo "  ✓ Created pet_audit_log table\n";
        
        // 6. Create performance indexes
        echo "Creating performance indexes...\n";
        $indexes = [
            "CREATE INDEX IF NOT EXISTS idx_pets_species ON pets(species)",
            "CREATE INDEX IF NOT EXISTS idx_pets_breed ON pets(breed)",
            "CREATE INDEX IF NOT EXISTS idx_pets_activity_level ON pets(activity_level)",
            "CREATE INDEX IF NOT EXISTS idx_pet_photos_pet_id ON pet_photos(pet_id)",
            "CREATE INDEX IF NOT EXISTS idx_pet_photos_is_primary ON pet_photos(is_primary)",
            "CREATE INDEX IF NOT EXISTS idx_pet_health_conditions_pet_id ON pet_health_conditions(pet_id)",
            "CREATE INDEX IF NOT EXISTS idx_pet_health_conditions_is_active ON pet_health_conditions(is_active)",
            "CREATE INDEX IF NOT EXISTS idx_pet_allergies_pet_id ON pet_allergies(pet_id)",
            "CREATE INDEX IF NOT EXISTS idx_pet_audit_log_pet_id ON pet_audit_log(pet_id)",
            "CREATE INDEX IF NOT EXISTS idx_pet_audit_log_timestamp ON pet_audit_log(timestamp)"
        ];
        
        foreach ($indexes as $indexSql) {
            $pdo->exec($indexSql);
        }
        echo "  ✓ Created performance indexes\n";
        
        // 7. Update existing sample data with new fields
        echo "Updating sample pet data...\n";
        $pdo->exec("
            UPDATE pets 
            SET gender = 'male', 
                birth_date = date('now', '-3 years'),
                body_condition_score = 5,
                spay_neuter_status = 'neutered'
            WHERE name = 'Buddy' AND gender IS NULL
        ");
        echo "  ✓ Updated sample pet data\n";
        
        // 8. Create photo upload directory
        echo "Creating photo upload directory...\n";
        $uploadDir = __DIR__ . '/../../public/storage/pet-photos';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
            echo "  ✓ Created photo upload directory: $uploadDir\n";
        } else {
            echo "  - Photo upload directory already exists\n";
        }
        
        // Create thumbnails directory
        $thumbDir = $uploadDir . '/thumbnails';
        if (!is_dir($thumbDir)) {
            mkdir($thumbDir, 0755, true);
            echo "  ✓ Created thumbnails directory\n";
        }
        
        $pdo->commit();
        echo "\n✅ Pet Management System migration completed successfully!\n";
        
        // Display summary
        echo "\nMigration Summary:\n";
        echo "- Extended pets table with 6 new columns\n";
        echo "- Created 4 new tables (pet_photos, pet_health_conditions, pet_allergies, pet_audit_log)\n";
        echo "- Added 10 performance indexes\n";
        echo "- Created photo storage directories\n";
        echo "- Updated sample data\n";
        
        return true;
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo "\n❌ Migration failed: " . $e->getMessage() . "\n";
        return false;
    }
}

// Run migration if called directly
if (basename(__FILE__) == basename($_SERVER['SCRIPT_NAME'])) {
    echo "Pet Management System Database Migration\n";
    echo "=====================================\n\n";
    
    if (runPetManagementMigration()) {
        echo "\nMigration completed successfully! You can now use the Pet Management System.\n";
        exit(0);
    } else {
        echo "\nMigration failed. Please check the error messages above.\n";
        exit(1);
    }
}
?>