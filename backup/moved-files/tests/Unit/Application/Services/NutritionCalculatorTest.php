<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Services;

use App\Application\Services\NutritionCalculator;
use App\Domain\Pet\Pet;
use App\Domain\Pet\PetSpecies;
use App\Domain\Pet\ActivityLevel;
use App\Domain\Pet\LifeStage;
use App\Domain\Pet\PetGender;
use App\Domain\Nutrition\NutrientRequirement;
use PHPUnit\Framework\TestCase;
use DateTime;

class NutritionCalculatorTest extends TestCase
{
    private NutritionCalculator $calculator;

    protected function setUp(): void
    {
        $this->calculator = new NutritionCalculator();
    }

    public function testCalculateDailyCaloriesForAdultDog(): void
    {
        $pet = new Pet(
            1,
            'Buddy',
            PetSpecies::DOG,
            'Golden Retriever',
            new DateTime('2020-01-01'),
            PetGender::MALE,
            false,
            25.0, // 25kg adult dog
            ActivityLevel::MODERATE,
            LifeStage::ADULT
        );

        $calories = $this->calculator->calculateDailyCalories($pet);

        // Expected: RER = 70 * 25^0.75 ≈ 674, DER = 674 * 1.6 * 1.0 ≈ 1078
        $this->assertGreaterThan(1000, $calories);
        $this->assertLessThan(1200, $calories);
    }

    public function testCalculateDailyCaloriesForPuppy(): void
    {
        $pet = new Pet(
            1,
            'Puppy',
            PetSpecies::DOG,
            'Golden Retriever',
            new DateTime('2023-06-01'),
            PetGender::MALE,
            false,
            10.0, // 10kg puppy
            ActivityLevel::HIGH,
            LifeStage::PUPPY
        );

        $calories = $this->calculator->calculateDailyCalories($pet);

        // Puppies need significantly more calories (2.0x life stage multiplier)
        $this->assertGreaterThan(800, $calories);
        $this->assertLessThan(1200, $calories);
    }

    public function testCalculateDailyCaloriesForCat(): void
    {
        $pet = new Pet(
            1,
            'Whiskers',
            PetSpecies::CAT,
            'Domestic Shorthair',
            new DateTime('2019-01-01'),
            PetGender::FEMALE,
            true,
            4.5, // 4.5kg adult cat
            ActivityLevel::MODERATE,
            LifeStage::ADULT
        );

        $calories = $this->calculator->calculateDailyCalories($pet);

        // Cats have lower energy requirements and neutered adjustment
        $this->assertGreaterThan(200, $calories);
        $this->assertLessThan(400, $calories);
    }

    public function testCalculateDailyCaloriesThrowsExceptionWithoutWeight(): void
    {
        $pet = new Pet(
            1,
            'Buddy',
            PetSpecies::DOG,
            'Golden Retriever',
            new DateTime('2020-01-01'),
            PetGender::MALE,
            false,
            null, // No weight
            ActivityLevel::MODERATE,
            LifeStage::ADULT
        );

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Pet weight is required for calorie calculation');

        $this->calculator->calculateDailyCalories($pet);
    }

    public function testCalculateNutrientRequirementsForDog(): void
    {
        $pet = new Pet(
            1,
            'Buddy',
            PetSpecies::DOG,
            'Golden Retriever',
            new DateTime('2020-01-01'),
            PetGender::MALE,
            false,
            25.0,
            ActivityLevel::MODERATE,
            LifeStage::ADULT
        );

        $requirements = $this->calculator->calculateNutrientRequirements($pet);

        $this->assertInstanceOf(NutrientRequirement::class, $requirements);
        $this->assertGreaterThan(0, $requirements->getDailyCalories());
        $this->assertGreaterThan(0, $requirements->getDailyProteinGrams());
        $this->assertGreaterThan(0, $requirements->getDailyFatGrams());
        $this->assertGreaterThan(0, $requirements->getDailyCarbGrams());
        $this->assertGreaterThan(0, $requirements->getDailyFiberGrams());

        // Check protein percentage is appropriate for adult dog (around 20%)
        $proteinPercentage = $requirements->getProteinPercentage();
        $this->assertGreaterThan(18, $proteinPercentage);
        $this->assertLessThan(25, $proteinPercentage);

        // Check additional nutrients are present
        $additionalNutrients = $requirements->getAdditionalNutrients();
        $this->assertArrayHasKey('calcium', $additionalNutrients);
        $this->assertArrayHasKey('phosphorus', $additionalNutrients);
        $this->assertArrayHasKey('vitamin_a', $additionalNutrients);
    }

    public function testCalculateNutrientRequirementsForKitten(): void
    {
        $pet = new Pet(
            1,
            'Kitten',
            PetSpecies::CAT,
            'Domestic Shorthair',
            new DateTime('2023-06-01'),
            PetGender::FEMALE,
            false,
            2.0,
            ActivityLevel::HIGH,
            LifeStage::KITTEN
        );

        $requirements = $this->calculator->calculateNutrientRequirements($pet);

        // Kittens need higher protein (around 32%)
        $proteinPercentage = $requirements->getProteinPercentage();
        $this->assertGreaterThan(30, $proteinPercentage);
        $this->assertLessThan(35, $proteinPercentage);

        // Check that additional nutrients are scaled for growing kitten
        $additionalNutrients = $requirements->getAdditionalNutrients();
        $this->assertGreaterThan(0, $additionalNutrients['calcium']);
        $this->assertGreaterThan(0, $additionalNutrients['vitamin_a']);
    }

    public function testCalculatePortionSize(): void
    {
        $requirement = new NutrientRequirement(
            1000, // 1000 calories
            50.0, // 50g protein
            22.0, // 22g fat
            100.0, // 100g carbs
            10.0, // 10g fiber
            []
        );

        $portionInfo = $this->calculator->calculatePortionSize($requirement, 400, 2); // 400 cal/cup, 2 meals

        $this->assertEquals(2.5, $portionInfo['cups_per_day']); // 1000/400
        $this->assertEquals(1.25, $portionInfo['cups_per_meal']); // 2.5/2
        $this->assertEquals(300, $portionInfo['grams_per_day']); // 2.5 * 120
        $this->assertEquals(150, $portionInfo['grams_per_meal']); // 300/2
        $this->assertEquals(2, $portionInfo['meals_per_day']);
    }

    public function testAdjustForHealthConditionsObesity(): void
    {
        $baseRequirement = new NutrientRequirement(
            1000,
            50.0,
            22.0,
            100.0,
            10.0,
            ['calcium' => 1000]
        );

        $adjusted = $this->calculator->adjustForHealthConditions($baseRequirement, ['obesity']);

        // Calories should be reduced by 20%
        $this->assertEquals(800, $adjusted->getDailyCalories());
        
        // Fat should be reduced
        $this->assertLessThan($baseRequirement->getDailyFatGrams(), $adjusted->getDailyFatGrams());
        
        // Fiber should be increased
        $this->assertGreaterThan($baseRequirement->getDailyFiberGrams(), $adjusted->getDailyFiberGrams());
    }

    public function testAdjustForHealthConditionsDiabetes(): void
    {
        $baseRequirement = new NutrientRequirement(
            1000,
            50.0,
            22.0,
            100.0,
            10.0,
            []
        );

        $adjusted = $this->calculator->adjustForHealthConditions($baseRequirement, ['diabetes']);

        // Carbs should be reduced
        $this->assertLessThan($baseRequirement->getDailyCarbGrams(), $adjusted->getDailyCarbGrams());
        
        // Protein should be increased
        $this->assertGreaterThan($baseRequirement->getDailyProteinGrams(), $adjusted->getDailyProteinGrams());
        
        // Fiber should be significantly increased
        $this->assertGreaterThan($baseRequirement->getDailyFiberGrams() * 1.5, $adjusted->getDailyFiberGrams());
    }

    public function testAdjustForHealthConditionsKidneyDisease(): void
    {
        $baseRequirement = new NutrientRequirement(
            1000,
            50.0,
            22.0,
            100.0,
            10.0,
            ['phosphorus' => 800, 'sodium' => 500]
        );

        $adjusted = $this->calculator->adjustForHealthConditions($baseRequirement, ['kidney_disease']);

        // Protein should be reduced
        $this->assertLessThan($baseRequirement->getDailyProteinGrams(), $adjusted->getDailyProteinGrams());
        
        // Phosphorus should be significantly reduced
        $this->assertLessThan(400, $adjusted->getAdditionalNutrient('phosphorus'));
        
        // Sodium should be reduced
        $this->assertLessThan(300, $adjusted->getAdditionalNutrient('sodium'));
    }

    public function testGenerateFeedingScheduleStandard(): void
    {
        $schedule = $this->calculator->generateFeedingSchedule(2, 'standard');

        $this->assertCount(2, $schedule);
        $this->assertEquals(1, $schedule[0]['meal_number']);
        $this->assertEquals(2, $schedule[1]['meal_number']);
        $this->assertEquals('08:00', $schedule[0]['time']);
        $this->assertEquals('18:00', $schedule[1]['time']);
        $this->assertEquals(50.0, $schedule[0]['portion_percentage']);
        $this->assertEquals(50.0, $schedule[1]['portion_percentage']);
    }

    public function testGenerateFeedingScheduleThreeMeals(): void
    {
        $schedule = $this->calculator->generateFeedingSchedule(3, 'early_riser');

        $this->assertCount(3, $schedule);
        $this->assertEquals('06:00', $schedule[0]['time']);
        $this->assertEquals('12:00', $schedule[1]['time']);
        $this->assertEquals('18:00', $schedule[2]['time']);
        $this->assertEquals(33.3, $schedule[0]['portion_percentage']);
    }

    public function testGenerateFeedingScheduleNightOwl(): void
    {
        $schedule = $this->calculator->generateFeedingSchedule(2, 'night_owl');

        $this->assertCount(2, $schedule);
        $this->assertEquals('10:00', $schedule[0]['time']);
        $this->assertEquals('20:00', $schedule[1]['time']);
    }

    public function testCalculateDailyCaloriesForSmallPet(): void
    {
        $pet = new Pet(
            1,
            'Tiny',
            PetSpecies::DOG,
            'Chihuahua',
            new DateTime('2020-01-01'),
            PetGender::FEMALE,
            true,
            1.5, // Very small dog
            ActivityLevel::MODERATE,
            LifeStage::ADULT
        );

        $calories = $this->calculator->calculateDailyCalories($pet);

        // Small pets use linear formula: RER = 70 * weight
        // Expected: RER = 70 * 1.5 = 105, DER = 105 * 1.6 * 1.0 * 0.9 (neutered) ≈ 151
        $this->assertGreaterThan(120, $calories);
        $this->assertLessThan(200, $calories);
    }

    public function testCalculateDailyCaloriesForLargePet(): void
    {
        $pet = new Pet(
            1,
            'Giant',
            PetSpecies::DOG,
            'Great Dane',
            new DateTime('2019-01-01'),
            PetGender::MALE,
            false,
            60.0, // Very large dog
            ActivityLevel::MODERATE,
            LifeStage::ADULT
        );

        $calories = $this->calculator->calculateDailyCalories($pet);

        // Large pets use linear formula: RER = 30 * weight + 70
        // Expected: RER = 30 * 60 + 70 = 1870, DER = 1870 * 1.6 * 1.0 ≈ 2992
        $this->assertGreaterThan(2500, $calories);
        $this->assertLessThan(3500, $calories);
    }

    public function testCalculateNutrientRequirementsForRabbit(): void
    {
        $pet = new Pet(
            1,
            'Bunny',
            PetSpecies::RABBIT,
            'Holland Lop',
            new DateTime('2021-01-01'),
            PetGender::FEMALE,
            true,
            2.0,
            ActivityLevel::MODERATE,
            LifeStage::ADULT
        );

        $requirements = $this->calculator->calculateNutrientRequirements($pet);

        // Rabbits need high fiber (20%)
        $fiberPercentage = ($requirements->getDailyFiberGrams() * 4 / $requirements->getDailyCalories()) * 100;
        $this->assertGreaterThan(18, $fiberPercentage);
        $this->assertLessThan(25, $fiberPercentage);

        // Rabbits don't need dietary vitamin D
        $additionalNutrients = $requirements->getAdditionalNutrients();
        $this->assertEquals(0, $additionalNutrients['vitamin_d']);
    }

    public function testMultipleHealthConditionsAdjustment(): void
    {
        $baseRequirement = new NutrientRequirement(
            1000,
            50.0,
            22.0,
            100.0,
            10.0,
            ['sodium' => 500, 'phosphorus' => 800]
        );

        $adjusted = $this->calculator->adjustForHealthConditions(
            $baseRequirement, 
            ['obesity', 'heart_disease']
        );

        // Should apply both obesity and heart disease adjustments
        $this->assertEquals(800, $adjusted->getDailyCalories()); // Obesity reduction
        $this->assertLessThan(200, $adjusted->getAdditionalNutrient('sodium')); // Heart disease sodium reduction
    }
}