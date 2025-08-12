# Design Document

## Overview

The Codebase Cleanup Analysis system is designed to intelligently analyze the ANMS project structure, categorize files based on their importance and usage, and safely relocate non-essential files to a backup location. The system will maintain project functionality while creating a cleaner, more maintainable codebase structure.

## Architecture

### Analysis Engine
The core analysis engine will examine the project structure using multiple analysis strategies:

1. **Dependency Analysis**: Parse composer.json, autoload configurations, and include/require statements
2. **Usage Analysis**: Identify actively used files through static analysis and reference tracking
3. **Pattern Recognition**: Categorize files based on naming patterns, locations, and file types
4. **Functional Classification**: Determine file roles (core, test, documentation, backup, etc.)

### File Classification System

#### Essential Files (Keep in place)
- **Core Application Files**: All files in `src/` directory following PSR-4 autoloading
- **Database Files**: Migration files, schema definitions, and seed files
- **Configuration Files**: `.env`, `composer.json`, `docker-compose.yml`, etc.
- **Entry Points**: `public/index.php`, `public/api.php`, and other main entry files
- **Active Assets**: CSS/JS files referenced in active HTML/PHP files
- **Dependencies**: `vendor/` directory and lock files

#### Non-Essential Files (Move to backup)
- **Test Files**: Files in test directories that are duplicates or unused
- **Debug Files**: Files with debug, test, or temporary naming patterns
- **Documentation**: Report files, artifact documents, and project documentation
- **Backup Files**: Files with backup suffixes or in backup directories
- **Legacy Files**: Unused or deprecated files identified through analysis
- **Development Tools**: Scripts and utilities not needed for production

#### Uncertain Files (Require manual review)
- Files that cannot be definitively categorized
- Files with mixed usage patterns
- Custom scripts without clear dependencies

## Components and Interfaces

### FileAnalyzer Interface
```php
interface FileAnalyzerInterface
{
    public function analyze(string $filePath): FileAnalysisResult;
    public function getCategory(): string;
    public function getPriority(): int;
}
```

### Analysis Components

#### DependencyAnalyzer
- Parses composer.json autoload configuration
- Tracks PSR-4 namespace mappings
- Identifies required files through static analysis

#### UsageAnalyzer  
- Scans for include/require statements
- Identifies referenced assets in HTML/PHP files
- Tracks database migration dependencies

#### PatternAnalyzer
- Recognizes file naming patterns (test, debug, backup)
- Identifies file types and purposes
- Categorizes based on directory structure

#### FunctionalAnalyzer
- Determines file roles in the application
- Identifies entry points and core functionality
- Classifies support files and utilities

### Backup Management System

#### BackupManager
```php
class BackupManager
{
    public function createBackup(array $files): BackupManifest;
    public function restoreFile(string $backupPath, string $originalPath): bool;
    public function getManifest(): BackupManifest;
}
```

#### Directory Structure
```
backup/
├── manifest.json                 # Complete backup manifest
├── moved-files/                 # Files moved from original locations
│   ├── public/                  # Maintains original structure
│   ├── src/                     
│   └── ...
├── analysis-report.json         # Detailed analysis results
└── restoration-guide.md         # Instructions for file restoration
```

## Data Models

### FileAnalysisResult
```php
class FileAnalysisResult
{
    public string $filePath;
    public string $category;        // 'essential', 'non-essential', 'uncertain'
    public int $confidenceScore;    // 0-100
    public array $reasons;          // Why this categorization was chosen
    public array $dependencies;     // Files that depend on this file
    public array $references;       // Files this file references
    public ?string $recommendedAction; // 'keep', 'move', 'review'
}
```

### BackupManifest
```php
class BackupManifest
{
    public DateTime $createdAt;
    public array $movedFiles;       // Original path => backup path mapping
    public array $analysisResults;  // Complete analysis data
    public string $projectState;    // Hash of project before cleanup
    public array $statistics;       // Cleanup statistics
}
```

## Error Handling

### File Operation Errors
- **Permission Issues**: Graceful handling of read/write permission problems
- **Disk Space**: Check available space before moving files
- **Path Conflicts**: Handle cases where backup paths already exist
- **Corruption Protection**: Verify file integrity during moves

### Analysis Errors
- **Parse Errors**: Handle malformed configuration files gracefully
- **Missing Dependencies**: Continue analysis when some files are inaccessible
- **Circular References**: Detect and handle circular dependency chains
- **Large File Handling**: Optimize analysis for large codebases

### Recovery Mechanisms
- **Rollback Capability**: Ability to restore all files to original state
- **Partial Recovery**: Restore individual files or directories
- **Conflict Resolution**: Handle cases where original locations are occupied
- **Integrity Verification**: Ensure restored files match originals

## Testing Strategy

### Unit Tests
- **FileAnalyzer Components**: Test each analyzer independently
- **BackupManager**: Test backup and restoration operations
- **Classification Logic**: Verify correct file categorization
- **Error Handling**: Test error scenarios and recovery

### Integration Tests
- **End-to-End Cleanup**: Test complete cleanup process
- **Backup and Restore**: Verify full backup/restore cycle
- **Project Functionality**: Ensure application works after cleanup
- **Performance**: Test with large codebases

### Test Data
- **Sample Project Structure**: Create test projects with known file types
- **Edge Cases**: Test unusual file structures and naming patterns
- **Dependency Scenarios**: Test complex dependency chains
- **Error Conditions**: Simulate various error scenarios

## Implementation Phases

### Phase 1: Analysis Engine
- Implement core file analyzers
- Create classification system
- Build dependency tracking
- Generate analysis reports

### Phase 2: Backup System
- Implement backup manager
- Create manifest system
- Build restoration capabilities
- Add integrity verification

### Phase 3: Safety and Validation
- Add comprehensive error handling
- Implement rollback mechanisms
- Create validation systems
- Build conflict resolution

### Phase 4: User Interface and Reporting
- Create analysis reports
- Build interactive cleanup interface
- Add progress tracking
- Implement logging and monitoring

## Security Considerations

### File System Security
- **Path Traversal Protection**: Prevent access outside project directory
- **Permission Validation**: Verify file operation permissions
- **Symlink Handling**: Safely handle symbolic links
- **Backup Isolation**: Ensure backup directory is properly isolated

### Data Integrity
- **Checksum Verification**: Verify file integrity during operations
- **Atomic Operations**: Ensure file moves are atomic where possible
- **Backup Validation**: Verify backup completeness and accuracy
- **Recovery Testing**: Regular validation of restoration capabilities

## Performance Considerations

### Analysis Optimization
- **Parallel Processing**: Analyze multiple files concurrently
- **Caching**: Cache analysis results for repeated operations
- **Incremental Analysis**: Only re-analyze changed files
- **Memory Management**: Optimize memory usage for large projects

### File Operations
- **Batch Operations**: Group file operations for efficiency
- **Progress Tracking**: Provide feedback during long operations
- **Interruption Handling**: Allow safe interruption and resumption
- **Resource Monitoring**: Monitor disk space and system resources