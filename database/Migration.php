<?php

declare(strict_types=1);

namespace Database;

use App\Infrastructure\Database\DatabaseManager;

abstract class Migration
{
    protected DatabaseManager $db;

    public function __construct(DatabaseManager $db)
    {
        $this->db = $db;
    }

    abstract public function up(): void;
    abstract public function down(): void;

    protected function createTable(string $tableName, callable $callback): void
    {
        $tableBuilder = new TableBuilder($tableName, $this->db);
        $callback($tableBuilder);
        $tableBuilder->execute();
    }

    protected function dropTable(string $tableName): void
    {
        $sql = "DROP TABLE IF EXISTS `{$tableName}`";
        $this->db->exec($sql);
    }

    protected function addColumn(string $tableName, string $columnName, string $definition): void
    {
        $sql = "ALTER TABLE `{$tableName}` ADD COLUMN `{$columnName}` {$definition}";
        $this->db->exec($sql);
    }

    protected function dropColumn(string $tableName, string $columnName): void
    {
        $sql = "ALTER TABLE `{$tableName}` DROP COLUMN `{$columnName}`";
        $this->db->exec($sql);
    }

    protected function addIndex(string $tableName, string $indexName, array $columns): void
    {
        $columnList = implode('`, `', $columns);
        $sql = "CREATE INDEX `{$indexName}` ON `{$tableName}` (`{$columnList}`)";
        $this->db->exec($sql);
    }

    protected function dropIndex(string $tableName, string $indexName): void
    {
        $sql = "DROP INDEX `{$indexName}` ON `{$tableName}`";
        $this->db->exec($sql);
    }
}