<?php

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap/app.php';

use App\Infrastructure\Database\DatabaseManager;
use Database\Migration;

class MigrationRunner
{
    private DatabaseManager $db;
    private string $migrationsPath;

    public function __construct(DatabaseManager $db, string $migrationsPath)
    {
        $this->db = $db;
        $this->migrationsPath = $migrationsPath;
        $this->createMigrationsTable();
    }

    private function createMigrationsTable(): void
    {
        $sql = "
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                migration VARCHAR(255) NOT NULL,
                batch INT NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ";
        $this->db->exec($sql);
    }

    public function run(): void
    {
        $migrations = $this->getPendingMigrations();
        
        if (empty($migrations)) {
            echo "No pending migrations.\n";
            return;
        }

        $batch = $this->getNextBatchNumber();

        foreach ($migrations as $migration) {
            echo "Running migration: {$migration}\n";
            
            try {
                $this->runMigration($migration);
                $this->recordMigration($migration, $batch);
                echo "Migration {$migration} completed successfully.\n";
            } catch (Exception $e) {
                echo "Migration {$migration} failed: " . $e->getMessage() . "\n";
                break;
            }
        }
    }

    private function getPendingMigrations(): array
    {
        $allMigrations = $this->getAllMigrationFiles();
        $executedMigrations = $this->getExecutedMigrations();
        
        return array_diff($allMigrations, $executedMigrations);
    }

    private function getAllMigrationFiles(): array
    {
        $files = glob($this->migrationsPath . '/*.php');
        $migrations = [];
        
        foreach ($files as $file) {
            $migrations[] = basename($file, '.php');
        }
        
        sort($migrations);
        return $migrations;
    }

    private function getExecutedMigrations(): array
    {
        $stmt = $this->db->query("SELECT migration FROM migrations ORDER BY id");
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    private function getNextBatchNumber(): int
    {
        $stmt = $this->db->query("SELECT MAX(batch) as max_batch FROM migrations");
        $result = $stmt->fetch();
        return ($result['max_batch'] ?? 0) + 1;
    }

    private function runMigration(string $migration): void
    {
        $migrationFile = $this->migrationsPath . '/' . $migration . '.php';
        
        if (!file_exists($migrationFile)) {
            throw new Exception("Migration file not found: {$migrationFile}");
        }

        require_once $migrationFile;
        
        $className = $this->getMigrationClassName($migration);
        
        if (!class_exists($className)) {
            throw new Exception("Migration class not found: {$className}");
        }

        $migrationInstance = new $className($this->db);
        
        if (!$migrationInstance instanceof Migration) {
            throw new Exception("Migration class must extend Database\\Migration");
        }

        $migrationInstance->up();
    }

    private function getMigrationClassName(string $migration): string
    {
        // Convert migration filename to class name
        // e.g., "2024_01_01_000000_create_users_table" -> "CreateUsersTable"
        $parts = explode('_', $migration);
        $classParts = array_slice($parts, 4); // Skip timestamp parts
        
        return implode('', array_map('ucfirst', $classParts));
    }

    private function recordMigration(string $migration, int $batch): void
    {
        $stmt = $this->db->prepare("INSERT INTO migrations (migration, batch) VALUES (?, ?)");
        $stmt->execute([$migration, $batch]);
    }
}

// Run migrations
try {
    $app = require __DIR__ . '/../bootstrap/app.php';
    $db = $app->getContainer()->get(DatabaseManager::class);
    $migrationsPath = __DIR__ . '/migrations';
    
    $runner = new MigrationRunner($db, $migrationsPath);
    $runner->run();
    
    echo "Migration process completed.\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}