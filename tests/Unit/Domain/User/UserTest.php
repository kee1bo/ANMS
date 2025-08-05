<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\User;

use App\Domain\User\User;
use App\Domain\User\UserRole;
use PHPUnit\Framework\TestCase;
use DateTime;

class UserTest extends TestCase
{
    public function testUserCanBeCreated(): void
    {
        $user = new User(
            'test@example.com',
            'hashed_password',
            'John',
            'Doe',
            UserRole::PET_OWNER,
            'New York',
            '+1234567890'
        );

        $this->assertEquals('test@example.com', $user->getEmail());
        $this->assertEquals('hashed_password', $user->getPasswordHash());
        $this->assertEquals('John', $user->getFirstName());
        $this->assertEquals('Doe', $user->getLastName());
        $this->assertEquals('John Doe', $user->getFullName());
        $this->assertEquals(UserRole::PET_OWNER, $user->getRole());
        $this->assertEquals('New York', $user->getLocation());
        $this->assertEquals('+1234567890', $user->getPhone());
        $this->assertFalse($user->isEmailVerified());
        $this->assertFalse($user->hasTwoFactorEnabled());
        $this->assertFalse($user->isVeterinarian());
        $this->assertFalse($user->isAdmin());
    }

    public function testUserCanBeCreatedWithMinimalData(): void
    {
        $user = new User(
            'test@example.com',
            'hashed_password',
            'John',
            'Doe'
        );

        $this->assertEquals(UserRole::PET_OWNER, $user->getRole());
        $this->assertNull($user->getLocation());
        $this->assertNull($user->getPhone());
    }

    public function testUserCanVerifyEmail(): void
    {
        $user = new User('test@example.com', 'password', 'John', 'Doe');
        
        $this->assertFalse($user->isEmailVerified());
        
        $user->verifyEmail();
        
        $this->assertTrue($user->isEmailVerified());
        $this->assertInstanceOf(DateTime::class, $user->getEmailVerifiedAt());
    }

    public function testUserCanEnableTwoFactor(): void
    {
        $user = new User('test@example.com', 'password', 'John', 'Doe');
        $secret = 'JBSWY3DPEHPK3PXP';
        
        $this->assertFalse($user->hasTwoFactorEnabled());
        
        $user->enableTwoFactor($secret);
        
        $this->assertTrue($user->hasTwoFactorEnabled());
        $this->assertEquals($secret, $user->getTwoFactorSecret());
    }

    public function testUserCanDisableTwoFactor(): void
    {
        $user = new User('test@example.com', 'password', 'John', 'Doe');
        $user->enableTwoFactor('JBSWY3DPEHPK3PXP');
        
        $this->assertTrue($user->hasTwoFactorEnabled());
        
        $user->disableTwoFactor();
        
        $this->assertFalse($user->hasTwoFactorEnabled());
        $this->assertNull($user->getTwoFactorSecret());
    }

    public function testUserCanUpdateProfile(): void
    {
        $user = new User('test@example.com', 'password', 'John', 'Doe');
        
        $user->updateProfile('Jane', 'Smith', 'Los Angeles', '+0987654321');
        
        $this->assertEquals('Jane', $user->getFirstName());
        $this->assertEquals('Smith', $user->getLastName());
        $this->assertEquals('Jane Smith', $user->getFullName());
        $this->assertEquals('Los Angeles', $user->getLocation());
        $this->assertEquals('+0987654321', $user->getPhone());
    }

    public function testUserCanUpdatePreferences(): void
    {
        $user = new User('test@example.com', 'password', 'John', 'Doe');
        
        $preferences = ['theme' => 'dark', 'notifications' => true];
        $user->updatePreferences($preferences);
        
        $this->assertEquals($preferences, $user->getPreferences());
        
        // Test merging preferences
        $newPreferences = ['language' => 'es', 'notifications' => false];
        $user->updatePreferences($newPreferences);
        
        $expected = ['theme' => 'dark', 'notifications' => false, 'language' => 'es'];
        $this->assertEquals($expected, $user->getPreferences());
    }

    public function testUserCanChangePassword(): void
    {
        $user = new User('test@example.com', 'old_password', 'John', 'Doe');
        
        $user->changePassword('new_password_hash');
        
        $this->assertEquals('new_password_hash', $user->getPasswordHash());
    }

    public function testUserCanBeSoftDeleted(): void
    {
        $user = new User('test@example.com', 'password', 'John', 'Doe');
        
        $this->assertFalse($user->isDeleted());
        $this->assertNull($user->getDeletedAt());
        
        $user->softDelete();
        
        $this->assertTrue($user->isDeleted());
        $this->assertInstanceOf(DateTime::class, $user->getDeletedAt());
    }

    public function testUserCanBeRestored(): void
    {
        $user = new User('test@example.com', 'password', 'John', 'Doe');
        $user->softDelete();
        
        $this->assertTrue($user->isDeleted());
        
        $user->restore();
        
        $this->assertFalse($user->isDeleted());
        $this->assertNull($user->getDeletedAt());
    }

    public function testVeterinarianUserIsIdentified(): void
    {
        $user = new User(
            'vet@example.com',
            'password',
            'Dr. Jane',
            'Smith',
            UserRole::VETERINARIAN
        );
        
        $this->assertTrue($user->isVeterinarian());
        $this->assertFalse($user->isAdmin());
    }

    public function testAdminUserIsIdentified(): void
    {
        $user = new User(
            'admin@example.com',
            'password',
            'Admin',
            'User',
            UserRole::ADMIN
        );
        
        $this->assertTrue($user->isAdmin());
        $this->assertFalse($user->isVeterinarian());
    }

    public function testUserCanBeSerializedToJson(): void
    {
        $user = new User(
            'test@example.com',
            'password',
            'John',
            'Doe',
            UserRole::PET_OWNER,
            'New York',
            '+1234567890'
        );
        
        $user->updatePreferences(['theme' => 'dark']);
        
        $json = $user->jsonSerialize();
        
        $this->assertIsArray($json);
        $this->assertEquals('test@example.com', $json['email']);
        $this->assertEquals('John', $json['firstName']);
        $this->assertEquals('Doe', $json['lastName']);
        $this->assertEquals('John Doe', $json['fullName']);
        $this->assertEquals('pet_owner', $json['role']);
        $this->assertEquals('New York', $json['location']);
        $this->assertEquals('+1234567890', $json['phone']);
        $this->assertFalse($json['emailVerified']);
        $this->assertFalse($json['twoFactorEnabled']);
        $this->assertEquals(['theme' => 'dark'], $json['preferences']);
        $this->assertArrayHasKey('createdAt', $json);
        $this->assertArrayHasKey('updatedAt', $json);
        $this->assertArrayNotHasKey('passwordHash', $json);
    }

    public function testUserCanBeCreatedFromArray(): void
    {
        $data = [
            'id' => 1,
            'email' => 'test@example.com',
            'password_hash' => 'hashed_password',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'role' => 'veterinarian',
            'location' => 'New York',
            'phone' => '+1234567890',
            'email_verified_at' => '2024-01-01 12:00:00',
            'two_factor_secret' => 'SECRET123',
            'preferences' => '{"theme":"dark"}',
            'created_at' => '2024-01-01 10:00:00',
            'updated_at' => '2024-01-01 11:00:00'
        ];
        
        $user = User::fromArray($data);
        
        $this->assertEquals(1, $user->getId());
        $this->assertEquals('test@example.com', $user->getEmail());
        $this->assertEquals('hashed_password', $user->getPasswordHash());
        $this->assertEquals('John', $user->getFirstName());
        $this->assertEquals('Doe', $user->getLastName());
        $this->assertEquals(UserRole::VETERINARIAN, $user->getRole());
        $this->assertEquals('New York', $user->getLocation());
        $this->assertEquals('+1234567890', $user->getPhone());
        $this->assertTrue($user->isEmailVerified());
        $this->assertTrue($user->hasTwoFactorEnabled());
        $this->assertEquals('SECRET123', $user->getTwoFactorSecret());
        $this->assertEquals(['theme' => 'dark'], $user->getPreferences());
    }
}