<?php

declare(strict_types=1);

namespace App\Application\Services\CodebaseAnalysis\Backup;

use App\Application\Services\CodebaseAnalysis\Models\FileAnalysisResult;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;

/**
 * Manages backup operations for codebase cleanup
 */
class BackupManager
{
    private string $projectRoot;
    private string $backupRoot;
    private LoggerInterface $logger;
    private ?BackupManifest $currentManifest = null;

    public function __construct(
        string $projectRoot,
        string $backupRoot = 'backup',
        ?LoggerInterface $logger = null
    ) {
        $this->projectRoot = rtrim($projectRoot, '/');
        $this->backupRoot = rtrim($backupRoot, '/');
        $this->logger = $logger ?? new NullLogger();
    }

    /**
     * Create backup of specified files
     */
    public function createBackup(array $analysisResults, bool $dryRun = false): BackupManifest
    {
        $this->logger->info('Starting backup creation', [
            'total_files' => count($analysisResults),
            'dry_run' => $dryRun
        ]);

        // Filter files that should be moved
        $filesToMove = $this->filterFilesToMove($analysisResults);
        
        if (empty($filesToMove)) {
            $this->logger->info('No files to move - backup not needed');
            return new BackupManifest([], [], $this->projectRoot);
        }

        // Create backup directory structure
        if (!$dryRun) {
            $this->createBackupDirectories();
        }

        // Validate disk space
        $this->validateDiskSpace($filesToMove);

        // Create manifest
        $manifest = new BackupManifest($filesToMove, $analysisResults, $this->projectRoot);
        
        if ($dryRun) {
            $this->logger->info('Dry run completed', [
                'files_to_move' => count($filesToMove),
                'estimated_size' => $this->calculateTotalSize($filesToMove)
            ]);
            return $manifest;
        }

        // Perform actual backup
        $movedFiles = [];
        $errors = [];
        
        foreach ($filesToMove as $filePath => $analysisResult) {
            try {
                $backupPath = $this->moveFileToBackup($filePath);
                $movedFiles[$filePath] = $backupPath;
                
                $this->logger->debug('File moved to backup', [
                    'original' => $filePath,
                    'backup' => $backupPath
                ]);
            } catch (\Exception $e) {
                $errors[$filePath] = $e->getMessage();
                $this->logger->error('Failed to move file to backup', [
                    'file' => $filePath,
                    'error' => $e->getMessage()
                ]);
            }
        }

        // Update manifest with actual results
        $manifest->setMovedFiles($movedFiles);
        $manifest->setErrors($errors);

        // Save manifest
        $this->saveManifest($manifest);
        $this->currentManifest = $manifest;

        $this->logger->info('Backup creation completed', [
            'moved_files' => count($movedFiles),
            'errors' => count($errors),
            'backup_location' => $this->getBackupPath()
        ]);

        return $manifest;
    }

    /**
     * Restore a single file from backup
     */
    public function restoreFile(string $backupPath, string $originalPath): bool
    {
        $fullBackupPath = $this->getBackupPath() . '/' . ltrim($backupPath, '/');
        $fullOriginalPath = $this->projectRoot . '/' . ltrim($originalPath, '/');

        if (!file_exists($fullBackupPath)) {
            $this->logger->error('Backup file not found', [
                'backup_path' => $fullBackupPath,
                'original_path' => $originalPath
            ]);
            return false;
        }

        try {
            // Create directory if it doesn't exist
            $originalDir = dirname($fullOriginalPath);
            if (!is_dir($originalDir)) {
                mkdir($originalDir, 0755, true);
            }

            // Handle conflicts
            if (file_exists($fullOriginalPath)) {
                $conflictResolution = $this->resolveRestoreConflict($fullOriginalPath, $fullBackupPath);
                if (!$conflictResolution) {
                    return false;
                }
            }

            // Copy file back (keep backup intact)
            if (!copy($fullBackupPath, $fullOriginalPath)) {
                throw new \RuntimeException('Failed to copy file from backup');
            }

            // Verify integrity
            if (!$this->verifyFileIntegrity($fullBackupPath, $fullOriginalPath)) {
                unlink($fullOriginalPath);
                throw new \RuntimeException('File integrity verification failed');
            }

            $this->logger->info('File restored from backup', [
                'original_path' => $originalPath,
                'backup_path' => $backupPath
            ]);

            return true;
        } catch (\Exception $e) {
            $this->logger->error('Failed to restore file from backup', [
                'original_path' => $originalPath,
                'backup_path' => $backupPath,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Restore multiple files from backup
     */
    public function restoreFiles(array $filePaths): array
    {
        $results = [];
        $manifest = $this->getManifest();
        
        if (!$manifest) {
            $this->logger->error('No backup manifest found');
            return [];
        }

        foreach ($filePaths as $originalPath) {
            $backupPath = $manifest->getBackupPath($originalPath);
            if ($backupPath) {
                $results[$originalPath] = $this->restoreFile($backupPath, $originalPath);
            } else {
                $this->logger->warning('File not found in backup manifest', [
                    'file' => $originalPath
                ]);
                $results[$originalPath] = false;
            }
        }

        return $results;
    }

    /**
     * Restore entire backup (rollback all changes)
     */
    public function restoreAll(): bool
    {
        $manifest = $this->getManifest();
        if (!$manifest) {
            $this->logger->error('No backup manifest found for restoration');
            return false;
        }

        $movedFiles = $manifest->getMovedFiles();
        $successCount = 0;
        $totalCount = count($movedFiles);

        $this->logger->info('Starting full restoration', [
            'total_files' => $totalCount
        ]);

        foreach ($movedFiles as $originalPath => $backupPath) {
            if ($this->restoreFile($backupPath, $originalPath)) {
                $successCount++;
            }
        }

        $success = $successCount === $totalCount;
        
        $this->logger->info('Full restoration completed', [
            'success' => $success,
            'restored_files' => $successCount,
            'total_files' => $totalCount
        ]);

        return $success;
    }

    /**
     * Get current backup manifest
     */
    public function getManifest(): ?BackupManifest
    {
        if ($this->currentManifest) {
            return $this->currentManifest;
        }

        return $this->loadManifest();
    }

    /**
     * Filter analysis results to get files that should be moved
     */
    private function filterFilesToMove(array $analysisResults): array
    {
        $filesToMove = [];
        
        foreach ($analysisResults as $filePath => $result) {
            if ($result instanceof FileAnalysisResult && $result->canBeMoved()) {
                $filesToMove[$filePath] = $result;
            }
        }

        return $filesToMove;
    }

    /**
     * Create backup directory structure
     */
    private function createBackupDirectories(): void
    {
        $backupPath = $this->getBackupPath();
        
        if (!is_dir($backupPath)) {
            if (!mkdir($backupPath, 0755, true)) {
                throw new \RuntimeException('Failed to create backup directory: ' . $backupPath);
            }
        }

        // Create subdirectories
        $subdirs = ['moved-files', 'reports'];
        foreach ($subdirs as $subdir) {
            $subdirPath = $backupPath . '/' . $subdir;
            if (!is_dir($subdirPath)) {
                mkdir($subdirPath, 0755, true);
            }
        }
    }

    /**
     * Validate available disk space
     */
    private function validateDiskSpace(array $filesToMove): void
    {
        $totalSize = $this->calculateTotalSize($filesToMove);
        $availableSpace = disk_free_space($this->getBackupPath());
        
        if ($availableSpace === false) {
            throw new \RuntimeException('Cannot determine available disk space');
        }

        // Require 20% extra space as buffer
        $requiredSpace = $totalSize * 1.2;
        
        if ($availableSpace < $requiredSpace) {
            throw new \RuntimeException(sprintf(
                'Insufficient disk space. Required: %s, Available: %s',
                $this->formatBytes($requiredSpace),
                $this->formatBytes($availableSpace)
            ));
        }

        $this->logger->info('Disk space validation passed', [
            'required_space' => $this->formatBytes($requiredSpace),
            'available_space' => $this->formatBytes($availableSpace)
        ]);
    }

    /**
     * Calculate total size of files to move
     */
    private function calculateTotalSize(array $filesToMove): int
    {
        $totalSize = 0;
        
        foreach ($filesToMove as $filePath => $result) {
            $fullPath = $this->projectRoot . '/' . ltrim($filePath, '/');
            if (file_exists($fullPath)) {
                $totalSize += filesize($fullPath);
            }
        }

        return $totalSize;
    }

    /**
     * Move a single file to backup
     */
    private function moveFileToBackup(string $filePath): string
    {
        $sourcePath = $this->projectRoot . '/' . ltrim($filePath, '/');
        $backupPath = $this->getBackupPath() . '/moved-files/' . ltrim($filePath, '/');
        
        if (!file_exists($sourcePath)) {
            throw new \RuntimeException('Source file does not exist: ' . $sourcePath);
        }

        // Create backup directory structure
        $backupDir = dirname($backupPath);
        if (!is_dir($backupDir)) {
            if (!mkdir($backupDir, 0755, true)) {
                throw new \RuntimeException('Failed to create backup directory: ' . $backupDir);
            }
        }

        // Perform atomic move
        if (!rename($sourcePath, $backupPath)) {
            throw new \RuntimeException('Failed to move file to backup: ' . $filePath);
        }

        // Verify the move was successful
        if (!file_exists($backupPath) || file_exists($sourcePath)) {
            throw new \RuntimeException('File move verification failed: ' . $filePath);
        }

        return 'moved-files/' . ltrim($filePath, '/');
    }

    /**
     * Resolve conflicts during restoration
     */
    private function resolveRestoreConflict(string $originalPath, string $backupPath): bool
    {
        // For now, create a backup of the existing file
        $conflictBackupPath = $originalPath . '.conflict.' . time();
        
        if (!rename($originalPath, $conflictBackupPath)) {
            $this->logger->error('Failed to resolve restore conflict', [
                'original_path' => $originalPath,
                'conflict_backup' => $conflictBackupPath
            ]);
            return false;
        }

        $this->logger->info('Restore conflict resolved', [
            'original_path' => $originalPath,
            'conflict_backup' => $conflictBackupPath
        ]);

        return true;
    }

    /**
     * Verify file integrity using checksums
     */
    private function verifyFileIntegrity(string $file1, string $file2): bool
    {
        if (!file_exists($file1) || !file_exists($file2)) {
            return false;
        }

        return hash_file('sha256', $file1) === hash_file('sha256', $file2);
    }

    /**
     * Save backup manifest to disk
     */
    private function saveManifest(BackupManifest $manifest): void
    {
        $manifestPath = $this->getBackupPath() . '/manifest.json';
        $manifestData = json_encode($manifest->toArray(), JSON_PRETTY_PRINT);
        
        if (file_put_contents($manifestPath, $manifestData) === false) {
            throw new \RuntimeException('Failed to save backup manifest');
        }

        // Also save a human-readable report
        $reportPath = $this->getBackupPath() . '/reports/backup-report.md';
        $reportContent = $manifest->generateReport();
        file_put_contents($reportPath, $reportContent);
    }

    /**
     * Load backup manifest from disk
     */
    private function loadManifest(): ?BackupManifest
    {
        $manifestPath = $this->getBackupPath() . '/manifest.json';
        
        if (!file_exists($manifestPath)) {
            return null;
        }

        $manifestData = file_get_contents($manifestPath);
        if ($manifestData === false) {
            return null;
        }

        $data = json_decode($manifestData, true);
        if ($data === null) {
            return null;
        }

        return BackupManifest::fromArray($data);
    }

    /**
     * Get backup root path
     */
    private function getBackupPath(): string
    {
        return $this->projectRoot . '/' . $this->backupRoot;
    }

    /**
     * Format bytes in human-readable format
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $unitIndex = 0;
        
        while ($bytes >= 1024 && $unitIndex < count($units) - 1) {
            $bytes /= 1024;
            $unitIndex++;
        }

        return round($bytes, 2) . ' ' . $units[$unitIndex];
    }

    /**
     * Set backup root directory
     */
    public function setBackupRoot(string $backupRoot): void
    {
        $this->backupRoot = rtrim($backupRoot, '/');
    }

    /**
     * Get backup statistics
     */
    public function getBackupStatistics(): array
    {
        $manifest = $this->getManifest();
        if (!$manifest) {
            return [];
        }

        return $manifest->getStatistics();
    }

    /**
     * Check if backup exists
     */
    public function hasBackup(): bool
    {
        return file_exists($this->getBackupPath() . '/manifest.json');
    }

    /**
     * Clean up old backups (keep only the most recent)
     */
    public function cleanupOldBackups(int $keepCount = 1): void
    {
        // This would implement cleanup of old backup directories
        // For now, we only maintain one backup at a time
        $this->logger->info('Backup cleanup not implemented yet');
    }
}