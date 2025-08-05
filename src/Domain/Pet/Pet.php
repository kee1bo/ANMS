<?php

declare(strict_types=1);

namespace App\Domain\Pet;

use DateTime;
use JsonSerializable;

class Pet implements JsonSerializable
{
    private int $id;
    private int $userId;
    private string $name;
    private PetSpecies $species;
    private ?string $breed;
    private ?DateTime $dateOfBirth;
    private PetGender $gender;
    private bool $isNeutered;
    private ?string $microchipId;
    private ?float $currentWeight;
    private ?float $idealWeight;
    private ActivityLevel $activityLevel;
    private ?int $bodyConditionScore;
    private array $healthConditions;
    private array $allergies;
    private array $medications;
    private array $personalityTraits;
    private ?string $photoUrl;
    private ?int $veterinarianId;
    private DateTime $createdAt;
    private DateTime $updatedAt;
    private ?DateTime $deletedAt;

    public function __construct(
        int $userId,
        string $name,
        PetSpecies $species,
        ?string $breed = null,
        ?DateTime $dateOfBirth = null,
        PetGender $gender = PetGender::UNKNOWN,
        bool $isNeutered = false
    ) {
        $this->userId = $userId;
        $this->name = $name;
        $this->species = $species;
        $this->breed = $breed;
        $this->dateOfBirth = $dateOfBirth;
        $this->gender = $gender;
        $this->isNeutered = $isNeutered;
        $this->activityLevel = ActivityLevel::MODERATE;
        $this->healthConditions = [];
        $this->allergies = [];
        $this->medications = [];
        $this->personalityTraits = [];
        $this->createdAt = new DateTime();
        $this->updatedAt = new DateTime();
    }

    // Getters
    public function getId(): int
    {
        return $this->id;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getSpecies(): PetSpecies
    {
        return $this->species;
    }

    public function getBreed(): ?string
    {
        return $this->breed;
    }

    public function getDateOfBirth(): ?DateTime
    {
        return $this->dateOfBirth;
    }

    public function getGender(): PetGender
    {
        return $this->gender;
    }

    public function isNeutered(): bool
    {
        return $this->isNeutered;
    }

    public function getMicrochipId(): ?string
    {
        return $this->microchipId;
    }

    public function getCurrentWeight(): ?float
    {
        return $this->currentWeight;
    }

    public function getIdealWeight(): ?float
    {
        return $this->idealWeight;
    }

    public function getActivityLevel(): ActivityLevel
    {
        return $this->activityLevel;
    }

    public function getBodyConditionScore(): ?int
    {
        return $this->bodyConditionScore;
    }

    public function getHealthConditions(): array
    {
        return $this->healthConditions;
    }

    public function getAllergies(): array
    {
        return $this->allergies;
    }

    public function getMedications(): array
    {
        return $this->medications;
    }

    public function getPersonalityTraits(): array
    {
        return $this->personalityTraits;
    }

    public function getPhotoUrl(): ?string
    {
        return $this->photoUrl;
    }

    public function getVeterinarianId(): ?int
    {
        return $this->veterinarianId;
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
    public function getAge(): ?int
    {
        if (!$this->dateOfBirth) {
            return null;
        }

        return $this->dateOfBirth->diff(new DateTime())->y;
    }

    public function getAgeInMonths(): ?int
    {
        if (!$this->dateOfBirth) {
            return null;
        }

        $diff = $this->dateOfBirth->diff(new DateTime());
        return ($diff->y * 12) + $diff->m;
    }

    public function getLifeStage(): LifeStage
    {
        $ageInMonths = $this->getAgeInMonths();
        if (!$ageInMonths) {
            return LifeStage::ADULT;
        }

        return match ($this->species) {
            PetSpecies::DOG => match (true) {
                $ageInMonths < 12 => LifeStage::PUPPY,
                $ageInMonths >= 84 => LifeStage::SENIOR, // 7 years
                default => LifeStage::ADULT
            },
            PetSpecies::CAT => match (true) {
                $ageInMonths < 12 => LifeStage::KITTEN,
                $ageInMonths >= 84 => LifeStage::SENIOR, // 7 years
                default => LifeStage::ADULT
            },
            default => LifeStage::ADULT
        };
    }

    public function isOverweight(): bool
    {
        if (!$this->currentWeight || !$this->idealWeight) {
            return false;
        }

        return $this->currentWeight > ($this->idealWeight * 1.1);
    }

    public function isUnderweight(): bool
    {
        if (!$this->currentWeight || !$this->idealWeight) {
            return false;
        }

        return $this->currentWeight < ($this->idealWeight * 0.9);
    }

    public function getWeightStatus(): WeightStatus
    {
        if ($this->isUnderweight()) {
            return WeightStatus::UNDERWEIGHT;
        }
        
        if ($this->isOverweight()) {
            return WeightStatus::OVERWEIGHT;
        }
        
        return WeightStatus::IDEAL;
    }

    public function hasHealthCondition(string $condition): bool
    {
        return in_array($condition, $this->healthConditions, true);
    }

    public function hasAllergy(string $allergen): bool
    {
        return in_array($allergen, $this->allergies, true);
    }

    public function isOnMedication(string $medication): bool
    {
        foreach ($this->medications as $med) {
            if (is_array($med) && isset($med['name']) && $med['name'] === $medication) {
                return true;
            }
            if (is_string($med) && $med === $medication) {
                return true;
            }
        }
        return false;
    }

    // Update Methods
    public function updateBasicInfo(
        string $name,
        ?string $breed = null,
        ?DateTime $dateOfBirth = null,
        PetGender $gender = null,
        bool $isNeutered = null
    ): void {
        $this->name = $name;
        if ($breed !== null) $this->breed = $breed;
        if ($dateOfBirth !== null) $this->dateOfBirth = $dateOfBirth;
        if ($gender !== null) $this->gender = $gender;
        if ($isNeutered !== null) $this->isNeutered = $isNeutered;
        $this->updatedAt = new DateTime();
    }

    public function updateWeight(float $currentWeight, ?float $idealWeight = null): void
    {
        $this->currentWeight = $currentWeight;
        if ($idealWeight !== null) {
            $this->idealWeight = $idealWeight;
        }
        $this->updatedAt = new DateTime();
    }

    public function updateActivityLevel(ActivityLevel $activityLevel): void
    {
        $this->activityLevel = $activityLevel;
        $this->updatedAt = new DateTime();
    }

    public function updateBodyConditionScore(int $score): void
    {
        if ($score < 1 || $score > 9) {
            throw new \InvalidArgumentException('Body condition score must be between 1 and 9');
        }
        
        $this->bodyConditionScore = $score;
        $this->updatedAt = new DateTime();
    }

    public function setMicrochipId(string $microchipId): void
    {
        $this->microchipId = $microchipId;
        $this->updatedAt = new DateTime();
    }

    public function setPhotoUrl(string $photoUrl): void
    {
        $this->photoUrl = $photoUrl;
        $this->updatedAt = new DateTime();
    }

    public function assignVeterinarian(int $veterinarianId): void
    {
        $this->veterinarianId = $veterinarianId;
        $this->updatedAt = new DateTime();
    }

    public function updateHealthConditions(array $healthConditions): void
    {
        $this->healthConditions = $healthConditions;
        $this->updatedAt = new DateTime();
    }

    public function addHealthCondition(string $condition): void
    {
        if (!in_array($condition, $this->healthConditions, true)) {
            $this->healthConditions[] = $condition;
            $this->updatedAt = new DateTime();
        }
    }

    public function removeHealthCondition(string $condition): void
    {
        $this->healthConditions = array_values(
            array_filter($this->healthConditions, fn($c) => $c !== $condition)
        );
        $this->updatedAt = new DateTime();
    }

    public function updateAllergies(array $allergies): void
    {
        $this->allergies = $allergies;
        $this->updatedAt = new DateTime();
    }

    public function addAllergy(string $allergen): void
    {
        if (!in_array($allergen, $this->allergies, true)) {
            $this->allergies[] = $allergen;
            $this->updatedAt = new DateTime();
        }
    }

    public function removeAllergy(string $allergen): void
    {
        $this->allergies = array_values(
            array_filter($this->allergies, fn($a) => $a !== $allergen)
        );
        $this->updatedAt = new DateTime();
    }

    public function updateMedications(array $medications): void
    {
        $this->medications = $medications;
        $this->updatedAt = new DateTime();
    }

    public function updatePersonalityTraits(array $traits): void
    {
        $this->personalityTraits = $traits;
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
            'userId' => $this->userId,
            'name' => $this->name,
            'species' => $this->species->value,
            'breed' => $this->breed,
            'dateOfBirth' => $this->dateOfBirth?->format('Y-m-d'),
            'age' => $this->getAge(),
            'ageInMonths' => $this->getAgeInMonths(),
            'lifeStage' => $this->getLifeStage()->value,
            'gender' => $this->gender->value,
            'isNeutered' => $this->isNeutered,
            'microchipId' => $this->microchipId,
            'currentWeight' => $this->currentWeight,
            'idealWeight' => $this->idealWeight,
            'weightStatus' => $this->getWeightStatus()->value,
            'activityLevel' => $this->activityLevel->value,
            'bodyConditionScore' => $this->bodyConditionScore,
            'healthConditions' => $this->healthConditions,
            'allergies' => $this->allergies,
            'medications' => $this->medications,
            'personalityTraits' => $this->personalityTraits,
            'photoUrl' => $this->photoUrl,
            'veterinarianId' => $this->veterinarianId,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
            'updatedAt' => $this->updatedAt->format('Y-m-d H:i:s')
        ];
    }

    public static function fromArray(array $data): self
    {
        $pet = new self(
            (int) $data['user_id'],
            $data['name'],
            PetSpecies::from($data['species']),
            $data['breed'] ?? null,
            isset($data['date_of_birth']) ? new DateTime($data['date_of_birth']) : null,
            PetGender::from($data['gender'] ?? 'unknown'),
            (bool) ($data['is_neutered'] ?? false)
        );

        if (isset($data['id'])) {
            $pet->id = (int) $data['id'];
        }

        $pet->microchipId = $data['microchip_id'] ?? null;
        $pet->currentWeight = isset($data['current_weight']) ? (float) $data['current_weight'] : null;
        $pet->idealWeight = isset($data['ideal_weight']) ? (float) $data['ideal_weight'] : null;
        $pet->activityLevel = ActivityLevel::from($data['activity_level'] ?? 'moderate');
        $pet->bodyConditionScore = isset($data['body_condition_score']) ? (int) $data['body_condition_score'] : null;
        
        $pet->healthConditions = isset($data['health_conditions']) 
            ? (is_string($data['health_conditions']) ? json_decode($data['health_conditions'], true) : $data['health_conditions']) ?? []
            : [];
            
        $pet->allergies = isset($data['allergies']) 
            ? (is_string($data['allergies']) ? json_decode($data['allergies'], true) : $data['allergies']) ?? []
            : [];
            
        $pet->medications = isset($data['medications']) 
            ? (is_string($data['medications']) ? json_decode($data['medications'], true) : $data['medications']) ?? []
            : [];
            
        $pet->personalityTraits = isset($data['personality_traits']) 
            ? (is_string($data['personality_traits']) ? json_decode($data['personality_traits'], true) : $data['personality_traits']) ?? []
            : [];

        $pet->photoUrl = $data['photo_url'] ?? null;
        $pet->veterinarianId = isset($data['veterinarian_id']) ? (int) $data['veterinarian_id'] : null;

        if (isset($data['created_at'])) {
            $pet->createdAt = new DateTime($data['created_at']);
        }

        if (isset($data['updated_at'])) {
            $pet->updatedAt = new DateTime($data['updated_at']);
        }

        if (isset($data['deleted_at'])) {
            $pet->deletedAt = new DateTime($data['deleted_at']);
        }

        return $pet;
    }
}