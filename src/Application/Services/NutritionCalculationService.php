<?php
/**
 * Nutrition Calculation Service
 * Implements veterinary-approved formulas for pet nutrition calculations
 * Based on AAFCO guidelines and species-specific requirements
 */

class NutritionCalculationService
{
    private $speciesData;
    private $lifestageMultipliers;
    private $activityMultipliers;
    
    public function __construct()
    {
        $this->initializeNutritionData();
    }
    
    /**
     * Calculate daily caloric needs using Resting Energy Requirement (RER) formulas
     */
    public function calculateDailyCalories($petData)
    {
        $weight = $petData['weight'];
        $species = strtolower($petData['species']);
        $age = $petData['age'];
        $activityLevel = strtolower($petData['activity_level']);
        
        // Calculate Resting Energy Requirement (RER)
        $rer = $this->calculateRER($weight, $species);
        
        // Apply life stage multiplier
        $lifestageMultiplier = $this->getLifestageMultiplier($species, $age);
        
        // Apply activity level multiplier
        $activityMultiplier = $this->getActivityMultiplier($activityLevel);
        
        // Calculate Daily Energy Requirement (DER)
        $der = $rer * $lifestageMultiplier * $activityMultiplier;
        
        return [
            'rer' => round($rer, 0),
            'der' => round($der, 0),
            'lifestage_multiplier' => $lifestageMultiplier,
            'activity_multiplier' => $activityMultiplier,
            'calculation_method' => 'AAFCO Standard Formula'
        ];
    }
    
    /**
     * Calculate Resting Energy Requirement using species-specific formulas
     */
    private function calculateRER($weight, $species)
    {
        switch ($species) {
            case 'dog':
                // For dogs: RER = 70 × (body weight in kg)^0.75
                return 70 * pow($weight, 0.75);
                
            case 'cat':
                // For cats: RER = 70 × (body weight in kg)^0.75
                // Alternative formula for cats: RER = 30 × body weight + 70
                if ($weight < 2 || $weight > 10) {
                    return 70 * pow($weight, 0.75);
                } else {
                    return 30 * $weight + 70;
                }
                
            default:
                // Generic mammal formula
                return 70 * pow($weight, 0.75);
        }
    }
    
    /**
     * Get life stage multiplier based on species and age
     */
    private function getLifestageMultiplier($species, $age)
    {
        $lifestageData = $this->lifestageMultipliers[$species] ?? $this->lifestageMultipliers['default'];
        
        foreach ($lifestageData as $stage) {
            if ($age >= $stage['min_age'] && $age <= $stage['max_age']) {
                return $stage['multiplier'];
            }
        }
        
        return 1.0; // Default multiplier
    }
    
    /**
     * Get activity level multiplier
     */
    private function getActivityMultiplier($activityLevel)
    {
        return $this->activityMultipliers[$activityLevel] ?? 1.0;
    }
    
    /**
     * Calculate macronutrient requirements
     */
    public function calculateMacronutrients($petData, $dailyCalories)
    {
        $species = strtolower($petData['species']);
        $weight = $petData['weight'];
        
        $macroData = $this->speciesData[$species]['macronutrients'] ?? $this->speciesData['default']['macronutrients'];
        
        // Calculate protein requirements (grams per kg body weight)
        $proteinGrams = $weight * $macroData['protein_per_kg'];
        
        // Calculate fat requirements (percentage of calories)
        $fatCalories = $dailyCalories * ($macroData['fat_percentage'] / 100);
        $fatGrams = $fatCalories / 9; // 9 calories per gram of fat
        
        // Calculate carbohydrate allowance (remaining calories)
        $proteinCalories = $proteinGrams * 4; // 4 calories per gram of protein
        $carbCalories = $dailyCalories - $proteinCalories - $fatCalories;
        $carbGrams = max(0, $carbCalories / 4); // 4 calories per gram of carbs
        
        return [
            'protein_grams' => round($proteinGrams, 1),
            'fat_grams' => round($fatGrams, 1),
            'carbohydrate_grams' => round($carbGrams, 1),
            'protein_percentage' => round(($proteinCalories / $dailyCalories) * 100, 1),
            'fat_percentage' => round(($fatCalories / $dailyCalories) * 100, 1),
            'carbohydrate_percentage' => round(($carbCalories / $dailyCalories) * 100, 1)
        ];
    }
    
    /**
     * Generate meal plan recommendations
     */
    public function generateMealPlan($petData, $nutritionRequirements)
    {
        $species = strtolower($petData['species']);
        $age = $petData['age'];
        $weight = $petData['weight'];
        
        // Determine optimal meal frequency
        $mealsPerDay = $this->getOptimalMealFrequency($species, $age, $weight);
        
        // Calculate calories per meal
        $caloriesPerMeal = round($nutritionRequirements['der'] / $mealsPerDay, 0);
        
        // Generate meal schedule
        $mealSchedule = $this->generateMealSchedule($mealsPerDay);
        
        return [
            'meals_per_day' => $mealsPerDay,
            'calories_per_meal' => $caloriesPerMeal,
            'meal_schedule' => $mealSchedule,
            'feeding_guidelines' => $this->getFeedingGuidelines($species, $age),
            'portion_guidance' => $this->getPortionGuidance($weight, $caloriesPerMeal)
        ];
    }
    
    /**
     * Validate nutrition calculations against veterinary standards
     */
    public function validateCalculations($petData, $calculations)
    {
        $validationResults = [
            'is_valid' => true,
            'warnings' => [],
            'recommendations' => []
        ];
        
        $species = strtolower($petData['species']);
        $weight = $petData['weight'];
        $age = $petData['age'];
        
        // Validate caloric requirements
        $expectedRange = $this->getExpectedCalorieRange($species, $weight, $age);
        if ($calculations['der'] < $expectedRange['min'] || $calculations['der'] > $expectedRange['max']) {
            $validationResults['warnings'][] = "Calculated calories ({$calculations['der']}) outside expected range ({$expectedRange['min']}-{$expectedRange['max']})";
        }
        
        // Validate protein requirements
        if (isset($calculations['protein_grams'])) {
            $minProtein = $this->getMinimumProtein($species, $weight);
            if ($calculations['protein_grams'] < $minProtein) {
                $validationResults['warnings'][] = "Protein requirement below minimum recommended ({$minProtein}g)";
            }
        }
        
        // Add species-specific recommendations
        $validationResults['recommendations'] = $this->getSpeciesRecommendations($species, $age);
        
        return $validationResults;
    }
    
    /**
     * Initialize nutrition data based on veterinary standards
     */
    private function initializeNutritionData()
    {
        // AAFCO-based species data
        $this->speciesData = [
            'dog' => [
                'macronutrients' => [
                    'protein_per_kg' => 2.5, // grams per kg body weight
                    'fat_percentage' => 15,   // minimum percentage of calories
                    'fiber_percentage' => 5   // maximum percentage
                ]
            ],
            'cat' => [
                'macronutrients' => [
                    'protein_per_kg' => 4.0, // cats need more protein
                    'fat_percentage' => 20,   // higher fat requirement
                    'fiber_percentage' => 3   // lower fiber tolerance
                ]
            ],
            'default' => [
                'macronutrients' => [
                    'protein_per_kg' => 2.0,
                    'fat_percentage' => 12,
                    'fiber_percentage' => 5
                ]
            ]
        ];
        
        // Life stage multipliers
        $this->lifestageMultipliers = [
            'dog' => [
                ['min_age' => 0, 'max_age' => 0.5, 'multiplier' => 2.5], // Puppy (0-6 months)
                ['min_age' => 0.5, 'max_age' => 1, 'multiplier' => 2.0],  // Young puppy (6-12 months)
                ['min_age' => 1, 'max_age' => 7, 'multiplier' => 1.6],     // Adult (1-7 years)
                ['min_age' => 7, 'max_age' => 20, 'multiplier' => 1.4]     // Senior (7+ years)
            ],
            'cat' => [
                ['min_age' => 0, 'max_age' => 1, 'multiplier' => 2.5],     // Kitten (0-12 months)
                ['min_age' => 1, 'max_age' => 7, 'multiplier' => 1.4],     // Adult (1-7 years)
                ['min_age' => 7, 'max_age' => 20, 'multiplier' => 1.2]     // Senior (7+ years)
            ],
            'default' => [
                ['min_age' => 0, 'max_age' => 1, 'multiplier' => 2.0],
                ['min_age' => 1, 'max_age' => 7, 'multiplier' => 1.5],
                ['min_age' => 7, 'max_age' => 20, 'multiplier' => 1.3]
            ]
        ];
        
        // Activity level multipliers
        $this->activityMultipliers = [
            'low' => 1.0,      // Sedentary/indoor
            'medium' => 1.2,   // Normal activity
            'high' => 1.5      // Very active/working
        ];
    }
    
    private function getOptimalMealFrequency($species, $age, $weight)
    {
        if ($species === 'cat') {
            return $age < 1 ? 4 : 2; // Kittens eat more frequently
        } elseif ($species === 'dog') {
            if ($age < 0.5) return 4;      // Puppies under 6 months
            if ($age < 1) return 3;        // Young dogs
            if ($weight < 10) return 3;    // Small dogs
            return 2;                      // Adult dogs
        }
        return 2; // Default
    }
    
    private function generateMealSchedule($mealsPerDay)
    {
        $schedules = [
            2 => ['08:00', '18:00'],
            3 => ['07:00', '13:00', '19:00'],
            4 => ['07:00', '12:00', '17:00', '21:00']
        ];
        
        return $schedules[$mealsPerDay] ?? $schedules[2];
    }
    
    private function getFeedingGuidelines($species, $age)
    {
        $guidelines = [
            'dog' => [
                'general' => 'Feed at consistent times daily',
                'puppy' => 'Puppies need frequent, smaller meals',
                'adult' => 'Two meals per day is optimal for most adult dogs',
                'senior' => 'May benefit from easily digestible foods'
            ],
            'cat' => [
                'general' => 'Cats prefer multiple small meals',
                'kitten' => 'Kittens need frequent feeding for proper growth',
                'adult' => 'Free feeding or scheduled meals both work',
                'senior' => 'Monitor for dental issues affecting eating'
            ]
        ];
        
        return $guidelines[$species] ?? $guidelines['dog'];
    }
    
    private function getPortionGuidance($weight, $caloriesPerMeal)
    {
        // Rough conversion: 1 cup dry food ≈ 300-400 calories
        $cupsPerMeal = round($caloriesPerMeal / 350, 2);
        
        return [
            'dry_food_cups' => $cupsPerMeal,
            'wet_food_cans' => round($caloriesPerMeal / 200, 1), // 1 can ≈ 200 calories
            'note' => 'Portions may vary based on food brand and formulation'
        ];
    }
    
    private function getExpectedCalorieRange($species, $weight, $age)
    {
        $baseCalories = $this->calculateRER($weight, $species);
        return [
            'min' => round($baseCalories * 1.2, 0),
            'max' => round($baseCalories * 2.5, 0)
        ];
    }
    
    private function getMinimumProtein($species, $weight)
    {
        $proteinPerKg = $this->speciesData[$species]['macronutrients']['protein_per_kg'] ?? 2.0;
        return round($weight * $proteinPerKg * 0.8, 1); // 80% of calculated requirement as minimum
    }
    
    private function getSpeciesRecommendations($species, $age)
    {
        $recommendations = [
            'dog' => [
                'Always provide fresh water',
                'Avoid foods toxic to dogs (chocolate, grapes, onions)',
                'Consider breed-specific nutritional needs'
            ],
            'cat' => [
                'Cats are obligate carnivores - require high protein',
                'Ensure adequate taurine in diet',
                'Monitor water intake - cats have low thirst drive'
            ]
        ];
        
        return $recommendations[$species] ?? $recommendations['dog'];
    }
}
?>