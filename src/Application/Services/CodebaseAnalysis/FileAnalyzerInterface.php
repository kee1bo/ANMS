<?php

declare(strict_types=1);

namespace App\Application\Services\CodebaseAnalysis;

use App\Application\Services\CodebaseAnalysis\Models\FileAnalysisResult;

/**
 * Interface for file analyzers that categorize files based on different criteria
 */
interface FileAnalyzerInterface
{
    /**
     * Analyze a file and return categorization result
     */
    public function analyze(string $filePath): FileAnalysisResult;

    /**
     * Get the category this analyzer focuses on
     */
    public function getCategory(): string;

    /**
     * Get the priority of this analyzer (higher = more important)
     */
    public function getPriority(): int;

    /**
     * Check if this analyzer can handle the given file
     */
    public function canAnalyze(string $filePath): bool;
}