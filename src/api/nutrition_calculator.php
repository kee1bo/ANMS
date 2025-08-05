<?php
/**
 * Nutrition Calculator API Endpoint
 * Provides nutrition calculations and meal planning for pets
 */

require_once __DIR__ . '/../Application/Services/NutritionCalculationService.php';
require_once __DIR__ . '/../includes/db_connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get request data
$input = file_get_contents('php://input');
$data = json_decode($input, true);
$action = $_GET['action'] ?? $data['action'] ?? '';

// Initialize nutrition service
$nutritionService = new NutritionCalculationService();

try {
    switch ($action) {
        case 'calculate_nutrition':
            handleNutritionCalculation($nutritionService, $data);
            break;
            
        case 'generate_meal_plan':
            handleMealPlanGeneration($nutritionService, $data);
            break;
            
        case 'validate_nutrition':
            handleNutritionValidation($nutritionService, $data);
            break;
            
        case 'get_nutrition_info':
            handleNutritionInfo($nutritionService, $data);
            break;
            
        default:
            sendError('Invalid action specified', 'INVALID_ACTION', 400);
    }
} catch (Exception $e) {
    error_log('Nutrition API Error: ' . $e->getMessage());
    sendError('Internal server error', 'INTERNAL_ERROR', 500);
}

function handleNutritionCalculation($nutritionService, $data)
{
    // Validate required fields
    $required = ['pet_id', 'weight', 'species', 'age', 'activity_level'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendError("Missing required field: {$field}", 'MISSING_FIELD', 400);
        }
    }
    
    // Prepare pet data
    $petData = [
        'weight' => (float)$data['weight'],
        'species' => $data['species'],
        'age' => (float)$data['age'],
        'activity_level' => $data['activity_level'],
        'breed' => $data['breed'] ?? '',
        'health_conditions' => $data['health_conditions'] ?? []
    ];
    
    // Calculate daily calories
    $calorieData = $nutritionService->calculateDailyCalories($petData);
    
    // Calculate macronutrients
    $macronutrients = $nutritionService->calculateMacronutrients($petData, $calorieData['der']);
    
    // Validate calculations
    $validation = $nutritionService->validateCalculations($petData, array_merge($calorieData, $macronutrients));
    
    // Save nutrition plan to database if pet_id provided
    if (isset($data['pet_id'])) {
        saveNutritionPlan($data['pet_id'], $calorieData, $macronutrients);
    }
    
    sendSuccess([
        'pet_data' => $petData,
        'calories' => $calorieData,
        'macronutrients' => $macronutrients,
        'validation' => $validation,
        'calculation_date' => date('Y-m-d H:i:s')
    ], 'Nutrition calculated successfully');
}

function handleMealPlanGeneration($nutritionService, $data)
{
    // Validate required fields
    if (!isset($data['pet_data']) || !isset($data['nutrition_requirements'])) {
        sendError('Missing pet data or nutrition requirements', 'MISSING_DATA', 400);
    }
    
    $petData = $data['pet_data'];
    $nutritionRequirements = $data['nutrition_requirements'];
    
    // Generate meal plan
    $mealPlan = $nutritionService->generateMealPlan($petData, $nutritionRequirements);
    
    // Add meal plan details
    $mealPlan['created_date'] = date('Y-m-d H:i:s');
    $mealPlan['total_daily_calories'] = $nutritionRequirements['der'];
    
    sendSuccess([
        'meal_plan' => $mealPlan,
        'pet_info' => [
            'name' => $petData['name'] ?? 'Pet',
            'species' => $petData['species'],
            'weight' => $petData['weight'] . 'kg'
        ]
    ], 'Meal plan generated successfully');
}

function handleNutritionValidation($nutritionService, $data)
{
    if (!isset($data['pet_data']) || !isset($data['calculations'])) {
        sendError('Missing pet data or calculations', 'MISSING_DATA', 400);
    }
    
    $validation = $nutritionService->validateCalculations($data['pet_data'], $data['calculations']);
    
    sendSuccess([
        'validation' => $validation,
        'validated_at' => date('Y-m-d H:i:s')
    ], 'Nutrition validation completed');
}

function handleNutritionInfo($nutritionService, $data)
{
    $species = $data['species'] ?? 'dog';
    $age = $data['age'] ?? 1;
    
    // Get general nutrition information
    $info = [
        'species_info' => getSpeciesNutritionInfo($species),
        'feeding_guidelines' => getFeedingGuidelines($species, $age),
        'common_foods' => getCommonFoods($species),
        'toxic_foods' => getToxicFoods($species),
        'nutritional_tips' => getNutritionalTips($species)
    ];
    
    sendSuccess($info, 'Nutrition information retrieved');
}

function saveNutritionPlan($petId, $calorieData, $macronutrients)
{
    global $pdo;
    
    if (!defined('USE_SQLITE') || !USE_SQLITE) {
        return; // Skip if not using database
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT OR REPLACE INTO nutrition_plans 
            (pet_id, daily_calories, meals_per_day, daily_protein_grams, daily_fat_grams, special_instructions, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ");
        
        $specialInstructions = json_encode([
            'rer' => $calorieData['rer'],
            'der' => $calorieData['der'],
            'lifestage_multiplier' => $calorieData['lifestage_multiplier'],
            'activity_multiplier' => $calorieData['activity_multiplier'],
            'calculation_method' => $calorieData['calculation_method'],
            'carbohydrate_grams' => $macronutrients['carbohydrate_grams']
        ]);
        
        $stmt->execute([
            $petId,
            $calorieData['der'],
            2, // Default meals per day
            $macronutrients['protein_grams'],
            $macronutrients['fat_grams'],
            $specialInstructions
        ]);
        
    } catch (PDOException $e) {
        error_log('Failed to save nutrition plan: ' . $e->getMessage());
    }
}

function getSpeciesNutritionInfo($species)
{
    $info = [
        'dog' => [
            'type' => 'Omnivore',
            'protein_needs' => 'Moderate to high',
            'special_requirements' => 'Balanced diet with quality protein sources',
            'life_stages' => ['Puppy (0-12 months)', 'Adult (1-7 years)', 'Senior (7+ years)']
        ],
        'cat' => [
            'type' => 'Obligate Carnivore',
            'protein_needs' => 'High',
            'special_requirements' => 'Requires taurine, high protein, moderate fat',
            'life_stages' => ['Kitten (0-12 months)', 'Adult (1-7 years)', 'Senior (7+ years)']
        ]
    ];
    
    return $info[$species] ?? $info['dog'];
}

function getFeedingGuidelines($species, $age)
{
    $guidelines = [
        'frequency' => $age < 1 ? '3-4 times daily' : '2 times daily',
        'timing' => 'Feed at consistent times',
        'portion_control' => 'Measure portions to prevent overfeeding',
        'water' => 'Always provide fresh water',
        'monitoring' => 'Monitor weight and body condition regularly'
    ];
    
    if ($species === 'cat') {
        $guidelines['special'] = 'Cats prefer multiple small meals throughout the day';
    }
    
    return $guidelines;
}

function getCommonFoods($species)
{
    $foods = [
        'dog' => [
            'proteins' => ['Chicken', 'Beef', 'Fish', 'Lamb', 'Turkey'],
            'carbohydrates' => ['Rice', 'Sweet potato', 'Oats', 'Barley'],
            'vegetables' => ['Carrots', 'Green beans', 'Peas', 'Pumpkin'],
            'fruits' => ['Apples', 'Blueberries', 'Bananas']
        ],
        'cat' => [
            'proteins' => ['Chicken', 'Fish', 'Turkey', 'Beef', 'Liver'],
            'limited_carbs' => ['Small amounts of rice or pumpkin'],
            'avoid' => ['High carbohydrate foods', 'Plant-based proteins as primary source']
        ]
    ];
    
    return $foods[$species] ?? $foods['dog'];
}

function getToxicFoods($species)
{
    $toxic = [
        'dog' => [
            'chocolate', 'grapes', 'raisins', 'onions', 'garlic', 
            'avocado', 'xylitol', 'macadamia nuts', 'alcohol'
        ],
        'cat' => [
            'chocolate', 'onions', 'garlic', 'grapes', 'raisins',
            'alcohol', 'caffeine', 'raw fish', 'raw eggs', 'milk'
        ]
    ];
    
    return $toxic[$species] ?? $toxic['dog'];
}

function getNutritionalTips($species)
{
    $tips = [
        'dog' => [
            'Transition to new foods gradually over 7-10 days',
            'Use treats sparingly - no more than 10% of daily calories',
            'Consider breed-specific nutritional needs',
            'Monitor body condition score regularly'
        ],
        'cat' => [
            'Wet food helps with hydration',
            'Cats need taurine - ensure it\'s in their diet',
            'Avoid feeding only fish-based diets',
            'Indoor cats may need fewer calories'
        ]
    ];
    
    return $tips[$species] ?? $tips['dog'];
}

function sendSuccess($data, $message = 'Success')
{
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('c')
    ]);
    exit();
}

function sendError($message, $code = 'ERROR', $statusCode = 400)
{
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'code' => $code,
        'timestamp' => date('c')
    ]);
    exit();
}
?>