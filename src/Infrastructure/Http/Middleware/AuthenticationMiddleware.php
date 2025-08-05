<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Middleware;

use App\Application\Services\AuthenticationService;
use App\Infrastructure\Http\Request;
use App\Infrastructure\Http\Response;

class AuthenticationMiddleware
{
    private AuthenticationService $authService;

    public function __construct(AuthenticationService $authService)
    {
        $this->authService = $authService;
    }

    public function handle(Request $request): ?Response
    {
        $authHeader = $request->getHeader('authorization');
        
        if (!$authHeader) {
            return Response::json([
                'success' => false,
                'error' => 'Authorization header required',
                'code' => 'MISSING_AUTH_HEADER'
            ], 401);
        }

        if (!str_starts_with($authHeader, 'Bearer ')) {
            return Response::json([
                'success' => false,
                'error' => 'Invalid authorization format. Use: Bearer <token>',
                'code' => 'INVALID_AUTH_FORMAT'
            ], 401);
        }

        $token = substr($authHeader, 7);
        $user = $this->authService->verifyToken($token);

        if (!$user) {
            return Response::json([
                'success' => false,
                'error' => 'Invalid or expired token',
                'code' => 'INVALID_TOKEN'
            ], 401);
        }

        // Add user to request for use in controllers
        $request->setParameters(['authenticated_user' => $user]);

        return null; // Continue to next middleware/controller
    }
}