<?php

declare(strict_types=1);

namespace App\Domain\Nutrition;

use DateTime;
use JsonSerializable;

class FoodItem implements JsonSerializable
{
    private ?int $id = null;
    private string $name;
    private ?string $brand = null;
    private FoodCategory $category;
    private array $targetSpecies;
    private array $lifeStage;
    private int $caloriesPer100g;
    private ?float $proteinPercentage = null;
    private ?float $fatPercentage = null;
    private ?float $fiberPercentage = null;
    private ?float $moisturePercentage = null;
    private ?float $ashPercentage = null;
    private ?float $carbohydratePercentage = null;
    private array $detailedNutrition = [];
    private ?string $ingredients = null;
    private array $feedingGuidelines = [];
    private bool $aafcoApproved = false;
    private bool $organicCertified = false;
    private bool $grainFree = false;
    private array $allergenInfo = [];
    private ?float $pricePerUnit = null;
    private ?string $unitSize = null;
    private AvailabilityStatus $availabilityStatus;
    private DateTime $createdAt;
    private DateTime $updatedAt;

    public function __construct(
        string $name,
        FoodCategory $category,
        array $targetSpecies,
        array $lifeStage,
        int $caloriesPer100g
    ) {
        $this->name = $name;
        $this->category = $category;
        $this->targetSpecies = $targetSpecies;
        $this->lifeStage = $lifeStage;
        $this->caloriesPer100g = $caloriesPer100g;
        $this->availabilityStatus = AvailabilityStatus::AVAILABLE;
        $this->createdAt = new DateTime();
        $this->updatedAt = new DateTime();
    }

    // Getters
    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getBrand(): ?string
    {
        return $this->brand;
    }

    public function getCategory(): FoodCategory
    {
        return $this->category;
    }

    public function getTargetSpecies(): array
    {
        return $this->targetSpecies;
    }

    public function getLifeStage(): array
    {
        return $this->lifeStage;
    }

    public function getCaloriesPer100g(): int
    {
        return $this->caloriesPer100g;
    }

    public function getProteinPercentage(): ?float
    {
        return $this->proteinPercentage;
    }

    public function getFatPercentage(): ?float
    {
        return $this->fatPercentage;
    }

    public function getFiberPercentage(): ?float
    {
        return $this->fiberPercentage;
    }

    public function getMoisturePercentage(): ?float
    {
        return $this->moisturePercentage;
    }

    public function getAshPercentage(): ?float
    {
        return $this->ashPercentage;
    }

    public function getCarbohydratePercentage(): ?float
    {
        return $this->carbohydratePercentage;
    }

    public function getDetailedNutrition(): array
    {
        return $this->detailedNutrition;
    }

    public function getIngredients(): ?string
    {
        return $this->ingredients;
    }

    public function getFeedingGuidelines(): array
    {
        return $this->feedingGuidelines;
    }

    public function isAafcoApproved(): bool
    {
        return $this->aafcoApproved;
    }

    public function isOrganicCertified(): bool
    {
        return $this->organicCertified;
    }

    public function isGrainFree(): bool
    {
        return $this->grainFree;
    }

    public function getAllergenInfo(): array
    {
        return $this->allergenInfo;
    }

    public function getPricePerUnit(): ?float
    {
        return $this->pricePerUnit;
    }

    public function getUnitSize(): ?string
    {
        return $this->unitSize;
    }

    public function getAvailabilityStatus(): AvailabilityStatus
    {
        return $this->availabilityStatus;
    }

    public function getCreatedAt(): DateTime
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTime
    {
        return $this->updatedAt;
    }

    // Setters
    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function setBrand(?string $brand): void
    {
        $this->brand = $brand;
        $this->updatedAt = new DateTime();
    }

    public function setNutritionValues(
        ?float $proteinPercentage,
        ?float $fatPercentage,
        ?float $fiberPercentage,
        ?float $moisturePercentage,
        ?float $ashPercentage,
        ?float $carbohydratePercentage
    ): void {
        $this->proteinPercentage = $proteinPercentage;
        $this->fatPercentage = $fatPercentage;
        $this->fiberPercentage = $fiberPercentage;
        $this->moisturePercentage = $moisturePercentage;
        $this->ashPercentage = $ashPercentage;
        $this->carbohydratePercentage = $carbohydratePercentage;
        $this->updatedAt = new DateTime();
    }

    public function setDetailedNutrition(array $detailedNutrition): void
    {
        $this->detailedNutrition = $detailedNutrition;
        $this->updatedAt = new DateTime();
    }

    public function setIngredients(?string $ingredients): void
    {
        $this->ingredients = $ingredients;
        $this->updatedAt = new DateTime();
    }

    public function setFeedingGuidelines(array $feedingGuidelines): void
    {
        $this->feedingGuidelines = $feedingGuidelines;
        $this->updatedAt = new DateTime();
    }

    public function setAafcoApproved(bool $aafcoApproved): void
    {
        $this->aafcoApproved = $aafcoApproved;
        $this->updatedAt = new DateTime();
    }

    public function setOrganicCertified(bool $organicCertified): void
    {
        $this->organicCertified = $organicCertified;
        $this->updatedAt = new DateTime();
    }

    public function setGrainFree(bool $grainFree): void
    {
        $this->grainFree = $grainFree;
        $this->updatedAt = new DateTime();
    }

    public function setAllergenInfo(array $allergenInfo): void
    {
        $this->allergenInfo = $allergenInfo;
        $this->updatedAt = new DateTime();
    }

    public function setPricing(?float $pricePerUnit, ?string $unitSize): void
    {
        $this->pricePerUnit = $pricePerUnit;
        $this->unitSize = $unitSize;
        $this->updatedAt = new DateTime();
    }

    public function setAvailabilityStatus(AvailabilityStatus $availabilityStatus): void
    {
        $this->availabilityStatus = $availabilityStatus;
        $this->updatedAt = new DateTime();
    }

    // Business Logic Methods
    public function isAvailable(): bool
    {
        return $this->availabilityStatus === AvailabilityStatus::AVAILABLE;
    }

    public function isForSpecies(string $species): bool
    {
        return in_array($species, $this->targetSpecies, true);
    }

    public function isForLifeStage(string $lifeStage): bool
    {
        return in_array($lifeStage, $this->lifeStage, true);
    }

    public function containsAllergen(string $allergen): bool
    {
        return in_array($allergen, $this->allergenInfo, true);
    }

    public function getCaloriesPerGram(): float
    {
        return $this->caloriesPer100g / 100;
    }

    public function getProteinGramsPer100g(): ?float
    {
        if ($this->proteinPercentage === null) {
            return null;
        }
        return $this->proteinPercentage;
    }

    public function getFatGramsPer100g(): ?float
    {
        if ($this->fatPercentage === null) {
            return null;
        }
        return $this->fatPercentage;
    }

    public function getCarbGramsPer100g(): ?float
    {
        if ($this->carbohydratePercentage === null) {
            return null;
        }
        return $this->carbohydratePercentage;
    }

    public function getFiberGramsPer100g(): ?float
    {
        if ($this->fiberPercentage === null) {
            return null;
        }
        return $this->fiberPercentage;
    }

    public function getPortionSizeForCalories(float $targetCalories): float
    {
        // Returns portion size in grams to achieve target calories
        return ($targetCalories / $this->getCaloriesPerGram());
    }

    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'brand' => $this->brand,
            'category' => $this->category->value,
            'targetSpecies' => $this->targetSpecies,
            'lifeStage' => $this->lifeStage,
            'caloriesPer100g' => $this->caloriesPer100g,
            'proteinPercentage' => $this->proteinPercentage,
            'fatPercentage' => $this->fatPercentage,
            'fiberPercentage' => $this->fiberPercentage,
            'moisturePercentage' => $this->moisturePercentage,
            'ashPercentage' => $this->ashPercentage,
            'carbohydratePercentage' => $this->carbohydratePercentage,
            'detailedNutrition' => $this->detailedNutrition,
            'ingredients' => $this->ingredients,
            'feedingGuidelines' => $this->feedingGuidelines,
            'aafcoApproved' => $this->aafcoApproved,
            'organicCertified' => $this->organicCertified,
            'grainFree' => $this->grainFree,
            'allergenInfo' => $this->allergenInfo,
            'pricePerUnit' => $this->pricePerUnit,
            'unitSize' => $this->unitSize,
            'availabilityStatus' => $this->availabilityStatus->value,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
            'updatedAt' => $this->updatedAt->format('Y-m-d H:i:s')
        ];
    }
}