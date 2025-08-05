<?php

declare(strict_types=1);

namespace App\Domain\Nutrition;

use JsonSerializable;

class NutrientRequirement implements JsonSerializable
{
    private float $dailyCalories;
    private float $dailyProteinGrams;
    private float $dailyFatGrams;
    private float $dailyCarbGrams;
    private float $dailyFiberGrams;
    private array $additionalNutrients;
    
    public function __construct(
        float $dailyCalories,
        float $dailyProteinGrams,
        float $dailyFatGrams,
        float $dailyCarbGrams,
        float $dailyFiberGrams,
        array $additionalNutrients = []
    ) {
        $this->dailyCalories = $dailyCalories;
        $this->dailyProteinGrams = $dailyProteinGrams;
        $this->dailyFatGrams = $dailyFatGrams;
        $this->dailyCarbGrams = $dailyCarbGrams;
        $this->dailyFiberGrams = $dailyFiberGrams;
        $this->additionalNutrients = $additionalNutrients;
    }

    public function getDailyCalories(): float
    {
        return $this->dailyCalories;
    }

    public function getDailyProteinGrams(): float
    {
        return $this->dailyProteinGrams;
    }

    public function getDailyFatGrams(): float
    {
        return $this->dailyFatGrams;
    }

    public function getDailyCarbGrams(): float
    {
        return $this->dailyCarbGrams;
    }

    public function getDailyFiberGrams(): float
    {
        return $this->dailyFiberGrams;
    }

    public function getAdditionalNutrients(): array
    {
        return $this->additionalNutrients;
    }

    public function getAdditionalNutrient(string $name): ?float
    {
        return $this->additionalNutrients[$name] ?? null;
    }

    public function getProteinPercentage(): float
    {
        // Protein provides 4 calories per gram
        $proteinCalories = $this->dailyProteinGrams * 4;
        return ($proteinCalories / $this->dailyCalories) * 100;
    }

    public function getFatPercentage(): float
    {
        // Fat provides 9 calories per gram
        $fatCalories = $this->dailyFatGrams * 9;
        return ($fatCalories / $this->dailyCalories) * 100;
    }

    public function getCarbPercentage(): float
    {
        // Carbohydrates provide 4 calories per gram
        $carbCalories = $this->dailyCarbGrams * 4;
        return ($carbCalories / $this->dailyCalories) * 100;
    }

    public function adjustForCalories(float $newDailyCalories): self
    {
        $ratio = $newDailyCalories / $this->dailyCalories;
        
        return new self(
            $newDailyCalories,
            $this->dailyProteinGrams * $ratio,
            $this->dailyFatGrams * $ratio,
            $this->dailyCarbGrams * $ratio,
            $this->dailyFiberGrams * $ratio,
            array_map(fn($value) => $value * $ratio, $this->additionalNutrients)
        );
    }

    public function jsonSerialize(): array
    {
        return [
            'dailyCalories' => $this->dailyCalories,
            'dailyProteinGrams' => $this->dailyProteinGrams,
            'dailyFatGrams' => $this->dailyFatGrams,
            'dailyCarbGrams' => $this->dailyCarbGrams,
            'dailyFiberGrams' => $this->dailyFiberGrams,
            'proteinPercentage' => $this->getProteinPercentage(),
            'fatPercentage' => $this->getFatPercentage(),
            'carbPercentage' => $this->getCarbPercentage(),
            'additionalNutrients' => $this->additionalNutrients
        ];
    }

    /**
     * Create from existing NutritionRequirements object
     */
    public static function fromNutritionRequirements(NutritionRequirements $requirements): self
    {
        $vitamins = $requirements->getVitamins();
        $minerals = $requirements->getMinerals();
        
        return new self(
            $requirements->getDailyCalories(),
            $requirements->getProteinGrams(),
            $requirements->getFatGrams(),
            $requirements->getCarbGrams(),
            $requirements->getFiberGrams(),
            array_merge($vitamins, $minerals)
        );
    }
}