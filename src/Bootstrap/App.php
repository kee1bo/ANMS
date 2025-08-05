<?php

declare(strict_types=1);

namespace App\Bootstrap;

use App\Infrastructure\Config\Config;
use App\Infrastructure\Database\DatabaseManager;
use App\Infrastructure\Http\Router;
use App\Infrastructure\Logging\Logger;
use League\Container\Container;
use League\Container\ReflectionContainer;
use Dotenv\Dotenv;
use Exception;
use Throwable;

class App
{
    private Container $container;
    private Config $config;
    private bool $booted = false;

    public function __construct(string $basePath)
    {
        $this->loadEnvironment($basePath);
        $this->container = new Container();
        $this->config = new Config();
        $this->registerCoreServices();
    }

    private function loadEnvironment(string $basePath): void
    {
        if (file_exists($basePath . '/.env')) {
            $dotenv = Dotenv::createImmutable($basePath);
            $dotenv->load();
        }
    }

    private function registerCoreServices(): void
    {
        // Enable auto-wiring
        $this->container->delegate(new ReflectionContainer(true));

        // Register configuration
        $this->container->add(Config::class, $this->config);

        // Register database manager
        $this->container->add(DatabaseManager::class)
            ->addArgument($this->config);

        // Register logger
        $this->container->add(Logger::class)
            ->addArgument($this->config);

        // Register router
        $this->container->add(Router::class)
            ->addArgument($this->container);
    }

    public function boot(): void
    {
        if ($this->booted) {
            return;
        }

        try {
            // Set error handling
            $this->setupErrorHandling();

            // Set timezone
            date_default_timezone_set($this->config->get('app.timezone', 'UTC'));

            // Initialize database connection
            $this->container->get(DatabaseManager::class)->connect();

            $this->booted = true;
        } catch (Throwable $e) {
            $this->handleBootError($e);
        }
    }

    private function setupErrorHandling(): void
    {
        error_reporting(E_ALL);
        
        if ($this->config->get('app.debug', false)) {
            ini_set('display_errors', '1');
        } else {
            ini_set('display_errors', '0');
        }

        set_error_handler([$this, 'handleError']);
        set_exception_handler([$this, 'handleException']);
        register_shutdown_function([$this, 'handleShutdown']);
    }

    public function handleError(int $level, string $message, string $file = '', int $line = 0): bool
    {
        if (!(error_reporting() & $level)) {
            return false;
        }

        $logger = $this->container->get(Logger::class);
        $logger->error("PHP Error: {$message}", [
            'level' => $level,
            'file' => $file,
            'line' => $line
        ]);

        return true;
    }

    public function handleException(Throwable $exception): void
    {
        $logger = $this->container->get(Logger::class);
        $logger->error("Uncaught Exception: " . $exception->getMessage(), [
            'exception' => $exception,
            'trace' => $exception->getTraceAsString()
        ]);

        if ($this->config->get('app.debug', false)) {
            echo "<pre>";
            echo "Uncaught Exception: " . $exception->getMessage() . "\n";
            echo "File: " . $exception->getFile() . ":" . $exception->getLine() . "\n";
            echo "Trace:\n" . $exception->getTraceAsString();
            echo "</pre>";
        } else {
            http_response_code(500);
            echo "Internal Server Error";
        }
    }

    public function handleShutdown(): void
    {
        $error = error_get_last();
        if ($error && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE])) {
            $this->handleError($error['type'], $error['message'], $error['file'], $error['line']);
        }
    }

    private function handleBootError(Throwable $e): void
    {
        error_log("Application boot failed: " . $e->getMessage());
        
        if ($this->config->get('app.debug', false)) {
            throw $e;
        }
        
        http_response_code(500);
        echo "Application failed to start";
        exit(1);
    }

    public function run(): void
    {
        if (!$this->booted) {
            $this->boot();
        }

        try {
            $router = $this->container->get(Router::class);
            $router->dispatch();
        } catch (Throwable $e) {
            $this->handleException($e);
        }
    }

    public function getContainer(): Container
    {
        return $this->container;
    }

    public function getConfig(): Config
    {
        return $this->config;
    }
}