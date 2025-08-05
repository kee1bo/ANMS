<?php

declare(strict_types=1);

namespace App\Application\Services;

use App\Domain\Pet\Pet;
use App\Domain\Pet\PetSpecies;
use App\Domain\Pet\ActivityLevel;
use App\Domain\Pet\LifeStage;
use App\Domain\Nutrition\NutrientRequirement;
use App\Domain\Nutrition\NutritionRequirements;

class NutritionCalculator
{
    /**
     * Calculate daily caloric needs for a pet
     */
    public function calculateDailyCalories(Pet $pet): float
    {
        if (!$pet->getCurrentWeight()) {
            throw new \InvalidArgumentException('Pet weight is required for calorie calculation');
        }

        $weight = $pet->getCurrentWeight(); // in kg
        $species = $pet->getSpecies();
        $lifeStage = $pet->getLifeStage();
        $activityLevel = $pet->getActivityLevel();
        
        // Calculate Resting Energy Requirement (RER)
        $rer = $this->calculateRER($weight, $species);
        
        // Apply life stage multiplier
        $lifeStageFactor = $this->getLifeStageMultiplier($lifeStage, $species);
        
        // Apply activity level multiplier
        $activityFactor = $this->getActivityMultiplier($activityLevel);
        
        // Calculate Daily Energy Requirement (DER)
        $der = $rer * $lifeStageFactor * $activityFactor;
        
        // Apply species-specific adjustments
        $der = $this->applySpeciesAdjustments($der, $species, $pet);
        
        return round($der, 2);
    }

    /**
     * Calculate complete nutrient requirements for a pet using existing system
     */
    public function calculateNutritionRequirements(Pet $pet): NutritionRequirements
    {
        return new NutritionRequirements($pet);
    }

    /**
     * Calculate complete nutrient requirements for a pet
     */
    public function calculateNutrientRequirements(Pet $pet): NutrientRequirement
    {
        $dailyCalories = $this->calculateDailyCalories($pet);
        $species = $pet->getSpecies();
        $lifeStage = $pet->getLifeStage();
        
        // Get species-specific nutrient percentages
        $proteinPercentage = $this->getProteinRequirement($species, $lifeStage);
        $fatPercentage = $this->getFatRequirement($species, $lifeStage);
        $fiberPercentage = $this->getFiberRequirement($species, $lifeStage);
        
        // Calculate grams from percentages
        $proteinGrams = ($dailyCalories * $proteinPercentage / 100) / 4; // 4 cal/g protein
        $fatGrams = ($dailyCalories * $fatPercentage / 100) / 9; // 9 cal/g fat
        $fiberGrams = ($dailyCalories * $fiberPercentage / 100) / 4; // 4 cal/g fiber
        
        // Calculate remaining calories for carbohydrates
        $proteinCalories = $proteinGrams * 4;
        $fatCalories = $fatGrams * 9;
        $fiberCalories = $fiberGrams * 4;
        $carbCalories = $dailyCalories - $proteinCalories - $fatCalories - $fiberCalories;
        $carbGrams = max(0, $carbCalories / 4); // 4 cal/g carbs
        
        // Get additional nutrients
        $additionalNutrients = $this->getAdditionalNutrients($species, $lifeStage, $pet->getCurrentWeight());
        
        return new NutrientRequirement(
            $dailyCalories,
            round($proteinGrams, 2),
            round($fatGrams, 2),
            round($carbGrams, 2),
            round($fiberGrams, 2),
            $additionalNutrients
        );
    }

    /**
     * Calculate Resting Energy Requirement (RER)
     */
    private function calculateRER(float $weightKg, PetSpecies $species): float
    {
        // Standard formula: RER = 70 * (weight in kg)^0.75
        // For very small or large pets, use linear formula
        
        if ($weightKg <= 2) {
            // Linear formula for very small pets
            return 70 * $weightKg;
        } elseif ($weightKg >= 45) {
            // Linear formula for very large pets
            return 30 * $weightKg + 70;
        } else {
            // Standard allometric formula
            return 70 * pow($weightKg, 0.75);
        }
    }

    /**
     * Get life stage multiplier for energy requirements
     */
    private function getLifeStageMultiplier(LifeStage $lifeStage, PetSpecies $species): float
    {
        return match ([$species->value, $lifeStage->value]) {
            // Dogs
            ['dog', 'puppy'] => 2.0,
            ['dog', 'adult'] => 1.6,
            ['dog', 'senior'] => 1.4,
            
            // Cats
            ['cat', 'kitten'] => 2.5,
            ['cat', 'adult'] => 1.4,
            ['cat', 'senior'] => 1.2,
            
            // Rabbits
            ['rabbit', 'young'] => 2.0,
            ['rabbit', 'adult'] => 1.5,
            ['rabbit', 'senior'] => 1.3,
            
            // Birds
            ['bird', 'young'] => 2.2,
            ['bird', 'adult'] => 1.8,
            ['bird', 'senior'] => 1.6,
            
            // Default
            default => 1.6
        };
    }

    /**
     * Get activity level multiplier
     */
    private function getActivityMultiplier(ActivityLevel $activityLevel): float
    {
        return match ($activityLevel->value) {
            'low' => 0.8,
            'moderate' => 1.0,
            'high' => 1.2,
            'very_high' => 1.4,
            default => 1.0
        };
    }

    /**
     * Apply species-specific adjustments
     */
    private function applySpeciesAdjustments(float $der, PetSpecies $species, Pet $pet): float
    {
        // Adjust for neutering status
        if ($pet->isNeutered()) {
            $der *= 0.9; // Reduce by 10% for neutered pets
        }
        
        // Species-specific adjustments
        switch ($species->value) {
            case 'cat':
                // Cats have slightly lower energy requirements
                $der *= 0.95;
                break;
            case 'rabbit':
                // Rabbits have higher metabolic rate
                $der *= 1.1;
                break;
            case 'bird':
                // Birds have very high metabolic rate
                $der *= 1.3;
                break;
        }
        
        return $der;
    }

    /**
     * Get protein requirement percentage by species and life stage
     */
    private function getProteinRequirement(PetSpecies $species, LifeStage $lifeStage): float
    {
        return match ([$species->value, $lifeStage->value]) {
            // Dogs - AAFCO minimums with safety margins
            ['dog', 'puppy'] => 25.0,
            ['dog', 'adult'] => 20.0,
            ['dog', 'senior'] => 22.0,
            
            // Cats - Higher protein requirements
            ['cat', 'kitten'] => 32.0,
            ['cat', 'adult'] => 28.0,
            ['cat', 'senior'] => 30.0,
            
            // Rabbits - Moderate protein
            ['rabbit', 'young'] => 16.0,
            ['rabbit', 'adult'] => 14.0,
            ['rabbit', 'senior'] => 15.0,
            
            // Birds - High protein
            ['bird', 'young'] => 20.0,
            ['bird', 'adult'] => 16.0,
            ['bird', 'senior'] => 18.0,
            
            default => 20.0
        };
    }

    /**
     * Get fat requirement percentage by species and life stage
     */
    private function getFatRequirement(PetSpecies $species, LifeStage $lifeStage): float
    {
        return match ([$species->value, $lifeStage->value]) {
            // Dogs
            ['dog', 'puppy'] => 12.0,
            ['dog', 'adult'] => 8.0,
            ['dog', 'senior'] => 6.0,
            
            // Cats - Higher fat requirements
            ['cat', 'kitten'] => 10.0,
            ['cat', 'adult'] => 9.0,
            ['cat', 'senior'] => 8.0,
            
            // Rabbits - Lower fat
            ['rabbit', 'young'] => 4.0,
            ['rabbit', 'adult'] => 3.0,
            ['rabbit', 'senior'] => 3.5,
            
            // Birds - Moderate fat
            ['bird', 'young'] => 8.0,
            ['bird', 'adult'] => 6.0,
            ['bird', 'senior'] => 7.0,
            
            default => 8.0
        };
    }

    /**
     * Get fiber requirement percentage by species and life stage
     */
    private function getFiberRequirement(PetSpecies $species, LifeStage $lifeStage): float
    {
        return match ($species->value) {
            'dog' => 4.0,
            'cat' => 2.0,
            'rabbit' => 20.0, // Rabbits need high fiber
            'bird' => 8.0,
            default => 4.0
        };
    }

    /**
     * Get additional nutrient requirements
     */
    private function getAdditionalNutrients(PetSpecies $species, LifeStage $lifeStage, float $weightKg): array
    {
        $nutrients = [];
        
        // Calcium (mg per day)
        $nutrients['calcium'] = match ($species->value) {
            'dog' => $weightKg * 50,
            'cat' => $weightKg * 40,
            'rabbit' => $weightKg * 60,
            'bird' => $weightKg * 80,
            default => $weightKg * 50
        };
        
        // Phosphorus (mg per day)
        $nutrients['phosphorus'] = $nutrients['calcium'] * 0.8;
        
        // Sodium (mg per day)
        $nutrients['sodium'] = match ($species->value) {
            'dog' => $weightKg * 20,
            'cat' => $weightKg * 15,
            'rabbit' => $weightKg * 10,
            'bird' => $weightKg * 25,
            default => $weightKg * 20
        };
        
        // Vitamin A (IU per day)
        $nutrients['vitamin_a'] = match ($species->value) {
            'dog' => $weightKg * 100,
            'cat' => $weightKg * 200, // Cats need more vitamin A
            'rabbit' => $weightKg * 150,
            'bird' => $weightKg * 300,
            default => $weightKg * 100
        };
        
        // Vitamin D (IU per day)
        $nutrients['vitamin_d'] = match ($species->value) {
            'dog' => $weightKg * 10,
            'cat' => $weightKg * 5,
            'rabbit' => 0, // Rabbits don't need dietary vitamin D
            'bird' => $weightKg * 15,
            default => $weightKg * 10
        };
        
        // Vitamin E (mg per day)
        $nutrients['vitamin_e'] = $weightKg * 1.0;
        
        // Thiamine (mg per day)
        $nutrients['thiamine'] = $weightKg * 0.05;
        
        // Riboflavin (mg per day)
        $nutrients['riboflavin'] = $weightKg * 0.1;
        
        // Niacin (mg per day)
        $nutrients['niacin'] = $weightKg * 0.3;
        
        // Adjust for life stage
        if (in_array($lifeStage->value, ['puppy', 'kitten', 'young'])) {
            // Growing animals need more nutrients
            foreach ($nutrients as $key => $value) {
                $nutrients[$key] = $value * 1.5;
            }
        }
        
        return array_map(fn($value) => round($value, 2), $nutrients);
    }

    /**
     * Calculate portion size for a specific food
     */
    public function calculatePortionSize(
        NutrientRequirement $requirement,
        int $caloriesPerCup,
        int $mealsPerDay = 2
    ): array {
        $dailyCalories = $requirement->getDailyCalories();
        $cupsPerDay = $dailyCalories / $caloriesPerCup;
        $cupsPerMeal = $cupsPerDay / $mealsPerDay;
        
        return [
            'cups_per_day' => round($cupsPerDay, 2),
            'cups_per_meal' => round($cupsPerMeal, 2),
            'grams_per_day' => round($cupsPerDay * 120, 0), // Assuming 120g per cup
            'grams_per_meal' => round($cupsPerMeal * 120, 0),
            'meals_per_day' => $mealsPerDay
        ];
    }

    /**
     * Adjust nutrition plan for health conditions
     */
    public function adjustForHealthConditions(
        NutrientRequirement $baseRequirement,
        array $healthConditions
    ): NutrientRequirement {
        $adjustedCalories = $baseRequirement->getDailyCalories();
        $adjustedProtein = $baseRequirement->getDailyProteinGrams();
        $adjustedFat = $baseRequirement->getDailyFatGrams();
        $adjustedCarbs = $baseRequirement->getDailyCarbGrams();
        $adjustedFiber = $baseRequirement->getDailyFiberGrams();
        $additionalNutrients = $baseRequirement->getAdditionalNutrients();
        
        foreach ($healthConditions as $condition) {
            switch (strtolower($condition)) {
                case 'obesity':
                    $adjustedCalories *= 0.8; // Reduce calories by 20%
                    $adjustedFat *= 0.7; // Reduce fat
                    $adjustedFiber *= 1.5; // Increase fiber
                    break;
                    
                case 'diabetes':
                    $adjustedCarbs *= 0.6; // Reduce carbs
                    $adjustedFiber *= 1.8; // Increase fiber significantly
                    $adjustedProtein *= 1.2; // Increase protein
                    break;
                    
                case 'kidney_disease':
                    $adjustedProtein *= 0.7; // Reduce protein
                    $additionalNutrients['phosphorus'] *= 0.5; // Reduce phosphorus
                    $additionalNutrients['sodium'] *= 0.6; // Reduce sodium
                    break;
                    
                case 'heart_disease':
                    $additionalNutrients['sodium'] *= 0.4; // Significantly reduce sodium
                    $adjustedFat *= 0.8; // Moderate fat reduction
                    break;
                    
                case 'allergies':
                    // This would require specific allergen avoidance
                    // Implementation would depend on specific allergens
                    break;
                    
                case 'digestive_issues':
                    $adjustedFiber *= 0.8; // Slightly reduce fiber
                    $adjustedFat *= 0.9; // Slightly reduce fat
                    break;
            }
        }
        
        return new NutrientRequirement(
            round($adjustedCalories, 2),
            round($adjustedProtein, 2),
            round($adjustedFat, 2),
            round($adjustedCarbs, 2),
            round($adjustedFiber, 2),
            array_map(fn($value) => round($value, 2), $additionalNutrients)
        );
    }

    /**
     * Generate feeding schedule recommendations
     */
    public function generateFeedingSchedule(int $mealsPerDay, string $lifestyle = 'standard'): array
    {
        $schedules = [
            1 => [
                'standard' => ['08:00'],
                'early_riser' => ['07:00'],
                'night_owl' => ['10:00']
            ],
            2 => [
                'standard' => ['08:00', '18:00'],
                'early_riser' => ['07:00', '17:00'],
                'night_owl' => ['10:00', '20:00']
            ],
            3 => [
                'standard' => ['07:00', '13:00', '19:00'],
                'early_riser' => ['06:00', '12:00', '18:00'],
                'night_owl' => ['09:00', '15:00', '21:00']
            ],
            4 => [
                'standard' => ['07:00', '12:00', '17:00', '21:00'],
                'early_riser' => ['06:00', '11:00', '16:00', '20:00'],
                'night_owl' => ['09:00', '13:00', '18:00', '22:00']
            ]
        ];
        
        $times = $schedules[$mealsPerDay][$lifestyle] ?? $schedules[2]['standard'];
        
        return array_map(function($time, $index) use ($mealsPerDay) {
            return [
                'meal_number' => $index + 1,
                'time' => $time,
                'portion_percentage' => round(100 / $mealsPerDay, 1)
            ];
        }, $times, array_keys($times));
    }
}