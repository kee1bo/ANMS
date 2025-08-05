<?php

declare(strict_types=1);

namespace App\Domain\User;

use DateTime;
use JsonSerializable;

class User implements JsonSerializable
{
    private int $id;
    private string $email;
    private string $passwordHash;
    private string $firstName;
    private string $lastName;
    private UserRole $role;
    private ?string $location;
    private ?string $phone;
    private ?DateTime $emailVerifiedAt;
    private ?string $twoFactorSecret;
    private array $preferences;
    private DateTime $createdAt;
    private DateTime $updatedAt;
    private ?DateTime $deletedAt;

    public function __construct(
        string $email,
        string $passwordHash,
        string $firstName,
        string $lastName,
        UserRole $role = UserRole::PET_OWNER,
        ?string $location = null,
        ?string $phone = null
    ) {
        $this->email = $email;
        $this->passwordHash = $passwordHash;
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->role = $role;
        $this->location = $location;
        $this->phone = $phone;
        $this->preferences = [];
        $this->createdAt = new DateTime();
        $this->updatedAt = new DateTime();
    }

    // Getters
    public function getId(): int
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getPasswordHash(): string
    {
        return $this->passwordHash;
    }

    public function getFirstName(): string
    {
        return $this->firstName;
    }

    public function getLastName(): string
    {
        return $this->lastName;
    }

    public function getFullName(): string
    {
        return $this->firstName . ' ' . $this->lastName;
    }

    public function getRole(): UserRole
    {
        return $this->role;
    }

    public function getLocation(): ?string
    {
        return $this->location;
    }

    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function getEmailVerifiedAt(): ?DateTime
    {
        return $this->emailVerifiedAt;
    }

    public function getTwoFactorSecret(): ?string
    {
        return $this->twoFactorSecret;
    }

    public function getPreferences(): array
    {
        return $this->preferences;
    }

    public function getCreatedAt(): DateTime
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTime
    {
        return $this->updatedAt;
    }

    public function getDeletedAt(): ?DateTime
    {
        return $this->deletedAt;
    }

    // Business Logic Methods
    public function isEmailVerified(): bool
    {
        return $this->emailVerifiedAt !== null;
    }

    public function hasTwoFactorEnabled(): bool
    {
        return $this->twoFactorSecret !== null;
    }

    public function isVeterinarian(): bool
    {
        return $this->role === UserRole::VETERINARIAN;
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::ADMIN;
    }

    public function verifyEmail(): void
    {
        $this->emailVerifiedAt = new DateTime();
        $this->updatedAt = new DateTime();
    }

    public function enableTwoFactor(string $secret): void
    {
        $this->twoFactorSecret = $secret;
        $this->updatedAt = new DateTime();
    }

    public function disableTwoFactor(): void
    {
        $this->twoFactorSecret = null;
        $this->updatedAt = new DateTime();
    }

    public function updateProfile(
        string $firstName,
        string $lastName,
        ?string $location = null,
        ?string $phone = null
    ): void {
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->location = $location;
        $this->phone = $phone;
        $this->updatedAt = new DateTime();
    }

    public function updatePreferences(array $preferences): void
    {
        $this->preferences = array_merge($this->preferences, $preferences);
        $this->updatedAt = new DateTime();
    }

    public function changePassword(string $newPasswordHash): void
    {
        $this->passwordHash = $newPasswordHash;
        $this->updatedAt = new DateTime();
    }

    public function softDelete(): void
    {
        $this->deletedAt = new DateTime();
        $this->updatedAt = new DateTime();
    }

    public function restore(): void
    {
        $this->deletedAt = null;
        $this->updatedAt = new DateTime();
    }

    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }

    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'firstName' => $this->firstName,
            'lastName' => $this->lastName,
            'fullName' => $this->getFullName(),
            'role' => $this->role->value,
            'location' => $this->location,
            'phone' => $this->phone,
            'emailVerified' => $this->isEmailVerified(),
            'twoFactorEnabled' => $this->hasTwoFactorEnabled(),
            'preferences' => $this->preferences,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
            'updatedAt' => $this->updatedAt->format('Y-m-d H:i:s')
        ];
    }

    // Hydration method for repository
    public static function fromArray(array $data): self
    {
        $user = new self(
            $data['email'],
            $data['password_hash'],
            $data['first_name'],
            $data['last_name'],
            UserRole::from($data['role']),
            $data['location'] ?? null,
            $data['phone'] ?? null
        );

        if (isset($data['id'])) {
            $user->id = (int) $data['id'];
        }

        if (isset($data['email_verified_at'])) {
            $user->emailVerifiedAt = new DateTime($data['email_verified_at']);
        }

        if (isset($data['two_factor_secret'])) {
            $user->twoFactorSecret = $data['two_factor_secret'];
        }

        if (isset($data['preferences'])) {
            $user->preferences = is_string($data['preferences']) 
                ? json_decode($data['preferences'], true) 
                : $data['preferences'];
        }

        if (isset($data['created_at'])) {
            $user->createdAt = new DateTime($data['created_at']);
        }

        if (isset($data['updated_at'])) {
            $user->updatedAt = new DateTime($data['updated_at']);
        }

        if (isset($data['deleted_at'])) {
            $user->deletedAt = new DateTime($data['deleted_at']);
        }

        return $user;
    }
}