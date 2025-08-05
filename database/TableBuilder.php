<?php

declare(strict_types=1);

namespace Database;

use App\Infrastructure\Database\DatabaseManager;

class TableBuilder
{
    private string $tableName;
    private DatabaseManager $db;
    private array $columns = [];
    private array $indexes = [];
    private array $foreignKeys = [];
    private string $engine = 'InnoDB';
    private string $charset = 'utf8mb4';
    private string $collation = 'utf8mb4_unicode_ci';

    public function __construct(string $tableName, DatabaseManager $db)
    {
        $this->tableName = $tableName;
        $this->db = $db;
    }

    public function id(string $name = 'id'): self
    {
        $this->columns[] = "`{$name}` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY";
        return $this;
    }

    public function string(string $name, int $length = 255): self
    {
        $this->columns[] = "`{$name}` VARCHAR({$length})";
        return $this;
    }

    public function text(string $name): self
    {
        $this->columns[] = "`{$name}` TEXT";
        return $this;
    }

    public function longText(string $name): self
    {
        $this->columns[] = "`{$name}` LONGTEXT";
        return $this;
    }

    public function integer(string $name): self
    {
        $this->columns[] = "`{$name}` INT";
        return $this;
    }

    public function bigInteger(string $name): self
    {
        $this->columns[] = "`{$name}` BIGINT";
        return $this;
    }

    public function decimal(string $name, int $precision = 8, int $scale = 2): self
    {
        $this->columns[] = "`{$name}` DECIMAL({$precision},{$scale})";
        return $this;
    }

    public function boolean(string $name): self
    {
        $this->columns[] = "`{$name}` BOOLEAN";
        return $this;
    }

    public function date(string $name): self
    {
        $this->columns[] = "`{$name}` DATE";
        return $this;
    }

    public function dateTime(string $name): self
    {
        $this->columns[] = "`{$name}` DATETIME";
        return $this;
    }

    public function timestamp(string $name): self
    {
        $this->columns[] = "`{$name}` TIMESTAMP";
        return $this;
    }

    public function json(string $name): self
    {
        $this->columns[] = "`{$name}` JSON";
        return $this;
    }

    public function enum(string $name, array $values): self
    {
        $valueList = "'" . implode("','", $values) . "'";
        $this->columns[] = "`{$name}` ENUM({$valueList})";
        return $this;
    }

    public function nullable(): self
    {
        $lastIndex = count($this->columns) - 1;
        if ($lastIndex >= 0) {
            $this->columns[$lastIndex] .= ' NULL';
        }
        return $this;
    }

    public function notNull(): self
    {
        $lastIndex = count($this->columns) - 1;
        if ($lastIndex >= 0) {
            $this->columns[$lastIndex] .= ' NOT NULL';
        }
        return $this;
    }

    public function default(string $value): self
    {
        $lastIndex = count($this->columns) - 1;
        if ($lastIndex >= 0) {
            $this->columns[$lastIndex] .= " DEFAULT {$value}";
        }
        return $this;
    }

    public function unique(): self
    {
        $lastIndex = count($this->columns) - 1;
        if ($lastIndex >= 0) {
            $this->columns[$lastIndex] .= ' UNIQUE';
        }
        return $this;
    }

    public function index(string $name, array $columns): self
    {
        $columnList = implode('`, `', $columns);
        $this->indexes[] = "INDEX `{$name}` (`{$columnList}`)";
        return $this;
    }

    public function uniqueIndex(string $name, array $columns): self
    {
        $columnList = implode('`, `', $columns);
        $this->indexes[] = "UNIQUE INDEX `{$name}` (`{$columnList}`)";
        return $this;
    }

    public function foreignKey(string $column, string $references, string $onDelete = 'CASCADE', string $onUpdate = 'CASCADE'): self
    {
        [$table, $referencedColumn] = explode('.', $references);
        $constraintName = "fk_{$this->tableName}_{$column}";
        $this->foreignKeys[] = "CONSTRAINT `{$constraintName}` FOREIGN KEY (`{$column}`) REFERENCES `{$table}` (`{$referencedColumn}`) ON DELETE {$onDelete} ON UPDATE {$onUpdate}";
        return $this;
    }

    public function timestamps(): self
    {
        $this->columns[] = "`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP";
        $this->columns[] = "`updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP";
        return $this;
    }

    public function softDeletes(): self
    {
        $this->columns[] = "`deleted_at` TIMESTAMP NULL";
        return $this;
    }

    public function execute(): void
    {
        $sql = "CREATE TABLE `{$this->tableName}` (\n";
        
        // Add columns
        $sql .= "  " . implode(",\n  ", $this->columns);
        
        // Add indexes
        if (!empty($this->indexes)) {
            $sql .= ",\n  " . implode(",\n  ", $this->indexes);
        }
        
        // Add foreign keys
        if (!empty($this->foreignKeys)) {
            $sql .= ",\n  " . implode(",\n  ", $this->foreignKeys);
        }
        
        $sql .= "\n) ENGINE={$this->engine} DEFAULT CHARSET={$this->charset} COLLATE={$this->collation}";
        
        $this->db->exec($sql);
    }
}