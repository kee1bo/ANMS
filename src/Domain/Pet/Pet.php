<?php

declare(strict_types=1);

namespace App\Domain\Pet;

use DateTime;
use InvalidArgumentException;

/**
 * Pet Domain Model
 * Represents a pet with all its characteristics and business logic
 */
class Pet
{
    private int $id;
    private int $userId;
    private string $name;
    private string $species;
    private ?string $breed;
    private ?string $gender;
    private ?DateTime $birthDate;
    private ?int $age;
    private float $weight;
    private ?float $idealWeight;
    private string $activityLevel;
    private ?int $bodyConditionScore;
    private string $healthStatus;
    private ?string $spayNeuterStatus;
    private ?string $microchipId;
    private ?string $personality;
    private ?string $emergencyContact;
    private array $photos;
    private array $healthConditions;
    private array $allergies;
    private DateTime $createdAt;
    private DateTime $updatedAt;

    // Valid enum values
    private const VALID_SPECIES = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'guinea_pig', 'other'];
    private const VALID_GENDERS = ['male', 'female', 'unknown'];
    private const VALID_ACTIVITY_LEVELS = ['low', 'medium', 'high'];
    private const VALID_SPAY_NEUTER_STATUS = ['spayed', 'neutered', 'intact', 'unknown'];

    public function __construct(array $data)
    {
        $this->validateAndSetData($data);
    }

    private function validateAndSetData(array $data): void
    {
        // Required fields
        $this->setId($data['id'] ?? 0);
        $this->setUserId($data['user_id'] ?? throw new InvalidArgumentException('User ID is required'));
        $this->setName($data['name'] ?? throw new InvalidArgumentException('Pet name is required'));
        $this->setSpecies($data['species'] ?? throw new InvalidArgumentException('Pet species is required'));
        $this->setWeight($data['weight'] ?? throw new InvalidArgumentException('Pet weight is required'));
        $this->setActivityLevel($data['activity_level'] ?? 'medium');
        $this->setHealthStatus($data['health_status'] ?? 'healthy');

        // Optional fields
        $this->setBreed($data['breed'] ?? null);
        $this->setGender($data['gender'] ?? null);
        $this->setBirthDate($data['birth_date'] ?? null);
        $this->setIdealWeight($data['ideal_weight'] ?? null);
        $this->setBodyConditionScore($data['body_condition_score'] ?? null);
        $this->setSpayNeuterStatus($data['spay_neuter_status'] ?? null);
        $this->setMicrochipId($data['microchip_id'] ?? null);
        $this->setPersonality($data['personality'] ?? null);
        $this->setEmergencyContact($data['emergency_contact'] ?? null);

        // Arrays
        $this->photos = $data['photos'] ?? [];
        $this->healthConditions = $data['health_conditions'] ?? [];
        $this->allergies = $data['allergies'] ?? [];

        // Timestamps
        $this->setCreatedAt($data['created_at'] ?? date('Y-m-d H:i:s'));
        $this->setUpdatedAt($data['updated_at'] ?? date('Y-m-d H:i:s'));

        // Calculate age if birth date is provided
        $this->calculateAge();
    }

    // Getters
    public function getId(): int { return $this->id; }
    public function getUserId(): int { return $this->userId; }
    public function getName(): string { return $this->name; }
    public function getSpecies(): string { return $this->species; }
    public function getBreed(): ?string { return $this->breed; }
    public function getGender(): ?string { return $this->gender; }
    public function getBirthDate(): ?DateTime { return $this->birthDate; }
    public function getAge(): ?int { return $this->age; }
    public function getWeight(): float { return $this->weight; }
    public function getIdealWeight(): ?float { return $this->idealWeight; }
    public function getActivityLevel(): string { return $this->activityLevel; }
    public function getBodyConditionScore(): ?int { return $this->bodyConditionScore; }
    public function getHealthStatus(): string { return $this->healthStatus; }
    public function getSpayNeuterStatus(): ?string { return $this->spayNeuterStatus; }
    public function getMicrochipId(): ?string { return $this->microchipId; }
    public function getPersonality(): ?string { return $this->personality; }
    public function getEmergencyContact(): ?string { return $this->emergencyContact; }
    public function getPhotos(): array { return $this->photos; }
    public function getHealthConditions(): array { return $this->healthConditions; }
    public function getAllergies(): array { return $this->allergies; }
    public function getCreatedAt(): DateTime { return $this->createdAt; }
    public function getUpdatedAt(): DateTime { return $this->updatedAt; }

    // Setters with validation
    private function setId(int $id): void
    {
        if ($id < 0) {
            throw new InvalidArgumentException('Pet ID must be non-negative');
        }
        $this->id = $id;
    }

    private function setUserId(int $userId): void
    {
        if ($userId <= 0) {
            throw new InvalidArgumentException('User ID must be positive');
        }
        $this->userId = $userId;
    }

    private function setName(string $name): void
    {
        $name = trim($name);
        if (empty($name)) {
            throw new InvalidArgumentException('Pet name cannot be empty');
        }
        if (strlen($name) > 50) {
            throw new InvalidArgumentException('Pet name must be less than 50 characters');
        }
        if (!preg_match('/^[a-zA-Z0-9\s\-\']+$/', $name)) {
            throw new InvalidArgumentException('Pet name contains invalid characters');
        }
        $this->name = $name;
    }

    private function setSpecies(string $species): void
    {
        $species = strtolower(trim($species));
        if (!in_array($species, self::VALID_SPECIES)) {
            throw new InvalidArgumentException('Invalid species. Must be one of: ' . implode(', ', self::VALID_SPECIES));
        }
        $this->species = $species;
    }

    private function setBreed(?string $breed): void
    {
        if ($breed !== null) {
            $breed = trim($breed);
            if (strlen($breed) > 100) {
                throw new InvalidArgumentException('Breed name must be less than 100 characters');
            }
        }
        $this->breed = $breed;
    }

    private function setGender(?string $gender): void
    {
        if ($gender !== null) {
            $gender = strtolower(trim($gender));
            if (!in_array($gender, self::VALID_GENDERS)) {
                throw new InvalidArgumentException('Invalid gender. Must be one of: ' . implode(', ', self::VALID_GENDERS));
            }
        }
        $this->gender = $gender;
    }

    private function setBirthDate(?string $birthDate): void
    {
        if ($birthDate !== null) {
            try {
                $date = new DateTime($birthDate);
                $now = new DateTime();
                if ($date > $now) {
                    throw new InvalidArgumentException('Birth date cannot be in the future');
                }
                $this->birthDate = $date;
            } catch (\Exception $e) {
                throw new InvalidArgumentException('Invalid birth date format');
            }
        } else {
            $this->birthDate = null;
        }
    }

    private function setWeight(float $weight): void
    {
        if ($weight <= 0) {
            throw new InvalidArgumentException('Weight must be positive');
        }
        if ($weight > 200) {
            throw new InvalidArgumentException('Weight must be less than 200kg');
        }
        $this->weight = round($weight, 1);
    }

    private function setIdealWeight(?float $idealWeight): void
    {
        if ($idealWeight !== null) {
            if ($idealWeight <= 0) {
                throw new InvalidArgumentException('Ideal weight must be positive');
            }
            if ($idealWeight > 200) {
                throw new InvalidArgumentException('Ideal weight must be less than 200kg');
            }
            $this->idealWeight = round($idealWeight, 1);
        } else {
            $this->idealWeight = null;
        }
    }

    private function setActivityLevel(string $activityLevel): void
    {
        $activityLevel = strtolower(trim($activityLevel));
        if (!in_array($activityLevel, self::VALID_ACTIVITY_LEVELS)) {
            throw new InvalidArgumentException('Invalid activity level. Must be one of: ' . implode(', ', self::VALID_ACTIVITY_LEVELS));
        }
        $this->activityLevel = $activityLevel;
    }

    private function setBodyConditionScore(?int $score): void
    {
        if ($score !== null) {
            if ($score < 1 || $score > 9) {
                throw new InvalidArgumentException('Body condition score must be between 1 and 9');
            }
        }
        $this->bodyConditionScore = $score;
    }

    private function setHealthStatus(string $healthStatus): void
    {
        $this->healthStatus = trim($healthStatus);
    }

    private function setSpayNeuterStatus(?string $status): void
    {
        if ($status !== null) {
            $status = strtolower(trim($status));
            if (!in_array($status, self::VALID_SPAY_NEUTER_STATUS)) {
                throw new InvalidArgumentException('Invalid spay/neuter status. Must be one of: ' . implode(', ', self::VALID_SPAY_NEUTER_STATUS));
            }
        }
        $this->spayNeuterStatus = $status;
    }

    private function setMicrochipId(?string $microchipId): void
    {
        if ($microchipId !== null) {
            $microchipId = trim($microchipId);
            if (strlen($microchipId) > 20) {
                throw new InvalidArgumentException('Microchip ID must be less than 20 characters');
            }
        }
        $this->microchipId = $microchipId;
    }

    private function setPersonality(?string $personality): void
    {
        if ($personality !== null) {
            $personality = trim($personality);
            if (strlen($personality) > 500) {
                throw new InvalidArgumentException('Personality description must be less than 500 characters');
            }
        }
        $this->personality = $personality;
    }

    private function setEmergencyContact(?string $emergencyContact): void
    {
        if ($emergencyContact !== null) {
            $emergencyContact = trim($emergencyContact);
            if (strlen($emergencyContact) > 200) {
                throw new InvalidArgumentException('Emergency contact must be less than 200 characters');
            }
        }
        $this->emergencyContact = $emergencyContact;
    }

    private function setCreatedAt(string $createdAt): void
    {
        try {
            $this->createdAt = new DateTime($createdAt);
        } catch (\Exception $e) {
            throw new InvalidArgumentException('Invalid created_at date format');
        }
    }

    private function setUpdatedAt(string $updatedAt): void
    {
        try {
            $this->updatedAt = new DateTime($updatedAt);
        } catch (\Exception $e) {
            throw new InvalidArgumentException('Invalid updated_at date format');
        }
    }

    // Business logic methods
    private function calculateAge(): void
    {
        if ($this->birthDate === null) {
            $this->age = null;
            return;
        }

        $now = new DateTime();
        $interval = $this->birthDate->diff($now);
        $this->age = $interval->y;
    }

    public function getPrimaryPhoto(): ?array
    {
        foreach ($this->photos as $photo) {
            if ($photo['is_primary'] ?? false) {
                return $photo;
            }
        }
        return $this->photos[0] ?? null;
    }

    public function getHealthSummary(): array
    {
        $activeConditions = array_filter($this->healthConditions, fn($condition) => $condition['is_active'] ?? true);
        
        return [
            'active_conditions' => count($activeConditions),
            'total_conditions' => count($this->healthConditions),
            'allergies' => count($this->allergies),
            'last_updated' => $this->updatedAt->format('Y-m-d H:i:s'),
            'health_status' => $this->healthStatus
        ];
    }

    public function isOverweight(): bool
    {
        if ($this->idealWeight === null) {
            return false;
        }
        return $this->weight > ($this->idealWeight * 1.15); // 15% over ideal weight
    }

    public function isUnderweight(): bool
    {
        if ($this->idealWeight === null) {
            return false;
        }
        return $this->weight < ($this->idealWeight * 0.85); // 15% under ideal weight
    }

    public function getWeightStatus(): string
    {
        if ($this->isOverweight()) {
            return 'overweight';
        }
        if ($this->isUnderweight()) {
            return 'underweight';
        }
        return 'normal';
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->userId,
            'name' => $this->name,
            'species' => $this->species,
            'breed' => $this->breed,
            'gender' => $this->gender,
            'birth_date' => $this->birthDate?->format('Y-m-d'),
            'age' => $this->age,
            'weight' => $this->weight,
            'ideal_weight' => $this->idealWeight,
            'activity_level' => $this->activityLevel,
            'body_condition_score' => $this->bodyConditionScore,
            'health_status' => $this->healthStatus,
            'spay_neuter_status' => $this->spayNeuterStatus,
            'microchip_id' => $this->microchipId,
            'personality' => $this->personality,
            'emergency_contact' => $this->emergencyContact,
            'photos' => $this->photos,
            'health_conditions' => $this->healthConditions,
            'allergies' => $this->allergies,
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s'),
            'health_summary' => $this->getHealthSummary(),
            'weight_status' => $this->getWeightStatus(),
            'primary_photo' => $this->getPrimaryPhoto()
        ];
    }

    public static function getValidSpecies(): array
    {
        return self::VALID_SPECIES;
    }

    public static function getValidGenders(): array
    {
        return self::VALID_GENDERS;
    }

    public static function getValidActivityLevels(): array
    {
        return self::VALID_ACTIVITY_LEVELS;
    }

    public static function getValidSpayNeuterStatuses(): array
    {
        return self::VALID_SPAY_NEUTER_STATUS;
    }
}