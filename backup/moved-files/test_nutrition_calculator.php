<?php
/**
 * Test Nutrition Calculator
 * Validates nutrition calculations against veterinary standards
 */

require_once 'src/Application/Services/NutritionCalculationService.php';

echo "=== ANMS Nutrition Calculator Test ===\n\n";

$nutritionService = new NutritionCalculationService();

// Test cases based on veterinary standards
$testCases = [
    [
        'name' => 'Adult Dog - Medium Activity',
        'pet_data' => [
            'weight' => 25.0,
            'species' => 'dog',
            'age' => 3,
            'activity_level' => 'medium',
            'breed' => 'Golden Retriever'
        ],
        'expected_rer_range' => [740, 760],
        'expected_der_range' => [1420, 1460]
    ],
    [
        'name' => 'Adult Cat - Low Activity',
        'pet_data' => [
            'weight' => 4.5,
            'species' => 'cat',
            'age' => 5,
            'activity_level' => 'low',
            'breed' => 'Persian'
        ],
        'expected_rer_range' => [200, 220],
        'expected_der_range' => [240, 280]
    ],
    [
        'name' => 'Puppy - High Activity',
        'pet_data' => [
            'weight' => 8.0,
            'species' => 'dog',
            'age' => 0.5,
            'activity_level' => 'high',
            'breed' => 'Labrador'
        ],
        'expected_rer_range' => [330, 350],
        'expected_der_range' => [1200, 1400]
    ],
    [
        'name' => 'Senior Cat - Medium Activity',
        'pet_data' => [
            'weight' => 3.8,
            'species' => 'cat',
            'age' => 12,
            'activity_level' => 'medium',
            'breed' => 'Domestic Shorthair'
        ],
        'expected_rer_range' => [180, 200],
        'expected_der_range' => [260, 300]
    ]
];

$passedTests = 0;
$totalTests = count($testCases);

foreach ($testCases as $index => $testCase) {
    echo "Test " . ($index + 1) . ": " . $testCase['name'] . "\n";
    echo str_repeat("-", 50) . "\n";
    
    try {
        // Calculate daily calories
        $calorieData = $nutritionService->calculateDailyCalories($testCase['pet_data']);
        
        // Calculate macronutrients
        $macronutrients = $nutritionService->calculateMacronutrients($testCase['pet_data'], $calorieData['der']);
        
        // Generate meal plan
        $mealPlan = $nutritionService->generateMealPlan($testCase['pet_data'], $calorieData);
        
        // Validate calculations
        $validation = $nutritionService->validateCalculations($testCase['pet_data'], array_merge($calorieData, $macronutrients));
        
        // Display results
        echo "Pet: {$testCase['pet_data']['weight']}kg {$testCase['pet_data']['species']}, {$testCase['pet_data']['age']} years, {$testCase['pet_data']['activity_level']} activity\n";
        echo "RER: {$calorieData['rer']} kcal/day\n";
        echo "DER: {$calorieData['der']} kcal/day\n";
        echo "Lifestage Multiplier: {$calorieData['lifestage_multiplier']}\n";
        echo "Activity Multiplier: {$calorieData['activity_multiplier']}\n";
        echo "Method: {$calorieData['calculation_method']}\n\n";
        
        echo "Macronutrients:\n";
        echo "- Protein: {$macronutrients['protein_grams']}g ({$macronutrients['protein_percentage']}%)\n";
        echo "- Fat: {$macronutrients['fat_grams']}g ({$macronutrients['fat_percentage']}%)\n";
        echo "- Carbs: {$macronutrients['carbohydrate_grams']}g ({$macronutrients['carbohydrate_percentage']}%)\n\n";
        
        echo "Meal Plan:\n";
        echo "- Meals per day: {$mealPlan['meals_per_day']}\n";
        echo "- Calories per meal: {$mealPlan['calories_per_meal']} kcal\n";
        echo "- Schedule: " . implode(', ', $mealPlan['meal_schedule']) . "\n";
        echo "- Dry food per meal: ~{$mealPlan['portion_guidance']['dry_food_cups']} cups\n\n";
        
        // Validate against expected ranges
        $rerValid = ($calorieData['rer'] >= $testCase['expected_rer_range'][0] && 
                    $calorieData['rer'] <= $testCase['expected_rer_range'][1]);
        $derValid = ($calorieData['der'] >= $testCase['expected_der_range'][0] && 
                    $calorieData['der'] <= $testCase['expected_der_range'][1]);
        
        echo "Validation:\n";
        echo "- RER in expected range: " . ($rerValid ? "✅ PASS" : "❌ FAIL") . "\n";
        echo "- DER in expected range: " . ($derValid ? "✅ PASS" : "❌ FAIL") . "\n";
        echo "- Calculations valid: " . ($validation['is_valid'] ? "✅ PASS" : "❌ FAIL") . "\n";
        
        if (!empty($validation['warnings'])) {
            echo "- Warnings: " . implode(', ', $validation['warnings']) . "\n";
        }
        
        if ($rerValid && $derValid && $validation['is_valid']) {
            echo "✅ TEST PASSED\n";
            $passedTests++;
        } else {
            echo "❌ TEST FAILED\n";
        }
        
    } catch (Exception $e) {
        echo "❌ TEST ERROR: " . $e->getMessage() . "\n";
    }
    
    echo "\n" . str_repeat("=", 60) . "\n\n";
}

// Summary
echo "=== TEST SUMMARY ===\n";
echo "Passed: {$passedTests}/{$totalTests} tests\n";
echo "Success Rate: " . round(($passedTests / $totalTests) * 100, 1) . "%\n";

if ($passedTests === $totalTests) {
    echo "🎉 ALL TESTS PASSED! Nutrition calculator is working correctly.\n";
} else {
    echo "⚠️  Some tests failed. Review calculations and formulas.\n";
}

// Test API endpoint
echo "\n=== API ENDPOINT TEST ===\n";

$testPetData = [
    'action' => 'calculate_nutrition',
    'pet_id' => 1,
    'weight' => 25.0,
    'species' => 'dog',
    'age' => 3,
    'activity_level' => 'medium',
    'breed' => 'Golden Retriever'
];

echo "Testing API endpoint with sample data...\n";

// Simulate API call
$_SERVER['REQUEST_METHOD'] = 'POST';
$_GET['action'] = 'calculate_nutrition';

// Capture output
ob_start();
$input = json_encode($testPetData);
file_put_contents('php://input', $input);

try {
    require_once 'src/api/nutrition_calculator.php';
    $apiOutput = ob_get_clean();
    
    $apiResponse = json_decode($apiOutput, true);
    
    if ($apiResponse && $apiResponse['success']) {
        echo "✅ API endpoint working correctly\n";
        echo "Response includes: calories, macronutrients, validation\n";
    } else {
        echo "❌ API endpoint failed\n";
        echo "Response: " . $apiOutput . "\n";
    }
    
} catch (Exception $e) {
    ob_end_clean();
    echo "❌ API test error: " . $e->getMessage() . "\n";
}

echo "\n=== NUTRITION CALCULATOR VALIDATION COMPLETE ===\n";
?>