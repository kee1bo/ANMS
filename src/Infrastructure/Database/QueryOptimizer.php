<?php

declare(strict_types=1);

namespace App\Infrastructure\Database;

use PDO;
use PDOStatement;

class QueryOptimizer
{
    private DatabaseManager $db;
    private array $queryLog = [];
    private array $slowQueries = [];
    private float $slowQueryThreshold = 1.0; // 1 second

    public function __construct(DatabaseManager $db)
    {
        $this->db = $db;
    }

    /**
     * Execute query with performance monitoring
     */
    public function executeQuery(string $sql, array $params = []): PDOStatement
    {
        $startTime = microtime(true);
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        $executionTime = microtime(true) - $startTime;
        
        // Log query performance
        $this->logQuery($sql, $params, $executionTime);
        
        // Check if query is slow
        if ($executionTime > $this->slowQueryThreshold) {
            $this->logSlowQuery($sql, $params, $executionTime);
        }
        
        return $stmt;
    }

    /**
     * Analyze query performance using EXPLAIN
     */
    public function analyzeQuery(string $sql, array $params = []): array
    {
        // Replace parameters in SQL for EXPLAIN
        $explainSql = $this->replaceParameters($sql, $params);
        
        try {
            $stmt = $this->db->prepare("EXPLAIN " . $explainSql);
            $stmt->execute();
            
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'query' => $sql,
                'explain' => $results,
                'analysis' => $this->analyzeExplainResults($results),
                'suggestions' => $this->generateOptimizationSuggestions($results, $sql)
            ];
        } catch (\Exception $e) {
            return [
                'query' => $sql,
                'error' => $e->getMessage(),
                'suggestions' => ['Unable to analyze query due to error']
            ];
        }
    }

    /**
     * Get missing indexes based on query analysis
     */
    public function suggestIndexes(): array
    {
        $suggestions = [];
        
        foreach ($this->slowQueries as $query) {
            $analysis = $this->analyzeQuery($query['sql'], $query['params']);
            
            if (isset($analysis['suggestions'])) {
                foreach ($analysis['suggestions'] as $suggestion) {
                    if (strpos($suggestion, 'INDEX') !== false) {
                        $suggestions[] = [
                            'query' => $query['sql'],
                            'execution_time' => $query['execution_time'],
                            'suggestion' => $suggestion
                        ];
                    }
                }
            }
        }
        
        return $suggestions;
    }

    /**
     * Create optimized indexes for common queries
     */
    public function createOptimizedIndexes(): array
    {
        $indexes = [
            // Pet-related indexes
            "CREATE INDEX IF NOT EXISTS idx_pets_user_species ON pets(user_id, species)",
            "CREATE INDEX IF NOT EXISTS idx_pets_weight_activity ON pets(current_weight, activity_level)",
            "CREATE INDEX IF NOT EXISTS idx_pets_health_conditions ON pets((JSON_LENGTH(health_conditions)))",
            
            // Health records indexes
            "CREATE INDEX IF NOT EXISTS idx_health_records_pet_type_date ON health_records(pet_id, record_type, recorded_date DESC)",
            "CREATE INDEX IF NOT EXISTS idx_health_records_numeric_value ON health_records(record_type, numeric_value) WHERE numeric_value IS NOT NULL",
            "CREATE INDEX IF NOT EXISTS idx_health_records_date_range ON health_records(recorded_date, pet_id)",
            
            // User indexes
            "CREATE INDEX IF NOT EXISTS idx_users_role_created ON users(role, created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified_at) WHERE email_verified_at IS NOT NULL",
            
            // Nutrition plans indexes (if table exists)
            "CREATE INDEX IF NOT EXISTS idx_nutrition_plans_pet_created ON nutrition_plans(pet_id, created_at DESC)",
            
            // Food items indexes (if table exists)
            "CREATE INDEX IF NOT EXISTS idx_food_items_category_name ON food_items(category, name)",
            "CREATE INDEX IF NOT EXISTS idx_food_items_species ON food_items(suitable_for_species)",
        ];
        
        $results = [];
        
        foreach ($indexes as $indexSql) {
            try {
                $this->db->exec($indexSql);
                $results[] = ['sql' => $indexSql, 'status' => 'success'];
            } catch (\Exception $e) {
                $results[] = ['sql' => $indexSql, 'status' => 'error', 'message' => $e->getMessage()];
            }
        }
        
        return $results;
    }

    /**
     * Optimize table structure and settings
     */
    public function optimizeTables(): array
    {
        $tables = ['users', 'pets', 'health_records', 'nutrition_plans', 'food_items'];
        $results = [];
        
        foreach ($tables as $table) {
            try {
                // Analyze table
                $this->db->exec("ANALYZE TABLE {$table}");
                
                // Optimize table
                $this->db->exec("OPTIMIZE TABLE {$table}");
                
                // Update table statistics
                $stmt = $this->db->query("SHOW TABLE STATUS LIKE '{$table}'");
                $status = $stmt->fetch(PDO::FETCH_ASSOC);
                
                $results[$table] = [
                    'status' => 'optimized',
                    'rows' => $status['Rows'] ?? 0,
                    'data_length' => $status['Data_length'] ?? 0,
                    'index_length' => $status['Index_length'] ?? 0,
                    'data_free' => $status['Data_free'] ?? 0
                ];
            } catch (\Exception $e) {
                $results[$table] = [
                    'status' => 'error',
                    'message' => $e->getMessage()
                ];
            }
        }
        
        return $results;
    }

    /**
     * Get query performance statistics
     */
    public function getQueryStats(): array
    {
        $totalQueries = count($this->queryLog);
        $slowQueriesCount = count($this->slowQueries);
        
        if ($totalQueries === 0) {
            return [
                'total_queries' => 0,
                'slow_queries' => 0,
                'average_time' => 0,
                'slowest_query' => null
            ];
        }
        
        $totalTime = array_sum(array_column($this->queryLog, 'execution_time'));
        $averageTime = $totalTime / $totalQueries;
        
        $slowestQuery = null;
        if (!empty($this->slowQueries)) {
            $slowestQuery = array_reduce($this->slowQueries, function ($carry, $query) {
                return ($carry === null || $query['execution_time'] > $carry['execution_time']) ? $query : $carry;
            });
        }
        
        return [
            'total_queries' => $totalQueries,
            'slow_queries' => $slowQueriesCount,
            'average_time' => round($averageTime, 4),
            'total_time' => round($totalTime, 4),
            'slowest_query' => $slowestQuery,
            'slow_query_threshold' => $this->slowQueryThreshold
        ];
    }

    /**
     * Log query execution
     */
    private function logQuery(string $sql, array $params, float $executionTime): void
    {
        $this->queryLog[] = [
            'sql' => $sql,
            'params' => $params,
            'execution_time' => $executionTime,
            'timestamp' => time()
        ];
        
        // Keep only last 1000 queries to prevent memory issues
        if (count($this->queryLog) > 1000) {
            array_shift($this->queryLog);
        }
    }

    /**
     * Log slow query
     */
    private function logSlowQuery(string $sql, array $params, float $executionTime): void
    {
        $this->slowQueries[] = [
            'sql' => $sql,
            'params' => $params,
            'execution_time' => $executionTime,
            'timestamp' => time()
        ];
        
        // Keep only last 100 slow queries
        if (count($this->slowQueries) > 100) {
            array_shift($this->slowQueries);
        }
    }

    /**
     * Replace parameters in SQL for EXPLAIN
     */
    private function replaceParameters(string $sql, array $params): string
    {
        $offset = 0;
        foreach ($params as $param) {
            $pos = strpos($sql, '?', $offset);
            if ($pos !== false) {
                $value = is_string($param) ? "'{$param}'" : $param;
                $sql = substr_replace($sql, $value, $pos, 1);
                $offset = $pos + strlen($value);
            }
        }
        
        return $sql;
    }

    /**
     * Analyze EXPLAIN results
     */
    private function analyzeExplainResults(array $results): array
    {
        $analysis = [];
        
        foreach ($results as $row) {
            $issues = [];
            
            // Check for table scans
            if ($row['type'] === 'ALL') {
                $issues[] = 'Full table scan detected';
            }
            
            // Check for large row examinations
            if (isset($row['rows']) && $row['rows'] > 1000) {
                $issues[] = "Large number of rows examined: {$row['rows']}";
            }
            
            // Check for filesort
            if (isset($row['Extra']) && strpos($row['Extra'], 'Using filesort') !== false) {
                $issues[] = 'Using filesort - consider adding index';
            }
            
            // Check for temporary table
            if (isset($row['Extra']) && strpos($row['Extra'], 'Using temporary') !== false) {
                $issues[] = 'Using temporary table - consider optimization';
            }
            
            $analysis[] = [
                'table' => $row['table'],
                'type' => $row['type'],
                'key' => $row['key'] ?? null,
                'rows' => $row['rows'] ?? null,
                'issues' => $issues
            ];
        }
        
        return $analysis;
    }

    /**
     * Generate optimization suggestions
     */
    private function generateOptimizationSuggestions(array $explainResults, string $sql): array
    {
        $suggestions = [];
        
        foreach ($explainResults as $row) {
            $table = $row['table'];
            
            // Suggest index for full table scans
            if ($row['type'] === 'ALL') {
                $suggestions[] = "Consider adding an index to table '{$table}' for better performance";
            }
            
            // Suggest composite index for WHERE clauses
            if (preg_match('/WHERE\s+(\w+)\s*=.*AND\s+(\w+)\s*=/', $sql, $matches)) {
                $col1 = $matches[1];
                $col2 = $matches[2];
                $suggestions[] = "Consider creating composite index: CREATE INDEX idx_{$table}_{$col1}_{$col2} ON {$table}({$col1}, {$col2})";
            }
            
            // Suggest index for ORDER BY
            if (preg_match('/ORDER\s+BY\s+(\w+)/', $sql, $matches)) {
                $column = $matches[1];
                $suggestions[] = "Consider creating index for ORDER BY: CREATE INDEX idx_{$table}_{$column} ON {$table}({$column})";
            }
            
            // Suggest covering index for SELECT columns
            if (isset($row['Extra']) && strpos($row['Extra'], 'Using index') === false) {
                $suggestions[] = "Consider creating covering index to avoid table lookups";
            }
        }
        
        return array_unique($suggestions);
    }

    /**
     * Set slow query threshold
     */
    public function setSlowQueryThreshold(float $threshold): void
    {
        $this->slowQueryThreshold = $threshold;
    }

    /**
     * Clear query logs
     */
    public function clearLogs(): void
    {
        $this->queryLog = [];
        $this->slowQueries = [];
    }
}