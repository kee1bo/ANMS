<?php
/**
 * Database Connection - SQLite Implementation
 * Uses SQLite for local development with proper database features
 */

// Database file path
$dbPath = __DIR__ . '/../../data/anms.db';

// Only run setup if database doesn't exist
if (!file_exists($dbPath)) {
    require_once __DIR__ . '/sqlite_setup.php';
}

// Use file storage system as fallback
require_once __DIR__ . '/file_storage.php';

// Enable SQLite as primary database
try {
    // Create SQLite connection
    $GLOBALS['pdo'] = new PDO("sqlite:$dbPath");
    $GLOBALS['pdo']->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $GLOBALS['pdo']->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    // Enable foreign keys and configure SQLite for better performance
    $GLOBALS['pdo']->exec("PRAGMA foreign_keys = ON");
    $GLOBALS['pdo']->exec("PRAGMA journal_mode = DELETE");
    $GLOBALS['pdo']->exec("PRAGMA synchronous = FULL");
    $GLOBALS['pdo']->setAttribute(PDO::ATTR_AUTOCOMMIT, true);
    
    // Set global flag for SQLite usage
    define('USE_SQLITE', true);
    
    // Also set local variable for backward compatibility
    $pdo = $GLOBALS['pdo'];
    
} catch (PDOException $e) {
    // Fallback to file storage if SQLite fails
    require_once __DIR__ . '/file_storage.php';
    define('USE_FILE_STORAGE', true);
    error_log("SQLite connection failed, using file storage: " . $e->getMessage());
    define('USE_FILE_STORAGE', true);
}

// For backward compatibility with existing code that expects mysqli
if (isset($pdo)) {
    // Create a simple mysqli-like wrapper for SQLite
    class SQLiteWrapper {
        private $pdo;
        
        public function __construct($pdo) {
            $this->pdo = $pdo;
        }
        
        public function prepare($sql) {
            // Convert MySQL syntax to SQLite if needed
            $sql = str_replace('AUTO_INCREMENT', 'AUTOINCREMENT', $sql);
            return $this->pdo->prepare($sql);
        }
        
        public function insert_id() {
            return $this->pdo->lastInsertId();
        }
        
        public function affected_rows() {
            return $this->pdo->rowCount();
        }
    }
    
    $mysqli = new SQLiteWrapper($pdo);
}
?>