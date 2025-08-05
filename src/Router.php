<?php
namespace ANMS;

class Router
{
    private array $routes = [];

    public function add(string $method, string $path, callable $handler): void
    {
        $this->routes[strtoupper($method)][$path] = $handler;
    }

    public function dispatch(string $method, string $path): void
    {
        $method = strtoupper($method);

        $handler = $this->routes[$method][$path] ?? null;

        if ($handler) {
            // Execute the handler (it will handle its own output)
            call_user_func($handler);
        } else {
            http_response_code(404);
            echo '404 Not Found';
        }
    }
}
