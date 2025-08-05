<?php

declare(strict_types=1);

namespace App\Domain\User;

enum UserRole: string
{
    case PET_OWNER = 'pet_owner';
    case VETERINARIAN = 'veterinarian';
    case ADMIN = 'admin';

    public function getDisplayName(): string
    {
        return match($this) {
            self::PET_OWNER => 'Pet Owner',
            self::VETERINARIAN => 'Veterinarian',
            self::ADMIN => 'Administrator'
        };
    }

    public function getPermissions(): array
    {
        return match($this) {
            self::PET_OWNER => [
                'pets.create',
                'pets.read',
                'pets.update',
                'pets.delete',
                'nutrition.create',
                'nutrition.read',
                'nutrition.update',
                'health.create',
                'health.read',
                'health.update',
                'education.read'
            ],
            self::VETERINARIAN => [
                'pets.create',
                'pets.read',
                'pets.update',
                'pets.delete',
                'nutrition.create',
                'nutrition.read',
                'nutrition.update',
                'nutrition.approve',
                'health.create',
                'health.read',
                'health.update',
                'health.verify',
                'education.read',
                'education.create',
                'clients.read',
                'clients.manage',
                'reports.generate'
            ],
            self::ADMIN => [
                'users.create',
                'users.read',
                'users.update',
                'users.delete',
                'pets.create',
                'pets.read',
                'pets.update',
                'pets.delete',
                'nutrition.create',
                'nutrition.read',
                'nutrition.update',
                'nutrition.approve',
                'health.create',
                'health.read',
                'health.update',
                'health.verify',
                'education.create',
                'education.read',
                'education.update',
                'education.delete',
                'system.manage',
                'reports.generate'
            ]
        };
    }

    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->getPermissions(), true);
    }
}