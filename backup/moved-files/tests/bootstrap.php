<?php

declare(strict_types=1);

// Set test environment
$_ENV['APP_ENV'] = 'testing';
$_ENV['APP_DEBUG'] = 'true';

// Load the application
$app = require __DIR__ . '/../bootstrap/app.php';

// Set up test database
$_ENV['DB_CONNECTION'] = 'sqlite';
$_ENV['DB_DATABASE'] = ':memory:';

// Boot the application for testing
$app->boot();

// Make app available globally for tests
$GLOBALS['app'] = $app;