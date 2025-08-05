<?php

declare(strict_types=1);

namespace App\Infrastructure\Http;

class Route
{
    private string $method;
    private string $path;
    private string $pattern;
    private callable|string|array $handler;
    private array $middleware = [];
    private array $parameterNames = [];

    public function __construct(string $method, string $path, callable|string|array $handler)
    {
        $this->method = strtoupper($method);
        $this->path = '/' . trim($path, '/');
        $this->handler = $handler;
        $this->compilePattern();
    }

    private function compilePattern(): void
    {
        $pattern = $this->path;
        $parameterNames = [];

        // Replace {param} with regex capture groups
        $pattern = preg_replace_callback('/\{([^}]+)\}/', function ($matches) use (&$parameterNames) {
            $parameterNames[] = $matches[1];
            return '([^/]+)';
        }, $pattern);

        // Escape forward slashes and add anchors
        $this->pattern = '#^' . str_replace('/', '\/', $pattern) . '$#';
        $this->parameterNames = $parameterNames;
    }

    public function matches(string $method, string $path): bool
    {
        if ($this->method !== strtoupper($method)) {
            return false;
        }

        $path = '/' . trim($path, '/');
        return preg_match($this->pattern, $path) === 1;
    }

    public function getParameters(string $path): array
    {
        $path = '/' . trim($path, '/');
        $matches = [];
        
        if (preg_match($this->pattern, $path, $matches)) {
            array_shift($matches); // Remove full match
            return array_combine($this->parameterNames, $matches);
        }

        return [];
    }

    public function middleware(string|array $middleware): self
    {
        if (is_array($middleware)) {
            $this->middleware = array_merge($this->middleware, $middleware);
        } else {
            $this->middleware[] = $middleware;
        }

        return $this;
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function getPath(): string
    {
        return $this->path;
    }

    public function getHandler(): callable|string|array
    {
        return $this->handler;
    }

    public function getMiddleware(): array
    {
        return $this->middleware;
    }
}