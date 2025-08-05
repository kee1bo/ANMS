<?php

declare(strict_types=1);

namespace App\Infrastructure\Http;

use League\Container\Container;
use App\Infrastructure\Http\Request;
use App\Infrastructure\Http\Response;
use InvalidArgumentException;
use ReflectionClass;
use ReflectionMethod;

class Router
{
    private Container $container;
    private array $routes = [];
    private array $middleware = [];
    private string $currentPrefix = '';
    private array $currentMiddleware = [];

    public function __construct(Container $container)
    {
        $this->container = $container;
    }

    public function get(string $path, callable|string|array $handler): Route
    {
        return $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, callable|string|array $handler): Route
    {
        return $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, callable|string|array $handler): Route
    {
        return $this->addRoute('PUT', $path, $handler);
    }

    public function patch(string $path, callable|string|array $handler): Route
    {
        return $this->addRoute('PATCH', $path, $handler);
    }

    public function delete(string $path, callable|string|array $handler): Route
    {
        return $this->addRoute('DELETE', $path, $handler);
    }

    public function options(string $path, callable|string|array $handler): Route
    {
        return $this->addRoute('OPTIONS', $path, $handler);
    }

    private function addRoute(string $method, string $path, callable|string|array $handler): Route
    {
        $fullPath = $this->currentPrefix . $path;
        $route = new Route($method, $fullPath, $handler);
        
        // Add current middleware to route
        foreach ($this->currentMiddleware as $middleware) {
            $route->middleware($middleware);
        }

        $this->routes[] = $route;
        return $route;
    }

    public function group(array $attributes, callable $callback): void
    {
        $previousPrefix = $this->currentPrefix;
        $previousMiddleware = $this->currentMiddleware;

        if (isset($attributes['prefix'])) {
            $this->currentPrefix .= '/' . trim($attributes['prefix'], '/');
        }

        if (isset($attributes['middleware'])) {
            $middleware = is_array($attributes['middleware']) 
                ? $attributes['middleware'] 
                : [$attributes['middleware']];
            $this->currentMiddleware = array_merge($this->currentMiddleware, $middleware);
        }

        $callback($this);

        $this->currentPrefix = $previousPrefix;
        $this->currentMiddleware = $previousMiddleware;
    }

    public function dispatch(): void
    {
        $request = Request::fromGlobals();
        $response = $this->handleRequest($request);
        $response->send();
    }

    public function handleRequest(Request $request): Response
    {
        $method = $request->getMethod();
        $path = $request->getPath();

        foreach ($this->routes as $route) {
            if ($route->matches($method, $path)) {
                $params = $route->getParameters($path);
                $request->setParameters($params);

                return $this->executeRoute($route, $request);
            }
        }

        return new Response('Not Found', 404);
    }

    private function executeRoute(Route $route, Request $request): Response
    {
        try {
            // Execute middleware
            foreach ($route->getMiddleware() as $middlewareClass) {
                $middleware = $this->container->get($middlewareClass);
                $response = $middleware->handle($request);
                
                if ($response !== null) {
                    return $response;
                }
            }

            // Execute route handler
            $handler = $route->getHandler();
            
            if (is_callable($handler)) {
                $result = $handler($request);
            } elseif (is_string($handler)) {
                $result = $this->executeControllerAction($handler, $request);
            } elseif (is_array($handler) && count($handler) === 2) {
                [$controller, $method] = $handler;
                $result = $this->executeControllerMethod($controller, $method, $request);
            } else {
                throw new InvalidArgumentException('Invalid route handler');
            }

            if ($result instanceof Response) {
                return $result;
            }

            if (is_array($result) || is_object($result)) {
                return new Response(json_encode($result), 200, ['Content-Type' => 'application/json']);
            }

            return new Response((string) $result);

        } catch (\Throwable $e) {
            return $this->handleException($e, $request);
        }
    }

    private function executeControllerAction(string $handler, Request $request): mixed
    {
        if (!str_contains($handler, '@')) {
            throw new InvalidArgumentException('Controller action must be in format Controller@method');
        }

        [$controller, $method] = explode('@', $handler, 2);
        return $this->executeControllerMethod($controller, $method, $request);
    }

    private function executeControllerMethod(string $controller, string $method, Request $request): mixed
    {
        $controllerInstance = $this->container->get($controller);
        
        if (!method_exists($controllerInstance, $method)) {
            throw new InvalidArgumentException("Method {$method} not found in controller {$controller}");
        }

        $reflectionMethod = new ReflectionMethod($controllerInstance, $method);
        $parameters = $this->resolveMethodParameters($reflectionMethod, $request);

        return $reflectionMethod->invokeArgs($controllerInstance, $parameters);
    }

    private function resolveMethodParameters(ReflectionMethod $method, Request $request): array
    {
        $parameters = [];
        
        foreach ($method->getParameters() as $parameter) {
            $type = $parameter->getType();
            
            if ($type && !$type->isBuiltin()) {
                $typeName = $type->getName();
                
                if ($typeName === Request::class) {
                    $parameters[] = $request;
                } else {
                    $parameters[] = $this->container->get($typeName);
                }
            } else {
                $paramName = $parameter->getName();
                $value = $request->getParameter($paramName);
                
                if ($value === null && !$parameter->isOptional()) {
                    throw new InvalidArgumentException("Required parameter {$paramName} not found");
                }
                
                $parameters[] = $value ?? $parameter->getDefaultValue();
            }
        }

        return $parameters;
    }

    private function handleException(\Throwable $e, Request $request): Response
    {
        // Log the exception
        error_log($e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());

        // Return appropriate error response
        $statusCode = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
        $message = $statusCode === 500 ? 'Internal Server Error' : $e->getMessage();

        if ($request->expectsJson()) {
            return new Response(
                json_encode(['error' => $message, 'code' => $statusCode]),
                $statusCode,
                ['Content-Type' => 'application/json']
            );
        }

        return new Response($message, $statusCode);
    }
}