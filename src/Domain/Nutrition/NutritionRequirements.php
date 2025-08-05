<?php

declare(strict_types=1);

namespace App\Domain\Nutrition;

use App\Domain\Pet\Pet;
use App\Domain\Pet\PetSpecies;
use App\Domain\Pet\ActivityLevel;
use App\Domain\Pet\LifeStage;

class NutritionRequirements
{
    private Pet $pet;
    private float $dailyCalories;
    private float $proteinGrams;
    private float $fatGrams;
    private float $carbGrams;
    private float $fiberGrams;
    private array $vitamins;
    private array $minerals;

    public function __construct(Pet $pet)
    {
        $this->pet = $pet;
        $this->vitamins = [];
        $this->minerals = [];
        $this->calculateRequirements();
    }

    private function calculateRequirements(): void
    {
        $this->calculateCalories();
        $this->calculateMacronutrients();
        $this->calculateMicronutrients();
    }

    private function calculateCalories(): void
    {
        if (!$this->pet->getCurrentWeight()) {
            $this->dailyCalories = 0;
            return;
        }

        // Calculate Resting Energy Requirement (RER)
        $weight = $this->pet->getCurrentWeight();
        $rer = $this->pet->getSpecies()->getBasalMetabolicRate($weight);

        // Apply life stage multiplier
        $lifeStageMultiplier = $this->pet->getLifeStage()->getNutritionalMultiplier();

        // Apply activity level multiplier
        $activityMultiplier = $this->pet->getActivityLevel()->getMultiplier();

        // Apply neuter status multiplier
        $neuterMultiplier = $this->pet->isNeutered() ? 0.9 : 1.0;

        // Calculate Daily Energy Requirement (DER)
        $this->dailyCalories = $rer * $lifeStageMultiplier * $activityMultiplier * $neuterMultiplier;

        // Apply weight management adjustments
        if ($this->pet->isOverweight()) {
            $this->dailyCalories *= 0.8; // Reduce by 20% for weight loss
        } elseif ($this->pet->isUnderweight()) {
            $this->dailyCalories *= 1.2; // Increase by 20% for weight gain
        }
    }

    private function calculateMacronutrients(): void
    {
        $calories = $this->dailyCalories;
        $lifeStage = $this->pet->getLifeStage();
        $species = $this->pet->getSpecies();

        // Protein requirements (grams per day)
        $proteinPercentage = $this->getProteinRequirement($species, $lifeStage);
        $this->proteinGrams = ($calories * $proteinPercentage / 100) / 4; // 4 cal/g protein

        // Fat requirements (grams per day)
        $fatPercentage = $this->getFatRequirement($species, $lifeStage);
        $this->fatGrams = ($calories * $fatPercentage / 100) / 9; // 9 cal/g fat

        // Fiber requirements (grams per day)
        $this->fiberGrams = $this->getFiberRequirement($species, $this->pet->getCurrentWeight() ?? 0);

        // Carbohydrate requirements (remaining calories)
        $proteinCalories = $this->proteinGrams * 4;
        $fatCalories = $this->fatGrams * 9;
        $remainingCalories = $calories - $proteinCalories - $fatCalories;
        $this->carbGrams = max(0, $remainingCalories / 4); // 4 cal/g carbs
    }

    private function calculateMicronutrients(): void
    {
        $weight = $this->pet->getCurrentWeight() ?? 0;
        $species = $this->pet->getSpecies();

        // Vitamins (per day)
        $this->vitamins = [
            'vitamin_a' => $this->getVitaminARequirement($species, $weight),
            'vitamin_d' => $this->getVitaminDRequirement($species, $weight),
            'vitamin_e' => $this->getVitaminERequirement($species, $weight),
            'vitamin_k' => $this->getVitaminKRequirement($species, $weight),
            'thiamine' => $this->getThiamineRequirement($species, $weight),
            'riboflavin' => $this->getRiboflavinRequirement($species, $weight),
            'niacin' => $this->getNiacinRequirement($species, $weight),
            'vitamin_b6' => $this->getVitaminB6Requirement($species, $weight),
            'folate' => $this->getFolateRequirement($species, $weight),
            'vitamin_b12' => $this->getVitaminB12Requirement($species, $weight),
            'choline' => $this->getCholineRequirement($species, $weight)
        ];

        // Minerals (per day)
        $this->minerals = [
            'calcium' => $this->getCalciumRequirement($species, $weight),
            'phosphorus' => $this->getPhosphorusRequirement($species, $weight),
            'potassium' => $this->getPotassiumRequirement($species, $weight),
            'sodium' => $this->getSodiumRequirement($species, $weight),
            'magnesium' => $this->getMagnesiumRequirement($species, $weight),
            'iron' => $this->getIronRequirement($species, $weight),
            'zinc' => $this->getZincRequirement($species, $weight),
            'copper' => $this->getCopperRequirement($species, $weight),
            'manganese' => $this->getManganeseRequirement($species, $weight),
            'selenium' => $this->getSeleniumRequirement($species, $weight),
            'iodine' => $this->getIodineRequirement($species, $weight)
        ];

        // Add species-specific requirements
        if ($species === PetSpecies::CAT) {
            $this->vitamins['taurine'] = $this->getTaurineRequirement($weight);
            $this->vitamins['arachidonic_acid'] = $this->getArachidonicAcidRequirement($weight);
        }
    }

    private function getProteinRequirement(PetSpecies $species, LifeStage $lifeStage): float
    {
        return match ($species) {
            PetSpecies::DOG => match ($lifeStage) {
                LifeStage::PUPPY => 22.5,
                LifeStage::ADULT => 18.0,
                LifeStage::SENIOR => 18.0,
                default => 18.0
            },
            PetSpecies::CAT => match ($lifeStage) {
                LifeStage::KITTEN => 30.0,
                LifeStage::ADULT => 26.0,
                LifeStage::SENIOR => 26.0,
                default => 26.0
            },
            default => 20.0
        };
    }

    private function getFatRequirement(PetSpecies $species, LifeStage $lifeStage): float
    {
        return match ($species) {
            PetSpecies::DOG => match ($lifeStage) {
                LifeStage::PUPPY => 8.5,
                LifeStage::ADULT => 5.5,
                LifeStage::SENIOR => 5.5,
                default => 5.5
            },
            PetSpecies::CAT => match ($lifeStage) {
                LifeStage::KITTEN => 9.0,
                LifeStage::ADULT => 9.0,
                LifeStage::SENIOR => 9.0,
                default => 9.0
            },
            default => 8.0
        };
    }

    private function getFiberRequirement(PetSpecies $species, float $weight): float
    {
        return match ($species) {
            PetSpecies::DOG => $weight * 0.5, // 0.5g per kg body weight
            PetSpecies::CAT => $weight * 0.3, // 0.3g per kg body weight
            default => $weight * 0.4
        };
    }

    // Vitamin requirements (simplified - in reality these would be more complex)
    private function getVitaminARequirement(PetSpecies $species, float $weight): float
    {
        return match ($species) {
            PetSpecies::DOG => $weight * 50, // IU per kg body weight
            PetSpecies::CAT => $weight * 100,
            default => $weight * 75
        };
    }

    private function getVitaminDRequirement(PetSpecies $species, float $weight): float
    {
        return match ($species) {
            PetSpecies::DOG => $weight * 5, // IU per kg body weight
            PetSpecies::CAT => $weight * 7,
            default => $weight * 6
        };
    }

    private function getVitaminERequirement(PetSpecies $species, float $weight): float
    {
        return match ($species) {
            PetSpecies::DOG => $weight * 1, // mg per kg body weight
            PetSpecies::CAT => $weight * 4,
            default => $weight * 2
        };
    }

    private function getVitaminKRequirement(PetSpecies $species, float $weight): float
    {
        return $weight * 0.1; // mg per kg body weight
    }

    private function getThiamineRequirement(PetSpecies $species, float $weight): float
    {
        return $weight * 0.02; // mg per kg body weight
    }

    private function getRiboflavinRequirement(PetSpecies $species, float $weight): float
    {
        return $weight * 0.05; // mg per kg body weight
    }

    private function getNiacinRequirement(PetSpecies $species, float $weight): float
    {
        return $weight * 0.17; // mg per kg body weight
    }

    private function getVitaminB6Requirement(PetSpecies $species, float $weight): float
    {
        return $weight * 0.02; // mg per kg body weight
    }

    private function getFolateRequirement(PetSpecies $species, float $weight): float
    {
        return $weight * 0.003; // mg per kg body weight
    }

    private function getVitaminB12Requirement(PetSpecies $species, float $weight): float
    {
        return $weight * 0.0003; // mg per kg body weight
    }

    private function getCholineRequirement(PetSpecies $species, float $weight): float
    {
        return $weight * 13; // mg per kg body weight
    }

    // Mineral requirements
    private function getCalciumRequirement(PetSpecies $species, float $weight): float
    {
        return $weight * 50; // mg per kg body weight
    }

    private function getPhosphorusRequirement(PetSpecies $species, float $weight): float
    {
        return $weight * 40; // mg per kg body weight
    }

    private function getPotassiumRequirement(PetSpecies $species, float $weight): float
    {
        return $weight * 60; // mg per kg body weight
    }

    private function getSodiumRequirement(PetSpecies $species, float $weight): float
    {
        return $weight * 10; // mg per kg body weight
    }

    private function getMagnesiumRequirement(PetSpecies $species, float $weight): float
    {
        return $weight * 4; // mg per kg body weight
    }

    private function getIronRequirement(PetSpecies $species, float $weight): float
    {
        return $weight * 0.8; // mg per kg body weight
    }

    private function getZincRequirement(PetSpecies $species, float $weight): float
    {
        return $weight * 1.5; // mg per kg body weight
    }

    private function getCopperRequirement(PetSpecies $species, float $weight): float
    {
        return $weight * 0.15; // mg per kg body weight
    }

    private function getManganeseRequirement(PetSpecies $species, float $weight): float
    {
        return $weight * 0.1; // mg per kg body weight
    }

    private function getSeleniumRequirement(PetSpecies $species, float $weight): float
    {
        return $weight * 0.003; // mg per kg body weight
    }

    private function getIodineRequirement(PetSpecies $species, float $weight): float
    {
        return $weight * 0.015; // mg per kg body weight
    }

    // Cat-specific requirements
    private function getTaurineRequirement(float $weight): float
    {
        return $weight * 10; // mg per kg body weight
    }

    private function getArachidonicAcidRequirement(float $weight): float
    {
        return $weight * 0.02; // g per kg body weight
    }

    // Getters
    public function getPet(): Pet
    {
        return $this->pet;
    }

    public function getDailyCalories(): float
    {
        return $this->dailyCalories;
    }

    public function getProteinGrams(): float
    {
        return $this->proteinGrams;
    }

    public function getFatGrams(): float
    {
        return $this->fatGrams;
    }

    public function getCarbGrams(): float
    {
        return $this->carbGrams;
    }

    public function getFiberGrams(): float
    {
        return $this->fiberGrams;
    }

    public function getVitamins(): array
    {
        return $this->vitamins;
    }

    public function getMinerals(): array
    {
        return $this->minerals;
    }

    public function toArray(): array
    {
        return [
            'pet_id' => $this->pet->getId(),
            'daily_calories' => round($this->dailyCalories, 2),
            'protein_grams' => round($this->proteinGrams, 2),
            'fat_grams' => round($this->fatGrams, 2),
            'carb_grams' => round($this->carbGrams, 2),
            'fiber_grams' => round($this->fiberGrams, 2),
            'protein_percentage' => round(($this->proteinGrams * 4 / $this->dailyCalories) * 100, 1),
            'fat_percentage' => round(($this->fatGrams * 9 / $this->dailyCalories) * 100, 1),
            'carb_percentage' => round(($this->carbGrams * 4 / $this->dailyCalories) * 100, 1),
            'vitamins' => $this->vitamins,
            'minerals' => $this->minerals
        ];
    }
}