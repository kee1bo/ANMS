<?php

declare(strict_types=1);

namespace App\Infrastructure\Database;

use App\Infrastructure\Config\Config;
use RuntimeException;

class BackupManager
{
    private Config $config;
    private DatabaseManager $db;
    private string $backupPath;

    public function __construct(Config $config, DatabaseManager $db)
    {
        $this->config = $config;
        $this->db = $db;
        $this->backupPath = 'storage/backups';
        
        if (!is_dir($this->backupPath)) {
            mkdir($this->backupPath, 0755, true);
        }
    }

    /**
     * Create full database backup
     */
    public function createFullBackup(): array
    {
        $timestamp = date('Y-m-d_H-i-s');
        $filename = "full_backup_{$timestamp}.sql";
        $filepath = $this->backupPath . '/' . $filename;

        try {
            $this->createMySQLDump($filepath);
            
            // Compress backup
            $compressedFile = $this->compressBackup($filepath);
            
            // Verify backup integrity
            $integrity = $this->verifyBackupIntegrity($compressedFile);
            
            return [
                'status' => 'success',
                'filename' => basename($compressedFile),
                'filepath' => $compressedFile,
                'size' => filesize($compressedFile),
                'created_at' => time(),
                'integrity_check' => $integrity,
                'type' => 'full'
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage(),
                'type' => 'full'
            ];
        }
    }

    /**
     * Create incremental backup (only changed data)
     */
    public function createIncrementalBackup(): array
    {
        $timestamp = date('Y-m-d_H-i-s');
        $filename = "incremental_backup_{$timestamp}.sql";
        $filepath = $this->backupPath . '/' . $filename;

        try {
            // Get last backup timestamp
            $lastBackupTime = $this->getLastBackupTimestamp();
            
            // Create incremental backup
            $this->createIncrementalDump($filepath, $lastBackupTime);
            
            // Compress backup
            $compressedFile = $this->compressBackup($filepath);
            
            return [
                'status' => 'success',
                'filename' => basename($compressedFile),
                'filepath' => $compressedFile,
                'size' => filesize($compressedFile),
                'created_at' => time(),
                'since' => $lastBackupTime,
                'type' => 'incremental'
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage(),
                'type' => 'incremental'
            ];
        }
    }

    /**
     * Restore database from backup
     */
    public function restoreFromBackup(string $backupFile): array
    {
        $filepath = $this->backupPath . '/' . $backupFile;
        
        if (!file_exists($filepath)) {
            return [
                'status' => 'error',
                'message' => 'Backup file not found: ' . $backupFile
            ];
        }

        try {
            // Decompress if needed
            $sqlFile = $this->decompressBackup($filepath);
            
            // Create backup of current database before restore
            $preRestoreBackup = $this->createFullBackup();
            
            // Restore database
            $this->restoreFromSQLFile($sqlFile);
            
            // Clean up temporary files
            if ($sqlFile !== $filepath) {
                unlink($sqlFile);
            }
            
            return [
                'status' => 'success',
                'message' => 'Database restored successfully',
                'backup_file' => $backupFile,
                'pre_restore_backup' => $preRestoreBackup['filename'] ?? null,
                'restored_at' => time()
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Restore failed: ' . $e->getMessage(),
                'backup_file' => $backupFile
            ];
        }
    }

    /**
     * List available backups
     */
    public function listBackups(): array
    {
        $backups = [];
        $files = glob($this->backupPath . '/*.{sql,gz,zip}', GLOB_BRACE);
        
        foreach ($files as $file) {
            $filename = basename($file);
            $backups[] = [
                'filename' => $filename,
                'size' => filesize($file),
                'created_at' => filemtime($file),
                'type' => $this->getBackupType($filename),
                'compressed' => in_array(pathinfo($file, PATHINFO_EXTENSION), ['gz', 'zip'])
            ];
        }
        
        // Sort by creation time (newest first)
        usort($backups, function ($a, $b) {
            return $b['created_at'] - $a['created_at'];
        });
        
        return $backups;
    }

    /**
     * Delete old backups based on retention policy
     */
    public function cleanupOldBackups(int $daysToKeep = 30): array
    {
        $cutoffTime = time() - ($daysToKeep * 24 * 3600);
        $deletedFiles = [];
        $files = glob($this->backupPath . '/*.{sql,gz,zip}', GLOB_BRACE);
        
        foreach ($files as $file) {
            if (filemtime($file) < $cutoffTime) {
                if (unlink($file)) {
                    $deletedFiles[] = basename($file);
                }
            }
        }
        
        return [
            'deleted_count' => count($deletedFiles),
            'deleted_files' => $deletedFiles,
            'retention_days' => $daysToKeep
        ];
    }

    /**
     * Verify backup integrity
     */
    public function verifyBackupIntegrity(string $backupFile): array
    {
        $filepath = $this->backupPath . '/' . $backupFile;
        
        if (!file_exists($filepath)) {
            return ['status' => 'error', 'message' => 'Backup file not found'];
        }

        try {
            $checks = [];
            
            // Check file size
            $fileSize = filesize($filepath);
            $checks['file_size'] = $fileSize > 0 ? 'pass' : 'fail';
            
            // Check file format
            $extension = pathinfo($filepath, PATHINFO_EXTENSION);
            if ($extension === 'gz') {
                $checks['compression'] = $this->verifyGzipFile($filepath) ? 'pass' : 'fail';
            } elseif ($extension === 'zip') {
                $checks['compression'] = $this->verifyZipFile($filepath) ? 'pass' : 'fail';
            } else {
                $checks['compression'] = 'not_compressed';
            }
            
            // Check SQL syntax (basic check)
            if ($extension === 'sql') {
                $checks['sql_syntax'] = $this->verifySQLSyntax($filepath) ? 'pass' : 'fail';
            }
            
            // Calculate checksum
            $checks['checksum'] = hash_file('sha256', $filepath);
            
            return [
                'status' => 'success',
                'checks' => $checks,
                'overall' => !in_array('fail', $checks) ? 'pass' : 'fail'
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Create MySQL dump
     */
    private function createMySQLDump(string $filepath): void
    {
        $host = $this->config->get('database.host');
        $port = $this->config->get('database.port');
        $database = $this->config->get('database.database');
        $username = $this->config->get('database.username');
        $password = $this->config->get('database.password');

        $command = sprintf(
            'mysqldump --host=%s --port=%d --user=%s --password=%s --single-transaction --routines --triggers %s > %s',
            escapeshellarg($host),
            $port,
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($database),
            escapeshellarg($filepath)
        );

        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new RuntimeException('MySQL dump failed: ' . implode("\n", $output));
        }
    }

    /**
     * Create incremental dump
     */
    private function createIncrementalDump(string $filepath, string $since): void
    {
        $tables = ['users', 'pets', 'health_records', 'nutrition_plans'];
        $sql = "-- Incremental backup since {$since}\n\n";

        foreach ($tables as $table) {
            $stmt = $this->db->prepare("
                SELECT * FROM {$table} 
                WHERE updated_at > ? OR created_at > ?
            ");
            $stmt->execute([$since, $since]);
            
            $rows = $stmt->fetchAll();
            
            if (!empty($rows)) {
                $sql .= "-- Table: {$table}\n";
                $sql .= $this->generateInsertStatements($table, $rows);
                $sql .= "\n";
            }
        }

        file_put_contents($filepath, $sql);
    }

    /**
     * Generate INSERT statements for incremental backup
     */
    private function generateInsertStatements(string $table, array $rows): string
    {
        if (empty($rows)) {
            return '';
        }

        $columns = array_keys($rows[0]);
        $sql = "INSERT INTO `{$table}` (`" . implode('`, `', $columns) . "`) VALUES\n";
        
        $values = [];
        foreach ($rows as $row) {
            $escapedValues = array_map(function ($value) {
                return $value === null ? 'NULL' : $this->db->quote($value);
            }, array_values($row));
            
            $values[] = '(' . implode(', ', $escapedValues) . ')';
        }
        
        $sql .= implode(",\n", $values) . ";\n";
        
        return $sql;
    }

    /**
     * Compress backup file
     */
    private function compressBackup(string $filepath): string
    {
        $compressedFile = $filepath . '.gz';
        
        $input = fopen($filepath, 'rb');
        $output = gzopen($compressedFile, 'wb9');
        
        while (!feof($input)) {
            gzwrite($output, fread($input, 8192));
        }
        
        fclose($input);
        gzclose($output);
        
        // Remove original file
        unlink($filepath);
        
        return $compressedFile;
    }

    /**
     * Decompress backup file
     */
    private function decompressBackup(string $filepath): string
    {
        $extension = pathinfo($filepath, PATHINFO_EXTENSION);
        
        if ($extension === 'gz') {
            $decompressedFile = substr($filepath, 0, -3); // Remove .gz extension
            
            $input = gzopen($filepath, 'rb');
            $output = fopen($decompressedFile, 'wb');
            
            while (!gzeof($input)) {
                fwrite($output, gzread($input, 8192));
            }
            
            gzclose($input);
            fclose($output);
            
            return $decompressedFile;
        }
        
        return $filepath; // Already decompressed
    }

    /**
     * Restore from SQL file
     */
    private function restoreFromSQLFile(string $sqlFile): void
    {
        $sql = file_get_contents($sqlFile);
        
        // Split SQL into individual statements
        $statements = array_filter(
            array_map('trim', explode(';', $sql)),
            function ($stmt) {
                return !empty($stmt) && !preg_match('/^--/', $stmt);
            }
        );

        foreach ($statements as $statement) {
            if (!empty($statement)) {
                $this->db->exec($statement);
            }
        }
    }

    /**
     * Get last backup timestamp
     */
    private function getLastBackupTimestamp(): string
    {
        $backups = $this->listBackups();
        
        if (empty($backups)) {
            return date('Y-m-d H:i:s', time() - 86400); // 24 hours ago
        }
        
        return date('Y-m-d H:i:s', $backups[0]['created_at']);
    }

    /**
     * Get backup type from filename
     */
    private function getBackupType(string $filename): string
    {
        if (strpos($filename, 'full_backup') !== false) {
            return 'full';
        } elseif (strpos($filename, 'incremental_backup') !== false) {
            return 'incremental';
        }
        
        return 'unknown';
    }

    /**
     * Verify gzip file integrity
     */
    private function verifyGzipFile(string $filepath): bool
    {
        $handle = gzopen($filepath, 'rb');
        if (!$handle) {
            return false;
        }
        
        // Try to read the file
        $data = gzread($handle, 1024);
        gzclose($handle);
        
        return $data !== false;
    }

    /**
     * Verify ZIP file integrity
     */
    private function verifyZipFile(string $filepath): bool
    {
        $zip = new \ZipArchive();
        return $zip->open($filepath) === true;
    }

    /**
     * Basic SQL syntax verification
     */
    private function verifySQLSyntax(string $filepath): bool
    {
        $content = file_get_contents($filepath);
        
        // Basic checks for SQL structure
        $hasCreateTable = strpos($content, 'CREATE TABLE') !== false;
        $hasInsert = strpos($content, 'INSERT INTO') !== false;
        $balanced = substr_count($content, '(') === substr_count($content, ')');
        
        return $hasCreateTable || $hasInsert || $balanced;
    }
}