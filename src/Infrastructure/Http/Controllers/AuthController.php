<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Controllers;

use App\Application\Services\AuthenticationService;
use App\Infrastructure\Http\Request;
use App\Infrastructure\Http\Response;
use Exception;

class AuthController extends ApiController
{
    private AuthenticationService $authService;

    public function __construct(AuthenticationService $authService)
    {
        $this->authService = $authService;
    }

    public function register(Request $request): Response
    {
        try {
            $data = $request->getJsonBody();
            
            if (!$data) {
                return $this->errorResponse('Invalid JSON data', 'INVALID_JSON');
            }

            $this->validateRequired($data, ['email', 'password', 'first_name', 'last_name']);

            $user = $this->authService->register($data);

            return $this->successResponse([
                'user' => $user->jsonSerialize(),
                'message' => 'User registered successfully. Please verify your email.'
            ], 'Registration successful', 201);

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function login(Request $request): Response
    {
        try {
            $data = $request->getJsonBody();
            
            if (!$data) {
                return $this->errorResponse('Invalid JSON data', 'INVALID_JSON');
            }

            $this->validateRequired($data, ['email', 'password']);

            $result = $this->authService->authenticate($data['email'], $data['password']);

            if (!$result) {
                return $this->errorResponse('Invalid credentials', 'INVALID_CREDENTIALS', 401);
            }

            return $this->successResponse([
                'user' => $result['user']->jsonSerialize(),
                'token' => $result['token'],
                'refresh_token' => $result['refresh_token'],
                'expires_in' => 3600 // 1 hour
            ], 'Login successful');

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function refreshToken(Request $request): Response
    {
        try {
            $data = $request->getJsonBody();
            
            if (!$data || !isset($data['refresh_token'])) {
                return $this->errorResponse('Refresh token required', 'MISSING_REFRESH_TOKEN');
            }

            $result = $this->authService->refreshToken($data['refresh_token']);

            if (!$result) {
                return $this->errorResponse('Invalid refresh token', 'INVALID_REFRESH_TOKEN', 401);
            }

            return $this->successResponse([
                'user' => $result['user']->jsonSerialize(),
                'token' => $result['token'],
                'refresh_token' => $result['refresh_token'],
                'expires_in' => 3600
            ], 'Token refreshed successfully');

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function resetPassword(Request $request): Response
    {
        try {
            $data = $request->getJsonBody();
            
            if (!$data || !isset($data['email'])) {
                return $this->errorResponse('Email required', 'MISSING_EMAIL');
            }

            $success = $this->authService->resetPassword($data['email']);

            if (!$success) {
                // Don't reveal if email exists or not for security
                return $this->successResponse(null, 'If the email exists, a reset link has been sent');
            }

            return $this->successResponse(null, 'Password reset link sent to your email');

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function changePassword(Request $request): Response
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            $data = $request->getJsonBody();
            
            if (!$data) {
                return $this->errorResponse('Invalid JSON data', 'INVALID_JSON');
            }

            $this->validateRequired($data, ['current_password', 'new_password']);

            $success = $this->authService->changePassword(
                $user->getId(),
                $data['current_password'],
                $data['new_password']
            );

            if (!$success) {
                return $this->errorResponse('Current password is incorrect', 'INVALID_CURRENT_PASSWORD', 400);
            }

            return $this->successResponse(null, 'Password changed successfully');

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function enableTwoFactor(Request $request): Response
    {
        try {
            $user = $this->getAuthenticatedUser($request);

            $secret = $this->authService->enableTwoFactor($user->getId());

            return $this->successResponse([
                'secret' => $secret,
                'qr_code_url' => $this->generateQrCodeUrl($user->getEmail(), $secret)
            ], 'Two-factor authentication enabled');

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function disableTwoFactor(Request $request): Response
    {
        try {
            $user = $this->getAuthenticatedUser($request);

            $success = $this->authService->disableTwoFactor($user->getId());

            if (!$success) {
                return $this->errorResponse('Failed to disable two-factor authentication', 'DISABLE_2FA_FAILED');
            }

            return $this->successResponse(null, 'Two-factor authentication disabled');

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function verifyTwoFactor(Request $request): Response
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            $data = $request->getJsonBody();
            
            if (!$data || !isset($data['code'])) {
                return $this->errorResponse('Verification code required', 'MISSING_CODE');
            }

            $valid = $this->authService->verifyTwoFactor($user->getId(), $data['code']);

            if (!$valid) {
                return $this->errorResponse('Invalid verification code', 'INVALID_CODE', 400);
            }

            return $this->successResponse(null, 'Two-factor code verified successfully');

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function me(Request $request): Response
    {
        try {
            $user = $this->getAuthenticatedUser($request);

            return $this->successResponse([
                'user' => $user->jsonSerialize()
            ]);

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    private function generateQrCodeUrl(string $email, string $secret): string
    {
        $issuer = 'ANMS';
        $label = urlencode("{$issuer}:{$email}");
        
        return "otpauth://totp/{$label}?secret={$secret}&issuer=" . urlencode($issuer);
    }
}