<?php
// Lightweight replacement for Composer autoload to keep project self-contained.
// Supports simple PSR-4 for the ANMS\ namespace.

spl_autoload_register(function ($class) {
    // Handle App namespace
    if (str_starts_with($class, 'App\\')) {
        $relative = substr($class, strlen('App\\')); // Remove namespace prefix
        $relativePath = __DIR__ . '/../src/' . str_replace('\\', '/', $relative) . '.php';
        if (file_exists($relativePath)) {
            require_once $relativePath;
        }
    }
    // Handle ANMS namespace for backward compatibility
    if (str_starts_with($class, 'ANMS\\')) {
        $relative = substr($class, strlen('ANMS\\')); // Remove namespace prefix
        $relativePath = __DIR__ . '/../src/' . str_replace('\\', '/', $relative) . '.php';
        if (file_exists($relativePath)) {
            require_once $relativePath;
        }
    }
    // Handle Tests namespace
    if (str_starts_with($class, 'Tests\\')) {
        $relative = substr($class, strlen('Tests\\')); // Remove namespace prefix
        $relativePath = __DIR__ . '/../tests/' . str_replace('\\', '/', $relative) . '.php';
        if (file_exists($relativePath)) {
            require_once $relativePath;
        }
    }
});

// Minimal .env loader: load key=value pairs into $_ENV
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (str_starts_with(trim($line), '#')) {
            continue; // Skip comments
        }
        [$key, $value] = array_map('trim', explode('=', $line, 2));
        if (!isset($_ENV[$key])) {
            $_ENV[$key] = trim($value, '"');
        }
    }
}
