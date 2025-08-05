<?php

declare(strict_types=1);

namespace App\Infrastructure\Database;

use App\Infrastructure\Config\Config;
use PDO;
use PDOException;
use RuntimeException;

class DatabaseManager
{
    private Config $config;
    private ?PDO $connection = null;
    private static array $connectionPool = [];
    private static int $maxConnections = 10;
    private static int $activeConnections = 0;

    public function __construct(Config $config)
    {
        $this->config = $config;
    }

    public function connect(): PDO
    {
        if ($this->connection !== null && $this->isConnectionAlive($this->connection)) {
            return $this->connection;
        }

        // Try to get connection from pool first
        $this->connection = $this->getConnectionFromPool();
        if ($this->connection !== null) {
            return $this->connection;
        }

        try {
            $dsn = $this->buildDsn();
            $username = $this->config->get('database.username');
            $password = $this->config->get('database.password');
            $options = $this->getOptimizedOptions();

            $this->connection = new PDO($dsn, $username, $password, $options);
            
            // Configure connection for optimal performance
            $this->optimizeConnection($this->connection);
            
            self::$activeConnections++;
            
            return $this->connection;
        } catch (PDOException $e) {
            throw new RuntimeException(
                'Database connection failed: ' . $e->getMessage(),
                0,
                $e
            );
        }
    }

    private function buildDsn(): string
    {
        $connection = $this->config->get('database.connection');
        $host = $this->config->get('database.host');
        $port = $this->config->get('database.port');
        $database = $this->config->get('database.database');
        $charset = $this->config->get('database.charset');

        return match ($connection) {
            'mysql' => "mysql:host={$host};port={$port};dbname={$database};charset={$charset}",
            'pgsql' => "pgsql:host={$host};port={$port};dbname={$database}",
            'sqlite' => "sqlite:{$database}",
            default => throw new RuntimeException("Unsupported database connection: {$connection}")
        };
    }

    public function getConnection(): PDO
    {
        if ($this->connection === null) {
            $this->connect();
        }

        return $this->connection;
    }

    public function beginTransaction(): bool
    {
        return $this->getConnection()->beginTransaction();
    }

    public function commit(): bool
    {
        return $this->getConnection()->commit();
    }

    public function rollback(): bool
    {
        return $this->getConnection()->rollback();
    }

    public function inTransaction(): bool
    {
        return $this->getConnection()->inTransaction();
    }

    public function lastInsertId(?string $name = null): string
    {
        return $this->getConnection()->lastInsertId($name);
    }

    public function prepare(string $statement): \PDOStatement
    {
        return $this->getConnection()->prepare($statement);
    }

    public function query(string $statement): \PDOStatement
    {
        return $this->getConnection()->query($statement);
    }

    public function exec(string $statement): int
    {
        return $this->getConnection()->exec($statement);
    }

    public function quote(string $string, int $type = PDO::PARAM_STR): string
    {
        return $this->getConnection()->quote($string, $type);
    }

    public function disconnect(): void
    {
        if ($this->connection !== null) {
            $this->returnConnectionToPool($this->connection);
            $this->connection = null;
        }
    }

    /**
     * Get optimized PDO options for performance
     */
    private function getOptimizedOptions(): array
    {
        $baseOptions = $this->config->get('database.options', []);
        
        return array_merge($baseOptions, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_PERSISTENT => true, // Enable persistent connections
            PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET sql_mode='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'",
        ]);
    }

    /**
     * Optimize connection settings for performance
     */
    private function optimizeConnection(PDO $connection): void
    {
        // Set MySQL-specific optimizations
        if ($this->config->get('database.connection') === 'mysql') {
            $connection->exec("SET SESSION query_cache_type = ON");
            $connection->exec("SET SESSION query_cache_size = 67108864"); // 64MB
            $connection->exec("SET SESSION innodb_buffer_pool_size = 134217728"); // 128MB
            $connection->exec("SET SESSION max_connections = 100");
            $connection->exec("SET SESSION wait_timeout = 28800"); // 8 hours
            $connection->exec("SET SESSION interactive_timeout = 28800");
        }
    }

    /**
     * Check if connection is still alive
     */
    private function isConnectionAlive(PDO $connection): bool
    {
        try {
            $connection->query('SELECT 1');
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * Get connection from pool if available
     */
    private function getConnectionFromPool(): ?PDO
    {
        if (empty(self::$connectionPool)) {
            return null;
        }

        $connection = array_pop(self::$connectionPool);
        
        if ($this->isConnectionAlive($connection)) {
            return $connection;
        }

        // Connection is dead, try next one
        return $this->getConnectionFromPool();
    }

    /**
     * Return connection to pool for reuse
     */
    private function returnConnectionToPool(PDO $connection): void
    {
        if (count(self::$connectionPool) < self::$maxConnections && $this->isConnectionAlive($connection)) {
            self::$connectionPool[] = $connection;
        } else {
            self::$activeConnections--;
        }
    }

    /**
     * Get connection pool statistics
     */
    public function getPoolStats(): array
    {
        return [
            'active_connections' => self::$activeConnections,
            'pooled_connections' => count(self::$connectionPool),
            'max_connections' => self::$maxConnections,
        ];
    }

    /**
     * Clear connection pool
     */
    public static function clearPool(): void
    {
        self::$connectionPool = [];
        self::$activeConnections = 0;
    }
}