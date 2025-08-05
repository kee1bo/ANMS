<?php
/**
 * Database Setup Script for ANMS
 * Creates the database and tables with proper structure
 */

// Database configuration
$configs = [
    ['localhost', '', ''],           // No password
    ['localhost', 'root', ''],       // Root with no password  
    ['localhost', 'root', 'root'],   // Root with root password
    ['localhost', 'root', 'password'] // Root with password
];

$db_name = 'anms_db';
$connection = null;

// Try to connect with different configurations
foreach ($configs as $config) {
    try {
        $pdo = new PDO("mysql:host={$config[0]}", $config[1], $config[2]);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Create database
        $pdo->exec("CREATE DATABASE IF NOT EXISTS $db_name");
        $pdo->exec("USE $db_name");
        
        $connection = $pdo;
        echo "✅ Connected to MySQL with user: " . ($config[1] ?: 'anonymous') . "\n";
        break;
    } catch (PDOException $e) {
        continue;
    }
}

if (!$connection) {
    die("❌ Could not connect to MySQL with any configuration\n");
}

try {
    // Create users table
    $connection->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            email_verified BOOLEAN DEFAULT FALSE,
            last_login TIMESTAMP NULL,
            status ENUM('active', 'inactive', 'suspended') DEFAULT 'active'
        )
    ");
    echo "✅ Users table created\n";

    // Create pets table
    $connection->exec("
        CREATE TABLE IF NOT EXISTS pets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            species VARCHAR(50) NOT NULL,
            breed VARCHAR(100),
            age INT,
            weight DECIMAL(5,2),
            ideal_weight DECIMAL(5,2),
            activity_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
            health_status VARCHAR(50) DEFAULT 'healthy',
            photo VARCHAR(255),
            personality TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");
    echo "✅ Pets table created\n";

    // Create health_records table
    $connection->exec("
        CREATE TABLE IF NOT EXISTS health_records (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pet_id INT NOT NULL,
            record_type ENUM('weight', 'medication', 'vet_visit', 'vaccination', 'other') NOT NULL,
            value DECIMAL(10,2),
            unit VARCHAR(20),
            notes TEXT,
            recorded_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
        )
    ");
    echo "✅ Health records table created\n";

    // Create nutrition_plans table
    $connection->exec("
        CREATE TABLE IF NOT EXISTS nutrition_plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pet_id INT NOT NULL,
            daily_calories INT,
            meals_per_day INT DEFAULT 2,
            daily_protein_grams DECIMAL(6,2),
            daily_fat_grams DECIMAL(6,2),
            special_instructions TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
        )
    ");
    echo "✅ Nutrition plans table created\n";

    // Insert sample data for testing
    $connection->exec("
        INSERT IGNORE INTO users (id, first_name, last_name, email, password_hash) VALUES 
        (1, 'Test', 'User', 'test@example.com', '" . password_hash('password', PASSWORD_DEFAULT) . "')
    ");
    echo "✅ Sample user created (test@example.com / password)\n";

    echo "\n🎉 Database setup completed successfully!\n";
    echo "You can now use the ANMS application with real database storage.\n";

} catch (PDOException $e) {
    die("❌ Error creating tables: " . $e->getMessage() . "\n");
}
?>