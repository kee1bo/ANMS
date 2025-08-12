<?php

declare(strict_types=1);

// Simple autoloader for our classes
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/src/';
    
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    
    if (file_exists($file)) {
        require $file;
    }
});

use App\Application\Services\CodebaseAnalysis\CodebaseAnalyzer;
use App\Application\Services\CodebaseAnalysis\Analyzers\DependencyAnalyzer;
use App\Application\Services\CodebaseAnalysis\Analyzers\PatternAnalyzer;
use App\Application\Services\CodebaseAnalysis\Analyzers\UsageAnalyzer;
use App\Application\Services\CodebaseAnalysis\Analyzers\FunctionalAnalyzer;
use App\Application\Services\CodebaseAnalysis\ClassificationEngine;
use App\Application\Services\CodebaseAnalysis\Backup\BackupManager;
use App\Application\Services\CodebaseAnalysis\ProgressTracker;

// Simple logger class
class SimpleLogger {
    public function info($message, $context = []) {
        $this->log('INFO', $message, $context);
    }
    
    public function error($message, $context = []) {
        $this->log('ERROR', $message, $context);
    }
    
    public function debug($message, $context = []) {
        // Skip debug messages for now
    }
    
    public function warning($message, $context = []) {
        $this->log('WARNING', $message, $context);
    }
    
    private function log($level, $message, $context) {
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? ' ' . json_encode($context) : '';
        file_put_contents(__DIR__ . '/cleanup.log', "[{$timestamp}] {$level}: {$message}{$contextStr}\n", FILE_APPEND);
    }
}

$logger = new SimpleLogger();

// Configuration
$projectRoot = __DIR__;
$dryRun = in_array('--dry-run', $argv);
$verbose = in_array('--verbose', $argv) || in_array('-v', $argv);

if ($verbose) {
    $logger->pushHandler(new StreamHandler('php://stdout', Logger::DEBUG));
}

echo "🧹 ANMS Codebase Cleanup Tool\n";
echo "============================\n\n";

if ($dryRun) {
    echo "🔍 Running in DRY RUN mode - no files will be moved\n\n";
}

try {
    // Initialize components
    echo "📋 Initializing analysis components...\n";
    
    $analyzer = new CodebaseAnalyzer($projectRoot, $logger);
    $classificationEngine = new ClassificationEngine($logger);
    $backupManager = new BackupManager($projectRoot, 'backup', $logger);
    $progressTracker = new ProgressTracker();

    // Add analyzers
    $analyzer->addAnalyzer(new DependencyAnalyzer($projectRoot));
    $analyzer->addAnalyzer(new PatternAnalyzer());
    $analyzer->addAnalyzer(new UsageAnalyzer($projectRoot));
    $analyzer->addAnalyzer(new FunctionalAnalyzer($projectRoot));

    echo "✅ Components initialized\n\n";

    // Perform analysis
    echo "🔍 Analyzing codebase...\n";
    $progressTracker->setCurrentOperation('Analyzing files');
    
    $analysisResults = $analyzer->analyzeCodebase();
    
    echo "✅ Analysis complete!\n\n";

    // Display summary
    $totalFiles = count($analysisResults);
    $essential = count(array_filter($analysisResults, fn($r) => $r->category === 'essential'));
    $nonEssential = count(array_filter($analysisResults, fn($r) => $r->category === 'non-essential'));
    $uncertain = count(array_filter($analysisResults, fn($r) => $r->category === 'uncertain'));
    $canMove = count(array_filter($analysisResults, fn($r) => $r->canBeMoved()));

    echo "📊 Analysis Summary:\n";
    echo "   Total files analyzed: {$totalFiles}\n";
    echo "   Essential files: {$essential}\n";
    echo "   Non-essential files: {$nonEssential}\n";
    echo "   Uncertain files: {$uncertain}\n";
    echo "   Files safe to move: {$canMove}\n\n";

    // Show files that will be moved
    if ($canMove > 0) {
        echo "📦 Files that will be moved to backup:\n";
        foreach ($analysisResults as $filePath => $result) {
            if ($result->canBeMoved()) {
                $confidence = $result->confidenceScore;
                $reasons = implode(', ', array_slice($result->reasons, 0, 2));
                echo "   • {$filePath} ({$confidence}% confidence: {$reasons})\n";
            }
        }
        echo "\n";
    }

    // Show uncertain files that need review
    $uncertainFiles = array_filter($analysisResults, fn($r) => $r->requiresReview());
    if (!empty($uncertainFiles)) {
        echo "⚠️  Files requiring manual review:\n";
        foreach ($uncertainFiles as $filePath => $result) {
            $confidence = $result->confidenceScore;
            $reasons = implode(', ', array_slice($result->reasons, 0, 2));
            echo "   • {$filePath} ({$confidence}% confidence: {$reasons})\n";
        }
        echo "\n";
    }

    if ($dryRun) {
        echo "🔍 Dry run complete - no files were moved\n";
        echo "💡 Run without --dry-run to perform actual cleanup\n";
        exit(0);
    }

    // Confirm before proceeding
    if ($canMove > 0) {
        echo "❓ Proceed with moving {$canMove} files to backup? [y/N]: ";
        $handle = fopen("php://stdin", "r");
        $line = fgets($handle);
        fclose($handle);
        
        if (trim(strtolower($line)) !== 'y') {
            echo "❌ Operation cancelled\n";
            exit(0);
        }
    } else {
        echo "✅ No files need to be moved - codebase is already clean!\n";
        exit(0);
    }

    // Perform backup
    echo "\n📦 Creating backup and moving files...\n";
    $progressTracker->setCurrentOperation('Creating backup');
    
    $manifest = $backupManager->createBackup($analysisResults);
    
    if ($manifest->isSuccessful()) {
        echo "✅ Backup completed successfully!\n\n";
        
        $summary = $manifest->getSummary();
        echo "📊 Backup Summary:\n";
        echo "   Files moved: {$summary['files_moved']}\n";
        echo "   Total size: {$summary['total_size_moved']}\n";
        echo "   Success rate: {$summary['success_rate']}%\n\n";
        
        echo "📁 Backup location: " . $projectRoot . "/backup\n";
        echo "📄 Manifest: " . $projectRoot . "/backup/manifest.json\n";
        echo "📋 Report: " . $projectRoot . "/backup/reports/backup-report.md\n\n";
        
        echo "🔄 To restore files if needed:\n";
        echo "   php restore-files.php --all\n";
        echo "   php restore-files.php --file path/to/file.php\n\n";
        
        echo "✨ Codebase cleanup completed successfully!\n";
        
    } else {
        echo "❌ Backup completed with errors:\n";
        foreach ($manifest->getErrors() as $file => $error) {
            echo "   • {$file}: {$error}\n";
        }
        echo "\n";
        echo "⚠️  Some files may not have been moved. Check the backup report for details.\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    $logger->error('Cleanup failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
    exit(1);
}