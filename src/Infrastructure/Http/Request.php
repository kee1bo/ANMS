<?php

declare(strict_types=1);

namespace App\Infrastructure\Http;

/**
 * HTTP Request wrapper
 */
class Request
{
    private array $query;
    private array $post;
    private array $server;
    private array $pathParams;
    private ?array $jsonBody;

    public function __construct()
    {
        $this->query = $_GET ?? [];
        $this->post = $_POST ?? [];
        $this->server = $_SERVER ?? [];
        $this->pathParams = [];
        $this->jsonBody = null;
    }

    public function getQuery(string $key = null): mixed
    {
        if ($key === null) {
            return $this->query;
        }
        return $this->query[$key] ?? null;
    }

    public function getPost(string $key = null): mixed
    {
        if ($key === null) {
            return $this->post;
        }
        return $this->post[$key] ?? null;
    }

    public function getJsonBody(): array
    {
        if ($this->jsonBody === null) {
            $input = file_get_contents('php://input');
            $this->jsonBody = json_decode($input, true) ?? [];
        }
        return $this->jsonBody;
    }

    public function getMethod(): string
    {
        return strtoupper($this->server['REQUEST_METHOD'] ?? 'GET');
    }

    public function getUri(): string
    {
        return $this->server['REQUEST_URI'] ?? '/';
    }

    public function getPathParam(string $key): ?string
    {
        return $this->pathParams[$key] ?? null;
    }

    public function setPathParam(string $key, string $value): void
    {
        $this->pathParams[$key] = $value;
    }

    public function getHeader(string $name): ?string
    {
        $headerKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return $this->server[$headerKey] ?? null;
    }

    public function isJson(): bool
    {
        $contentType = $this->getHeader('Content-Type') ?? '';
        return strpos($contentType, 'application/json') !== false;
    }
}