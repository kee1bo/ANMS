<?php

declare(strict_types=1);

use App\Bootstrap\App;

// Define base path
$basePath = dirname(__DIR__);

// Load Composer autoloader
require_once $basePath . '/vendor/autoload.php';

// Create and boot application
$app = new App($basePath);
$app->boot();

return $app;