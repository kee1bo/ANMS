<?php

declare(strict_types=1);

use App\Bootstrap\SimpleApp;

// Define base path
$basePath = dirname(__DIR__);

// Load our simple autoloader
require_once $basePath . '/vendor/autoload.php';

// Create and boot simple application
$app = new SimpleApp($basePath);
$app->boot();

return $app;