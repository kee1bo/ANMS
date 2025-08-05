<?php
// src/config.php
// Global configuration loader. Loads environment variables using vlucas/phpdotenv if present.

namespace ANMS;

// Attempt to load vlucas/phpdotenv if installed


// Project root directory (assuming config.php is in src/)
$rootDir = dirname(__DIR__);

// Load composer autoload
require_once $rootDir . '/vendor/autoload.php';

// Load .env if exists and Dotenv class available
if (class_exists('Dotenv\\Dotenv')) {
    $dotenv = \Dotenv\Dotenv::createImmutable($rootDir);
    $dotenv->safeLoad();
}

// Provide helper function to get env with default
if (!function_exists('env')) {
    function env(string $key, $default = null) {
        return $_ENV[$key] ?? $_SERVER[$key] ?? $default;
    }
}
