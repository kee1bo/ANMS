<?php

declare(strict_types=1);

namespace App\Infrastructure\Logging;

use App\Infrastructure\Config\Config;
use Monolog\Logger as MonologLogger;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\RotatingFileHandler;
use Monolog\Formatter\LineFormatter;
use Psr\Log\LoggerInterface;

class Logger implements LoggerInterface
{
    private MonologLogger $logger;
    private Config $config;

    public function __construct(Config $config)
    {
        $this->config = $config;
        $this->logger = new MonologLogger('anms');
        $this->setupHandlers();
    }

    private function setupHandlers(): void
    {
        $logPath = $this->config->get('logging.path', 'storage/logs');
        $logLevel = $this->getLogLevel();
        $channel = $this->config->get('logging.channel', 'daily');

        // Ensure log directory exists
        if (!is_dir($logPath)) {
            mkdir($logPath, 0755, true);
        }

        $handler = match ($channel) {
            'daily' => new RotatingFileHandler(
                $logPath . '/anms.log',
                0,
                $logLevel
            ),
            'single' => new StreamHandler(
                $logPath . '/anms.log',
                $logLevel
            ),
            default => new StreamHandler('php://stdout', $logLevel)
        };

        // Set custom formatter
        $formatter = new LineFormatter(
            "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n",
            'Y-m-d H:i:s'
        );
        $handler->setFormatter($formatter);

        $this->logger->pushHandler($handler);
    }

    private function getLogLevel(): int
    {
        $level = strtolower($this->config->get('logging.level', 'info'));

        return match ($level) {
            'debug' => MonologLogger::DEBUG,
            'info' => MonologLogger::INFO,
            'notice' => MonologLogger::NOTICE,
            'warning' => MonologLogger::WARNING,
            'error' => MonologLogger::ERROR,
            'critical' => MonologLogger::CRITICAL,
            'alert' => MonologLogger::ALERT,
            'emergency' => MonologLogger::EMERGENCY,
            default => MonologLogger::INFO
        };
    }

    public function emergency(string|\Stringable $message, array $context = []): void
    {
        $this->logger->emergency($message, $context);
    }

    public function alert(string|\Stringable $message, array $context = []): void
    {
        $this->logger->alert($message, $context);
    }

    public function critical(string|\Stringable $message, array $context = []): void
    {
        $this->logger->critical($message, $context);
    }

    public function error(string|\Stringable $message, array $context = []): void
    {
        $this->logger->error($message, $context);
    }

    public function warning(string|\Stringable $message, array $context = []): void
    {
        $this->logger->warning($message, $context);
    }

    public function notice(string|\Stringable $message, array $context = []): void
    {
        $this->logger->notice($message, $context);
    }

    public function info(string|\Stringable $message, array $context = []): void
    {
        $this->logger->info($message, $context);
    }

    public function debug(string|\Stringable $message, array $context = []): void
    {
        $this->logger->debug($message, $context);
    }

    public function log($level, string|\Stringable $message, array $context = []): void
    {
        $this->logger->log($level, $message, $context);
    }
}