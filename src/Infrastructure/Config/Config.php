<?php

declare(strict_types=1);

namespace App\Infrastructure\Config;

class Config
{
    private array $config = [];

    public function __construct()
    {
        $this->loadConfiguration();
    }

    private function loadConfiguration(): void
    {
        $this->config = [
            'app' => [
                'name' => $_ENV['APP_NAME'] ?? 'ANMS',
                'env' => $_ENV['APP_ENV'] ?? 'production',
                'debug' => filter_var($_ENV['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'url' => $_ENV['APP_URL'] ?? 'http://localhost',
                'timezone' => $_ENV['APP_TIMEZONE'] ?? 'UTC',
            ],
            'database' => [
                'connection' => $_ENV['DB_CONNECTION'] ?? 'mysql',
                'host' => $_ENV['DB_HOST'] ?? 'localhost',
                'port' => (int) ($_ENV['DB_PORT'] ?? 3306),
                'database' => $_ENV['DB_DATABASE'] ?? 'anms_db',
                'username' => $_ENV['DB_USERNAME'] ?? 'root',
                'password' => $_ENV['DB_PASSWORD'] ?? '',
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'options' => [
                    \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                    \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                    \PDO::ATTR_EMULATE_PREPARES => false,
                ]
            ],
            'redis' => [
                'host' => $_ENV['REDIS_HOST'] ?? 'localhost',
                'port' => (int) ($_ENV['REDIS_PORT'] ?? 6379),
                'password' => $_ENV['REDIS_PASSWORD'] ?? null,
                'database' => (int) ($_ENV['REDIS_DATABASE'] ?? 0),
            ],
            'jwt' => [
                'secret' => $_ENV['JWT_SECRET'] ?? 'your-secret-key',
                'expiry' => (int) ($_ENV['JWT_EXPIRY'] ?? 3600),
                'refresh_expiry' => (int) ($_ENV['JWT_REFRESH_EXPIRY'] ?? 604800),
                'algorithm' => 'HS256',
            ],
            'mail' => [
                'driver' => $_ENV['MAIL_DRIVER'] ?? 'smtp',
                'host' => $_ENV['MAIL_HOST'] ?? 'localhost',
                'port' => (int) ($_ENV['MAIL_PORT'] ?? 587),
                'username' => $_ENV['MAIL_USERNAME'] ?? '',
                'password' => $_ENV['MAIL_PASSWORD'] ?? '',
                'encryption' => $_ENV['MAIL_ENCRYPTION'] ?? 'tls',
                'from' => [
                    'address' => $_ENV['MAIL_FROM_ADDRESS'] ?? 'noreply@anms.com',
                    'name' => $_ENV['MAIL_FROM_NAME'] ?? 'ANMS System',
                ],
            ],
            'storage' => [
                'driver' => $_ENV['STORAGE_DRIVER'] ?? 'local',
                'path' => $_ENV['STORAGE_PATH'] ?? 'storage/uploads',
                'max_upload_size' => (int) ($_ENV['MAX_UPLOAD_SIZE'] ?? 10485760), // 10MB
            ],
            'security' => [
                'bcrypt_rounds' => (int) ($_ENV['BCRYPT_ROUNDS'] ?? 12),
                'session_lifetime' => (int) ($_ENV['SESSION_LIFETIME'] ?? 120),
                'rate_limit' => [
                    'requests' => (int) ($_ENV['RATE_LIMIT_REQUESTS'] ?? 100),
                    'window' => (int) ($_ENV['RATE_LIMIT_WINDOW'] ?? 60),
                ],
            ],
            'logging' => [
                'level' => $_ENV['LOG_LEVEL'] ?? 'info',
                'channel' => $_ENV['LOG_CHANNEL'] ?? 'daily',
                'path' => 'storage/logs',
            ],
            'external' => [
                'openai_api_key' => $_ENV['OPENAI_API_KEY'] ?? null,
                'nutrition_api_key' => $_ENV['NUTRITION_API_KEY'] ?? null,
            ],
        ];
    }

    public function get(string $key, mixed $default = null): mixed
    {
        $keys = explode('.', $key);
        $value = $this->config;

        foreach ($keys as $segment) {
            if (!is_array($value) || !array_key_exists($segment, $value)) {
                return $default;
            }
            $value = $value[$segment];
        }

        return $value;
    }

    public function set(string $key, mixed $value): void
    {
        $keys = explode('.', $key);
        $config = &$this->config;

        foreach ($keys as $segment) {
            if (!isset($config[$segment]) || !is_array($config[$segment])) {
                $config[$segment] = [];
            }
            $config = &$config[$segment];
        }

        $config = $value;
    }

    public function has(string $key): bool
    {
        return $this->get($key) !== null;
    }

    public function all(): array
    {
        return $this->config;
    }
}