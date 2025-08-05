<?php

declare(strict_types=1);

namespace Tests;

use App\Bootstrap\App;
use App\Infrastructure\Database\DatabaseManager;
use PHPUnit\Framework\TestCase as BaseTestCase;
use League\Container\Container;

abstract class TestCase extends BaseTestCase
{
    protected App $app;
    protected Container $container;
    protected DatabaseManager $db;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->app = $GLOBALS['app'];
        $this->container = $this->app->getContainer();
        $this->db = $this->container->get(DatabaseManager::class);
        
        $this->setUpDatabase();
    }

    protected function tearDown(): void
    {
        $this->tearDownDatabase();
        parent::tearDown();
    }

    protected function setUpDatabase(): void
    {
        // Create tables for testing
        $this->createTestTables();
    }

    protected function tearDownDatabase(): void
    {
        // Clean up database
        if ($this->db->inTransaction()) {
            $this->db->rollback();
        }
    }

    private function createTestTables(): void
    {
        // Create basic tables needed for testing
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                role VARCHAR(50) DEFAULT 'pet_owner',
                location VARCHAR(255),
                phone VARCHAR(20),
                email_verified_at DATETIME,
                two_factor_secret VARCHAR(255),
                preferences TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                deleted_at DATETIME
            )
        ");

        $this->db->exec("
            CREATE TABLE IF NOT EXISTS pets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name VARCHAR(100) NOT NULL,
                species VARCHAR(50) NOT NULL,
                breed VARCHAR(100),
                date_of_birth DATE,
                gender VARCHAR(10) DEFAULT 'unknown',
                is_neutered BOOLEAN DEFAULT 0,
                microchip_id VARCHAR(50),
                current_weight DECIMAL(5,2),
                ideal_weight DECIMAL(5,2),
                activity_level VARCHAR(20) DEFAULT 'moderate',
                body_condition_score INTEGER,
                health_conditions TEXT,
                allergies TEXT,
                medications TEXT,
                personality_traits TEXT,
                photo_url VARCHAR(500),
                veterinarian_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                deleted_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ");
    }

    protected function createUser(array $attributes = []): array
    {
        $defaultAttributes = [
            'email' => 'test@example.com',
            'password_hash' => password_hash('password', PASSWORD_DEFAULT),
            'first_name' => 'Test',
            'last_name' => 'User',
            'role' => 'pet_owner'
        ];

        $attributes = array_merge($defaultAttributes, $attributes);
        
        $columns = implode(', ', array_keys($attributes));
        $placeholders = ':' . implode(', :', array_keys($attributes));
        
        $stmt = $this->db->prepare("INSERT INTO users ({$columns}) VALUES ({$placeholders})");
        $stmt->execute($attributes);
        
        $attributes['id'] = (int) $this->db->lastInsertId();
        return $attributes;
    }

    protected function createPet(array $attributes = []): array
    {
        if (!isset($attributes['user_id'])) {
            $user = $this->createUser();
            $attributes['user_id'] = $user['id'];
        }

        $defaultAttributes = [
            'name' => 'Test Pet',
            'species' => 'dog',
            'breed' => 'Golden Retriever',
            'current_weight' => 25.5,
            'ideal_weight' => 24.0,
            'activity_level' => 'moderate'
        ];

        $attributes = array_merge($defaultAttributes, $attributes);
        
        $columns = implode(', ', array_keys($attributes));
        $placeholders = ':' . implode(', :', array_keys($attributes));
        
        $stmt = $this->db->prepare("INSERT INTO pets ({$columns}) VALUES ({$placeholders})");
        $stmt->execute($attributes);
        
        $attributes['id'] = (int) $this->db->lastInsertId();
        return $attributes;
    }

    protected function assertDatabaseHas(string $table, array $data): void
    {
        $conditions = [];
        $values = [];
        
        foreach ($data as $column => $value) {
            $conditions[] = "{$column} = ?";
            $values[] = $value;
        }
        
        $sql = "SELECT COUNT(*) FROM {$table} WHERE " . implode(' AND ', $conditions);
        $stmt = $this->db->prepare($sql);
        $stmt->execute($values);
        
        $count = $stmt->fetchColumn();
        $this->assertGreaterThan(0, $count, "Failed asserting that table '{$table}' contains matching record.");
    }

    protected function assertDatabaseMissing(string $table, array $data): void
    {
        $conditions = [];
        $values = [];
        
        foreach ($data as $column => $value) {
            $conditions[] = "{$column} = ?";
            $values[] = $value;
        }
        
        $sql = "SELECT COUNT(*) FROM {$table} WHERE " . implode(' AND ', $conditions);
        $stmt = $this->db->prepare($sql);
        $stmt->execute($values);
        
        $count = $stmt->fetchColumn();
        $this->assertEquals(0, $count, "Failed asserting that table '{$table}' does not contain matching record.");
    }
}