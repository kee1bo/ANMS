<?php

declare(strict_types=1);

namespace App\Application\Services\CodebaseAnalysis\Backup;

use App\Application\Services\CodebaseAnalysis\Models\FileAnalysisResult;

/**
 * Manifest for backup operations containing metadata and file mappings
 */
class BackupManifest
{
    private \DateTime $createdAt;
    private array $movedFiles = [];
    private array $analysisResults = [];
    private string $projectState;
    private array $statistics = [];
    private array $errors = [];
    private string $projectRoot;

    public function __construct(
        array $filesToMove,
        array $analysisResults,
        string $projectRoot
    ) {
        $this->createdAt = new \DateTime();
        $this->analysisResults = $analysisResults;
        $this->projectRoot = $projectRoot;
        $this->projectState = $this->calculateProjectState();
        $this->calculateStatistics($filesToMove);
    }

    /**
     * Set the actual moved files after backup operation
     */
    public function setMovedFiles(array $movedFiles): void
    {
        $this->movedFiles = $movedFiles;
        $this->updateStatistics();
    }

    /**
     * Set errors that occurred during backup
     */
    public function setErrors(array $errors): void
    {
        $this->errors = $errors;
        $this->updateStatistics();
    }

    /**
     * Get moved files mapping (original path => backup path)
     */
    public function getMovedFiles(): array
    {
        return $this->movedFiles;
    }

    /**
     * Get backup path for a specific original file
     */
    public function getBackupPath(string $originalPath): ?string
    {
        return $this->movedFiles[$originalPath] ?? null;
    }

    /**
     * Get original path for a specific backup file
     */
    public function getOriginalPath(string $backupPath): ?string
    {
        $flipped = array_flip($this->movedFiles);
        return $flipped[$backupPath] ?? null;
    }

    /**
     * Check if a file was moved to backup
     */
    public function isFileMoved(string $originalPath): bool
    {
        return isset($this->movedFiles[$originalPath]);
    }

    /**
     * Get analysis result for a specific file
     */
    public function getAnalysisResult(string $filePath): ?FileAnalysisResult
    {
        return $this->analysisResults[$filePath] ?? null;
    }

    /**
     * Get all analysis results
     */
    public function getAnalysisResults(): array
    {
        return $this->analysisResults;
    }

    /**
     * Get backup creation timestamp
     */
    public function getCreatedAt(): \DateTime
    {
        return $this->createdAt;
    }

    /**
     * Get project state hash
     */
    public function getProjectState(): string
    {
        return $this->projectState;
    }

    /**
     * Get backup statistics
     */
    public function getStatistics(): array
    {
        return $this->statistics;
    }

    /**
     * Get errors that occurred during backup
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    /**
     * Check if backup was successful (no errors)
     */
    public function isSuccessful(): bool
    {
        return empty($this->errors);
    }

    /**
     * Get files by category
     */
    public function getFilesByCategory(string $category): array
    {
        $files = [];
        
        foreach ($this->analysisResults as $filePath => $result) {
            if ($result instanceof FileAnalysisResult && $result->category === $category) {
                $files[$filePath] = $result;
            }
        }

        return $files;
    }

    /**
     * Get files by recommended action
     */
    public function getFilesByAction(string $action): array
    {
        $files = [];
        
        foreach ($this->analysisResults as $filePath => $result) {
            if ($result instanceof FileAnalysisResult && $result->recommendedAction === $action) {
                $files[$filePath] = $result;
            }
        }

        return $files;
    }

    /**
     * Generate human-readable backup report
     */
    public function generateReport(): string
    {
        $report = [];
        $report[] = "# Codebase Cleanup Backup Report";
        $report[] = "";
        $report[] = "**Created:** " . $this->createdAt->format('Y-m-d H:i:s');
        $report[] = "**Project Root:** " . $this->projectRoot;
        $report[] = "**Project State Hash:** " . $this->projectState;
        $report[] = "";

        // Summary statistics
        $report[] = "## Summary";
        $report[] = "";
        $stats = $this->statistics;
        $report[] = "- **Total Files Analyzed:** " . ($stats['total_analyzed'] ?? 0);
        $report[] = "- **Files Moved to Backup:** " . ($stats['moved_count'] ?? 0);
        $report[] = "- **Files Kept in Place:** " . ($stats['kept_count'] ?? 0);
        $report[] = "- **Files Requiring Review:** " . ($stats['review_count'] ?? 0);
        $report[] = "- **Errors:** " . ($stats['error_count'] ?? 0);
        $report[] = "- **Total Size Moved:** " . $this->formatBytes($stats['total_size_moved'] ?? 0);
        $report[] = "";

        // Category breakdown
        $report[] = "## Files by Category";
        $report[] = "";
        $categoryStats = $stats['by_category'] ?? [];
        foreach ($categoryStats as $category => $count) {
            $report[] = "- **" . ucfirst(str_replace('_', ' ', $category)) . ":** " . $count;
        }
        $report[] = "";

        // Action breakdown
        $report[] = "## Files by Action";
        $report[] = "";
        $actionStats = $stats['by_action'] ?? [];
        foreach ($actionStats as $action => $count) {
            $report[] = "- **" . ucfirst(str_replace('_', ' ', $action)) . ":** " . $count;
        }
        $report[] = "";

        // Moved files
        if (!empty($this->movedFiles)) {
            $report[] = "## Moved Files";
            $report[] = "";
            $report[] = "| Original Path | Backup Path | Category | Confidence |";
            $report[] = "|---------------|-------------|----------|------------|";
            
            foreach ($this->movedFiles as $originalPath => $backupPath) {
                $result = $this->getAnalysisResult($originalPath);
                $category = $result ? $result->category : 'unknown';
                $confidence = $result ? $result->confidenceScore . '%' : 'unknown';
                
                $report[] = "| `{$originalPath}` | `{$backupPath}` | {$category} | {$confidence} |";
            }
            $report[] = "";
        }

        // Errors
        if (!empty($this->errors)) {
            $report[] = "## Errors";
            $report[] = "";
            foreach ($this->errors as $filePath => $error) {
                $report[] = "- **{$filePath}:** {$error}";
            }
            $report[] = "";
        }

        // Restoration instructions
        $report[] = "## Restoration Instructions";
        $report[] = "";
        $report[] = "To restore files from this backup:";
        $report[] = "";
        $report[] = "### Restore Individual Files";
        $report[] = "```php";
        $report[] = "\$backupManager = new BackupManager('/path/to/project');";
        $report[] = "\$backupManager->restoreFile('backup/path', 'original/path');";
        $report[] = "```";
        $report[] = "";
        $report[] = "### Restore All Files (Complete Rollback)";
        $report[] = "```php";
        $report[] = "\$backupManager = new BackupManager('/path/to/project');";
        $report[] = "\$backupManager->restoreAll();";
        $report[] = "```";
        $report[] = "";

        // File analysis details
        $report[] = "## Analysis Details";
        $report[] = "";
        
        // Group files by category for detailed reporting
        $categories = [
            FileAnalysisResult::CATEGORY_ESSENTIAL => 'Essential Files (Kept)',
            FileAnalysisResult::CATEGORY_NON_ESSENTIAL => 'Non-Essential Files (Moved)',
            FileAnalysisResult::CATEGORY_UNCERTAIN => 'Uncertain Files (Review Required)'
        ];

        foreach ($categories as $category => $title) {
            $categoryFiles = $this->getFilesByCategory($category);
            if (!empty($categoryFiles)) {
                $report[] = "### {$title}";
                $report[] = "";
                
                foreach ($categoryFiles as $filePath => $result) {
                    $report[] = "#### `{$filePath}`";
                    $report[] = "";
                    $report[] = "- **Confidence:** {$result->confidenceScore}%";
                    $report[] = "- **Recommended Action:** {$result->recommendedAction}";
                    $report[] = "- **Reasons:**";
                    foreach ($result->reasons as $reason) {
                        $report[] = "  - {$reason}";
                    }
                    
                    if (!empty($result->dependencies)) {
                        $report[] = "- **Dependencies:** " . implode(', ', array_slice($result->dependencies, 0, 5));
                        if (count($result->dependencies) > 5) {
                            $report[] = "  (and " . (count($result->dependencies) - 5) . " more)";
                        }
                    }
                    
                    if (!empty($result->references)) {
                        $report[] = "- **Referenced by:** " . implode(', ', array_slice($result->references, 0, 5));
                        if (count($result->references) > 5) {
                            $report[] = "  (and " . (count($result->references) - 5) . " more)";
                        }
                    }
                    
                    $report[] = "";
                }
            }
        }

        return implode("\n", $report);
    }

    /**
     * Convert manifest to array for serialization
     */
    public function toArray(): array
    {
        return [
            'created_at' => $this->createdAt->format('c'),
            'moved_files' => $this->movedFiles,
            'analysis_results' => array_map(
                fn($result) => $result instanceof FileAnalysisResult ? $result->toArray() : $result,
                $this->analysisResults
            ),
            'project_state' => $this->projectState,
            'statistics' => $this->statistics,
            'errors' => $this->errors,
            'project_root' => $this->projectRoot
        ];
    }

    /**
     * Create manifest from array (deserialization)
     */
    public static function fromArray(array $data): self
    {
        $analysisResults = [];
        foreach ($data['analysis_results'] ?? [] as $filePath => $resultData) {
            if (is_array($resultData)) {
                $analysisResults[$filePath] = FileAnalysisResult::fromArray($resultData);
            }
        }

        $manifest = new self([], $analysisResults, $data['project_root'] ?? '');
        $manifest->createdAt = new \DateTime($data['created_at'] ?? 'now');
        $manifest->movedFiles = $data['moved_files'] ?? [];
        $manifest->projectState = $data['project_state'] ?? '';
        $manifest->statistics = $data['statistics'] ?? [];
        $manifest->errors = $data['errors'] ?? [];

        return $manifest;
    }

    /**
     * Calculate project state hash for integrity verification
     */
    private function calculateProjectState(): string
    {
        // Create a hash based on key project files and their modification times
        $keyFiles = [
            'composer.json',
            'composer.lock',
            '.env',
            'docker-compose.yml',
            'phpunit.xml'
        ];

        $stateData = [];
        foreach ($keyFiles as $file) {
            $fullPath = $this->projectRoot . '/' . $file;
            if (file_exists($fullPath)) {
                $stateData[$file] = [
                    'size' => filesize($fullPath),
                    'mtime' => filemtime($fullPath),
                    'hash' => hash_file('md5', $fullPath)
                ];
            }
        }

        return hash('sha256', json_encode($stateData));
    }

    /**
     * Calculate initial statistics from files to move
     */
    private function calculateStatistics(array $filesToMove): void
    {
        $this->statistics = [
            'total_analyzed' => count($this->analysisResults),
            'planned_move_count' => count($filesToMove),
            'moved_count' => 0,
            'kept_count' => 0,
            'review_count' => 0,
            'error_count' => 0,
            'total_size_planned' => 0,
            'total_size_moved' => 0,
            'by_category' => [],
            'by_action' => [],
            'by_confidence' => [
                'high' => 0,    // 80-100%
                'medium' => 0,  // 50-79%
                'low' => 0      // 0-49%
            ]
        ];

        // Calculate planned size
        foreach ($filesToMove as $filePath => $result) {
            $fullPath = $this->projectRoot . '/' . ltrim($filePath, '/');
            if (file_exists($fullPath)) {
                $this->statistics['total_size_planned'] += filesize($fullPath);
            }
        }

        // Analyze all results
        foreach ($this->analysisResults as $filePath => $result) {
            if (!($result instanceof FileAnalysisResult)) {
                continue;
            }

            // Count by category
            $category = $result->category;
            $this->statistics['by_category'][$category] = ($this->statistics['by_category'][$category] ?? 0) + 1;

            // Count by action
            $action = $result->recommendedAction ?? 'unknown';
            $this->statistics['by_action'][$action] = ($this->statistics['by_action'][$action] ?? 0) + 1;

            // Count by confidence level
            $confidence = $result->confidenceScore;
            if ($confidence >= 80) {
                $this->statistics['by_confidence']['high']++;
            } elseif ($confidence >= 50) {
                $this->statistics['by_confidence']['medium']++;
            } else {
                $this->statistics['by_confidence']['low']++;
            }

            // Count by final disposition
            if ($result->recommendedAction === FileAnalysisResult::ACTION_KEEP) {
                $this->statistics['kept_count']++;
            } elseif ($result->recommendedAction === FileAnalysisResult::ACTION_REVIEW) {
                $this->statistics['review_count']++;
            }
        }
    }

    /**
     * Update statistics after backup operation
     */
    private function updateStatistics(): void
    {
        $this->statistics['moved_count'] = count($this->movedFiles);
        $this->statistics['error_count'] = count($this->errors);

        // Calculate actual moved size
        $totalMovedSize = 0;
        foreach ($this->movedFiles as $originalPath => $backupPath) {
            $fullBackupPath = $this->projectRoot . '/backup/' . ltrim($backupPath, '/');
            if (file_exists($fullBackupPath)) {
                $totalMovedSize += filesize($fullBackupPath);
            }
        }
        $this->statistics['total_size_moved'] = $totalMovedSize;

        // Update success rate
        $totalPlanned = $this->statistics['planned_move_count'];
        $this->statistics['success_rate'] = $totalPlanned > 0 ? 
            round(($this->statistics['moved_count'] / $totalPlanned) * 100, 2) : 100;
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
     * Get summary of backup operation
     */
    public function getSummary(): array
    {
        return [
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'total_files_analyzed' => $this->statistics['total_analyzed'] ?? 0,
            'files_moved' => count($this->movedFiles),
            'files_with_errors' => count($this->errors),
            'success_rate' => $this->statistics['success_rate'] ?? 0,
            'total_size_moved' => $this->formatBytes($this->statistics['total_size_moved'] ?? 0),
            'is_successful' => $this->isSuccessful()
        ];
    }

    /**
     * Validate manifest integrity
     */
    public function validateIntegrity(): array
    {
        $issues = [];

        // Check if all moved files exist in backup
        foreach ($this->movedFiles as $originalPath => $backupPath) {
            $fullBackupPath = $this->projectRoot . '/backup/' . ltrim($backupPath, '/');
            if (!file_exists($fullBackupPath)) {
                $issues[] = "Backup file missing: {$backupPath}";
            }
        }

        // Check if original files were actually moved
        foreach ($this->movedFiles as $originalPath => $backupPath) {
            $fullOriginalPath = $this->projectRoot . '/' . ltrim($originalPath, '/');
            if (file_exists($fullOriginalPath)) {
                $issues[] = "Original file still exists: {$originalPath}";
            }
        }

        return $issues;
    }
}