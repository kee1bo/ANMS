<?php

declare(strict_types=1);

namespace App\Infrastructure\Repository;

use App\Domain\User\User;
use App\Domain\User\UserRole;
use App\Domain\User\UserRepositoryInterface;
use App\Infrastructure\Database\DatabaseManager;
use PDO;

class UserRepository implements UserRepositoryInterface
{
    private DatabaseManager $db;

    public function __construct(DatabaseManager $db)
    {
        $this->db = $db;
    }

    public function findById(int $id): ?User
    {
        $stmt = $this->db->prepare("
            SELECT * FROM users 
            WHERE id = ? AND deleted_at IS NULL
        ");
        $stmt->execute([$id]);
        
        $data = $stmt->fetch();
        return $data ? User::fromArray($data) : null;
    }

    public function findByEmail(string $email): ?User
    {
        $stmt = $this->db->prepare("
            SELECT * FROM users 
            WHERE email = ? AND deleted_at IS NULL
        ");
        $stmt->execute([$email]);
        
        $data = $stmt->fetch();
        return $data ? User::fromArray($data) : null;
    }

    public function create(User $user): User
    {
        $stmt = $this->db->prepare("
            INSERT INTO users (
                email, password_hash, first_name, last_name, role, 
                location, phone, email_verified_at, two_factor_secret, 
                preferences, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");

        $preferences = json_encode($user->getPreferences());
        $emailVerifiedAt = $user->getEmailVerifiedAt()?->format('Y-m-d H:i:s');

        $stmt->execute([
            $user->getEmail(),
            $user->getPasswordHash(),
            $user->getFirstName(),
            $user->getLastName(),
            $user->getRole()->value,
            $user->getLocation(),
            $user->getPhone(),
            $emailVerifiedAt,
            $user->getTwoFactorSecret(),
            $preferences
        ]);

        $id = (int) $this->db->lastInsertId();
        return $this->findById($id);
    }

    public function update(User $user): User
    {
        $stmt = $this->db->prepare("
            UPDATE users SET 
                email = ?, password_hash = ?, first_name = ?, last_name = ?, 
                role = ?, location = ?, phone = ?, email_verified_at = ?, 
                two_factor_secret = ?, preferences = ?, updated_at = NOW()
            WHERE id = ?
        ");

        $preferences = json_encode($user->getPreferences());
        $emailVerifiedAt = $user->getEmailVerifiedAt()?->format('Y-m-d H:i:s');

        $stmt->execute([
            $user->getEmail(),
            $user->getPasswordHash(),
            $user->getFirstName(),
            $user->getLastName(),
            $user->getRole()->value,
            $user->getLocation(),
            $user->getPhone(),
            $emailVerifiedAt,
            $user->getTwoFactorSecret(),
            $preferences,
            $user->getId()
        ]);

        return $this->findById($user->getId());
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("
            UPDATE users SET deleted_at = NOW() WHERE id = ?
        ");
        return $stmt->execute([$id]);
    }

    public function findAll(int $limit = 50, int $offset = 0): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM users 
            WHERE deleted_at IS NULL 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$limit, $offset]);
        
        $users = [];
        while ($data = $stmt->fetch()) {
            $users[] = User::fromArray($data);
        }
        
        return $users;
    }

    public function findByRole(UserRole $role): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM users 
            WHERE role = ? AND deleted_at IS NULL 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$role->value]);
        
        $users = [];
        while ($data = $stmt->fetch()) {
            $users[] = User::fromArray($data);
        }
        
        return $users;
    }

    public function existsByEmail(string $email): bool
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM users 
            WHERE email = ? AND deleted_at IS NULL
        ");
        $stmt->execute([$email]);
        
        return $stmt->fetchColumn() > 0;
    }

    public function countByRole(UserRole $role): int
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM users 
            WHERE role = ? AND deleted_at IS NULL
        ");
        $stmt->execute([$role->value]);
        
        return (int) $stmt->fetchColumn();
    }
}