<?php

declare(strict_types=1);

namespace App\Application\Services;

use App\Domain\Pet\Pet;
use App\Domain\Nutrition\NutritionPlan;
use App\Domain\Nutrition\NutritionRequirements;
use DateTime;
use InvalidArgumentException;

class NutritionService
{
    public function calculateNutritionalRequirements(Pet $pet): NutritionRequirements
    {
        return new NutritionRequirements($pet);
    }

    public function generateNutritionPlan(Pet $pet, array $preferences = []): NutritionPlan
    {
        $requirements = $this->calculateNutritionalRequirements($pet);
        
        $planName = $this->generatePlanName($pet);
        $mealsPerDay = $this->calculateOptimalMealsPerDay($pet);
        
        $plan = new NutritionPlan(
            $pet->getId(),
            $planName,
            (int) round($requirements->getDailyCalories()),
            $mealsPerDay,
            $pet->getUserId(),
            new DateTime()
        );

        // Set macronutrients
        $plan->updateNutrients(
            $requirements->getProteinGrams(),
            $requirements->getFatGrams(),
            $requirements->getCarbGrams(),
            $requirements->getFiberGrams()
        );

        // Generate feeding schedule
        $feedingSchedule = $this->generateFeedingSchedule($mealsPerDay, $preferences);
        $plan->updateFeedingSchedule($feedingSchedule);

        // Generate food recommendations
        $foodRecommendations = $this->generateFoodRecommendations($pet, $requirements, $preferences);
        $plan->updateFoodRecommendations($foodRecommendations);

        // Add special instructions
        $specialInstructions = $this->generateSpecialInstructions($pet, $requirements);
        if ($specialInstructions) {
            $plan->setSpecialInstructions($specialInstructions);
        }

        return $plan;
    }

    public function adjustPlanForWeightManagement(Pet $pet, NutritionPlan $plan, string $goal): NutritionPlan
    {
        $currentCalories = $plan->getDailyCalories();
        
        $adjustedCalories = match ($goal) {
            'weight_loss' => (int) round($currentCalories * 0.8),
            'weight_gain' => (int) round($currentCalories * 1.2),
            'maintenance' => $currentCalories,
            default => throw new InvalidArgumentException('Invalid weight management goal')
        };

        $newPlan = new NutritionPlan(
            $pet->getId(),
            $plan->getPlanName() . " - " . ucfirst(str_replace('_', ' ', $goal)),
            $adjustedCalories,
            $plan->getMealsPerDay(),
            $plan->getCreatedByUserId(),
            new DateTime()
        );

        // Adjust macronutrients proportionally
        $ratio = $adjustedCalories / $currentCalories;
        $newPlan->updateNutrients(
            $plan->getDailyProteinGrams() ? $plan->getDailyProteinGrams() * $ratio : null,
            $plan->getDailyFatGrams() ? $plan->getDailyFatGrams() * $ratio : null,
            $plan->getDailyCarbGrams() ? $plan->getDailyCarbGrams() * $ratio : null,
            $plan->getDailyFiberGrams() ? $plan->getDailyFiberGrams() * $ratio : null
        );

        // Update feeding schedule with adjusted portions
        $adjustedSchedule = $this->adjustFeedingSchedulePortions($plan->getFeedingSchedule(), $ratio);
        $newPlan->updateFeedingSchedule($adjustedSchedule);

        // Update food recommendations
        $adjustedRecommendations = $this->adjustFoodRecommendations($plan->getFoodRecommendations(), $ratio);
        $newPlan->updateFoodRecommendations($adjustedRecommendations);

        // Add weight management instructions
        $instructions = $this->generateWeightManagementInstructions($goal, $pet);
        $newPlan->setSpecialInstructions($instructions);

        return $newPlan;
    }

    public function validateNutritionPlan(Pet $pet, NutritionPlan $plan): array
    {
        $requirements = $this->calculateNutritionalRequirements($pet);
        $issues = [];

        // Check calorie adequacy
        $calorieDeviation = abs($plan->getDailyCalories() - $requirements->getDailyCalories()) / $requirements->getDailyCalories();
        if ($calorieDeviation > 0.2) { // More than 20% deviation
            $issues[] = [
                'type' => 'calorie_mismatch',
                'severity' => 'warning',
                'message' => 'Daily calories deviate significantly from calculated requirements',
                'expected' => round($requirements->getDailyCalories()),
                'actual' => $plan->getDailyCalories()
            ];
        }

        // Check protein adequacy
        if ($plan->getDailyProteinGrams()) {
            $proteinDeviation = abs($plan->getDailyProteinGrams() - $requirements->getProteinGrams()) / $requirements->getProteinGrams();
            if ($proteinDeviation > 0.15) { // More than 15% deviation
                $issues[] = [
                    'type' => 'protein_mismatch',
                    'severity' => 'warning',
                    'message' => 'Protein content may not meet requirements',
                    'expected' => round($requirements->getProteinGrams(), 1),
                    'actual' => round($plan->getDailyProteinGrams(), 1)
                ];
            }
        }

        // Check for species-specific requirements
        if ($pet->getSpecies()->value === 'cat') {
            $proteinPercentage = $plan->getProteinPercentage();
            if ($proteinPercentage && $proteinPercentage < 26) {
                $issues[] = [
                    'type' => 'insufficient_protein',
                    'severity' => 'error',
                    'message' => 'Cats require minimum 26% protein in their diet',
                    'actual' => round($proteinPercentage, 1)
                ];
            }
        }

        // Check for allergies
        foreach ($pet->getAllergies() as $allergen) {
            foreach ($plan->getFoodRecommendations() as $food) {
                if (isset($food['ingredients']) && str_contains(strtolower($food['ingredients']), strtolower($allergen))) {
                    $issues[] = [
                        'type' => 'allergen_present',
                        'severity' => 'error',
                        'message' => "Food recommendation contains allergen: {$allergen}",
                        'food' => $food['name'] ?? 'Unknown food'
                    ];
                }
            }
        }

        return $issues;
    }

    private function generatePlanName(Pet $pet): string
    {
        $lifeStage = $pet->getLifeStage()->getDisplayName();
        $species = $pet->getSpecies()->getDisplayName();
        $date = (new DateTime())->format('M Y');
        
        return "{$pet->getName()}'s {$lifeStage} {$species} Plan - {$date}";
    }

    private function calculateOptimalMealsPerDay(Pet $pet): int
    {
        $lifeStage = $pet->getLifeStage();
        $species = $pet->getSpecies();

        return match ($lifeStage) {
            $pet->getLifeStage()::PUPPY, $pet->getLifeStage()::KITTEN => 4,
            $pet->getLifeStage()::ADULT => match ($species) {
                $pet->getSpecies()::DOG => 2,
                $pet->getSpecies()::CAT => 2,
                default => 2
            },
            $pet->getLifeStage()::SENIOR => 3,
            default => 2
        };
    }

    private function generateFeedingSchedule(int $mealsPerDay, array $preferences = []): array
    {
        $schedule = [];
        $startHour = $preferences['start_hour'] ?? 7;
        $endHour = $preferences['end_hour'] ?? 19;
        
        $interval = ($endHour - $startHour) / ($mealsPerDay - 1);
        
        for ($i = 0; $i < $mealsPerDay; $i++) {
            $hour = $startHour + ($i * $interval);
            $time = sprintf('%02d:00', (int) $hour);
            
            $mealName = match ($i) {
                0 => 'Breakfast',
                1 => $mealsPerDay === 2 ? 'Dinner' : 'Lunch',
                2 => $mealsPerDay === 3 ? 'Dinner' : 'Afternoon Snack',
                3 => 'Dinner',
                default => 'Meal ' . ($i + 1)
            };

            $schedule[] = [
                'time' => $time,
                'meal_name' => $mealName,
                'portion_percentage' => round(100 / $mealsPerDay, 1)
            ];
        }

        return $schedule;
    }

    private function generateFoodRecommendations(Pet $pet, NutritionRequirements $requirements, array $preferences = []): array
    {
        $recommendations = [];
        $species = $pet->getSpecies();
        $lifeStage = $pet->getLifeStage();
        $allergies = $pet->getAllergies();

        // Primary food recommendation
        $primaryFood = [
            'type' => 'primary',
            'category' => 'dry_kibble',
            'name' => $this->generateFoodName($species, $lifeStage),
            'daily_amount_grams' => $this->calculateDryFoodAmount($requirements->getDailyCalories()),
            'calories_per_100g' => $this->getTypicalCaloriesPerGram($species, 'dry_kibble'),
            'feeding_notes' => 'High-quality complete and balanced dry food',
            'avoid_ingredients' => $allergies
        ];

        $recommendations[] = $primaryFood;

        // Wet food supplement (if preferred)
        if (!in_array('wet_food', $preferences['avoid_categories'] ?? [])) {
            $wetFood = [
                'type' => 'supplement',
                'category' => 'wet_food',
                'name' => $this->generateFoodName($species, $lifeStage, 'wet'),
                'daily_amount_grams' => $this->calculateWetFoodAmount($requirements->getDailyCalories() * 0.3),
                'calories_per_100g' => $this->getTypicalCaloriesPerGram($species, 'wet_food'),
                'feeding_notes' => 'Can replace 30% of dry food for variety and hydration',
                'avoid_ingredients' => $allergies
            ];

            $recommendations[] = $wetFood;
        }

        // Treats allowance
        $treats = [
            'type' => 'treats',
            'category' => 'treats',
            'name' => 'Healthy Training Treats',
            'daily_amount_grams' => $this->calculateTreatAmount($requirements->getDailyCalories()),
            'calories_per_100g' => 350,
            'feeding_notes' => 'Should not exceed 10% of daily calories',
            'avoid_ingredients' => $allergies
        ];

        $recommendations[] = $treats;

        return $recommendations;
    }

    private function generateSpecialInstructions(Pet $pet, NutritionRequirements $requirements): ?string
    {
        $instructions = [];

        // Age-specific instructions
        if ($pet->getLifeStage()->value === 'puppy' || $pet->getLifeStage()->value === 'kitten') {
            $instructions[] = "Growing pets need frequent meals and higher calorie density.";
        }

        if ($pet->getLifeStage()->value === 'senior') {
            $instructions[] = "Senior pets may benefit from easily digestible foods and joint support supplements.";
        }

        // Weight management instructions
        if ($pet->isOverweight()) {
            $instructions[] = "Weight management: Measure portions carefully and increase exercise gradually.";
        }

        if ($pet->isUnderweight()) {
            $instructions[] = "Weight gain: Consider more frequent meals and calorie-dense foods.";
        }

        // Health condition instructions
        foreach ($pet->getHealthConditions() as $condition) {
            $instructions[] = match ($condition) {
                'diabetes' => "Monitor carbohydrate intake and maintain consistent meal times.",
                'kidney_disease' => "Consider reduced protein and phosphorus diet - consult veterinarian.",
                'heart_disease' => "Low sodium diet recommended - check food labels carefully.",
                'allergies' => "Strictly avoid known allergens and introduce new foods gradually.",
                default => "Consult veterinarian about dietary modifications for {$condition}."
            };
        }

        // Species-specific instructions
        if ($pet->getSpecies()->value === 'cat') {
            $instructions[] = "Cats require taurine and arachidonic acid - ensure food is formulated for cats.";
            $instructions[] = "Fresh water should always be available as cats have low thirst drive.";
        }

        return empty($instructions) ? null : implode(' ', $instructions);
    }

    private function generateFoodName(object $species, object $lifeStage, string $type = 'dry'): string
    {
        $speciesName = $species->getDisplayName();
        $stageName = $lifeStage->getDisplayName();
        $typeText = $type === 'wet' ? 'Wet Food' : 'Dry Food';
        
        return "Premium {$stageName} {$speciesName} {$typeText}";
    }

    private function calculateDryFoodAmount(float $dailyCalories): int
    {
        // Assuming average dry food has 350-400 calories per 100g
        return (int) round(($dailyCalories / 375) * 100);
    }

    private function calculateWetFoodAmount(float $calories): int
    {
        // Assuming average wet food has 80-100 calories per 100g
        return (int) round(($calories / 90) * 100);
    }

    private function calculateTreatAmount(float $dailyCalories): int
    {
        // Treats should be max 10% of daily calories
        $treatCalories = $dailyCalories * 0.1;
        return (int) round(($treatCalories / 350) * 100);
    }

    private function getTypicalCaloriesPerGram(object $species, string $category): int
    {
        return match ($category) {
            'dry_kibble' => 375,
            'wet_food' => 90,
            'treats' => 350,
            default => 300
        };
    }

    private function adjustFeedingSchedulePortions(array $schedule, float $ratio): array
    {
        return array_map(function ($meal) use ($ratio) {
            if (isset($meal['portion_grams'])) {
                $meal['portion_grams'] = (int) round($meal['portion_grams'] * $ratio);
            }
            return $meal;
        }, $schedule);
    }

    private function adjustFoodRecommendations(array $recommendations, float $ratio): array
    {
        return array_map(function ($food) use ($ratio) {
            if (isset($food['daily_amount_grams'])) {
                $food['daily_amount_grams'] = (int) round($food['daily_amount_grams'] * $ratio);
            }
            return $food;
        }, $recommendations);
    }

    private function generateWeightManagementInstructions(string $goal, Pet $pet): string
    {
        return match ($goal) {
            'weight_loss' => "Weight loss plan: Feed measured portions, increase exercise gradually, and monitor weight weekly. Target weight loss is 1-2% of body weight per week.",
            'weight_gain' => "Weight gain plan: Increase meal frequency, choose calorie-dense foods, and monitor for healthy weight gain. Consult veterinarian if rapid weight loss occurred.",
            'maintenance' => "Maintenance plan: Continue current feeding routine while monitoring weight monthly to ensure stability.",
            default => "Follow feeding guidelines and monitor pet's body condition regularly."
        };
    }
}