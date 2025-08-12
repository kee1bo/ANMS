<?php

declare(strict_types=1);

namespace App\Application\Services\CodebaseAnalysis\Analyzers;

use App\Application\Services\CodebaseAnalysis\FileAnalyzerInterface;
use App\Application\Services\CodebaseAnalysis\Models\FileAnalysisResult;

/**
 * Analyzes files based on dependency relationships and autoload configuration
 */
class DependencyAnalyzer implements FileAnalyzerInterface
{
    private array $composerConfig = [];
    private array $psr4Namespaces = [];
    private array $dependencyGraph = [];
    private string $projectRoot;

    public function __construct(string $projectRoot)
    {
        $this->projectRoot = rtrim($projectRoot, '/');
        $this->loadComposerConfig();
        $this->buildDependencyGraph();
    }

    public function analyze(string $filePath): FileAnalysisResult
    {
        $reasons = [];
        $dependencies = [];
        $references = [];
        $metadata = [];
        
        // Check if file is part of PSR-4 autoload structure
        $isPsr4File = $this->isPsr4AutoloadFile($filePath);
        if ($isPsr4File) {
            $reasons[] = 'Part of PSR-4 autoload structure';
        }

        // Check if file is required by composer
        $isComposerRequired = $this->isComposerRequiredFile($filePath);
        if ($isComposerRequired) {
            $reasons[] = 'Required by composer configuration';
        }

        // Analyze PHP file dependencies
        if ($this->isPhpFile($filePath)) {
            $fileDependencies = $this->analyzePhpDependencies($filePath);
            $dependencies = array_merge($dependencies, $fileDependencies['dependencies']);
            $references = array_merge($references, $fileDependencies['references']);
            
            if (!empty($fileDependencies['dependencies'])) {
                $reasons[] = sprintf('Has %d dependencies', count($fileDependencies['dependencies']));
            }
            
            if (!empty($fileDependencies['references'])) {
                $reasons[] = sprintf('Referenced by %d files', count($fileDependencies['references']));
            }
        }

        // Check if file is a core configuration file
        $isCoreConfig = $this->isCoreConfigurationFile($filePath);
        if ($isCoreConfig) {
            $reasons[] = 'Core configuration file';
        }

        // Check if file is a database migration
        $isMigration = $this->isDatabaseMigration($filePath);
        if ($isMigration) {
            $reasons[] = 'Database migration file';
        }

        // Determine category and confidence
        $category = $this->determineCategory($filePath, $isPsr4File, $isComposerRequired, $isCoreConfig, $isMigration, $dependencies, $references);
        $confidence = $this->calculateConfidence($isPsr4File, $isComposerRequired, $isCoreConfig, $isMigration, $dependencies, $references);

        $metadata = [
            'is_psr4_file' => $isPsr4File,
            'is_composer_required' => $isComposerRequired,
            'is_core_config' => $isCoreConfig,
            'is_migration' => $isMigration,
            'dependency_count' => count($dependencies),
            'reference_count' => count($references)
        ];

        $recommendedAction = match ($category) {
            FileAnalysisResult::CATEGORY_ESSENTIAL => FileAnalysisResult::ACTION_KEEP,
            FileAnalysisResult::CATEGORY_NON_ESSENTIAL => FileAnalysisResult::ACTION_MOVE,
            default => FileAnalysisResult::ACTION_REVIEW
        };

        return new FileAnalysisResult(
            filePath: $filePath,
            category: $category,
            confidenceScore: $confidence,
            reasons: $reasons,
            dependencies: $dependencies,
            references: $references,
            recommendedAction: $recommendedAction,
            metadata: $metadata
        );
    }

    public function getCategory(): string
    {
        return 'dependency';
    }

    public function getPriority(): int
    {
        return 90; // High priority - dependency analysis is crucial
    }

    public function canAnalyze(string $filePath): bool
    {
        // Can analyze all files, but focus on PHP files and configuration files
        return true;
    }

    /**
     * Load composer.json configuration
     */
    private function loadComposerConfig(): void
    {
        $composerPath = $this->projectRoot . '/composer.json';
        
        if (file_exists($composerPath)) {
            $content = file_get_contents($composerPath);
            $this->composerConfig = json_decode($content, true) ?? [];
            
            // Extract PSR-4 namespaces
            if (isset($this->composerConfig['autoload']['psr-4'])) {
                $this->psr4Namespaces = $this->composerConfig['autoload']['psr-4'];
            }
            
            if (isset($this->composerConfig['autoload-dev']['psr-4'])) {
                $this->psr4Namespaces = array_merge(
                    $this->psr4Namespaces,
                    $this->composerConfig['autoload-dev']['psr-4']
                );
            }
        }
    }

    /**
     * Build dependency graph by analyzing PHP files
     */
    private function buildDependencyGraph(): void
    {
        // This is a simplified version - in practice, you'd want to cache this
        // and only rebuild when files change
        $phpFiles = $this->findPhpFiles();
        
        foreach ($phpFiles as $file) {
            $this->dependencyGraph[$file] = $this->analyzePhpDependencies($file);
        }
    }

    /**
     * Check if file is part of PSR-4 autoload structure
     */
    private function isPsr4AutoloadFile(string $filePath): bool
    {
        foreach ($this->psr4Namespaces as $namespace => $directory) {
            $directory = rtrim($directory, '/') . '/';
            if (str_starts_with($filePath, $directory) && str_ends_with($filePath, '.php')) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if file is required by composer configuration
     */
    private function isComposerRequiredFile(string $filePath): bool
    {
        $requiredFiles = [
            'composer.json',
            'composer.lock',
            '.env',
            '.env.example',
            'docker-compose.yml',
            'Dockerfile',
            'phpunit.xml',
            'phpstan.neon',
            'phpcs.xml'
        ];

        return in_array($filePath, $requiredFiles) || str_starts_with($filePath, 'vendor/');
    }

    /**
     * Check if file is a core configuration file
     */
    private function isCoreConfigurationFile(string $filePath): bool
    {
        $configPatterns = [
            'config/',
            'bootstrap/',
            '.env',
            'docker-compose',
            'Dockerfile',
            'nginx.conf',
            'apache.conf'
        ];

        foreach ($configPatterns as $pattern) {
            if (str_contains($filePath, $pattern)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if file is a database migration
     */
    private function isDatabaseMigration(string $filePath): bool
    {
        return str_contains($filePath, 'database/migrations/') || 
               str_contains($filePath, 'migrations/') ||
               (str_contains($filePath, 'database/') && str_contains($filePath, 'migration'));
    }

    /**
     * Analyze PHP file for dependencies and references
     */
    private function analyzePhpDependencies(string $filePath): array
    {
        $absolutePath = $this->projectRoot . '/' . ltrim($filePath, '/');
        
        if (!file_exists($absolutePath) || !$this->isPhpFile($filePath)) {
            return ['dependencies' => [], 'references' => []];
        }

        $content = file_get_contents($absolutePath);
        $dependencies = [];
        $references = [];

        // Find use statements
        if (preg_match_all('/^use\s+([^;]+);/m', $content, $matches)) {
            foreach ($matches[1] as $use) {
                $use = trim($use);
                // Convert namespace to file path (simplified)
                $dependencies[] = $this->namespaceToFilePath($use);
            }
        }

        // Find include/require statements
        if (preg_match_all('/(include|require)(_once)?\s*[\'"]([^\'"]+)[\'"]/', $content, $matches)) {
            foreach ($matches[3] as $includePath) {
                $dependencies[] = $this->resolveIncludePath($includePath, $filePath);
            }
        }

        // Find class instantiations and static calls (simplified)
        if (preg_match_all('/new\s+([A-Za-z_][A-Za-z0-9_\\\\]*)|([A-Za-z_][A-Za-z0-9_\\\\]*)::/m', $content, $matches)) {
            foreach (array_merge($matches[1], $matches[2]) as $className) {
                if (!empty($className)) {
                    $dependencies[] = $this->namespaceToFilePath($className);
                }
            }
        }

        return [
            'dependencies' => array_filter(array_unique($dependencies)),
            'references' => $references // This would be populated by reverse lookup
        ];
    }

    /**
     * Convert namespace to file path
     */
    private function namespaceToFilePath(string $namespace): string
    {
        $namespace = ltrim($namespace, '\\');
        
        foreach ($this->psr4Namespaces as $prefix => $directory) {
            $prefix = rtrim($prefix, '\\') . '\\';
            if (str_starts_with($namespace, $prefix)) {
                $relativePath = substr($namespace, strlen($prefix));
                $filePath = $directory . str_replace('\\', '/', $relativePath) . '.php';
                return ltrim($filePath, '/');
            }
        }

        // Fallback: convert namespace directly to path
        return str_replace('\\', '/', $namespace) . '.php';
    }

    /**
     * Resolve include path relative to current file
     */
    private function resolveIncludePath(string $includePath, string $currentFile): string
    {
        if (str_starts_with($includePath, '/')) {
            return ltrim($includePath, '/');
        }

        $currentDir = dirname($currentFile);
        $resolvedPath = $currentDir . '/' . $includePath;
        
        // Normalize path (remove ./ and ../)
        $parts = explode('/', $resolvedPath);
        $normalized = [];
        
        foreach ($parts as $part) {
            if ($part === '.' || $part === '') {
                continue;
            } elseif ($part === '..') {
                array_pop($normalized);
            } else {
                $normalized[] = $part;
            }
        }

        return implode('/', $normalized);
    }

    /**
     * Find all PHP files in the project
     */
    private function findPhpFiles(): array
    {
        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($this->projectRoot, \RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $relativePath = substr($file->getPathname(), strlen($this->projectRoot) + 1);
                
                // Skip vendor directory
                if (!str_starts_with($relativePath, 'vendor/')) {
                    $files[] = $relativePath;
                }
            }
        }

        return $files;
    }

    /**
     * Check if file is a PHP file
     */
    private function isPhpFile(string $filePath): bool
    {
        return str_ends_with(strtolower($filePath), '.php');
    }

    /**
     * Determine file category based on analysis
     */
    private function determineCategory(
        string $filePath,
        bool $isPsr4File,
        bool $isComposerRequired,
        bool $isCoreConfig,
        bool $isMigration,
        array $dependencies,
        array $references
    ): string {
        // Essential files
        if ($isPsr4File || $isComposerRequired || $isCoreConfig || $isMigration) {
            return FileAnalysisResult::CATEGORY_ESSENTIAL;
        }

        // Files with many dependencies or references are likely essential
        if (count($dependencies) > 3 || count($references) > 2) {
            return FileAnalysisResult::CATEGORY_ESSENTIAL;
        }

        // Entry points are essential
        if (str_contains($filePath, 'public/index.php') || 
            str_contains($filePath, 'public/api.php') ||
            basename($filePath) === 'index.php') {
            return FileAnalysisResult::CATEGORY_ESSENTIAL;
        }

        // If we can't determine, mark as uncertain
        return FileAnalysisResult::CATEGORY_UNCERTAIN;
    }

    /**
     * Calculate confidence score
     */
    private function calculateConfidence(
        bool $isPsr4File,
        bool $isComposerRequired,
        bool $isCoreConfig,
        bool $isMigration,
        array $dependencies,
        array $references
    ): int {
        $confidence = 0;

        if ($isPsr4File) $confidence += 30;
        if ($isComposerRequired) $confidence += 40;
        if ($isCoreConfig) $confidence += 35;
        if ($isMigration) $confidence += 35;
        
        // Add confidence based on dependency count
        $confidence += min(20, count($dependencies) * 3);
        $confidence += min(15, count($references) * 5);

        return min(100, $confidence);
    }
}