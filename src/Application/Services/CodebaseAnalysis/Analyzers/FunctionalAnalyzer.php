<?php

declare(strict_types=1);

namespace App\Application\Services\CodebaseAnalysis\Analyzers;

use App\Application\Services\CodebaseAnalysis\FileAnalyzerInterface;
use App\Application\Services\CodebaseAnalysis\Models\FileAnalysisResult;

/**
 * Analyzes files based on their functional role in the application
 */
class FunctionalAnalyzer implements FileAnalyzerInterface
{
    private string $projectRoot;

    public function __construct(string $projectRoot)
    {
        $this->projectRoot = rtrim($projectRoot, '/');
    }

    public function analyze(string $filePath): FileAnalysisResult
    {
        $reasons = [];
        $metadata = [];
        
        // Determine functional role
        $functionalRole = $this->determineFunctionalRole($filePath);
        $metadata['functional_role'] = $functionalRole;

        // Analyze based on role
        $roleAnalysis = $this->analyzeByRole($filePath, $functionalRole);
        $reasons = array_merge($reasons, $roleAnalysis['reasons']);
        $metadata = array_merge($metadata, $roleAnalysis['metadata']);

        // Check if file is a core application entry point
        $isEntryPoint = $this->isEntryPoint($filePath);
        if ($isEntryPoint) {
            $reasons[] = 'Core application entry point';
            $metadata['entry_point'] = true;
        }

        // Check if file is a configuration file
        $configType = $this->getConfigurationType($filePath);
        if ($configType) {
            $reasons[] = sprintf('Configuration file (%s)', $configType);
            $metadata['config_type'] = $configType;
        }

        // Check if file is development vs production
        $environment = $this->determineEnvironment($filePath);
        $metadata['environment'] = $environment;
        if ($environment === 'development') {
            $reasons[] = 'Development-only file';
        } elseif ($environment === 'production') {
            $reasons[] = 'Production-required file';
        }

        // Check if file is a utility or tool
        $utilityType = $this->getUtilityType($filePath);
        if ($utilityType) {
            $reasons[] = sprintf('Utility/tool file (%s)', $utilityType);
            $metadata['utility_type'] = $utilityType;
        }

        // Determine category and confidence
        $category = $this->determineCategory($functionalRole, $isEntryPoint, $configType, $environment, $utilityType);
        $confidence = $this->calculateConfidence($functionalRole, $isEntryPoint, $configType, $environment, $utilityType);

        if (empty($reasons)) {
            $reasons[] = 'No specific functional role identified';
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
        return 'functional';
    }

    public function getPriority(): int
    {
        return 75; // Medium-high priority - functional analysis is important
    }

    public function canAnalyze(string $filePath): bool
    {
        return true; // Can analyze all files for functional role
    }

    /**
     * Determine the functional role of a file
     */
    private function determineFunctionalRole(string $filePath): string
    {
        // Domain layer files
        if (str_contains($filePath, 'src/Domain/')) {
            return 'domain_entity';
        }

        // Application layer files
        if (str_contains($filePath, 'src/Application/')) {
            return 'application_service';
        }

        // Infrastructure layer files
        if (str_contains($filePath, 'src/Infrastructure/')) {
            return 'infrastructure';
        }

        // Controllers
        if (str_contains($filePath, 'Controller') || str_contains($filePath, 'public/api/')) {
            return 'controller';
        }

        // Database files
        if (str_contains($filePath, 'database/migrations/')) {
            return 'migration';
        }
        if (str_contains($filePath, 'database/seeds/')) {
            return 'seed';
        }

        // Frontend assets
        if (str_ends_with($filePath, '.css')) {
            return 'stylesheet';
        }
        if (str_ends_with($filePath, '.js')) {
            return 'javascript';
        }
        if (str_ends_with($filePath, '.html')) {
            return 'template';
        }

        // Public web files
        if (str_starts_with($filePath, 'public/') && str_ends_with($filePath, '.php')) {
            return 'web_entry';
        }

        // Test files
        if (str_contains($filePath, 'test') || str_contains($filePath, 'Test')) {
            return 'test';
        }

        // Configuration files
        if ($this->getConfigurationType($filePath)) {
            return 'configuration';
        }

        // Documentation
        if (str_ends_with($filePath, '.md') || str_ends_with($filePath, '.txt') || str_ends_with($filePath, '.docx')) {
            return 'documentation';
        }

        // Scripts
        if (str_ends_with($filePath, '.sh') || str_contains($filePath, 'script')) {
            return 'script';
        }

        return 'unknown';
    }

    /**
     * Analyze file based on its functional role
     */
    private function analyzeByRole(string $filePath, string $role): array
    {
        $reasons = [];
        $metadata = [];

        switch ($role) {
            case 'domain_entity':
                $reasons[] = 'Core domain entity - essential for business logic';
                $metadata['layer'] = 'domain';
                $metadata['importance'] = 'critical';
                break;

            case 'application_service':
                $reasons[] = 'Application service - coordinates business operations';
                $metadata['layer'] = 'application';
                $metadata['importance'] = 'high';
                break;

            case 'infrastructure':
                $reasons[] = 'Infrastructure component - handles external concerns';
                $metadata['layer'] = 'infrastructure';
                $metadata['importance'] = 'high';
                break;

            case 'controller':
                $reasons[] = 'Controller - handles HTTP requests';
                $metadata['layer'] = 'presentation';
                $metadata['importance'] = 'high';
                break;

            case 'migration':
                $reasons[] = 'Database migration - essential for schema management';
                $metadata['importance'] = 'critical';
                $metadata['database_related'] = true;
                break;

            case 'seed':
                $reasons[] = 'Database seed - provides initial data';
                $metadata['importance'] = 'medium';
                $metadata['database_related'] = true;
                break;

            case 'stylesheet':
                $activeUsage = $this->checkAssetActiveUsage($filePath);
                if ($activeUsage) {
                    $reasons[] = 'Active stylesheet - used in application UI';
                    $metadata['importance'] = 'medium';
                } else {
                    $reasons[] = 'Stylesheet - may be unused';
                    $metadata['importance'] = 'low';
                }
                break;

            case 'javascript':
                $activeUsage = $this->checkAssetActiveUsage($filePath);
                if ($activeUsage) {
                    $reasons[] = 'Active JavaScript - provides UI functionality';
                    $metadata['importance'] = 'medium';
                } else {
                    $reasons[] = 'JavaScript file - may be unused';
                    $metadata['importance'] = 'low';
                }
                break;

            case 'template':
                $reasons[] = 'HTML template - part of user interface';
                $metadata['importance'] = 'medium';
                break;

            case 'web_entry':
                $reasons[] = 'Web entry point - accessible via HTTP';
                $metadata['importance'] = 'high';
                $metadata['entry_point'] = true;
                break;

            case 'test':
                $reasons[] = 'Test file - for quality assurance';
                $metadata['importance'] = 'low';
                $metadata['development_only'] = true;
                break;

            case 'configuration':
                $reasons[] = 'Configuration file - defines application settings';
                $metadata['importance'] = 'high';
                break;

            case 'documentation':
                $reasons[] = 'Documentation file - for reference';
                $metadata['importance'] = 'low';
                break;

            case 'script':
                $scriptType = $this->getScriptType($filePath);
                $reasons[] = sprintf('Script file (%s)', $scriptType);
                $metadata['script_type'] = $scriptType;
                $metadata['importance'] = $scriptType === 'deployment' ? 'medium' : 'low';
                break;

            default:
                $reasons[] = 'Unknown functional role';
                $metadata['importance'] = 'unknown';
                break;
        }

        return ['reasons' => $reasons, 'metadata' => $metadata];
    }

    /**
     * Check if file is an entry point
     */
    private function isEntryPoint(string $filePath): bool
    {
        $entryPoints = [
            'public/index.php',
            'public/api.php',
            'public/login.php',
            'public/register.php',
            'public/admin.php',
            'index.php',
            'api.php'
        ];

        return in_array($filePath, $entryPoints);
    }

    /**
     * Get configuration file type
     */
    private function getConfigurationType(string $filePath): ?string
    {
        $configMap = [
            'composer.json' => 'dependency_management',
            'composer.lock' => 'dependency_lock',
            '.env' => 'environment',
            '.env.example' => 'environment_template',
            'docker-compose.yml' => 'container_orchestration',
            'Dockerfile' => 'container_definition',
            'phpunit.xml' => 'testing_framework',
            'phpstan.neon' => 'static_analysis',
            'phpcs.xml' => 'code_standards',
            '.gitignore' => 'version_control',
            'README.md' => 'project_documentation',
            'nginx.conf' => 'web_server',
            'apache.conf' => 'web_server',
        ];

        if (isset($configMap[$filePath])) {
            return $configMap[$filePath];
        }

        // Check for config directories
        if (str_starts_with($filePath, 'config/')) {
            return 'application_config';
        }

        if (str_starts_with($filePath, 'bootstrap/')) {
            return 'bootstrap';
        }

        return null;
    }

    /**
     * Determine if file is for development or production
     */
    private function determineEnvironment(string $filePath): string
    {
        // Development-only patterns
        $devPatterns = [
            '/test/',
            '/tests/',
            '/debug/',
            'phpunit.xml',
            'phpstan.neon',
            'phpcs.xml',
            '.env.example',
            '/setup',
            '/install',
            '/build',
            '/deploy',
            'troubleshoot',
            'validate',
            'check_status',
            'reset_',
            'quick-start',
        ];

        foreach ($devPatterns as $pattern) {
            if (str_contains($filePath, $pattern)) {
                return 'development';
            }
        }

        // Production-required patterns
        $prodPatterns = [
            'src/',
            'public/index.php',
            'public/api.php',
            'database/migrations/',
            'composer.json',
            'composer.lock',
            '.env',
            'docker-compose.yml',
            'Dockerfile',
        ];

        foreach ($prodPatterns as $pattern) {
            if (str_contains($filePath, $pattern)) {
                return 'production';
            }
        }

        return 'both';
    }

    /**
     * Get utility/tool type
     */
    private function getUtilityType(string $filePath): ?string
    {
        $utilityMap = [
            'setup' => 'setup_script',
            'install' => 'installation_script',
            'build' => 'build_script',
            'deploy' => 'deployment_script',
            'reset' => 'reset_script',
            'check' => 'health_check',
            'validate' => 'validation_script',
            'troubleshoot' => 'troubleshooting_tool',
            'migrate' => 'migration_runner',
            'seed' => 'data_seeder',
            'test_' => 'test_utility',
            'debug' => 'debug_utility',
        ];

        foreach ($utilityMap as $pattern => $type) {
            if (str_contains(strtolower($filePath), $pattern)) {
                return $type;
            }
        }

        return null;
    }

    /**
     * Get script type
     */
    private function getScriptType(string $filePath): string
    {
        if (str_contains($filePath, 'setup') || str_contains($filePath, 'install')) {
            return 'setup';
        }
        if (str_contains($filePath, 'deploy') || str_contains($filePath, 'build')) {
            return 'deployment';
        }
        if (str_contains($filePath, 'test') || str_contains($filePath, 'check')) {
            return 'testing';
        }
        if (str_contains($filePath, 'reset') || str_contains($filePath, 'clean')) {
            return 'maintenance';
        }
        if (str_contains($filePath, 'start') || str_contains($filePath, 'run')) {
            return 'execution';
        }

        return 'utility';
    }

    /**
     * Check if asset is actively used
     */
    private function checkAssetActiveUsage(string $filePath): bool
    {
        // This is a simplified check - in practice, you'd want to scan HTML/PHP files
        // for references to this asset
        
        // Check if file is in active assets directory
        if (str_starts_with($filePath, 'public/assets/')) {
            return true;
        }

        // Check if file is referenced in main application files
        $mainFiles = ['public/index.php', 'public/dashboard.php', 'public/landing.php'];
        
        foreach ($mainFiles as $mainFile) {
            $absolutePath = $this->projectRoot . '/' . $mainFile;
            if (file_exists($absolutePath)) {
                $content = file_get_contents($absolutePath);
                if (str_contains($content, basename($filePath))) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Determine category based on functional analysis
     */
    private function determineCategory(
        string $functionalRole,
        bool $isEntryPoint,
        ?string $configType,
        string $environment,
        ?string $utilityType
    ): string {
        // Essential files
        if ($isEntryPoint) {
            return FileAnalysisResult::CATEGORY_ESSENTIAL;
        }

        if (in_array($functionalRole, ['domain_entity', 'application_service', 'infrastructure', 'controller', 'migration'])) {
            return FileAnalysisResult::CATEGORY_ESSENTIAL;
        }

        if ($configType && in_array($configType, ['dependency_management', 'dependency_lock', 'environment', 'container_orchestration', 'container_definition'])) {
            return FileAnalysisResult::CATEGORY_ESSENTIAL;
        }

        if ($environment === 'production') {
            return FileAnalysisResult::CATEGORY_ESSENTIAL;
        }

        // Non-essential files
        if ($environment === 'development') {
            return FileAnalysisResult::CATEGORY_NON_ESSENTIAL;
        }

        if (in_array($functionalRole, ['test', 'documentation'])) {
            return FileAnalysisResult::CATEGORY_NON_ESSENTIAL;
        }

        if ($utilityType && in_array($utilityType, ['test_utility', 'debug_utility', 'troubleshooting_tool'])) {
            return FileAnalysisResult::CATEGORY_NON_ESSENTIAL;
        }

        // Default to uncertain
        return FileAnalysisResult::CATEGORY_UNCERTAIN;
    }

    /**
     * Calculate confidence score
     */
    private function calculateConfidence(
        string $functionalRole,
        bool $isEntryPoint,
        ?string $configType,
        string $environment,
        ?string $utilityType
    ): int {
        $confidence = 0;

        // High confidence indicators
        if ($isEntryPoint) $confidence += 40;
        if (in_array($functionalRole, ['domain_entity', 'migration'])) $confidence += 35;
        if (in_array($functionalRole, ['application_service', 'infrastructure', 'controller'])) $confidence += 30;
        
        if ($configType) {
            $configConfidence = match ($configType) {
                'dependency_management', 'dependency_lock' => 35,
                'environment', 'container_orchestration' => 30,
                'testing_framework', 'static_analysis' => 25,
                default => 20
            };
            $confidence += $configConfidence;
        }

        // Environment confidence
        if ($environment === 'production') $confidence += 25;
        if ($environment === 'development') $confidence += 20;

        // Role-based confidence
        $roleConfidence = match ($functionalRole) {
            'domain_entity', 'migration' => 30,
            'application_service', 'infrastructure', 'controller' => 25,
            'stylesheet', 'javascript', 'template' => 15,
            'test', 'documentation' => 25,
            'script' => 20,
            default => 10
        };
        $confidence += $roleConfidence;

        return min(100, max(10, $confidence));
    }
}