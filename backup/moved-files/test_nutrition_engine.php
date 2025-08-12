<?php

require_once 'vendor/autoload.php';

use App\Domain\Pet\Pet;
use App\Domain\Pet\PetSpecies;
use App\Domain\Pet\ActivityLevel;
use App\Domain\Pet\LifeStage;
use App\Domain\Pet\PetGender;
use App\Application\Services\NutritionCalculator;
use App\Domain\Nutrition\NutritionRequirements;
use DateTime;

echo "=== Testing Nutrition Calculation Engine ===\n\n";

// Create a test pet
$pet = new Pet(
    1, // userId
    'Buddy',
    PetSpecies::DOG,
    'Golden Retriever',
    new DateTime('2020-01-01'),
    PetGender::MALE,
    false
);

// Set additional properties using reflection for testing
$reflection = new ReflectionClass($pet);
$idProperty = $reflection->getProperty('id');
$idProperty->setAccessible(true);
$idProperty->setValue($pet, 1);

$pet->updateWeight(25.0, 25.0); // 25kg adult dog (current and ideal weight)
$pet->updateActivityLevel(ActivityLevel::MODERATE);

echo "Pet Details:\n";
echo "- Name: " . $pet->getName() . "\n";
echo "- Species: " . $pet->getSpecies()->value . "\n";
echo "- Weight: " . $pet->getCurrentWeight() . " kg\n";
echo "- Life Stage: " . $pet->getLifeStage()->value . "\n";
echo "- Activity Level: " . $pet->getActivityLevel()->value . "\n\n";

// Test existing NutritionRequirements class
echo "=== Using Existing NutritionRequirements Class ===\n";
$nutritionRequirements = new NutritionRequirements($pet);
$requirementsArray = $nutritionRequirements->toArray();

echo "Daily Calories: " . $requirementsArray['daily_calories'] . "\n";
echo "Protein: " . $requirementsArray['protein_grams'] . "g (" . $requirementsArray['protein_percentage'] . "%)\n";
echo "Fat: " . $requirementsArray['fat_grams'] . "g (" . $requirementsArray['fat_percentage'] . "%)\n";
echo "Carbs: " . $requirementsArray['carb_grams'] . "g (" . $requirementsArray['carb_percentage'] . "%)\n";
echo "Fiber: " . $requirementsArray['fiber_grams'] . "g\n\n";

echo "Vitamins:\n";
foreach ($requirementsArray['vitamins'] as $vitamin => $amount) {
    echo "- " . ucfirst(str_replace('_', ' ', $vitamin)) . ": " . $amount . "\n";
}

echo "\nMinerals:\n";
foreach ($requirementsArray['minerals'] as $mineral => $amount) {
    echo "- " . ucfirst(str_replace('_', ' ', $mineral)) . ": " . $amount . "\n";
}

// Test new NutritionCalculator
echo "\n=== Using New NutritionCalculator ===\n";
$calculator = new NutritionCalculator();

try {
    $dailyCalories = $calculator->calculateDailyCalories($pet);
    echo "Daily Calories (Calculator): " . $dailyCalories . "\n";
    
    $nutrientRequirement = $calculator->calculateNutrientRequirements($pet);
    echo "Protein: " . $nutrientRequirement->getDailyProteinGrams() . "g (" . 
         round($nutrientRequirement->getProteinPercentage(), 1) . "%)\n";
    echo "Fat: " . $nutrientRequirement->getDailyFatGrams() . "g (" . 
         round($nutrientRequirement->getFatPercentage(), 1) . "%)\n";
    echo "Carbs: " . $nutrientRequirement->getDailyCarbGrams() . "g (" . 
         round($nutrientRequirement->getCarbPercentage(), 1) . "%)\n";
    echo "Fiber: " . $nutrientRequirement->getDailyFiberGrams() . "g\n";
    
    // Test portion calculation
    $portionInfo = $calculator->calculatePortionSize($nutrientRequirement, 400, 2);
    echo "\nPortion Info (400 cal/cup, 2 meals):\n";
    echo "- Cups per day: " . $portionInfo['cups_per_day'] . "\n";
    echo "- Cups per meal: " . $portionInfo['cups_per_meal'] . "\n";
    echo "- Grams per day: " . $portionInfo['grams_per_day'] . "\n";
    echo "- Grams per meal: " . $portionInfo['grams_per_meal'] . "\n";
    
    // Test feeding schedule
    $schedule = $calculator->generateFeedingSchedule(2, 'standard');
    echo "\nFeeding Schedule:\n";
    foreach ($schedule as $meal) {
        echo "- Meal " . $meal['meal_number'] . ": " . $meal['time'] . 
             " (" . $meal['portion_percentage'] . "%)\n";
    }
    
    // Test health condition adjustments
    echo "\n=== Health Condition Adjustments ===\n";
    $adjustedForObesity = $calculator->adjustForHealthConditions($nutrientRequirement, ['obesity']);
    echo "Obesity adjustment:\n";
    echo "- Original calories: " . $nutrientRequirement->getDailyCalories() . "\n";
    echo "- Adjusted calories: " . $adjustedForObesity->getDailyCalories() . "\n";
    echo "- Fiber increase: " . $nutrientRequirement->getDailyFiberGrams() . "g -> " . 
         $adjustedForObesity->getDailyFiberGrams() . "g\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Completed Successfully! ===\n";