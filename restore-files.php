<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use App\Application\Services\CodebaseAnalysis\Backup\BackupManager;
use App\Application\Services\CodebaseAnalysis\Backup\RestorationService;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\ConsoleHandler;

// Create logger
$logger = new Logger('file-restoration');
$logger->pushHandler(new ConsoleHandler());

// Configuration
$projectRoot = __DIR__;
$verbose = in_array('--verbose', $argv) || in_array('-v', $argv);

if ($verbose) {
    $logger->pushHandler(new StreamHandler('php://stdout', Logger::DEBUG));
}

echo "🔄 ANMS File Restoration Tool\n";
echo "=============================\n\n";

try {
    // Initialize components
    $backupManager = new BackupManager($projectRoot, 'backup', $logger);
    $restorationService = new RestorationService($backupManager, $projectRoot, $logger);

    // Check if backup exists
    if (!$backupManager->hasBackup()) {
        echo "❌ No backup found. Run cleanup-codebase.php first.\n";
        exit(1);
    }

    // Validate prerequisites
    $issues = $restorationService->validateRestorationPrerequisites();
    if (!empty($issues)) {
        echo "❌ Restoration prerequisites not met:\n";
        foreach ($issues as $issue) {
            echo "   • {$issue}\n";
        }
        exit(1);
    }

    $manifest = $backupManager->getManifest();
    $movedFiles = $manifest->getMovedFiles();

    echo "📊 Backup Information:\n";
    echo "   Created: " . $manifest->getCreatedAt()->format('Y-m-d H:i:s') . "\n";
    echo "   Files in backup: " . count($movedFiles) . "\n";
    echo "   Backup location: {$projectRoot}/backup\n\n";

    // Parse command line arguments
    $restoreAll = in_array('--all', $argv);
    $fileToRestore = null;
    $directoryToRestore = null;

    foreach ($argv as $i => $arg) {
        if ($arg === '--file' && isset($argv[$i + 1])) {
            $fileToRestore = $argv[$i + 1];
        } elseif ($arg === '--directory' && isset($argv[$i + 1])) {
            $directoryToRestore = $argv[$i + 1];
        }
    }

    if (!$restoreAll && !$fileToRestore && !$directoryToRestore) {
        echo "❓ What would you like to restore?\n\n";
        echo "Options:\n";
        echo "   --all                    Restore all files (complete rollback)\n";
        echo "   --file path/to/file.php  Restore specific file\n";
        echo "   --directory path/to/dir  Restore entire directory\n\n";
        
        echo "📋 Available files to restore:\n";
        $count = 0;
        foreach ($movedFiles as $originalPath => $backupPath) {
            echo "   • {$originalPath}\n";
            $count++;
            if ($count >= 10) {
                $remaining = count($movedFiles) - 10;
                echo "   ... and {$remaining} more files\n";
                break;
            }
        }
        echo "\n";
        exit(0);
    }

    // Perform restoration
    if ($restoreAll) {
        echo "⚠️  Complete rollback will restore ALL backed up files!\n";
        echo "❓ Are you sure you want to proceed? [y/N]: ";
        $handle = fopen("php://stdin", "r");
        $line = fgets($handle);
        fclose($handle);
        
        if (trim(strtolower($line)) !== 'y') {
            echo "❌ Operation cancelled\n";
            exit(0);
        }

        echo "\n🔄 Performing complete rollback...\n";
        $result = $restorationService->performCompleteRollback(['confirm_rollback' => true]);
        
        if ($result->isFullySuccessful()) {
            echo "✅ Complete rollback successful!\n";
            echo "   Restored files: {$result->successCount}\n";
        } else {
            echo "⚠️  Rollback completed with issues:\n";
            echo "   Successful: {$result->successCount}\n";
            echo "   Failed: {$result->errorCount}\n";
            echo "   Skipped: {$result->skippedCount}\n\n";
            
            $failedFiles = $result->getFailedFiles();
            if (!empty($failedFiles)) {
                echo "❌ Failed files:\n";
                foreach ($failedFiles as $file => $error) {
                    echo "   • {$file}: {$error}\n";
                }
            }
        }

    } elseif ($fileToRestore) {
        echo "🔄 Restoring file: {$fileToRestore}\n";
        $result = $restorationService->restoreFile($fileToRestore);
        
        if ($result->success) {
            echo "✅ File restored successfully!\n";
            if ($result->conflictResolution) {
                echo "   Conflict resolution: {$result->conflictResolution->message}\n";
            }
        } else {
            echo "❌ Failed to restore file: {$result->error}\n";
            exit(1);
        }

    } elseif ($directoryToRestore) {
        echo "🔄 Restoring directory: {$directoryToRestore}\n";
        $result = $restorationService->restoreDirectory($directoryToRestore);
        
        if ($result->isFullySuccessful()) {
            echo "✅ Directory restored successfully!\n";
            echo "   Restored files: {$result->successCount}\n";
        } else {
            echo "⚠️  Directory restoration completed with issues:\n";
            echo "   Successful: {$result->successCount}\n";
            echo "   Failed: {$result->errorCount}\n";
            echo "   Skipped: {$result->skippedCount}\n";
        }
    }

    echo "\n✨ Restoration operation completed!\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    $logger->error('Restoration failed', ['error' => $e->getMessage()]);
    exit(1);
}