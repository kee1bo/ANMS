<?php

declare(strict_types=1);

namespace App\Application\Services\CodebaseAnalysis\Analyzers;

use App\Application\Services\CodebaseAnalysis\FileAnalyzerInterface;
use App\Application\Services\CodebaseAnalysis\Models\FileAnalysisResult;

/**
 * Analyzes files based on actual usage in the codebase
 */
class UsageAnalyzer implements FileAnalyzerInterface
{
    private string $projectRoot;
    private array $assetReferences = [];
    private array $migrationDependencies = [];
    private array $apiEndpoints = [];
    private bool $cacheBuilt = false;

    public function __construct(string $projectRoot)
    {
        $this->projectRoot = rtrim($projectRoot, '/');
    }

    public function analyze(string $filePath): FileAnalysisResult
    {
        if (!$this->cacheBuilt) {
            $this->buildUsageCache();
        }

        $reasons = [];
        $dependencies = [];
        $references = [];
        $metadata = [];
        
        // Check if file is referenced as an asset
        $assetUsage = $this->checkAssetUsage($filePath);
        if ($assetUsage) {
            $reasons[] = sprintf('Referenced in %d files as asset', count($assetUsage['references']));
            $references = array_merge($references, $assetUsage['references']);
            $metadata['asset_references'] = $assetUsage['references'];
        }

        // Check if file is a migration with dependencies
        $migrationUsage = $this->checkMigrationUsage($filePath);
        if ($migrationUsage) {
            $reasons[] = 'Active database migration';
            $metadata['migration_order'] = $migrationUsage['order'];
            $metadata['migration_dependencies'] = $migrationUsage['dependencies'];
        }

        // Check if file defines API endpoints
        $apiUsage = $this->checkApiEndpointUsage($filePath);
        if ($apiUsage) {
            $reasons[] = sprintf('Defines %d API endpoints', count($apiUsage['endpoints']));
            $metadata['api_endpoints'] = $apiUsage['endpoints'];
        }

        // Check if file is included/required by other files
        $includeUsage = $this->checkIncludeUsage($filePath);
        if ($includeUsage) {
            $reasons[] = sprintf('Included/required by %d files', count($includeUsage['references']));
            $references = array_merge($references, $includeUsage['references']);
            $metadata['include_references'] = $includeUsage['references'];
        }

        // Check if file is a template or view
        $templateUsage = $this->checkTemplateUsage($filePath);
        if ($templateUsage) {
            $reasons[] = 'Used as template or view';
            $references = array_merge($references, $templateUsage['references']);
            $metadata['template_usage'] = $templateUsage['usage_type'];
        }

        // Check if file is an entry point
        $entryPointUsage = $this->checkEntryPointUsage($filePath);
        if ($entryPointUsage) {
            $reasons[] = 'Application entry point';
            $metadata['entry_point_type'] = $entryPointUsage['type'];
        }

        // Check if file is unused
        $isUnused = $this->checkIfUnused($filePath, $references);
        if ($isUnused) {
            $reasons[] = 'No references found - potentially unused';
            $metadata['potentially_unused'] = true;
        }

        // Determine category and confidence
        $category = $this->determineCategory($filePath, $assetUsage, $migrationUsage, $apiUsage, $includeUsage, $templateUsage, $entryPointUsage, $isUnused);
        $confidence = $this->calculateConfidence($assetUsage, $migrationUsage, $apiUsage, $includeUsage, $templateUsage, $entryPointUsage, $isUnused);

        if (empty($reasons)) {
            $reasons[] = 'No specific usage patterns detected';
        }

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
            references: array_unique($references),
            recommendedAction: $recommendedAction,
            metadata: $metadata
        );
    }

    public function getCategory(): string
    {
        return 'usage';
    }

    public function getPriority(): int
    {
        return 80; // High priority - actual usage is very important
    }

    public function canAnalyze(string $filePath): bool
    {
        return true; // Can analyze all files for usage
    }

    /**
     * Build cache of usage patterns across the codebase
     */
    private function buildUsageCache(): void
    {
        $this->buildAssetReferences();
        $this->buildMigrationDependencies();
        $this->buildApiEndpoints();
        $this->cacheBuilt = true;
    }

    /**
     * Build cache of asset references (CSS, JS, images)
     */
    private function buildAssetReferences(): void
    {
        $htmlPhpFiles = $this->findFiles(['php', 'html']);
        
        foreach ($htmlPhpFiles as $file) {
            $content = $this->getFileContent($file);
            if ($content === null) continue;

            // Find CSS references
            if (preg_match_all('/href=["\']([^"\']+\.css)["\']/', $content, $matches)) {
                foreach ($matches[1] as $cssPath) {
                    $normalizedPath = $this->normalizePath($cssPath);
                    $this->assetReferences[$normalizedPath][] = $file;
                }
            }

            // Find JS references
            if (preg_match_all('/src=["\']([^"\']+\.js)["\']/', $content, $matches)) {
                foreach ($matches[1] as $jsPath) {
                    $normalizedPath = $this->normalizePath($jsPath);
                    $this->assetReferences[$normalizedPath][] = $file;
                }
            }

            // Find image references
            if (preg_match_all('/src=["\']([^"\']+\.(png|jpg|jpeg|gif|svg))["\']/', $content, $matches)) {
                foreach ($matches[1] as $imagePath) {
                    $normalizedPath = $this->normalizePath($imagePath);
                    $this->assetReferences[$normalizedPath][] = $file;
                }
            }

            // Find background image references in CSS
            if (preg_match_all('/background-image:\s*url\(["\']?([^"\']+\.(png|jpg|jpeg|gif|svg))["\']?\)/', $content, $matches)) {
                foreach ($matches[1] as $imagePath) {
                    $normalizedPath = $this->normalizePath($imagePath);
                    $this->assetReferences[$normalizedPath][] = $file;
                }
            }
        }
    }

    /**
     * Build cache of migration dependencies
     */
    private function buildMigrationDependencies(): void
    {
        $migrationFiles = $this->findFiles(['php'], 'database/migrations/');
        
        foreach ($migrationFiles as $file) {
            $content = $this->getFileContent($file);
            if ($content === null) continue;

            // Extract migration order from filename
            if (preg_match('/(\d{3})_/', basename($file), $matches)) {
                $order = (int)$matches[1];
                $this->migrationDependencies[$file] = [
                    'order' => $order,
                    'dependencies' => $this->findMigrationDependencies($content)
                ];
            }
        }
    }

    /**
     * Build cache of API endpoints
     */
    private function buildApiEndpoints(): void
    {
        $apiFiles = $this->findFiles(['php'], 'public/api/');
        
        foreach ($apiFiles as $file) {
            $content = $this->getFileContent($file);
            if ($content === null) continue;

            $endpoints = [];
            
            // Find route definitions (simplified)
            if (preg_match_all('/\$_(?:GET|POST|PUT|DELETE)\[/', $content, $matches)) {
                $endpoints[] = basename($file, '.php');
            }

            // Find switch statements for different actions
            if (preg_match_all('/case\s+["\']([^"\']+)["\']/', $content, $matches)) {
                $endpoints = array_merge($endpoints, $matches[1]);
            }

            if (!empty($endpoints)) {
                $this->apiEndpoints[$file] = $endpoints;
            }
        }
    }

    /**
     * Check if file is referenced as an asset
     */
    private function checkAssetUsage(string $filePath): ?array
    {
        // Check direct references
        if (isset($this->assetReferences[$filePath])) {
            return ['references' => $this->assetReferences[$filePath]];
        }

        // Check with different path variations
        $variations = [
            'assets/' . $filePath,
            'public/' . $filePath,
            'public/assets/' . $filePath,
            ltrim($filePath, '/'),
            '/' . ltrim($filePath, '/')
        ];

        foreach ($variations as $variation) {
            if (isset($this->assetReferences[$variation])) {
                return ['references' => $this->assetReferences[$variation]];
            }
        }

        return null;
    }

    /**
     * Check if file is a migration with dependencies
     */
    private function checkMigrationUsage(string $filePath): ?array
    {
        return $this->migrationDependencies[$filePath] ?? null;
    }

    /**
     * Check if file defines API endpoints
     */
    private function checkApiEndpointUsage(string $filePath): ?array
    {
        if (isset($this->apiEndpoints[$filePath])) {
            return ['endpoints' => $this->apiEndpoints[$filePath]];
        }
        return null;
    }

    /**
     * Check if file is included/required by other files
     */
    private function checkIncludeUsage(string $filePath): ?array
    {
        $references = [];
        $phpFiles = $this->findFiles(['php']);
        
        foreach ($phpFiles as $file) {
            if ($file === $filePath) continue;
            
            $content = $this->getFileContent($file);
            if ($content === null) continue;

            // Check for include/require statements
            $patterns = [
                '/(?:include|require)(?:_once)?\s*[\'"]([^\'"]+)[\'"]/',
                '/(?:include|require)(?:_once)?\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)/',
            ];

            foreach ($patterns as $pattern) {
                if (preg_match_all($pattern, $content, $matches)) {
                    foreach ($matches[1] as $includePath) {
                        $resolvedPath = $this->resolveIncludePath($includePath, $file);
                        if ($resolvedPath === $filePath) {
                            $references[] = $file;
                        }
                    }
                }
            }
        }

        return !empty($references) ? ['references' => $references] : null;
    }

    /**
     * Check if file is used as a template or view
     */
    private function checkTemplateUsage(string $filePath): ?array
    {
        $references = [];
        $usageType = null;

        // Check if it's included in other PHP files
        if (str_ends_with($filePath, '.php') && (
            str_contains($filePath, 'template') ||
            str_contains($filePath, 'view') ||
            str_contains($filePath, 'partial') ||
            str_contains($filePath, 'component')
        )) {
            $usageType = 'template';
        }

        // Check if it's a dashboard or landing page
        if (str_contains($filePath, 'dashboard.php') || str_contains($filePath, 'landing.php')) {
            $usageType = 'page_template';
            
            // Find files that include this template
            $phpFiles = $this->findFiles(['php']);
            foreach ($phpFiles as $file) {
                $content = $this->getFileContent($file);
                if ($content && str_contains($content, basename($filePath))) {
                    $references[] = $file;
                }
            }
        }

        return $usageType ? ['references' => $references, 'usage_type' => $usageType] : null;
    }

    /**
     * Check if file is an entry point
     */
    private function checkEntryPointUsage(string $filePath): ?array
    {
        $entryPoints = [
            'public/index.php' => 'main_entry',
            'public/api.php' => 'api_entry',
            'public/login.php' => 'auth_entry',
            'public/register.php' => 'auth_entry',
            'public/admin.php' => 'admin_entry',
            'index.php' => 'main_entry',
        ];

        return isset($entryPoints[$filePath]) ? ['type' => $entryPoints[$filePath]] : null;
    }

    /**
     * Check if file appears to be unused
     */
    private function checkIfUnused(string $filePath, array $references): bool
    {
        // If file has references, it's not unused
        if (!empty($references)) {
            return false;
        }

        // Entry points are never unused
        if ($this->checkEntryPointUsage($filePath)) {
            return false;
        }

        // Configuration files are never unused
        $configFiles = ['composer.json', '.env', 'docker-compose.yml', 'phpunit.xml'];
        if (in_array($filePath, $configFiles)) {
            return false;
        }

        // Files in src/ directory are assumed to be used (PSR-4 autoloading)
        if (str_starts_with($filePath, 'src/')) {
            return false;
        }

        // Check file age and patterns that suggest it might be unused
        $unusedPatterns = [
            '/test[_-].*\.php$/',
            '/.*[_-]test\.php$/',
            '/debug.*\.php$/',
            '/.*debug\.php$/',
            '/backup.*\.(php|html|js|css)$/',
            '/.*backup\.(php|html|js|css)$/',
            '/old.*\.(php|html|js|css)$/',
            '/.*\.old$/',
            '/.*\.bak$/',
        ];

        foreach ($unusedPatterns as $pattern) {
            if (preg_match($pattern, $filePath)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determine file category based on usage analysis
     */
    private function determineCategory(
        string $filePath,
        ?array $assetUsage,
        ?array $migrationUsage,
        ?array $apiUsage,
        ?array $includeUsage,
        ?array $templateUsage,
        ?array $entryPointUsage,
        bool $isUnused
    ): string {
        // Essential files
        if ($entryPointUsage || $migrationUsage || $apiUsage) {
            return FileAnalysisResult::CATEGORY_ESSENTIAL;
        }

        if ($assetUsage && count($assetUsage['references']) > 0) {
            return FileAnalysisResult::CATEGORY_ESSENTIAL;
        }

        if ($includeUsage && count($includeUsage['references']) > 1) {
            return FileAnalysisResult::CATEGORY_ESSENTIAL;
        }

        if ($templateUsage && !empty($templateUsage['references'])) {
            return FileAnalysisResult::CATEGORY_ESSENTIAL;
        }

        // Non-essential files
        if ($isUnused) {
            return FileAnalysisResult::CATEGORY_NON_ESSENTIAL;
        }

        // Default to uncertain
        return FileAnalysisResult::CATEGORY_UNCERTAIN;
    }

    /**
     * Calculate confidence score
     */
    private function calculateConfidence(
        ?array $assetUsage,
        ?array $migrationUsage,
        ?array $apiUsage,
        ?array $includeUsage,
        ?array $templateUsage,
        ?array $entryPointUsage,
        bool $isUnused
    ): int {
        $confidence = 0;

        if ($entryPointUsage) $confidence += 40;
        if ($migrationUsage) $confidence += 35;
        if ($apiUsage) $confidence += 30;
        
        if ($assetUsage) {
            $confidence += min(25, count($assetUsage['references']) * 5);
        }
        
        if ($includeUsage) {
            $confidence += min(20, count($includeUsage['references']) * 3);
        }
        
        if ($templateUsage) $confidence += 25;
        
        if ($isUnused) $confidence += 30;

        return min(100, max(10, $confidence));
    }

    /**
     * Find files with specific extensions in optional directory
     */
    private function findFiles(array $extensions, string $directory = ''): array
    {
        $files = [];
        $searchPath = $directory ? $this->projectRoot . '/' . trim($directory, '/') : $this->projectRoot;
        
        if (!is_dir($searchPath)) {
            return $files;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($searchPath, \RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $extension = strtolower($file->getExtension());
                if (in_array($extension, $extensions)) {
                    $relativePath = substr($file->getPathname(), strlen($this->projectRoot) + 1);
                    $files[] = $relativePath;
                }
            }
        }

        return $files;
    }

    /**
     * Get file content safely
     */
    private function getFileContent(string $filePath): ?string
    {
        $absolutePath = $this->projectRoot . '/' . ltrim($filePath, '/');
        return file_exists($absolutePath) ? file_get_contents($absolutePath) : null;
    }

    /**
     * Normalize asset path for consistent lookup
     */
    private function normalizePath(string $path): string
    {
        // Remove leading slash and normalize
        $path = ltrim($path, '/');
        
        // Remove query parameters
        if (($pos = strpos($path, '?')) !== false) {
            $path = substr($path, 0, $pos);
        }
        
        return $path;
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
        
        // Normalize path
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
     * Find migration dependencies in content
     */
    private function findMigrationDependencies(string $content): array
    {
        $dependencies = [];
        
        // Look for references to other tables or migrations
        if (preg_match_all('/Schema::table\([\'"]([^\'"]+)[\'"]/', $content, $matches)) {
            $dependencies = array_merge($dependencies, $matches[1]);
        }
        
        return array_unique($dependencies);
    }
}