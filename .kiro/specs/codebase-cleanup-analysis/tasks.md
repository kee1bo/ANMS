# Implementation Plan

- [x] 1. Create core analysis infrastructure
  - Set up the file analysis framework with interfaces and base classes
  - Create the main CodebaseAnalyzer class that orchestrates the cleanup process
  - Implement logging and progress tracking systems
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implement file classification analyzers
- [x] 2.1 Create DependencyAnalyzer class
  - Parse composer.json autoload configuration to identify PSR-4 namespaces
  - Scan PHP files for include/require statements and class usage
  - Build dependency graph to track file relationships
  - _Requirements: 1.1, 3.1, 3.2, 3.3_

- [x] 2.2 Create PatternAnalyzer class
  - Implement pattern matching for test files (test_*.php, *Test.php, files in tests/ directory)
  - Identify debug files (debug_*.php, *_debug.php, debug.html)
  - Detect backup files (*_backup.php, *.backup, files with backup in name)
  - Recognize documentation files (*.md, *.docx, *.txt with report/artifact patterns)
  - _Requirements: 1.3, 5.1, 5.2, 5.3_

- [x] 2.3 Create UsageAnalyzer class
  - Scan HTML/PHP files for referenced CSS and JavaScript assets
  - Identify database migration dependencies and active migrations
  - Track API endpoint usage and route definitions
  - Detect unused assets and orphaned files
  - _Requirements: 1.1, 3.5, 5.4_

- [x] 2.4 Create FunctionalAnalyzer class
  - Identify core application entry points (index.php, api.php, etc.)
  - Classify configuration files and environment files
  - Detect development vs production files
  - Categorize utility scripts and tools
  - _Requirements: 1.1, 3.4, 5.5_

- [x] 3. Build file categorization system
- [x] 3.1 Create FileAnalysisResult data model
  - Define structure for analysis results with confidence scores
  - Implement reasoning system to explain categorization decisions
  - Add dependency tracking and reference mapping
  - Create recommendation engine for file actions
  - _Requirements: 1.4, 2.4_

- [x] 3.2 Implement classification engine
  - Combine results from all analyzers with weighted scoring
  - Handle conflicting analysis results and edge cases
  - Generate confidence scores based on multiple analysis factors
  - Create decision logic for essential vs non-essential classification
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Create backup management system
- [x] 4.1 Implement BackupManager class
  - Create backup directory structure that mirrors original organization
  - Implement atomic file move operations with integrity checks
  - Generate backup manifest with complete file mapping
  - Add rollback capability for failed operations
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 4.2 Create BackupManifest system
  - Design JSON structure for backup metadata and file mappings
  - Implement manifest generation with timestamps and checksums
  - Add restoration metadata and conflict resolution data
  - Create manifest validation and integrity checking
  - _Requirements: 2.4, 4.2, 4.3_

- [x] 4.3 Implement file restoration system
  - Create individual file restoration with conflict handling
  - Implement bulk restoration for entire directories
  - Add validation to ensure restored files match originals
  - Handle edge cases like missing backup files or path conflicts
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 5. Add comprehensive error handling and safety
- [ ] 5.1 Implement file operation safety checks
  - Add disk space validation before moving files
  - Implement permission checking for all file operations
  - Create path traversal protection and security validation
  - Add symlink handling and circular reference detection
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 5.2 Create recovery and rollback mechanisms
  - Implement complete rollback to restore all files to original state
  - Add partial recovery for individual files or directories
  - Create integrity verification for all file operations
  - Handle corruption detection and recovery procedures
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 6. Build analysis reporting system
- [ ] 6.1 Create comprehensive analysis reports
  - Generate detailed categorization reports with file counts and sizes
  - Create dependency visualization and relationship mapping
  - Add cleanup recommendations with risk assessments
  - Implement progress tracking and operation logging
  - _Requirements: 1.4, 2.4_

- [ ] 6.2 Implement interactive cleanup interface
  - Create command-line interface for running analysis and cleanup
  - Add confirmation prompts for destructive operations
  - Implement dry-run mode to preview changes without executing
  - Create detailed output with color coding and progress indicators
  - _Requirements: 1.4, 2.4_

- [ ] 7. Create specific ANMS project cleanup logic
- [ ] 7.1 Implement ANMS-specific file identification
  - Identify and categorize ANMS report files (ANMS_*.md, *_Report_*.md, etc.)
  - Handle project documentation and artifact files appropriately
  - Classify development scripts and utility files specific to ANMS
  - Detect and handle Office-Word-MCP-Server as external project
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 7.2 Create ANMS project structure optimization
  - Preserve essential ANMS application files (src/, public/, database/)
  - Move development documentation to backup (second_major review-info/, z-project-knowledge/)
  - Handle test files and debug scripts appropriately
  - Maintain Docker configuration and deployment scripts
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 8. Add comprehensive testing and validation
- [ ] 8.1 Create unit tests for all analyzer components
  - Test DependencyAnalyzer with various PHP project structures
  - Test PatternAnalyzer with different file naming conventions
  - Test UsageAnalyzer with complex asset dependencies
  - Test FunctionalAnalyzer with various application structures
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 8.2 Create integration tests for complete cleanup process
  - Test end-to-end cleanup with sample project structures
  - Validate backup and restoration functionality
  - Test error handling and recovery scenarios
  - Verify application functionality after cleanup operations
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9. Execute ANMS project cleanup
- [x] 9.1 Run comprehensive analysis on current ANMS codebase
  - Execute all analyzers on the current project structure
  - Generate detailed analysis report with categorization results
  - Review uncertain files and make manual classification decisions
  - Create backup plan with file move operations
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 9.2 Execute safe cleanup with backup
  - Create backup directory structure
  - Move non-essential files to backup with manifest generation
  - Verify application functionality after cleanup
  - Generate final cleanup report with statistics and recommendations
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 6.3, 6.4, 6.5_