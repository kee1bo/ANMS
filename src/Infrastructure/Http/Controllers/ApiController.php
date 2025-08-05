<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Controllers;

use App\Domain\User\User;
use App\Infrastructure\Http\Request;
use App\Infrastructure\Http\Response;
use InvalidArgumentException;
use Exception;

abstract class ApiController
{
    protected function getAuthenticatedUser(Request $request): User
    {
        $user = $request->getParameter('authenticated_user');
        
        if (!$user instanceof User) {
            throw new InvalidArgumentException('User not authenticated');
        }
        
        return $user;
    }

    protected function validateRequired(array $data, array $required): void
    {
        foreach ($required as $field) {
            if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                throw new InvalidArgumentException("Field '{$field}' is required");
            }
        }
    }

    protected function successResponse(mixed $data = null, string $message = null, int $statusCode = 200): Response
    {
        $response = ['success' => true];
        
        if ($message) {
            $response['message'] = $message;
        }
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        return Response::json($response, $statusCode);
    }

    protected function errorResponse(string $message, string $code = null, int $statusCode = 400, array $details = null): Response
    {
        $response = [
            'success' => false,
            'error' => $message
        ];
        
        if ($code) {
            $response['code'] = $code;
        }
        
        if ($details) {
            $response['details'] = $details;
        }
        
        return Response::json($response, $statusCode);
    }

    protected function handleException(Exception $e): Response
    {
        // Log the exception
        error_log($e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
        
        if ($e instanceof InvalidArgumentException) {
            return $this->errorResponse($e->getMessage(), 'VALIDATION_ERROR', 400);
        }
        
        // Don't expose internal errors in production
        $message = $_ENV['APP_DEBUG'] === 'true' ? $e->getMessage() : 'Internal server error';
        
        return $this->errorResponse($message, 'INTERNAL_ERROR', 500);
    }

    protected function paginate(array $items, int $page = 1, int $perPage = 20): array
    {
        $total = count($items);
        $offset = ($page - 1) * $perPage;
        $paginatedItems = array_slice($items, $offset, $perPage);
        
        return [
            'items' => $paginatedItems,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => (int) ceil($total / $perPage),
                'has_next' => $page < ceil($total / $perPage),
                'has_prev' => $page > 1
            ]
        ];
    }
}