<?php
/**
 * Dashboard Performance Indexes Migration
 * Adds indexes to improve dashboard query performance
 */

class DashboardPerformanceIndexes {
    
    public function up($pdo) {
        try {
            // Activities table indexes for dashboard queries
            $pdo->exec("
                CREATE INDEX IF NOT EXISTS idx_activities_user_timestamp 
                ON activities (user_id, timestamp DESC)
            ");
            
            $pdo->exec("
                CREATE INDEX IF NOT EXISTS idx_activities_pet_timestamp 
                ON activities (pet_id, timestamp DESC)
            ");
            
            $pdo->exec("
                CREATE INDEX IF NOT EXISTS idx_activities_type_timestamp 
                ON activities (type, timestamp DESC)
            ");
            
            // Pets table indexes for statistics
            $pdo->exec("
                CREATE INDEX IF NOT EXISTS idx_pets_user_created 
                ON pets (user_id, created_at DESC)
            ");
            
            $pdo->exec("
                CREATE INDEX IF NOT EXISTS idx_pets_species_user 
                ON pets (species, user_id)
            ");
            
            // Pet weight logs indexes for health metrics
            if ($this->tableExists($pdo, 'pet_weight_logs')) {
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_weight_logs_pet_date 
                    ON pet_weight_logs (pet_id, log_date DESC)
                ");
                
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date 
                    ON pet_weight_logs (user_id, log_date DESC)
                ");
            }
            
            // Pet allergies indexes
            if ($this->tableExists($pdo, 'pet_allergies')) {
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_allergies_pet_active 
                    ON pet_allergies (pet_id, is_active)
                ");
            }
            
            // Photos table indexes for recent photos
            if ($this->tableExists($pdo, 'photos')) {
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_photos_pet_uploaded 
                    ON photos (pet_id, uploaded_at DESC)
                ");
                
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_photos_user_uploaded 
                    ON photos (user_id, uploaded_at DESC)
                ");
                
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_photos_primary_pet 
                    ON photos (is_primary, pet_id)
                ");
            }
            
            // Nutrition plans indexes (if table exists)
            if ($this->tableExists($pdo, 'nutrition_plans')) {
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_nutrition_plans_pet_active 
                    ON nutrition_plans (pet_id, is_active)
                ");
                
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_nutrition_plans_user_created 
                    ON nutrition_plans (user_id, created_at DESC)
                ");
            }
            
            // Meal schedules indexes (if table exists)
            if ($this->tableExists($pdo, 'meal_schedules')) {
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_meal_schedules_pet_date 
                    ON meal_schedules (pet_id, scheduled_date)
                ");
                
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_meal_schedules_user_date 
                    ON meal_schedules (user_id, scheduled_date)
                ");
            }
            
            // Health records indexes (if table exists)
            if ($this->tableExists($pdo, 'health_records')) {
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_health_records_pet_date 
                    ON health_records (pet_id, record_date DESC)
                ");
                
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_health_records_type_pet 
                    ON health_records (record_type, pet_id)
                ");
            }
            
            // Checkup reminders indexes (if table exists)
            if ($this->tableExists($pdo, 'checkup_reminders')) {
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_checkup_reminders_pet_due 
                    ON checkup_reminders (pet_id, due_date)
                ");
                
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_checkup_reminders_user_due 
                    ON checkup_reminders (user_id, due_date)
                ");
                
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_checkup_reminders_status_due 
                    ON checkup_reminders (status, due_date)
                ");
            }
            
            // Composite indexes for common dashboard queries
            $pdo->exec("
                CREATE INDEX IF NOT EXISTS idx_pets_user_species_created 
                ON pets (user_id, species, created_at DESC)
            ");
            
            $pdo->exec("
                CREATE INDEX IF NOT EXISTS idx_activities_user_type_timestamp 
                ON activities (user_id, type, timestamp DESC)
            ");
            
            echo "Dashboard performance indexes created successfully.\n";
            
        } catch (PDOException $e) {
            throw new Exception("Failed to create dashboard performance indexes: " . $e->getMessage());
        }
    }
    
    public function down($pdo) {
        try {
            // Drop all the indexes we created
            $indexes = [
                'idx_activities_user_timestamp',
                'idx_activities_pet_timestamp',
                'idx_activities_type_timestamp',
                'idx_pets_user_created',
                'idx_pets_species_user',
                'idx_weight_logs_pet_date',
                'idx_weight_logs_user_date',
                'idx_allergies_pet_active',
                'idx_photos_pet_uploaded',
                'idx_photos_user_uploaded',
                'idx_photos_primary_pet',
                'idx_nutrition_plans_pet_active',
                'idx_nutrition_plans_user_created',
                'idx_meal_schedules_pet_date',
                'idx_meal_schedules_user_date',
                'idx_health_records_pet_date',
                'idx_health_records_type_pet',
                'idx_checkup_reminders_pet_due',
                'idx_checkup_reminders_user_due',
                'idx_checkup_reminders_status_due',
                'idx_pets_user_species_created',
                'idx_activities_user_type_timestamp'
            ];
            
            foreach ($indexes as $index) {
                try {
                    $pdo->exec("DROP INDEX IF EXISTS {$index}");
                } catch (PDOException $e) {
                    // Continue dropping other indexes even if one fails
                    echo "Warning: Could not drop index {$index}: " . $e->getMessage() . "\n";
                }
            }
            
            echo "Dashboard performance indexes dropped successfully.\n";
            
        } catch (PDOException $e) {
            throw new Exception("Failed to drop dashboard performance indexes: " . $e->getMessage());
        }
    }
    
    private function tableExists($pdo, $tableName) {
        try {
            $result = $pdo->query("SELECT 1 FROM {$tableName} LIMIT 1");
            return $result !== false;
        } catch (PDOException $e) {
            return false;
        }
    }
}

// Run migration if called directly
if (basename(__FILE__) == basename($_SERVER['SCRIPT_NAME'])) {
    require_once __DIR__ . '/../config/database.php';
    
    try {
        $migration = new DashboardPerformanceIndexes();
        $migration->up($pdo);
        echo "Migration completed successfully!\n";
    } catch (Exception $e) {
        echo "Migration failed: " . $e->getMessage() . "\n";
        exit(1);
    }
}
?>