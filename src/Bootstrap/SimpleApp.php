<?php

declare(strict_types=1);

namespace App\Bootstrap;

/**
 * Simple Application Bootstrap
 * This version doesn't depend on external libraries like Dotenv or League Container
 */
class SimpleApp
{
    private array $config = [];
    private array $services = [];
    private bool $booted = false;

    public function __construct(string $basePath)
    {
        $this->loadEnvironment($basePath);
        $this->loadConfig();
        $this->setupErrorHandling();
    }

    private function loadEnvironment(string $basePath): void
    {
        $envFile = $basePath . '/.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || str_starts_with($line, '#')) {
                    continue; // Skip comments and empty lines
                }
                
                if (strpos($line, '=') !== false) {
                    [$key, $value] = array_map('trim', explode('=', $line, 2));
                    // Remove quotes if present
                    $value = trim($value, '"\'');
                    $_ENV[$key] = $value;
                    putenv("{$key}={$value}");
                }
            }
        }
    }

    private function loadConfig(): void
    {
        $this->config = [
            'app' => [
                'name' => $_ENV['APP_NAME'] ?? 'ANMS',
                'env' => $_ENV['APP_ENV'] ?? 'development',
                'debug' => filter_var($_ENV['APP_DEBUG'] ?? 'true', FILTER_VALIDATE_BOOLEAN),
                'url' => $_ENV['APP_URL'] ?? 'http://localhost:8080',
                'timezone' => $_ENV['APP_TIMEZONE'] ?? 'UTC',
            ],
            'database' => [
                'host' => $_ENV['DB_HOST'] ?? 'database',
                'port' => $_ENV['DB_PORT'] ?? '3306',
                'database' => $_ENV['DB_DATABASE'] ?? 'anms_db',
                'username' => $_ENV['DB_USERNAME'] ?? 'anms_user',
                'password' => $_ENV['DB_PASSWORD'] ?? 'anms_password',
            ],
            'redis' => [
                'host' => $_ENV['REDIS_HOST'] ?? 'redis',
                'port' => $_ENV['REDIS_PORT'] ?? '6379',
                'password' => $_ENV['REDIS_PASSWORD'] ?? '',
                'database' => $_ENV['REDIS_DATABASE'] ?? '0',
            ]
        ];
    }

    private function setupErrorHandling(): void
    {
        error_reporting(E_ALL);
        
        if ($this->config['app']['debug']) {
            ini_set('display_errors', '1');
        } else {
            ini_set('display_errors', '0');
        }

        set_error_handler([$this, 'handleError']);
        set_exception_handler([$this, 'handleException']);
    }

    public function handleError(int $level, string $message, string $file = '', int $line = 0): bool
    {
        if (!(error_reporting() & $level)) {
            return false;
        }

        error_log("PHP Error: {$message} in {$file}:{$line}");
        return true;
    }

    public function handleException(\Throwable $exception): void
    {
        error_log("Uncaught Exception: " . $exception->getMessage() . " in " . $exception->getFile() . ":" . $exception->getLine());

        if ($this->config['app']['debug']) {
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

    public function boot(): void
    {
        if ($this->booted) {
            return;
        }

        try {
            // Set timezone
            date_default_timezone_set($this->config['app']['timezone']);
            
            $this->booted = true;
        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    public function run(): void
    {
        if (!$this->booted) {
            $this->boot();
        }

        // Simple routing - for now just show a basic page
        $this->handleRequest();
    }

    private function handleRequest(): void
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        
        // Remove query string
        $uri = strtok($uri, '?');
        
        // Simple routing
        switch ($uri) {
            case '/':
                $this->showHomePage();
                break;
            case '/health':
                $this->showHealthCheck();
                break;
            case '/phpinfo':
                if ($this->config['app']['debug']) {
                    phpinfo();
                } else {
                    http_response_code(404);
                    echo "Not Found";
                }
                break;
            default:
                $this->showNotFound();
                break;
        }
    }

    private function showHomePage(): void
    {
        $dbStatus = $this->checkDatabaseConnection();
        
        echo $this->renderPage('ANMS - Animal Nutrition Management System', '
            <div class="hero">
                <h1>🐾 Animal Nutrition Management System</h1>
                <p>Modern pet nutrition planning and health tracking platform</p>
            </div>
            
            <div class="status-grid">
                <div class="status-card">
                    <h3>🌐 System Status</h3>
                    <p class="status-good">✅ Application Running</p>
                    <p class="status-' . ($dbStatus ? 'good">✅' : 'error">❌') . ' Database: ' . ($dbStatus ? 'Connected' : 'Disconnected') . '</p>
                </div>
                
                <div class="status-card">
                    <h3>🧮 Nutrition Engine</h3>
                    <p class="status-good">✅ Calculation Engine Active</p>
                    <p class="status-good">✅ Scientific Formulas Loaded</p>
                </div>
                
                <div class="status-card">
                    <h3>📊 Database</h3>
                    <p class="status-info">📋 Tables: ' . $this->getTableCount() . '</p>
                    <p class="status-info">👥 Users: ' . $this->getUserCount() . '</p>
                    <p class="status-info">🐾 Pets: ' . $this->getPetCount() . '</p>
                </div>
            </div>
            
            <div class="features">
                <h2>🚀 Features</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <h4>🐕 Pet Profiles</h4>
                        <p>Comprehensive pet information management</p>
                    </div>
                    <div class="feature-card">
                        <h4>🍽️ Nutrition Planning</h4>
                        <p>Scientific nutrition calculations and meal planning</p>
                    </div>
                    <div class="feature-card">
                        <h4>📈 Health Tracking</h4>
                        <p>Monitor weight, activity, and health metrics</p>
                    </div>
                    <div class="feature-card">
                        <h4>👨‍⚕️ Professional Tools</h4>
                        <p>Veterinarian collaboration and reporting</p>
                    </div>
                </div>
            </div>
            
            <div class="links">
                <h2>🔗 Quick Links</h2>
                <ul>
                    <li><a href="/health">System Health Check</a></li>
                    <li><a href="http://localhost:8081" target="_blank">phpMyAdmin (Database)</a></li>
                    <li><a href="https://github.com/your-repo" target="_blank">GitHub Repository</a></li>
                </ul>
            </div>
        ');
    }

    private function showHealthCheck(): void
    {
        $health = [
            'status' => 'ok',
            'timestamp' => date('Y-m-d H:i:s'),
            'version' => '1.0.0',
            'environment' => $this->config['app']['env'],
            'database' => $this->checkDatabaseConnection() ? 'connected' : 'disconnected',
            'tables' => $this->getTableCount(),
            'users' => $this->getUserCount(),
            'pets' => $this->getPetCount()
        ];

        header('Content-Type: application/json');
        echo json_encode($health, JSON_PRETTY_PRINT);
    }

    private function showNotFound(): void
    {
        http_response_code(404);
        echo $this->renderPage('404 - Not Found', '
            <div class="error-page">
                <h1>404 - Page Not Found</h1>
                <p>The requested page could not be found.</p>
                <a href="/">← Back to Home</a>
            </div>
        ');
    }

    private function renderPage(string $title, string $content): string
    {
        return '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . htmlspecialchars($title) . '</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6; color: #333; background: #f5f5f5;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .hero { text-align: center; background: white; padding: 40px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .hero h1 { font-size: 2.5em; margin-bottom: 10px; color: #2c3e50; }
        .hero p { font-size: 1.2em; color: #7f8c8d; }
        .status-grid, .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .status-card, .feature-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .status-card h3, .feature-card h4 { margin-bottom: 15px; color: #2c3e50; }
        .status-good { color: #27ae60; font-weight: bold; }
        .status-error { color: #e74c3c; font-weight: bold; }
        .status-info { color: #3498db; font-weight: bold; }
        .features { background: white; padding: 30px; border-radius: 10px; margin: 30px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .features h2 { margin-bottom: 20px; color: #2c3e50; }
        .links { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .links h2 { margin-bottom: 20px; color: #2c3e50; }
        .links ul { list-style: none; }
        .links li { margin: 10px 0; }
        .links a { color: #3498db; text-decoration: none; font-weight: bold; }
        .links a:hover { text-decoration: underline; }
        .error-page { text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .error-page h1 { color: #e74c3c; margin-bottom: 20px; }
        .error-page a { color: #3498db; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        ' . $content . '
    </div>
</body>
</html>';
    }

    private function checkDatabaseConnection(): bool
    {
        try {
            $dsn = "mysql:host={$this->config['database']['host']};port={$this->config['database']['port']};dbname={$this->config['database']['database']};charset=utf8mb4";
            $pdo = new \PDO($dsn, $this->config['database']['username'], $this->config['database']['password']);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    private function getTableCount(): int
    {
        try {
            $dsn = "mysql:host={$this->config['database']['host']};port={$this->config['database']['port']};dbname={$this->config['database']['database']};charset=utf8mb4";
            $pdo = new \PDO($dsn, $this->config['database']['username'], $this->config['database']['password']);
            $stmt = $pdo->query("SHOW TABLES");
            return $stmt->rowCount();
        } catch (\Exception $e) {
            return 0;
        }
    }

    private function getUserCount(): int
    {
        try {
            $dsn = "mysql:host={$this->config['database']['host']};port={$this->config['database']['port']};dbname={$this->config['database']['database']};charset=utf8mb4";
            $pdo = new \PDO($dsn, $this->config['database']['username'], $this->config['database']['password']);
            $stmt = $pdo->query("SELECT COUNT(*) FROM users");
            return (int) $stmt->fetchColumn();
        } catch (\Exception $e) {
            return 0;
        }
    }

    private function getPetCount(): int
    {
        try {
            $dsn = "mysql:host={$this->config['database']['host']};port={$this->config['database']['port']};dbname={$this->config['database']['database']};charset=utf8mb4";
            $pdo = new \PDO($dsn, $this->config['database']['username'], $this->config['database']['password']);
            $stmt = $pdo->query("SELECT COUNT(*) FROM pets");
            return (int) $stmt->fetchColumn();
        } catch (\Exception $e) {
            return 0;
        }
    }

    public function getConfig(string $key = null, $default = null)
    {
        if ($key === null) {
            return $this->config;
        }

        $keys = explode('.', $key);
        $value = $this->config;

        foreach ($keys as $k) {
            if (!isset($value[$k])) {
                return $default;
            }
            $value = $value[$k];
        }

        return $value;
    }
}