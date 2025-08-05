<?php
/**
 * SQLite Database Setup for ANMS
 * Creates SQLite database with proper schema
 */

// Database file path
$dbPath = __DIR__ . '/../../data/anms.db';
$dataDir = dirname($dbPath);

// Ensure data directory exists
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

try {
    // Create SQLite connection
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Enable foreign keys
    $pdo->exec("PRAGMA foreign_keys = ON");
    
    // Create users table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended'))
        )
    ");
    
    // Create pets table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS pets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            species TEXT NOT NULL,
            breed TEXT,
            age INTEGER,
            weight REAL,
            ideal_weight REAL,
            activity_level TEXT DEFAULT 'medium' CHECK(activity_level IN ('low', 'medium', 'high')),
            health_status TEXT DEFAULT 'healthy',
            photo TEXT,
            personality TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");
    
    // Create health_records table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS health_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pet_id INTEGER NOT NULL,
            record_type TEXT NOT NULL CHECK(record_type IN ('weight', 'medication', 'vet_visit', 'vaccination', 'other')),
            value REAL,
            unit TEXT,
            notes TEXT,
            recorded_date DATE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
        )
    ");
    
    // Create nutrition_plans table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS nutrition_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pet_id INTEGER NOT NULL,
            daily_calories INTEGER,
            meals_per_day INTEGER DEFAULT 2,
            daily_protein_grams REAL,
            daily_fat_grams REAL,
            special_instructions TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
        )
    ");
    
    // Create indexes for better performance
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_health_records_pet_id ON health_records(pet_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_nutrition_plans_pet_id ON nutrition_plans(pet_id)");
    
    // Insert sample user if not exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
    $stmt->execute(['test@example.com']);
    
    if ($stmt->fetchColumn() == 0) {
        $stmt = $pdo->prepare("
            INSERT INTO users (first_name, last_name, email, password_hash) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            'Test',
            'User', 
            'test@example.com',
            password_hash('password', PASSWORD_DEFAULT)
        ]);
        
        // Add sample pet for test user
        $userId = $pdo->lastInsertId();
        $stmt = $pdo->prepare("
            INSERT INTO pets (user_id, name, species, breed, age, weight, ideal_weight, activity_level, health_status, photo, personality) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $userId,
            'Buddy',
            'Dog',
            'Golden Retriever',
            3,
            25.5,
            24.0,
            'medium',
            'healthy',
            '🐕',
            'Friendly and energetic'
        ]);
    }
    
    // Close the connection to prevent locking
    $pdo = null;
    
} catch (PDOException $e) {
    die("SQLite setup failed: " . $e->getMessage());
}
?>