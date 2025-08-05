<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Middleware;

use App\Infrastructure\Config\Config;
use App\Infrastructure\Http\Request;
use App\Infrastructure\Http\Response;

class RateLimitMiddleware
{
    private Config $config;
    private array $requests = []; // In production, this would use Redis

    public function __construct(Config $config)
    {
        $this->config = $config;
    }

    public function handle(Request $request): ?Response
    {
        $clientIp = $request->getClientIp();
        $maxRequests = $this->config->get('security.rate_limit.requests', 100);
        $windowSeconds = $this->config->get('security.rate_limit.window', 60);
        
        $now = time();
        $windowStart = $now - $windowSeconds;
        
        // Clean old requests
        if (isset($this->requests[$clientIp])) {
            $this->requests[$clientIp] = array_filter(
                $this->requests[$clientIp],
                fn($timestamp) => $timestamp > $windowStart
            );
        } else {
            $this->requests[$clientIp] = [];
        }
        
        // Check rate limit
        if (count($this->requests[$clientIp]) >= $maxRequests) {
            return Response::json([
                'success' => false,
                'error' => 'Rate limit exceeded',
                'code' => 'RATE_LIMIT_EXCEEDED',
                'retry_after' => $windowSeconds
            ], 429, [
                'Retry-After' => (string) $windowSeconds,
                'X-RateLimit-Limit' => (string) $maxRequests,
                'X-RateLimit-Remaining' => '0',
                'X-RateLimit-Reset' => (string) ($now + $windowSeconds)
            ]);
        }
        
        // Record this request
        $this->requests[$clientIp][] = $now;
        
        return null; // Continue to next middleware/controller
    }
}