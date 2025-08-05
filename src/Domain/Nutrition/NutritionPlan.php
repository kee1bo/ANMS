<?php

declare(strict_types=1);

namespace App\Domain\Nutrition;

use DateTime;
use JsonSerializable;

class NutritionPlan implements JsonSerializable
{
    private int $id;
    private int $petId;
    private string $planName;
    private int $dailyCalories;
    private ?float $dailyProteinGrams;
    private ?float $dailyFatGrams;
    private ?float $dailyCarbGrams;
    private ?float $dailyFiberGrams;
    private int $mealsPerDay;
    private array $feedingSchedule;
    private array $foodRecommendations;
    private ?string $specialInstructions;
    private int $createdByUserId;
    private bool $veterinarianApproved;
    private ?int $approvedByUserId;
    private ?DateTime $approvedAt;
    private DateTime $activeFrom;
    private ?DateTime $activeUntil;
    private DateTime $createdAt;
    private DateTime $updatedAt;

    public function __construct(
        int $petId,
        string $planName,
        int $dailyCalories,
        int $mealsPerDay,
        int $createdByUserId,
        DateTime $activeFrom
    ) {
        $this->petId = $petId;
        $this->planName = $planName;
        $this->dailyCalories = $dailyCalories;
        $this->mealsPerDay = $mealsPerDay;
        $this->createdByUserId = $createdByUserId;
        $this->activeFrom = $activeFrom;
        $this->veterinarianApproved = false;
        $this->feedingSchedule = [];
        $this->foodRecommendations = [];
        $this->createdAt = new DateTime();
        $this->updatedAt = new DateTime();
    }

    // Getters
    public function getId(): int
    {
        return $this->id;
    }

    public function getPetId(): int
    {
        return $this->petId;
    }

    public function getPlanName(): string
    {
        return $this->planName;
    }

    public function getDailyCalories(): int
    {
        return $this->dailyCalories;
    }

    public function getDailyProteinGrams(): ?float
    {
        return $this->dailyProteinGrams;
    }

    public function getDailyFatGrams(): ?float
    {
        return $this->dailyFatGrams;
    }

    public function getDailyCarbGrams(): ?float
    {
        return $this->dailyCarbGrams;
    }

    public function getDailyFiberGrams(): ?float
    {
        return $this->dailyFiberGrams;
    }

    public function getMealsPerDay(): int
    {
        return $this->mealsPerDay;
    }

    public function getFeedingSchedule(): array
    {
        return $this->feedingSchedule;
    }

    public function getFoodRecommendations(): array
    {
        return $this->foodRecommendations;
    }

    public function getSpecialInstructions(): ?string
    {
        return $this->specialInstructions;
    }

    public function getCreatedByUserId(): int
    {
        return $this->createdByUserId;
    }

    public function isVeterinarianApproved(): bool
    {
        return $this->veterinarianApproved;
    }

    public function getApprovedByUserId(): ?int
    {
        return $this->approvedByUserId;
    }

    public function getApprovedAt(): ?DateTime
    {
        return $this->approvedAt;
    }

    public function getActiveFrom(): DateTime
    {
        return $this->activeFrom;
    }

    public function getActiveUntil(): ?DateTime
    {
        return $this->activeUntil;
    }

    public function getCreatedAt(): DateTime
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTime
    {
        return $this->updatedAt;
    }

    // Business Logic Methods
    public function isActive(): bool
    {
        $now = new DateTime();
        
        if ($this->activeFrom > $now) {
            return false;
        }
        
        if ($this->activeUntil && $this->activeUntil < $now) {
            return false;
        }
        
        return true;
    }

    public function getCaloriesPerMeal(): float
    {
        return $this->dailyCalories / $this->mealsPerDay;
    }

    public function getProteinPercentage(): ?float
    {
        if (!$this->dailyProteinGrams) {
            return null;
        }
        
        // Protein has 4 calories per gram
        return ($this->dailyProteinGrams * 4 / $this->dailyCalories) * 100;
    }

    public function getFatPercentage(): ?float
    {
        if (!$this->dailyFatGrams) {
            return null;
        }
        
        // Fat has 9 calories per gram
        return ($this->dailyFatGrams * 9 / $this->dailyCalories) * 100;
    }

    public function getCarbPercentage(): ?float
    {
        if (!$this->dailyCarbGrams) {
            return null;
        }
        
        // Carbs have 4 calories per gram
        return ($this->dailyCarbGrams * 4 / $this->dailyCalories) * 100;
    }

    // Update Methods
    public function updateNutrients(
        ?float $proteinGrams = null,
        ?float $fatGrams = null,
        ?float $carbGrams = null,
        ?float $fiberGrams = null
    ): void {
        if ($proteinGrams !== null) $this->dailyProteinGrams = $proteinGrams;
        if ($fatGrams !== null) $this->dailyFatGrams = $fatGrams;
        if ($carbGrams !== null) $this->dailyCarbGrams = $carbGrams;
        if ($fiberGrams !== null) $this->dailyFiberGrams = $fiberGrams;
        $this->updatedAt = new DateTime();
    }

    public function updateFeedingSchedule(array $schedule): void
    {
        $this->feedingSchedule = $schedule;
        $this->updatedAt = new DateTime();
    }

    public function updateFoodRecommendations(array $recommendations): void
    {
        $this->foodRecommendations = $recommendations;
        $this->updatedAt = new DateTime();
    }

    public function setSpecialInstructions(string $instructions): void
    {
        $this->specialInstructions = $instructions;
        $this->updatedAt = new DateTime();
    }

    public function approveByVeterinarian(int $veterinarianId): void
    {
        $this->veterinarianApproved = true;
        $this->approvedByUserId = $veterinarianId;
        $this->approvedAt = new DateTime();
        $this->updatedAt = new DateTime();
    }

    public function revokeApproval(): void
    {
        $this->veterinarianApproved = false;
        $this->approvedByUserId = null;
        $this->approvedAt = null;
        $this->updatedAt = new DateTime();
    }

    public function setActiveUntil(DateTime $activeUntil): void
    {
        $this->activeUntil = $activeUntil;
        $this->updatedAt = new DateTime();
    }

    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'petId' => $this->petId,
            'planName' => $this->planName,
            'dailyCalories' => $this->dailyCalories,
            'dailyProteinGrams' => $this->dailyProteinGrams,
            'dailyFatGrams' => $this->dailyFatGrams,
            'dailyCarbGrams' => $this->dailyCarbGrams,
            'dailyFiberGrams' => $this->dailyFiberGrams,
            'mealsPerDay' => $this->mealsPerDay,
            'caloriesPerMeal' => $this->getCaloriesPerMeal(),
            'proteinPercentage' => $this->getProteinPercentage(),
            'fatPercentage' => $this->getFatPercentage(),
            'carbPercentage' => $this->getCarbPercentage(),
            'feedingSchedule' => $this->feedingSchedule,
            'foodRecommendations' => $this->foodRecommendations,
            'specialInstructions' => $this->specialInstructions,
            'createdByUserId' => $this->createdByUserId,
            'veterinarianApproved' => $this->veterinarianApproved,
            'approvedByUserId' => $this->approvedByUserId,
            'approvedAt' => $this->approvedAt?->format('Y-m-d H:i:s'),
            'activeFrom' => $this->activeFrom->format('Y-m-d'),
            'activeUntil' => $this->activeUntil?->format('Y-m-d'),
            'isActive' => $this->isActive(),
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
            'updatedAt' => $this->updatedAt->format('Y-m-d H:i:s')
        ];
    }

    public static function fromArray(array $data): self
    {
        $plan = new self(
            (int) $data['pet_id'],
            $data['plan_name'],
            (int) $data['daily_calories'],
            (int) $data['meals_per_day'],
            (int) $data['created_by_user_id'],
            new DateTime($data['active_from'])
        );

        if (isset($data['id'])) {
            $plan->id = (int) $data['id'];
        }

        $plan->dailyProteinGrams = isset($data['daily_protein_grams']) ? (float) $data['daily_protein_grams'] : null;
        $plan->dailyFatGrams = isset($data['daily_fat_grams']) ? (float) $data['daily_fat_grams'] : null;
        $plan->dailyCarbGrams = isset($data['daily_carb_grams']) ? (float) $data['daily_carb_grams'] : null;
        $plan->dailyFiberGrams = isset($data['daily_fiber_grams']) ? (float) $data['daily_fiber_grams'] : null;

        $plan->feedingSchedule = isset($data['feeding_schedule']) 
            ? (is_string($data['feeding_schedule']) ? json_decode($data['feeding_schedule'], true) : $data['feeding_schedule']) ?? []
            : [];

        $plan->foodRecommendations = isset($data['food_recommendations']) 
            ? (is_string($data['food_recommendations']) ? json_decode($data['food_recommendations'], true) : $data['food_recommendations']) ?? []
            : [];

        $plan->specialInstructions = $data['special_instructions'] ?? null;
        $plan->veterinarianApproved = (bool) ($data['veterinarian_approved'] ?? false);
        $plan->approvedByUserId = isset($data['approved_by_user_id']) ? (int) $data['approved_by_user_id'] : null;

        if (isset($data['approved_at'])) {
            $plan->approvedAt = new DateTime($data['approved_at']);
        }

        if (isset($data['active_until'])) {
            $plan->activeUntil = new DateTime($data['active_until']);
        }

        if (isset($data['created_at'])) {
            $plan->createdAt = new DateTime($data['created_at']);
        }

        if (isset($data['updated_at'])) {
            $plan->updatedAt = new DateTime($data['updated_at']);
        }

        return $plan;
    }
}