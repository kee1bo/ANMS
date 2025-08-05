<?php

declare(strict_types=1);

namespace App\Domain\User;

interface UserRepositoryInterface
{
    public function findById(int $id): ?User;
    public function findByEmail(string $email): ?User;
    public function create(User $user): User;
    public function update(User $user): User;
    public function delete(int $id): bool;
    public function findAll(int $limit = 50, int $offset = 0): array;
    public function findByRole(UserRole $role): array;
    public function existsByEmail(string $email): bool;
    public function countByRole(UserRole $role): int;
}