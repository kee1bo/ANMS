<?php

declare(strict_types=1);

namespace App\Application\Services;

use App\Domain\Pet\Pet;
use App\Domain\Nutrition\NutrientRequirement;
use App\Domain\Nutrition\FoodItem;
use App\Domain\Nutrition\FoodItemRepositoryInterface;
use App\Domain\Nutrition\FoodCategory;

class FoodRecommendationService
{
    private FoodItemRepositoryInterface $foodItemRepository;
    private NutritionCalculator $nutritionCalculator;

    public function __construct(
        FoodItemRepositoryInterface $foodItemRepository,
        NutritionCalculator $nutritionCalculator
    ) {
        $this->foodItemRepository = $foodItemRepository;
        $this->nutritionCalculator = $nutritionCalculator;
    }

    /**
     * Get food recommendations for a pet based on their nutritional needs
     */
    public function getRecommendationsForPet(Pet $pet, array $preferences = []): array
    {
        $nutritionRequirements = $this->nutritionCalculator->calculateNutritionRequirements($pet);
        $nutrientRequirement = NutrientRequirement::fromNutritionRequirements($nutritionRequirements);
        
        return $this->getRecommendationsByRequirement(
            $nutrientRequirement,
            $pet->getSpecies()->value,
            $pet->getLifeStage()->value,
            $preferences
        );
    }

    /**
     * Get food recommendations based on nutrient requirements
     */
    public function getRecommendationsByRequirement(
        NutrientRequirement $requirement,
        string $species,
        string $lifeStage,
        array $preferences = []
    ): array {
        // Get base food recommendations
        $foods = $this->foodItemRepository->findByNutritionalNeeds($requirement, $species, $lifeStage);
        
        // Apply preference filters
        $foods = $this->applyPreferenceFilters($foods, $preferences);
        
        // Score and rank foods
        $scoredFoods = $this->scoreFoods($foods, $requirement, $preferences);
        
        // Sort by score (highest first)
        usort($scoredFoods, fn($a, $b) => $b['score'] <=> $a['score']);
        
        // Limit to top recommendations
        $topFoods = array_slice($scoredFoods, 0, $preferences['limit'] ?? 10);
        
        // Calculate portion sizes for each food
        return array_map(function($scoredFood) use ($requirement) {
            $food = $scoredFood['food'];
            $portionInfo = $this->calculatePortionInfo($food, $requirement);
            
            return [
                'food' => $food,
                'score' => $scoredFood['score'],
                'match_reasons' => $scoredFood['reasons'],
                'portion_info' => $portionInfo,
                'nutritional_analysis' => $this->analyzeNutritionalMatch($food, $requirement)
            ];
        }, $topFoods);
    }

    /**
     * Apply preference filters to food list
     */
    private function applyPreferenceFilters(array $foods, array $preferences): array
    {
        $filtered = $foods;
        
        // Filter by category preference
        if (isset($preferences['categories']) && !empty($preferences['categories'])) {
            $filtered = array_filter($filtered, function(FoodItem $food) use ($preferences) {
                return in_array($food->getCategory()->value, $preferences['categories']);
            });
        }
        
        // Filter by brand preference
        if (isset($preferences['brands']) && !empty($preferences['brands'])) {
            $filtered = array_filter($filtered, function(FoodItem $food) use ($preferences) {
                return in_array($food->getBrand(), $preferences['brands']);
            });
        }
        
        // Filter by special dietary requirements
        if (isset($preferences['grain_free']) && $preferences['grain_free']) {
            $filtered = array_filter($filtered, fn(FoodItem $food) => $food->isGrainFree());
        }
        
        if (isset($preferences['organic']) && $preferences['organic']) {
            $filtered = array_filter($filtered, fn(FoodItem $food) => $food->isOrganicCertified());
        }
        
        if (isset($preferences['aafco_approved']) && $preferences['aafco_approved']) {
            $filtered = array_filter($filtered, fn(FoodItem $food) => $food->isAafcoApproved());
        }
        
        // Filter by allergen avoidance
        if (isset($preferences['avoid_allergens']) && !empty($preferences['avoid_allergens'])) {
            $filtered = array_filter($filtered, function(FoodItem $food) use ($preferences) {
                foreach ($preferences['avoid_allergens'] as $allergen) {
                    if ($food->containsAllergen($allergen)) {
                        return false;
                    }
                }
                return true;
            });
        }
        
        // Filter by price range
        if (isset($preferences['max_price']) && $preferences['max_price'] > 0) {
            $filtered = array_filter($filtered, function(FoodItem $food) use ($preferences) {
                $price = $food->getPricePerUnit();
                return $price === null || $price <= $preferences['max_price'];
            });
        }
        
        return array_values($filtered);
    }

    /**
     * Score foods based on nutritional match and preferences
     */
    private function scoreFoods(array $foods, NutrientRequirement $requirement, array $preferences): array
    {
        return array_map(function(FoodItem $food) use ($requirement, $preferences) {
            $score = 0;
            $reasons = [];
            
            // Nutritional match score (0-50 points)
            $nutritionalScore = $this->calculateNutritionalScore($food, $requirement);
            $score += $nutritionalScore['score'];
            $reasons = array_merge($reasons, $nutritionalScore['reasons']);
            
            // Quality indicators (0-30 points)
            $qualityScore = $this->calculateQualityScore($food);
            $score += $qualityScore['score'];
            $reasons = array_merge($reasons, $qualityScore['reasons']);
            
            // Preference bonus (0-20 points)
            $preferenceScore = $this->calculatePreferenceScore($food, $preferences);
            $score += $preferenceScore['score'];
            $reasons = array_merge($reasons, $preferenceScore['reasons']);
            
            return [
                'food' => $food,
                'score' => round($score, 1),
                'reasons' => $reasons
            ];
        }, $foods);
    }

    /**
     * Calculate nutritional match score
     */
    private function calculateNutritionalScore(FoodItem $food, NutrientRequirement $requirement): array
    {
        $score = 0;
        $reasons = [];
        
        // Protein match (0-15 points)
        $targetProteinPercentage = $requirement->getProteinPercentage();
        $foodProteinPercentage = $food->getProteinPercentage();
        
        if ($foodProteinPercentage !== null) {
            $proteinDiff = abs($targetProteinPercentage - $foodProteinPercentage);
            if ($proteinDiff <= 2) {
                $score += 15;
                $reasons[] = 'Excellent protein match';
            } elseif ($proteinDiff <= 5) {
                $score += 10;
                $reasons[] = 'Good protein content';
            } elseif ($proteinDiff <= 10) {
                $score += 5;
                $reasons[] = 'Adequate protein content';
            }
        }
        
        // Fat match (0-15 points)
        $targetFatPercentage = $requirement->getFatPercentage();
        $foodFatPercentage = $food->getFatPercentage();
        
        if ($foodFatPercentage !== null) {
            $fatDiff = abs($targetFatPercentage - $foodFatPercentage);
            if ($fatDiff <= 1) {
                $score += 15;
                $reasons[] = 'Perfect fat content';
            } elseif ($fatDiff <= 3) {
                $score += 10;
                $reasons[] = 'Good fat content';
            } elseif ($fatDiff <= 6) {
                $score += 5;
                $reasons[] = 'Acceptable fat content';
            }
        }
        
        // Fiber consideration (0-10 points)
        $foodFiberPercentage = $food->getFiberPercentage();
        if ($foodFiberPercentage !== null) {
            if ($foodFiberPercentage >= 2 && $foodFiberPercentage <= 8) {
                $score += 10;
                $reasons[] = 'Good fiber content';
            } elseif ($foodFiberPercentage >= 1 && $foodFiberPercentage <= 12) {
                $score += 5;
                $reasons[] = 'Adequate fiber content';
            }
        }
        
        // Calorie density consideration (0-10 points)
        $caloriesPerGram = $food->getCaloriesPerGram();
        if ($caloriesPerGram >= 3.5 && $caloriesPerGram <= 4.5) {
            $score += 10;
            $reasons[] = 'Optimal calorie density';
        } elseif ($caloriesPerGram >= 3.0 && $caloriesPerGram <= 5.0) {
            $score += 5;
            $reasons[] = 'Good calorie density';
        }
        
        return ['score' => $score, 'reasons' => $reasons];
    }

    /**
     * Calculate quality score based on certifications and standards
     */
    private function calculateQualityScore(FoodItem $food): array
    {
        $score = 0;
        $reasons = [];
        
        // AAFCO approval (0-15 points)
        if ($food->isAafcoApproved()) {
            $score += 15;
            $reasons[] = 'AAFCO approved for complete nutrition';
        }
        
        // Organic certification (0-8 points)
        if ($food->isOrganicCertified()) {
            $score += 8;
            $reasons[] = 'Organic certified ingredients';
        }
        
        // Grain-free option (0-5 points)
        if ($food->isGrainFree()) {
            $score += 5;
            $reasons[] = 'Grain-free formula';
        }
        
        // Brand reputation (0-2 points based on availability status)
        if ($food->getAvailabilityStatus()->value === 'available') {
            $score += 2;
            $reasons[] = 'Readily available';
        }
        
        return ['score' => $score, 'reasons' => $reasons];
    }

    /**
     * Calculate preference-based bonus score
     */
    private function calculatePreferenceScore(FoodItem $food, array $preferences): array
    {
        $score = 0;
        $reasons = [];
        
        // Preferred category bonus
        if (isset($preferences['preferred_categories'])) {
            if (in_array($food->getCategory()->value, $preferences['preferred_categories'])) {
                $score += 10;
                $reasons[] = 'Matches preferred food type';
            }
        }
        
        // Preferred brand bonus
        if (isset($preferences['preferred_brands'])) {
            if (in_array($food->getBrand(), $preferences['preferred_brands'])) {
                $score += 8;
                $reasons[] = 'Preferred brand';
            }
        }
        
        // Price consideration
        if (isset($preferences['budget_conscious']) && $preferences['budget_conscious']) {
            $price = $food->getPricePerUnit();
            if ($price !== null && $price <= 50) { // Assuming reasonable price threshold
                $score += 5;
                $reasons[] = 'Budget-friendly option';
            }
        }
        
        return ['score' => $score, 'reasons' => $reasons];
    }

    /**
     * Calculate portion information for a specific food
     */
    private function calculatePortionInfo(FoodItem $food, NutrientRequirement $requirement): array
    {
        $dailyCalories = $requirement->getDailyCalories();
        $foodCaloriesPer100g = $food->getCaloriesPer100g();
        
        // Calculate daily portion in grams
        $dailyPortionGrams = ($dailyCalories / $foodCaloriesPer100g) * 100;
        
        // Convert to cups (assuming 120g per cup for dry food, 85g for wet food)
        $gramsPerCup = $food->getCategory() === FoodCategory::WET_FOOD ? 85 : 120;
        $dailyPortionCups = $dailyPortionGrams / $gramsPerCup;
        
        // Calculate for different meal frequencies
        return [
            'daily_grams' => round($dailyPortionGrams, 0),
            'daily_cups' => round($dailyPortionCups, 2),
            'meals' => [
                1 => [
                    'grams_per_meal' => round($dailyPortionGrams, 0),
                    'cups_per_meal' => round($dailyPortionCups, 2)
                ],
                2 => [
                    'grams_per_meal' => round($dailyPortionGrams / 2, 0),
                    'cups_per_meal' => round($dailyPortionCups / 2, 2)
                ],
                3 => [
                    'grams_per_meal' => round($dailyPortionGrams / 3, 0),
                    'cups_per_meal' => round($dailyPortionCups / 3, 2)
                ]
            ]
        ];
    }

    /**
     * Analyze how well a food matches nutritional requirements
     */
    private function analyzeNutritionalMatch(FoodItem $food, NutrientRequirement $requirement): array
    {
        $analysis = [
            'overall_match' => 'good',
            'protein_analysis' => null,
            'fat_analysis' => null,
            'calorie_analysis' => null,
            'recommendations' => []
        ];
        
        // Protein analysis
        $targetProtein = $requirement->getProteinPercentage();
        $foodProtein = $food->getProteinPercentage();
        
        if ($foodProtein !== null) {
            $proteinDiff = $foodProtein - $targetProtein;
            if (abs($proteinDiff) <= 2) {
                $analysis['protein_analysis'] = 'excellent';
            } elseif (abs($proteinDiff) <= 5) {
                $analysis['protein_analysis'] = 'good';
            } else {
                $analysis['protein_analysis'] = 'fair';
                if ($proteinDiff > 0) {
                    $analysis['recommendations'][] = 'This food is higher in protein than needed - monitor for kidney health';
                } else {
                    $analysis['recommendations'][] = 'This food is lower in protein - consider supplementing with high-protein treats';
                }
            }
        }
        
        // Fat analysis
        $targetFat = $requirement->getFatPercentage();
        $foodFat = $food->getFatPercentage();
        
        if ($foodFat !== null) {
            $fatDiff = $foodFat - $targetFat;
            if (abs($fatDiff) <= 1) {
                $analysis['fat_analysis'] = 'excellent';
            } elseif (abs($fatDiff) <= 3) {
                $analysis['fat_analysis'] = 'good';
            } else {
                $analysis['fat_analysis'] = 'fair';
                if ($fatDiff > 0) {
                    $analysis['recommendations'][] = 'This food is higher in fat - reduce portion size slightly';
                } else {
                    $analysis['recommendations'][] = 'This food is lower in fat - may need additional healthy fats';
                }
            }
        }
        
        // Overall calorie density
        $caloriesPerGram = $food->getCaloriesPerGram();
        if ($caloriesPerGram >= 3.5 && $caloriesPerGram <= 4.5) {
            $analysis['calorie_analysis'] = 'optimal';
        } elseif ($caloriesPerGram >= 3.0 && $caloriesPerGram <= 5.0) {
            $analysis['calorie_analysis'] = 'good';
        } else {
            $analysis['calorie_analysis'] = 'suboptimal';
            if ($caloriesPerGram > 5.0) {
                $analysis['recommendations'][] = 'High calorie density - watch portion sizes carefully';
            } else {
                $analysis['recommendations'][] = 'Low calorie density - may need larger portions';
            }
        }
        
        // Determine overall match
        $scores = array_filter([
            $analysis['protein_analysis'],
            $analysis['fat_analysis'],
            $analysis['calorie_analysis']
        ]);
        
        $excellentCount = count(array_filter($scores, fn($s) => $s === 'excellent'));
        $goodCount = count(array_filter($scores, fn($s) => $s === 'good'));
        
        if ($excellentCount >= 2) {
            $analysis['overall_match'] = 'excellent';
        } elseif ($excellentCount + $goodCount >= 2) {
            $analysis['overall_match'] = 'good';
        } else {
            $analysis['overall_match'] = 'fair';
        }
        
        return $analysis;
    }

    /**
     * Get alternative food recommendations
     */
    public function getAlternatives(FoodItem $currentFood, Pet $pet, int $limit = 5): array
    {
        $nutritionRequirements = $this->nutritionCalculator->calculateNutritionRequirements($pet);
        $nutrientRequirement = NutrientRequirement::fromNutritionRequirements($nutritionRequirements);
        
        // Get foods in the same category
        $alternatives = $this->foodItemRepository->findByCategory($currentFood->getCategory());
        
        // Remove the current food from alternatives
        $alternatives = array_filter($alternatives, fn(FoodItem $food) => $food->getId() !== $currentFood->getId());
        
        // Filter by species and life stage
        $alternatives = array_filter($alternatives, function(FoodItem $food) use ($pet) {
            return $food->isForSpecies($pet->getSpecies()->value) && 
                   $food->isForLifeStage($pet->getLifeStage()->value);
        });
        
        // Score alternatives
        $scoredAlternatives = $this->scoreFoods($alternatives, $nutrientRequirement, []);
        
        // Sort by score
        usort($scoredAlternatives, fn($a, $b) => $b['score'] <=> $a['score']);
        
        // Return top alternatives with portion info
        return array_slice(array_map(function($scoredFood) use ($nutrientRequirement) {
            $food = $scoredFood['food'];
            return [
                'food' => $food,
                'score' => $scoredFood['score'],
                'reasons' => $scoredFood['reasons'],
                'portion_info' => $this->calculatePortionInfo($food, $nutrientRequirement)
            ];
        }, $scoredAlternatives), 0, $limit);
    }
}