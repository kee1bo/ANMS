<?php

declare(strict_types=1);

/**
 * Simple Database Migration Script for ANMS
 * This script creates the database schema without external dependencies
 */

// Database configuration from environment or defaults
$dbHost = $_ENV['DB_HOST'] ?? 'database';
$dbPort = $_ENV['DB_PORT'] ?? '3306';
$dbName = $_ENV['DB_DATABASE'] ?? 'anms_db';
$dbUser = $_ENV['DB_USERNAME'] ?? 'anms_user';
$dbPass = $_ENV['DB_PASSWORD'] ?? 'anms_password';

echo "🗄️ ANMS Database Migration\n";
echo "==========================\n\n";

// Function to create database connection
function createConnection($host, $port, $user, $pass, $dbname = null) {
    $dsn = "mysql:host={$host};port={$port}";
    if ($dbname) {
        $dsn .= ";dbname={$dbname}";
    }
    $dsn .= ";charset=utf8mb4";
    
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    return new PDO($dsn, $user, $pass, $options);
}

try {
    echo "📡 Connecting to database server...\n";
    
    // First connect without database to create it if needed
    $pdo = createConnection($dbHost, $dbPort, $dbUser, $dbPass);
    
    // Create database if it doesn't exist
    echo "🏗️ Creating database if not exists...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✅ Database '{$dbName}' ready\n\n";
    
    // Connect to the specific database
    $pdo = createConnection($dbHost, $dbPort, $dbUser, $dbPass, $dbName);
    
    // Check if schema.sql exists
    $schemaFile = __DIR__ . '/schema.sql';
    if (!file_exists($schemaFile)) {
        throw new Exception("Schema file not found: {$schemaFile}");
    }
    
    echo "📋 Reading schema file...\n";
    $schema = file_get_contents($schemaFile);
    
    if ($schema === false) {
        throw new Exception("Could not read schema file");
    }
    
    // Clean the schema by removing comments and empty lines
    $lines = explode("\n", $schema);
    $cleanedLines = [];
    
    foreach ($lines as $line) {
        $line = trim($line);
        // Skip empty lines and comment lines
        if (empty($line) || str_starts_with($line, '--') || str_starts_with($line, '/*')) {
            continue;
        }
        $cleanedLines[] = $line;
    }
    
    $cleanedSchema = implode("\n", $cleanedLines);
    
    // Split the schema into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $cleanedSchema)),
        function($stmt) {
            $stmt = trim($stmt);
            return !empty($stmt) && strlen($stmt) > 10; // Ignore very short statements
        }
    );
    
    echo "📝 Found " . count($statements) . " SQL statements to execute\n";
    
    echo "🔧 Executing schema statements...\n";
    
    foreach ($statements as $index => $statement) {
        if (empty(trim($statement))) {
            continue;
        }
        
        echo "  🔍 Executing: " . substr(trim($statement), 0, 50) . "...\n";
        
        try {
            $pdo->exec($statement);
            echo "  ✅ Statement " . ($index + 1) . " executed successfully\n";
        } catch (PDOException $e) {
            // Check if it's a "table already exists" error, which is okay
            if (strpos($e->getMessage(), 'already exists') !== false) {
                echo "  ⚠️ Statement " . ($index + 1) . " skipped (already exists)\n";
            } else {
                echo "  ❌ Statement " . ($index + 1) . " failed: " . $e->getMessage() . "\n";
                echo "  Statement: " . substr($statement, 0, 200) . "...\n";
                throw $e;
            }
        }
    }
    
    echo "\n🎉 Database migration completed successfully!\n";
    
    // Verify tables were created
    echo "\n📊 Verifying database structure...\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($tables)) {
        echo "⚠️ Warning: No tables found in database\n";
    } else {
        echo "✅ Found " . count($tables) . " tables:\n";
        foreach ($tables as $table) {
            echo "  - {$table}\n";
        }
    }
    
    // Test a simple query
    echo "\n🧪 Testing database connectivity...\n";
    $stmt = $pdo->query("SELECT COUNT(*) as user_count FROM users");
    $result = $stmt->fetch();
    echo "✅ Database test successful - Users table has {$result['user_count']} records\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
    echo "Connection details:\n";
    echo "  Host: {$dbHost}:{$dbPort}\n";
    echo "  Database: {$dbName}\n";
    echo "  Username: {$dbUser}\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n🚀 Migration completed successfully!\n";