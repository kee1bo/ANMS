<?php

declare(strict_types=1);

namespace App\Application\Services\CodebaseAnalysis\Analyzers;

use App\Application\Services\CodebaseAnalysis\FileAnalyzerInterface;
use App\Application\Services\CodebaseAnalysis\Models\FileAnalysisResult;

/**
 * Analyzes files based on naming patterns and directory structure
 */
class PatternAnalyzer implements FileAnalyzerInterface
{
    private array $testPatterns = [
        // Test file patterns
        '/^test[_-].*\.php$/i',
        '/.*[_-]test\.php$/i',
        '/.*Test\.php$/',
        '/^.*test.*\.html$/i',
        '/^test[_-].*\.html$/i',
        // Test directories
        '/^tests\//',
        '/\/tests\//',
        '/^test\//',
        '/\/test\//',
    ];

    private array $debugPatterns = [
        // Debug file patterns
        '/^debug[_-].*\.(php|html|js)$/i',
        '/.*[_-]debug\.(php|html|js)$/i',
        '/^.*debug.*\.html$/i',
        '/\.debug\.(php|html|js)$/i',
        // Debug directories
        '/^debug\//',
        '/\/debug\//',
    ];

    private array $backupPatterns = [
        // Backup file patterns
        '/.*[_-]backup\.(php|html|js|css)$/i',
        '/.*\.backup$/i',
        '/.*\.bak$/i',
        '/.*\.old$/i',
        '/.*~$/i',
        '/.*\.orig$/i',
        '/.*[_-]copy\.(php|html|js|css)$/i',
        // Backup directories
        '/^backup\//',
        '/\/backup\//',
        '/^backups\//',
        '/\/backups\//',
        '/^old\//',
        '/\/old\//',
    ];

    private array $documentationPatterns = [
        // Documentation files
        '/.*\.md$/i',
        '/.*\.txt$/i',
        '/.*\.docx?$/i',
        '/.*\.pdf$/i',
        '/^readme/i',
        '/^changelog/i',
        '/^license/i',
        '/^contributing/i',
        // Report and artifact patterns
        '/.*report.*\.(md|docx?|pdf)$/i',
        '/.*artifact.*\.(md|docx?|pdf)$/i',
        '/^anms.*report.*\.(md|docx?)$/i',
        '/^anms.*artifact.*\.(md|docx?)$/i',
        // Documentation directories
        '/^docs\//',
        '/\/docs\//',
        '/^documentation\//',
        '/\/documentation\//',
        '/^doc\//',
        '/\/doc\//',
    ];

    private array $temporaryPatterns = [
        // Temporary files
        '/.*\.tmp$/i',
        '/.*\.temp$/i',
        '/.*\.cache$/i',
        '/.*\.log$/i',
        '/.*\.swp$/i',
        '/.*\.swo$/i',
        '/\.DS_Store$/i',
        '/Thumbs\.db$/i',
        // Temporary directories
        '/^tmp\//',
        '/\/tmp\//',
        '/^temp\//',
        '/\/temp\//',
        '/^cache\//',
        '/\/cache\//',
    ];

    private array $developmentPatterns = [
        // Development scripts
        '/^setup[_-].*\.(php|sh)$/i',
        '/^install[_-].*\.(php|sh)$/i',
        '/^build[_-].*\.(php|sh)$/i',
        '/^deploy[_-].*\.(php|sh)$/i',
        '/^reset[_-].*\.(php|sh)$/i',
        '/^check[_-].*\.(php|sh)$/i',
        '/^validate[_-].*\.(php|sh)$/i',
        '/^troubleshoot.*\.(php|sh)$/i',
        '/.*\.sh$/i',
        // Development directories
        '/^scripts\//',
        '/\/scripts\//',
        '/^tools\//',
        '/\/tools\//',
        '/^utils\//',
        '/\/utils\//',
    ];

    private array $projectSpecificPatterns = [
        // ANMS specific patterns
        '/^anms[_-].*report.*\.(md|docx?)$/i',
        '/^anms[_-].*artifact.*\.(md|docx?)$/i',
        '/^artifact[_-]report.*\.(md|docx?)$/i',
        '/^complete[_-]system[_-]status\.(md|txt)$/i',
        '/^final[_-]website[_-]status\.(md|txt)$/i',
        '/^database[_-]integration[_-]status\.(md|txt)$/i',
        '/^backend[_-]performance[_-]optimizations\.(md|txt)$/i',
        '/^fixes[_-]and[_-]solutions\.(md|txt)$/i',
        '/^project[_-]setup\.(md|txt)$/i',
        '/^setup[_-]instructions\.(md|txt)$/i',
        // Project knowledge directories
        '/^z-project-knowledge\//',
        '/^second_major review-info\//',
        '/^Office-Word-MCP-Server\//',
        // Cookie and log files
        '/.*cookies.*\.txt$/i',
        '/.*\.log$/i',
        '/server.*\.log$/i',
    ];

    public function analyze(string $filePath): FileAnalysisResult
    {
        $reasons = [];
        $metadata = [];
        $category = FileAnalysisResult::CATEGORY_UNCERTAIN;
        $confidence = 0;

        // Check against all pattern categories
        $patternMatches = $this->checkPatterns($filePath);
        
        if (!empty($patternMatches)) {
            $reasons = array_merge($reasons, $patternMatches['reasons']);
            $metadata = array_merge($metadata, $patternMatches['metadata']);
            
            // Determine category based on pattern matches
            if ($this->isNonEssentialPattern($patternMatches['types'])) {
                $category = FileAnalysisResult::CATEGORY_NON_ESSENTIAL;
                $confidence = $this->calculateNonEssentialConfidence($patternMatches['types']);
            } elseif ($this->isEssentialPattern($filePath)) {
                $category = FileAnalysisResult::CATEGORY_ESSENTIAL;
                $confidence = 85;
                $reasons[] = 'Matches essential file pattern';
            }
        }

        // Check file extension patterns
        $extensionAnalysis = $this->analyzeFileExtension($filePath);
        if ($extensionAnalysis) {
            $reasons[] = $extensionAnalysis['reason'];
            $metadata['file_type'] = $extensionAnalysis['type'];
            
            if ($extensionAnalysis['category'] !== FileAnalysisResult::CATEGORY_UNCERTAIN) {
                $category = $extensionAnalysis['category'];
                $confidence = max($confidence, $extensionAnalysis['confidence']);
            }
        }

        // Check directory structure
        $directoryAnalysis = $this->analyzeDirectoryStructure($filePath);
        if ($directoryAnalysis) {
            $reasons[] = $directoryAnalysis['reason'];
            $metadata['directory_type'] = $directoryAnalysis['type'];
            
            if ($directoryAnalysis['category'] !== FileAnalysisResult::CATEGORY_UNCERTAIN) {
                $category = $directoryAnalysis['category'];
                $confidence = max($confidence, $directoryAnalysis['confidence']);
            }
        }

        // If no patterns matched, keep as uncertain with low confidence
        if (empty($reasons)) {
            $reasons[] = 'No specific patterns matched';
            $confidence = 10;
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
            dependencies: [],
            references: [],
            recommendedAction: $recommendedAction,
            metadata: $metadata
        );
    }

    public function getCategory(): string
    {
        return 'pattern';
    }

    public function getPriority(): int
    {
        return 70; // Medium-high priority - patterns are quite reliable
    }

    public function canAnalyze(string $filePath): bool
    {
        return true; // Can analyze all files based on patterns
    }

    /**
     * Check file against all pattern categories
     */
    private function checkPatterns(string $filePath): array
    {
        $matches = [];
        $reasons = [];
        $metadata = [];

        // Check test patterns
        if ($this->matchesPatterns($filePath, $this->testPatterns)) {
            $matches[] = 'test';
            $reasons[] = 'Matches test file pattern';
            $metadata['pattern_type'] = 'test';
        }

        // Check debug patterns
        if ($this->matchesPatterns($filePath, $this->debugPatterns)) {
            $matches[] = 'debug';
            $reasons[] = 'Matches debug file pattern';
            $metadata['pattern_type'] = 'debug';
        }

        // Check backup patterns
        if ($this->matchesPatterns($filePath, $this->backupPatterns)) {
            $matches[] = 'backup';
            $reasons[] = 'Matches backup file pattern';
            $metadata['pattern_type'] = 'backup';
        }

        // Check documentation patterns
        if ($this->matchesPatterns($filePath, $this->documentationPatterns)) {
            $matches[] = 'documentation';
            $reasons[] = 'Matches documentation file pattern';
            $metadata['pattern_type'] = 'documentation';
        }

        // Check temporary patterns
        if ($this->matchesPatterns($filePath, $this->temporaryPatterns)) {
            $matches[] = 'temporary';
            $reasons[] = 'Matches temporary file pattern';
            $metadata['pattern_type'] = 'temporary';
        }

        // Check development patterns
        if ($this->matchesPatterns($filePath, $this->developmentPatterns)) {
            $matches[] = 'development';
            $reasons[] = 'Matches development script pattern';
            $metadata['pattern_type'] = 'development';
        }

        // Check project-specific patterns
        if ($this->matchesPatterns($filePath, $this->projectSpecificPatterns)) {
            $matches[] = 'project_specific';
            $reasons[] = 'Matches ANMS project-specific pattern';
            $metadata['pattern_type'] = 'project_specific';
        }

        return [
            'types' => $matches,
            'reasons' => $reasons,
            'metadata' => $metadata
        ];
    }

    /**
     * Check if file matches any pattern in the given array
     */
    private function matchesPatterns(string $filePath, array $patterns): bool
    {
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $filePath)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if pattern types indicate non-essential file
     */
    private function isNonEssentialPattern(array $types): bool
    {
        $nonEssentialTypes = ['test', 'debug', 'backup', 'documentation', 'temporary', 'development', 'project_specific'];
        
        foreach ($types as $type) {
            if (in_array($type, $nonEssentialTypes)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check if file matches essential patterns
     */
    private function isEssentialPattern(string $filePath): bool
    {
        $essentialPatterns = [
            '/^src\//',
            '/^public\/index\.php$/',
            '/^public\/api\.php$/',
            '/^database\/migrations\//',
            '/^database\/seeds\//',
            '/^composer\.json$/',
            '/^composer\.lock$/',
            '/^\.env$/',
            '/^\.env\.example$/',
            '/^docker-compose\.yml$/',
            '/^Dockerfile$/',
            '/^phpunit\.xml$/',
            '/^phpstan\.neon$/',
            '/^phpcs\.xml$/',
        ];

        return $this->matchesPatterns($filePath, $essentialPatterns);
    }

    /**
     * Calculate confidence for non-essential files
     */
    private function calculateNonEssentialConfidence(array $types): int
    {
        $confidenceMap = [
            'test' => 85,
            'debug' => 90,
            'backup' => 95,
            'documentation' => 80,
            'temporary' => 95,
            'development' => 75,
            'project_specific' => 85
        ];

        $maxConfidence = 0;
        foreach ($types as $type) {
            if (isset($confidenceMap[$type])) {
                $maxConfidence = max($maxConfidence, $confidenceMap[$type]);
            }
        }

        return $maxConfidence ?: 50;
    }

    /**
     * Analyze file based on extension
     */
    private function analyzeFileExtension(string $filePath): ?array
    {
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        
        $extensionMap = [
            // Essential extensions
            'php' => ['type' => 'php_source', 'category' => FileAnalysisResult::CATEGORY_UNCERTAIN, 'confidence' => 30, 'reason' => 'PHP source file'],
            'js' => ['type' => 'javascript', 'category' => FileAnalysisResult::CATEGORY_UNCERTAIN, 'confidence' => 30, 'reason' => 'JavaScript file'],
            'css' => ['type' => 'stylesheet', 'category' => FileAnalysisResult::CATEGORY_UNCERTAIN, 'confidence' => 30, 'reason' => 'CSS stylesheet'],
            'html' => ['type' => 'html', 'category' => FileAnalysisResult::CATEGORY_UNCERTAIN, 'confidence' => 30, 'reason' => 'HTML file'],
            'json' => ['type' => 'json', 'category' => FileAnalysisResult::CATEGORY_UNCERTAIN, 'confidence' => 40, 'reason' => 'JSON configuration file'],
            'yml' => ['type' => 'yaml', 'category' => FileAnalysisResult::CATEGORY_UNCERTAIN, 'confidence' => 40, 'reason' => 'YAML configuration file'],
            'yaml' => ['type' => 'yaml', 'category' => FileAnalysisResult::CATEGORY_UNCERTAIN, 'confidence' => 40, 'reason' => 'YAML configuration file'],
            'xml' => ['type' => 'xml', 'category' => FileAnalysisResult::CATEGORY_UNCERTAIN, 'confidence' => 40, 'reason' => 'XML configuration file'],
            
            // Non-essential extensions
            'md' => ['type' => 'markdown', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 70, 'reason' => 'Markdown documentation'],
            'txt' => ['type' => 'text', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 60, 'reason' => 'Text file'],
            'doc' => ['type' => 'document', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 80, 'reason' => 'Word document'],
            'docx' => ['type' => 'document', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 80, 'reason' => 'Word document'],
            'pdf' => ['type' => 'document', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 80, 'reason' => 'PDF document'],
            'log' => ['type' => 'log', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 85, 'reason' => 'Log file'],
            'tmp' => ['type' => 'temporary', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 95, 'reason' => 'Temporary file'],
            'temp' => ['type' => 'temporary', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 95, 'reason' => 'Temporary file'],
            'cache' => ['type' => 'cache', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 90, 'reason' => 'Cache file'],
            'bak' => ['type' => 'backup', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 95, 'reason' => 'Backup file'],
            'backup' => ['type' => 'backup', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 95, 'reason' => 'Backup file'],
            'old' => ['type' => 'backup', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 90, 'reason' => 'Old/backup file'],
            'orig' => ['type' => 'backup', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 90, 'reason' => 'Original backup file'],
            'sh' => ['type' => 'shell_script', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 70, 'reason' => 'Shell script'],
            'png' => ['type' => 'image', 'category' => FileAnalysisResult::CATEGORY_UNCERTAIN, 'confidence' => 20, 'reason' => 'Image file'],
            'jpg' => ['type' => 'image', 'category' => FileAnalysisResult::CATEGORY_UNCERTAIN, 'confidence' => 20, 'reason' => 'Image file'],
            'jpeg' => ['type' => 'image', 'category' => FileAnalysisResult::CATEGORY_UNCERTAIN, 'confidence' => 20, 'reason' => 'Image file'],
            'gif' => ['type' => 'image', 'category' => FileAnalysisResult::CATEGORY_UNCERTAIN, 'confidence' => 20, 'reason' => 'Image file'],
            'svg' => ['type' => 'image', 'category' => FileAnalysisResult::CATEGORY_UNCERTAIN, 'confidence' => 30, 'reason' => 'SVG image file'],
        ];

        return $extensionMap[$extension] ?? null;
    }

    /**
     * Analyze file based on directory structure
     */
    private function analyzeDirectoryStructure(string $filePath): ?array
    {
        $directoryMap = [
            // Essential directories
            'src/' => ['type' => 'source', 'category' => FileAnalysisResult::CATEGORY_ESSENTIAL, 'confidence' => 90, 'reason' => 'In source code directory'],
            'public/' => ['type' => 'public', 'category' => FileAnalysisResult::CATEGORY_ESSENTIAL, 'confidence' => 85, 'reason' => 'In public web directory'],
            'database/migrations/' => ['type' => 'migration', 'category' => FileAnalysisResult::CATEGORY_ESSENTIAL, 'confidence' => 95, 'reason' => 'Database migration'],
            'database/seeds/' => ['type' => 'seed', 'category' => FileAnalysisResult::CATEGORY_ESSENTIAL, 'confidence' => 85, 'reason' => 'Database seed'],
            'config/' => ['type' => 'config', 'category' => FileAnalysisResult::CATEGORY_ESSENTIAL, 'confidence' => 85, 'reason' => 'Configuration directory'],
            'bootstrap/' => ['type' => 'bootstrap', 'category' => FileAnalysisResult::CATEGORY_ESSENTIAL, 'confidence' => 85, 'reason' => 'Bootstrap directory'],
            
            // Non-essential directories
            'tests/' => ['type' => 'test', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 80, 'reason' => 'In test directory'],
            'test/' => ['type' => 'test', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 80, 'reason' => 'In test directory'],
            'docs/' => ['type' => 'documentation', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 85, 'reason' => 'In documentation directory'],
            'documentation/' => ['type' => 'documentation', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 85, 'reason' => 'In documentation directory'],
            'backup/' => ['type' => 'backup', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 95, 'reason' => 'In backup directory'],
            'backups/' => ['type' => 'backup', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 95, 'reason' => 'In backup directory'],
            'tmp/' => ['type' => 'temporary', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 95, 'reason' => 'In temporary directory'],
            'temp/' => ['type' => 'temporary', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 95, 'reason' => 'In temporary directory'],
            'cache/' => ['type' => 'cache', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 90, 'reason' => 'In cache directory'],
            'logs/' => ['type' => 'logs', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 85, 'reason' => 'In logs directory'],
            'z-project-knowledge/' => ['type' => 'project_docs', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 90, 'reason' => 'In project knowledge directory'],
            'second_major review-info/' => ['type' => 'project_docs', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 90, 'reason' => 'In review info directory'],
            'Office-Word-MCP-Server/' => ['type' => 'external_project', 'category' => FileAnalysisResult::CATEGORY_NON_ESSENTIAL, 'confidence' => 95, 'reason' => 'External project directory'],
        ];

        foreach ($directoryMap as $directory => $info) {
            if (str_starts_with($filePath, $directory)) {
                return $info;
            }
        }

        return null;
    }
}