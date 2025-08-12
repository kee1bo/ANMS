<?php

declare(strict_types=1);

namespace App\Application\Services\CodebaseAnalysis\Backup;

use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;

/**
 * Service for handling file restoration from backup
 */
class RestorationService
{
    private BackupManager $backupManager;
    private LoggerInterface $logger;
    private string $projectRoot;

    public function __construct(
        BackupManager $backupManager,
        string $projectRoot,
        ?LoggerInterface $logger = null
    ) {
        $this->backupManager = $backupManager;
        $this->projectRoot = rtrim($projectRoot, '/');
        $this->logger = $logger ?? new NullLogger();
    }

    /**
     * Restore individual file with advanced conflict resolution
     */
    public function restoreFile(
        string $originalPath,
        array $options = []
    ): RestorationResult {
        $this->logger->info('Starting file restoration', [
            'file' => $originalPath,
            'options' => $options
        ]);

        $manifest = $this->backupManager->getManifest();
        if (!$manifest) {
            return new RestorationResult(
                success: false,
                filePath: $originalPath,
                error: 'No backup manifest found'
            );
        }

        $backupPath = $manifest->getBackupPath($originalPath);
        if (!$backupPath) {
            return new RestorationResult(
                success: false,
                filePath: $originalPath,
                error: 'File not found in backup manifest'
            );
        }

        try {
            // Validate backup file exists
            $fullBackupPath = $this->projectRoot . '/backup/' . ltrim($backupPath, '/');
            if (!file_exists($fullBackupPath)) {
                throw new \RuntimeException('Backup file does not exist: ' . $backupPath);
            }

            // Check for conflicts
            $fullOriginalPath = $this->projectRoot . '/' . ltrim($originalPath, '/');
            $conflictResolution = null;
            
            if (file_exists($fullOriginalPath)) {
                $conflictResolution = $this->resolveConflict(
                    $fullOriginalPath,
                    $fullBackupPath,
                    $options['conflict_resolution'] ?? 'backup_existing'
                );
                
                if (!$conflictResolution->success) {
                    throw new \RuntimeException('Conflict resolution failed: ' . $conflictResolution->error);
                }
            }

            // Create directory structure if needed
            $originalDir = dirname($fullOriginalPath);
            if (!is_dir($originalDir)) {
                if (!mkdir($originalDir, 0755, true)) {
                    throw new \RuntimeException('Failed to create directory: ' . $originalDir);
                }
            }

            // Perform restoration
            $restorationMethod = $options['method'] ?? 'copy';
            $success = $this->performRestoration($fullBackupPath, $fullOriginalPath, $restorationMethod);
            
            if (!$success) {
                throw new \RuntimeException('File restoration operation failed');
            }

            // Verify restoration
            $verification = $this->verifyRestoration($fullBackupPath, $fullOriginalPath);
            if (!$verification->success) {
                // Clean up failed restoration
                if (file_exists($fullOriginalPath)) {
                    unlink($fullOriginalPath);
                }
                throw new \RuntimeException('Restoration verification failed: ' . $verification->error);
            }

            // Update manifest if needed
            if ($options['update_manifest'] ?? true) {
                $this->updateManifestAfterRestoration($originalPath, $manifest);
            }

            $this->logger->info('File restoration completed successfully', [
                'file' => $originalPath,
                'backup_path' => $backupPath,
                'conflict_resolution' => $conflictResolution?->action
            ]);

            return new RestorationResult(
                success: true,
                filePath: $originalPath,
                backupPath: $backupPath,
                conflictResolution: $conflictResolution,
                verification: $verification
            );

        } catch (\Exception $e) {
            $this->logger->error('File restoration failed', [
                'file' => $originalPath,
                'error' => $e->getMessage()
            ]);

            return new RestorationResult(
                success: false,
                filePath: $originalPath,
                error: $e->getMessage()
            );
        }
    }

    /**
     * Restore multiple files with batch processing
     */
    public function restoreFiles(array $filePaths, array $options = []): BatchRestorationResult
    {
        $this->logger->info('Starting batch file restoration', [
            'file_count' => count($filePaths),
            'options' => $options
        ]);

        $results = [];
        $successCount = 0;
        $errorCount = 0;
        $skippedCount = 0;

        foreach ($filePaths as $filePath) {
            $result = $this->restoreFile($filePath, $options);
            $results[$filePath] = $result;

            if ($result->success) {
                $successCount++;
            } elseif ($result->error === 'File not found in backup manifest') {
                $skippedCount++;
            } else {
                $errorCount++;
            }

            // Stop on first error if fail_fast is enabled
            if (!$result->success && ($options['fail_fast'] ?? false)) {
                $this->logger->warning('Batch restoration stopped due to fail_fast option', [
                    'failed_file' => $filePath,
                    'processed' => count($results)
                ]);
                break;
            }
        }

        $batchResult = new BatchRestorationResult(
            results: $results,
            successCount: $successCount,
            errorCount: $errorCount,
            skippedCount: $skippedCount,
            totalCount: count($filePaths)
        );

        $this->logger->info('Batch file restoration completed', [
            'total' => $batchResult->totalCount,
            'success' => $batchResult->successCount,
            'errors' => $batchResult->errorCount,
            'skipped' => $batchResult->skippedCount
        ]);

        return $batchResult;
    }

    /**
     * Restore entire directory structure
     */
    public function restoreDirectory(string $directoryPath, array $options = []): BatchRestorationResult
    {
        $manifest = $this->backupManager->getManifest();
        if (!$manifest) {
            throw new \RuntimeException('No backup manifest found');
        }

        // Find all files in the directory
        $directoryFiles = [];
        foreach ($manifest->getMovedFiles() as $originalPath => $backupPath) {
            if (str_starts_with($originalPath, $directoryPath)) {
                $directoryFiles[] = $originalPath;
            }
        }

        if (empty($directoryFiles)) {
            $this->logger->info('No files found in directory for restoration', [
                'directory' => $directoryPath
            ]);
            
            return new BatchRestorationResult([], 0, 0, 0, 0);
        }

        $this->logger->info('Restoring directory', [
            'directory' => $directoryPath,
            'file_count' => count($directoryFiles)
        ]);

        return $this->restoreFiles($directoryFiles, $options);
    }

    /**
     * Complete rollback - restore all backed up files
     */
    public function performCompleteRollback(array $options = []): BatchRestorationResult
    {
        $this->logger->info('Starting complete rollback');

        $manifest = $this->backupManager->getManifest();
        if (!$manifest) {
            throw new \RuntimeException('No backup manifest found for rollback');
        }

        $allFiles = array_keys($manifest->getMovedFiles());
        
        // Add safety confirmation if not explicitly bypassed
        if (!($options['confirm_rollback'] ?? false)) {
            throw new \RuntimeException('Complete rollback requires explicit confirmation via confirm_rollback option');
        }

        $result = $this->restoreFiles($allFiles, array_merge($options, [
            'method' => 'move', // Move files back instead of copying
            'update_manifest' => true
        ]));

        if ($result->isFullySuccessful()) {
            $this->logger->info('Complete rollback successful - all files restored');
        } else {
            $this->logger->warning('Complete rollback partially successful', [
                'success_count' => $result->successCount,
                'error_count' => $result->errorCount
            ]);
        }

        return $result;
    }

    /**
     * Resolve conflicts when restoring files
     */
    private function resolveConflict(
        string $existingPath,
        string $backupPath,
        string $strategy
    ): ConflictResolution {
        switch ($strategy) {
            case 'backup_existing':
                return $this->backupExistingFile($existingPath);
                
            case 'overwrite':
                return new ConflictResolution(
                    success: true,
                    action: 'overwrite',
                    message: 'Existing file will be overwritten'
                );
                
            case 'skip':
                return new ConflictResolution(
                    success: false,
                    action: 'skip',
                    message: 'Restoration skipped due to existing file'
                );
                
            case 'compare':
                return $this->compareAndDecide($existingPath, $backupPath);
                
            default:
                return new ConflictResolution(
                    success: false,
                    action: 'unknown',
                    error: 'Unknown conflict resolution strategy: ' . $strategy
                );
        }
    }

    /**
     * Backup existing file before restoration
     */
    private function backupExistingFile(string $existingPath): ConflictResolution
    {
        $timestamp = date('Y-m-d_H-i-s');
        $backupPath = $existingPath . '.conflict-backup.' . $timestamp;
        
        if (!copy($existingPath, $backupPath)) {
            return new ConflictResolution(
                success: false,
                action: 'backup_existing',
                error: 'Failed to create backup of existing file'
            );
        }

        return new ConflictResolution(
            success: true,
            action: 'backup_existing',
            message: 'Existing file backed up to: ' . basename($backupPath),
            backupPath: $backupPath
        );
    }

    /**
     * Compare files and decide on restoration
     */
    private function compareAndDecide(string $existingPath, string $backupPath): ConflictResolution
    {
        // Compare file hashes
        $existingHash = hash_file('sha256', $existingPath);
        $backupHash = hash_file('sha256', $backupPath);
        
        if ($existingHash === $backupHash) {
            return new ConflictResolution(
                success: false,
                action: 'skip',
                message: 'Files are identical - restoration not needed'
            );
        }

        // Compare modification times
        $existingMtime = filemtime($existingPath);
        $backupMtime = filemtime($backupPath);
        
        if ($existingMtime > $backupMtime) {
            return new ConflictResolution(
                success: false,
                action: 'skip',
                message: 'Existing file is newer - restoration skipped'
            );
        }

        // Default to backing up existing file
        return $this->backupExistingFile($existingPath);
    }

    /**
     * Perform the actual restoration operation
     */
    private function performRestoration(string $backupPath, string $originalPath, string $method): bool
    {
        switch ($method) {
            case 'copy':
                return copy($backupPath, $originalPath);
                
            case 'move':
                return rename($backupPath, $originalPath);
                
            case 'link':
                return link($backupPath, $originalPath);
                
            case 'symlink':
                return symlink($backupPath, $originalPath);
                
            default:
                throw new \InvalidArgumentException('Unknown restoration method: ' . $method);
        }
    }

    /**
     * Verify restoration was successful
     */
    private function verifyRestoration(string $backupPath, string $originalPath): VerificationResult
    {
        if (!file_exists($originalPath)) {
            return new VerificationResult(
                success: false,
                error: 'Restored file does not exist'
            );
        }

        // Compare file sizes
        $backupSize = filesize($backupPath);
        $originalSize = filesize($originalPath);
        
        if ($backupSize !== $originalSize) {
            return new VerificationResult(
                success: false,
                error: sprintf('File size mismatch: backup=%d, restored=%d', $backupSize, $originalSize)
            );
        }

        // Compare file hashes
        $backupHash = hash_file('sha256', $backupPath);
        $originalHash = hash_file('sha256', $originalPath);
        
        if ($backupHash !== $originalHash) {
            return new VerificationResult(
                success: false,
                error: 'File content hash mismatch'
            );
        }

        return new VerificationResult(
            success: true,
            message: 'File restoration verified successfully'
        );
    }

    /**
     * Update manifest after successful restoration
     */
    private function updateManifestAfterRestoration(string $originalPath, BackupManifest $manifest): void
    {
        // This could update the manifest to track restored files
        // For now, we just log the restoration
        $this->logger->debug('File restored - manifest could be updated', [
            'file' => $originalPath
        ]);
    }

    /**
     * Get restoration preview without actually restoring
     */
    public function getRestorationPreview(array $filePaths): array
    {
        $manifest = $this->backupManager->getManifest();
        if (!$manifest) {
            return [];
        }

        $preview = [];
        
        foreach ($filePaths as $filePath) {
            $backupPath = $manifest->getBackupPath($filePath);
            $fullOriginalPath = $this->projectRoot . '/' . ltrim($filePath, '/');
            
            $preview[$filePath] = [
                'has_backup' => $backupPath !== null,
                'backup_path' => $backupPath,
                'original_exists' => file_exists($fullOriginalPath),
                'will_conflict' => $backupPath && file_exists($fullOriginalPath),
                'analysis_result' => $manifest->getAnalysisResult($filePath)?->toArray()
            ];
        }

        return $preview;
    }

    /**
     * Validate restoration prerequisites
     */
    public function validateRestorationPrerequisites(): array
    {
        $issues = [];

        // Check if backup exists
        if (!$this->backupManager->hasBackup()) {
            $issues[] = 'No backup found';
            return $issues;
        }

        // Check manifest integrity
        $manifest = $this->backupManager->getManifest();
        if ($manifest) {
            $manifestIssues = $manifest->validateIntegrity();
            $issues = array_merge($issues, $manifestIssues);
        }

        // Check disk space for restoration
        $stats = $this->backupManager->getBackupStatistics();
        $requiredSpace = $stats['total_size_moved'] ?? 0;
        $availableSpace = disk_free_space($this->projectRoot);
        
        if ($availableSpace !== false && $availableSpace < $requiredSpace) {
            $issues[] = sprintf(
                'Insufficient disk space for restoration. Required: %s, Available: %s',
                $this->formatBytes($requiredSpace),
                $this->formatBytes($availableSpace)
            );
        }

        return $issues;
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
}

/**
 * Result of a single file restoration
 */
class RestorationResult
{
    public function __construct(
        public readonly bool $success,
        public readonly string $filePath,
        public readonly ?string $backupPath = null,
        public readonly ?string $error = null,
        public readonly ?ConflictResolution $conflictResolution = null,
        public readonly ?VerificationResult $verification = null
    ) {}
}

/**
 * Result of batch file restoration
 */
class BatchRestorationResult
{
    public function __construct(
        public readonly array $results,
        public readonly int $successCount,
        public readonly int $errorCount,
        public readonly int $skippedCount,
        public readonly int $totalCount
    ) {}

    public function isFullySuccessful(): bool
    {
        return $this->errorCount === 0 && $this->successCount === $this->totalCount;
    }

    public function getSuccessRate(): float
    {
        return $this->totalCount > 0 ? ($this->successCount / $this->totalCount) * 100 : 0;
    }

    public function getFailedFiles(): array
    {
        $failed = [];
        foreach ($this->results as $filePath => $result) {
            if (!$result->success) {
                $failed[$filePath] = $result->error;
            }
        }
        return $failed;
    }
}

/**
 * Result of conflict resolution
 */
class ConflictResolution
{
    public function __construct(
        public readonly bool $success,
        public readonly string $action,
        public readonly ?string $message = null,
        public readonly ?string $error = null,
        public readonly ?string $backupPath = null
    ) {}
}

/**
 * Result of file verification
 */
class VerificationResult
{
    public function __construct(
        public readonly bool $success,
        public readonly ?string $message = null,
        public readonly ?string $error = null
    ) {}
}