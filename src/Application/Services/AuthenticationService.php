<?php

declare(strict_types=1);

namespace App\Application\Services;

use App\Domain\User\User;
use App\Domain\User\UserRole;
use App\Domain\User\UserRepositoryInterface;
use App\Infrastructure\Config\Config;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use DateTime;
use Exception;
use InvalidArgumentException;

class AuthenticationService
{
    private UserRepositoryInterface $userRepository;
    private Config $config;

    public function __construct(UserRepositoryInterface $userRepository, Config $config)
    {
        $this->userRepository = $userRepository;
        $this->config = $config;
    }

    public function authenticate(string $email, string $password): ?array
    {
        $user = $this->userRepository->findByEmail($email);
        
        if (!$user || !password_verify($password, $user->getPasswordHash())) {
            return null;
        }

        if ($user->isDeleted()) {
            return null;
        }

        return [
            'user' => $user,
            'token' => $this->generateToken($user),
            'refresh_token' => $this->generateRefreshToken($user)
        ];
    }

    public function register(array $userData): User
    {
        $this->validateRegistrationData($userData);

        if ($this->userRepository->existsByEmail($userData['email'])) {
            throw new InvalidArgumentException('Email already exists');
        }

        $user = new User(
            $userData['email'],
            password_hash($userData['password'], PASSWORD_DEFAULT, [
                'cost' => $this->config->get('security.bcrypt_rounds', 12)
            ]),
            $userData['first_name'],
            $userData['last_name'],
            UserRole::from($userData['role'] ?? 'pet_owner'),
            $userData['location'] ?? null,
            $userData['phone'] ?? null
        );

        return $this->userRepository->create($user);
    }

    public function verifyToken(string $token): ?User
    {
        try {
            $decoded = JWT::decode(
                $token,
                new Key($this->config->get('jwt.secret'), $this->config->get('jwt.algorithm'))
            );

            return $this->userRepository->findById($decoded->user_id);
        } catch (Exception $e) {
            return null;
        }
    }

    public function refreshToken(string $refreshToken): ?array
    {
        try {
            $decoded = JWT::decode(
                $refreshToken,
                new Key($this->config->get('jwt.secret'), $this->config->get('jwt.algorithm'))
            );

            if ($decoded->type !== 'refresh') {
                return null;
            }

            $user = $this->userRepository->findById($decoded->user_id);
            if (!$user) {
                return null;
            }

            return [
                'user' => $user,
                'token' => $this->generateToken($user),
                'refresh_token' => $this->generateRefreshToken($user)
            ];
        } catch (Exception $e) {
            return null;
        }
    }

    public function resetPassword(string $email): bool
    {
        $user = $this->userRepository->findByEmail($email);
        if (!$user) {
            return false;
        }

        // Generate reset token
        $resetToken = $this->generatePasswordResetToken($user);
        
        // In a real application, you would send this token via email
        // For now, we'll just return true to indicate the process started
        return true;
    }

    public function changePassword(int $userId, string $currentPassword, string $newPassword): bool
    {
        $user = $this->userRepository->findById($userId);
        if (!$user) {
            return false;
        }

        if (!password_verify($currentPassword, $user->getPasswordHash())) {
            return false;
        }

        $this->validatePassword($newPassword);

        $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT, [
            'cost' => $this->config->get('security.bcrypt_rounds', 12)
        ]);

        $user->changePassword($newPasswordHash);
        $this->userRepository->update($user);

        return true;
    }

    public function enableTwoFactor(int $userId): string
    {
        $user = $this->userRepository->findById($userId);
        if (!$user) {
            throw new InvalidArgumentException('User not found');
        }

        $secret = $this->generateTwoFactorSecret();
        $user->enableTwoFactor($secret);
        $this->userRepository->update($user);

        return $secret;
    }

    public function disableTwoFactor(int $userId): bool
    {
        $user = $this->userRepository->findById($userId);
        if (!$user) {
            return false;
        }

        $user->disableTwoFactor();
        $this->userRepository->update($user);

        return true;
    }

    public function verifyTwoFactor(int $userId, string $code): bool
    {
        $user = $this->userRepository->findById($userId);
        if (!$user || !$user->hasTwoFactorEnabled()) {
            return false;
        }

        // In a real implementation, you would verify the TOTP code
        // For now, we'll accept any 6-digit code
        return preg_match('/^\d{6}$/', $code);
    }

    private function generateToken(User $user): string
    {
        $payload = [
            'user_id' => $user->getId(),
            'email' => $user->getEmail(),
            'role' => $user->getRole()->value,
            'iat' => time(),
            'exp' => time() + $this->config->get('jwt.expiry', 3600),
            'type' => 'access'
        ];

        return JWT::encode($payload, $this->config->get('jwt.secret'), $this->config->get('jwt.algorithm'));
    }

    private function generateRefreshToken(User $user): string
    {
        $payload = [
            'user_id' => $user->getId(),
            'iat' => time(),
            'exp' => time() + $this->config->get('jwt.refresh_expiry', 604800),
            'type' => 'refresh'
        ];

        return JWT::encode($payload, $this->config->get('jwt.secret'), $this->config->get('jwt.algorithm'));
    }

    private function generatePasswordResetToken(User $user): string
    {
        $payload = [
            'user_id' => $user->getId(),
            'email' => $user->getEmail(),
            'iat' => time(),
            'exp' => time() + 3600, // 1 hour expiry
            'type' => 'password_reset'
        ];

        return JWT::encode($payload, $this->config->get('jwt.secret'), $this->config->get('jwt.algorithm'));
    }

    private function generateTwoFactorSecret(): string
    {
        // Generate a base32 secret for TOTP
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < 32; $i++) {
            $secret .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $secret;
    }

    private function validateRegistrationData(array $data): void
    {
        $required = ['email', 'password', 'first_name', 'last_name'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new InvalidArgumentException("Field '{$field}' is required");
            }
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email format');
        }

        $this->validatePassword($data['password']);

        if (isset($data['role']) && !in_array($data['role'], ['pet_owner', 'veterinarian', 'admin'])) {
            throw new InvalidArgumentException('Invalid role');
        }
    }

    private function validatePassword(string $password): void
    {
        if (strlen($password) < 8) {
            throw new InvalidArgumentException('Password must be at least 8 characters long');
        }

        if (!preg_match('/[A-Z]/', $password)) {
            throw new InvalidArgumentException('Password must contain at least one uppercase letter');
        }

        if (!preg_match('/[a-z]/', $password)) {
            throw new InvalidArgumentException('Password must contain at least one lowercase letter');
        }

        if (!preg_match('/\d/', $password)) {
            throw new InvalidArgumentException('Password must contain at least one number');
        }
    }
}