<?php

declare(strict_types=1);

namespace App\Application\Services\CodebaseAnalysis;

use App\Application\Services\CodebaseAnalysis\Models\FileAnalysisResult;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;

/**
 * Main orchestrator for codebase analysis and cleanup
 */
class CodebaseAnalyzer
{
    /** @var FileAnalyzerInterface[] */
    private array $analyzers = [];
    
    private LoggerInterface $logger;
    private string $projectRoot;
    private array $excludePatterns = [
        '.git',
        'vendor',
        'node_modules',
        '.kiro'
    ];

    public function __construct(
        string $projectRoot,
        ?LoggerInterface $logger = null
    ) {
        $this->projectRoot = rtrim($projectRoot, '/');
        $this->logger = $logger ?? new NullLogger();
    }

    /**
     * Register a file analyzer
     */
    public function addAnalyzer(FileAnalyzerInterface $analyzer): void
    {
        $this->analyzers[] = $analyzer;
        
        // Sort analyzers by priority (highest first)
        usort($this->analyzers, fn($a, $b) => $b->getPriority() <=> $a->getPriority());
        
        $this->logger->info('Added analyzer: ' . $analyzer->getCategory());
    }

    /**
     * Analyze the entire codebase
     */
    public function analyzeCodebase(): array
    {
        $this->logger->info('Starting codebase analysis', ['project_root' => $this->projectRoot]);
        
        $files = $this->getAllFiles();
        $results = [];
        $processed = 0;
        $total = count($files);

        foreach ($files as $file) {
            $processed++;
            $this->logger->debug("Analyzing file {$processed}/{$total}: {$file}");
            
            $result = $this->analyzeFile($file);
            $results[$file] = $result;
            
            // Log progress every 50 files
            if ($processed % 50 === 0) {
                $this->logger->info("Progress: {$processed}/{$total} files analyzed");
            }
        }

        $this->logger->info('Codebase analysis complete', [
            'total_files' => $total,
            'essential' => $this->countByCategory($results, FileAnalysisResult::CATEGORY_ESSENTIAL),
            'non_essential' => $this->countByCategory($results, FileAnalysisResult::CATEGORY_NON_ESSENTIAL),
            'uncertain' => $this->countByCategory($results, FileAnalysisResult::CATEGORY_UNCERTAIN)
        ]);

        return $results;
    }

    /**
     * Analyze a single file using all registered analyzers
     */
    public function analyzeFile(string $filePath): FileAnalysisResult
    {
        $absolutePath = $this->getAbsolutePath($filePath);
        
        if (!file_exists($absolutePath)) {
            return new FileAnalysisResult(
                filePath: $filePath,
                category: FileAnalysisResult::CATEGORY_UNCERTAIN,
                confidenceScore: 0,
                reasons: ['File does not exist'],
                recommendedAction: FileAnalysisResult::ACTION_REVIEW
            );
        }

        $results = [];
        $applicableAnalyzers = 0;

        foreach ($this->analyzers as $analyzer) {
            if ($analyzer->canAnalyze($filePath)) {
                $applicableAnalyzers++;
                try {
                    $result = $analyzer->analyze($filePath);
                    $results[] = $result;
                    
                    $this->logger->debug('Analyzer result', [
                        'analyzer' => $analyzer->getCategory(),
                        'file' => $filePath,
                        'category' => $result->category,
                        'confidence' => $result->confidenceScore
                    ]);
                } catch (\Exception $e) {
                    $this->logger->warning('Analyzer failed', [
                        'analyzer' => $analyzer->getCategory(),
                        'file' => $filePath,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }

        if (empty($results)) {
            return new FileAnalysisResult(
                filePath: $filePath,
                category: FileAnalysisResult::CATEGORY_UNCERTAIN,
                confidenceScore: 0,
                reasons: ['No applicable analyzers found'],
                recommendedAction: FileAnalysisResult::ACTION_REVIEW
            );
        }

        return $this->combineResults($filePath, $results);
    }

    /**
     * Get all files in the project (excluding patterns)
     */
    private function getAllFiles(): array
    {
        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($this->projectRoot, \RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $relativePath = $this->getRelativePath($file->getPathname());
                
                if (!$this->shouldExclude($relativePath)) {
                    $files[] = $relativePath;
                }
            }
        }

        sort($files);
        return $files;
    }

    /**
     * Check if a file should be excluded from analysis
     */
    private function shouldExclude(string $relativePath): bool
    {
        foreach ($this->excludePatterns as $pattern) {
            if (str_starts_with($relativePath, $pattern . '/') || $relativePath === $pattern) {
                return true;
            }
        }
        return false;
    }

    /**
     * Combine results from multiple analyzers
     */
    private function combineResults(string $filePath, array $results): FileAnalysisResult
    {
        // Weighted scoring based on analyzer priority and confidence
        $totalWeight = 0;
        $weightedScores = [
            FileAnalysisResult::CATEGORY_ESSENTIAL => 0,
            FileAnalysisResult::CATEGORY_NON_ESSENTIAL => 0,
            FileAnalysisResult::CATEGORY_UNCERTAIN => 0
        ];
        
        $allReasons = [];
        $allDependencies = [];
        $allReferences = [];
        $allMetadata = [];

        foreach ($results as $result) {
            $analyzer = $this->findAnalyzerByResult($result);
            $weight = $analyzer ? $analyzer->getPriority() * ($result->confidenceScore / 100) : $result->confidenceScore / 100;
            
            $totalWeight += $weight;
            $weightedScores[$result->category] += $weight;
            
            $allReasons = array_merge($allReasons, $result->reasons);
            $allDependencies = array_merge($allDependencies, $result->dependencies);
            $allReferences = array_merge($allReferences, $result->references);
            $allMetadata = array_merge($allMetadata, $result->metadata);
        }

        // Determine final category based on weighted scores
        $finalCategory = array_keys($weightedScores, max($weightedScores))[0];
        $finalConfidence = $totalWeight > 0 ? (int)round(($weightedScores[$finalCategory] / $totalWeight) * 100) : 0;

        // Determine recommended action
        $recommendedAction = match ($finalCategory) {
            FileAnalysisResult::CATEGORY_ESSENTIAL => FileAnalysisResult::ACTION_KEEP,
            FileAnalysisResult::CATEGORY_NON_ESSENTIAL => FileAnalysisResult::ACTION_MOVE,
            default => FileAnalysisResult::ACTION_REVIEW
        };

        return new FileAnalysisResult(
            filePath: $filePath,
            category: $finalCategory,
            confidenceScore: $finalConfidence,
            reasons: array_unique($allReasons),
            dependencies: array_unique($allDependencies),
            references: array_unique($allReferences),
            recommendedAction: $recommendedAction,
            metadata: $allMetadata
        );
    }

    /**
     * Find analyzer that produced a specific result
     */
    private function findAnalyzerByResult(FileAnalysisResult $result): ?FileAnalyzerInterface
    {
        // This is a simplified approach - in practice, you might want to track this more explicitly
        foreach ($this->analyzers as $analyzer) {
            if ($analyzer->canAnalyze($result->filePath)) {
                return $analyzer;
            }
        }
        return null;
    }

    /**
     * Count results by category
     */
    private function countByCategory(array $results, string $category): int
    {
        return count(array_filter($results, fn($result) => $result->category === $category));
    }

    /**
     * Get absolute path from relative path
     */
    private function getAbsolutePath(string $relativePath): string
    {
        return $this->projectRoot . '/' . ltrim($relativePath, '/');
    }

    /**
     * Get relative path from absolute path
     */
    private function getRelativePath(string $absolutePath): string
    {
        $projectRoot = $this->projectRoot . '/';
        if (str_starts_with($absolutePath, $projectRoot)) {
            return substr($absolutePath, strlen($projectRoot));
        }
        return $absolutePath;
    }

    /**
     * Add exclude pattern
     */
    public function addExcludePattern(string $pattern): void
    {
        $this->excludePatterns[] = $pattern;
    }

    /**
     * Get current exclude patterns
     */
    public function getExcludePatterns(): array
    {
        return $this->excludePatterns;
    }
}