<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Services;

use App\Application\Services\FoodRecommendationService;
use App\Application\Services\NutritionCalculator;
use App\Domain\Pet\Pet;
use App\Domain\Pet\PetSpecies;
use App\Domain\Pet\ActivityLevel;
use App\Domain\Pet\LifeStage;
use App\Domain\Pet\PetGender;
use App\Domain\Nutrition\FoodItem;
use App\Domain\Nutrition\FoodCategory;
use App\Domain\Nutrition\AvailabilityStatus;
use App\Domain\Nutrition\FoodItemRepositoryInterface;
use App\Domain\Nutrition\NutrientRequirement;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;
use DateTime;

class FoodRecommendationServiceTest extends TestCase
{
    private FoodRecommendationService $service;
    private MockObject $foodItemRepository;
    private MockObject $nutritionCalculator;

    protected function setUp(): void
    {
        $this->foodItemRepository = $this->createMock(FoodItemRepositoryInterface::class);
        $this->nutritionCalculator = $this->createMock(NutritionCalculator::class);
        
        $this->service = new FoodRecommendationService(
            $this->foodItemRepository,
            $this->nutritionCalculator
        );
    }

    public function testGetRecommendationsForPet(): void
    {
        $pet = $this->createTestPet();
        $nutrientRequirement = $this->createTestNutrientRequirement();
        
        $this->nutritionCalculator
            ->expects($this->once())
            ->method('calculateNutrientRequirements')
            ->with($pet)
            ->willReturn($nutrientRequirement);

        $foodItems = [$this->createTestFoodItem()];
        
        $this->foodItemRepository
            ->expects($this->once())
            ->method('findByNutritionalNeeds')
            ->with($nutrientRequirement, 'dog', 'adult')
            ->willReturn($foodItems);

        $recommendations = $this->service->getRecommendationsForPet($pet);

        $this->assertIsArray($recommendations);
        $this->assertCount(1, $recommendations);
        $this->assertArrayHasKey('food', $recommendations[0]);
        $this->assertArrayHasKey('score', $recommendations[0]);
        $this->assertArrayHasKey('match_reasons', $recommendations[0]);
        $this->assertArrayHasKey('portion_info', $recommendations[0]);
        $this->assertArrayHasKey('nutritional_analysis', $recommendations[0]);
    }

    public function testGetRecommendationsByRequirementWithPreferences(): void
    {
        $nutrientRequirement = $this->createTestNutrientRequirement();
        $preferences = [
            'categories' => ['dry_kibble'],
            'grain_free' => true,
            'limit' => 5
        ];

        $grainFreeFoodItem = $this->createTestFoodItem();
        $grainFreeFoodItem->setGrainFree(true);
        
        $regularFoodItem = $this->createTestFoodItem();
        $regularFoodItem->setGrainFree(false);

        $foodItems = [$grainFreeFoodItem, $regularFoodItem];
        
        $this->foodItemRepository
            ->expects($this->once())
            ->method('findByNutritionalNeeds')
            ->willReturn($foodItems);

        $recommendations = $this->service->getRecommendationsByRequirement(
            $nutrientRequirement,
            'dog',
            'adult',
            $preferences
        );

        // Should only return grain-free food
        $this->assertCount(1, $recommendations);
        $this->assertTrue($recommendations[0]['food']->isGrainFree());
    }

    public function testGetRecommendationsWithBrandPreference(): void
    {
        $nutrientRequirement = $this->createTestNutrientRequirement();
        $preferences = [
            'brands' => ['Premium Brand'],
            'preferred_brands' => ['Premium Brand']
        ];

        $preferredBrandFood = $this->createTestFoodItem();
        $preferredBrandFood->setBrand('Premium Brand');
        
        $otherBrandFood = $this->createTestFoodItem();
        $otherBrandFood->setBrand('Other Brand');

        $foodItems = [$preferredBrandFood, $otherBrandFood];
        
        $this->foodItemRepository
            ->expects($this->once())
            ->method('findByNutritionalNeeds')
            ->willReturn($foodItems);

        $recommendations = $this->service->getRecommendationsByRequirement(
            $nutrientRequirement,
            'dog',
            'adult',
            $preferences
        );

        // Should only return preferred brand and it should have higher score
        $this->assertCount(1, $recommendations);
        $this->assertEquals('Premium Brand', $recommendations[0]['food']->getBrand());
        $this->assertContains('Preferred brand', $recommendations[0]['match_reasons']);
    }

    public function testGetRecommendationsWithAllergenAvoidance(): void
    {
        $nutrientRequirement = $this->createTestNutrientRequirement();
        $preferences = [
            'avoid_allergens' => ['chicken', 'wheat']
        ];

        $safeFood = $this->createTestFoodItem();
        $safeFood->setAllergenInfo(['beef']);
        
        $allergenicFood = $this->createTestFoodItem();
        $allergenicFood->setAllergenInfo(['chicken', 'rice']);

        $foodItems = [$safeFood, $allergenicFood];
        
        $this->foodItemRepository
            ->expects($this->once())
            ->method('findByNutritionalNeeds')
            ->willReturn($foodItems);

        $recommendations = $this->service->getRecommendationsByRequirement(
            $nutrientRequirement,
            'dog',
            'adult',
            $preferences
        );

        // Should only return safe food
        $this->assertCount(1, $recommendations);
        $this->assertNotContains('chicken', $recommendations[0]['food']->getAllergenInfo());
    }

    public function testGetRecommendationsWithPriceFilter(): void
    {
        $nutrientRequirement = $this->createTestNutrientRequirement();
        $preferences = [
            'max_price' => 50.0
        ];

        $affordableFood = $this->createTestFoodItem();
        $affordableFood->setPricing(45.0, '15kg');
        
        $expensiveFood = $this->createTestFoodItem();
        $expensiveFood->setPricing(75.0, '15kg');

        $foodItems = [$affordableFood, $expensiveFood];
        
        $this->foodItemRepository
            ->expects($this->once())
            ->method('findByNutritionalNeeds')
            ->willReturn($foodItems);

        $recommendations = $this->service->getRecommendationsByRequirement(
            $nutrientRequirement,
            'dog',
            'adult',
            $preferences
        );

        // Should only return affordable food
        $this->assertCount(1, $recommendations);
        $this->assertLessThanOrEqual(50.0, $recommendations[0]['food']->getPricePerUnit());
    }

    public function testNutritionalScoring(): void
    {
        $nutrientRequirement = new NutrientRequirement(
            1000, // 1000 calories
            50.0, // 20% protein (50g * 4 cal/g = 200 cal = 20%)
            22.2, // 8% fat (22.2g * 9 cal/g = 200 cal = 20%)
            100.0, // carbs
            10.0, // fiber
            []
        );

        // Perfect match food
        $perfectFood = $this->createTestFoodItem();
        $perfectFood->setNutritionValues(20.0, 8.0, 4.0, 10.0, 5.0, 53.0); // Perfect protein and fat match
        $perfectFood->setAafcoApproved(true);

        // Poor match food
        $poorFood = $this->createTestFoodItem();
        $poorFood->setNutritionValues(35.0, 15.0, 4.0, 10.0, 5.0, 31.0); // High protein and fat
        $poorFood->setAafcoApproved(false);

        $foodItems = [$perfectFood, $poorFood];
        
        $this->foodItemRepository
            ->expects($this->once())
            ->method('findByNutritionalNeeds')
            ->willReturn($foodItems);

        $recommendations = $this->service->getRecommendationsByRequirement(
            $nutrientRequirement,
            'dog',
            'adult'
        );

        // Perfect match should score higher
        $this->assertCount(2, $recommendations);
        $this->assertGreaterThan($recommendations[1]['score'], $recommendations[0]['score']);
        $this->assertContains('Excellent protein match', $recommendations[0]['match_reasons']);
        $this->assertContains('AAFCO approved for complete nutrition', $recommendations[0]['match_reasons']);
    }

    public function testPortionCalculation(): void
    {
        $nutrientRequirement = new NutrientRequirement(1000, 50.0, 22.0, 100.0, 10.0, []);
        
        $foodItem = $this->createTestFoodItem();
        // 400 calories per 100g
        
        $this->foodItemRepository
            ->expects($this->once())
            ->method('findByNutritionalNeeds')
            ->willReturn([$foodItem]);

        $recommendations = $this->service->getRecommendationsByRequirement(
            $nutrientRequirement,
            'dog',
            'adult'
        );

        $portionInfo = $recommendations[0]['portion_info'];
        
        // 1000 calories / 400 calories per 100g = 250g per day
        $this->assertEquals(250, $portionInfo['daily_grams']);
        
        // 250g / 120g per cup = 2.08 cups per day
        $this->assertEquals(2.08, $portionInfo['daily_cups']);
        
        // For 2 meals: 125g per meal
        $this->assertEquals(125, $portionInfo['meals'][2]['grams_per_meal']);
    }

    public function testGetAlternatives(): void
    {
        $pet = $this->createTestPet();
        $currentFood = $this->createTestFoodItem();
        $currentFood->setId(1);
        
        $nutrientRequirement = $this->createTestNutrientRequirement();
        
        $this->nutritionCalculator
            ->expects($this->once())
            ->method('calculateNutrientRequirements')
            ->with($pet)
            ->willReturn($nutrientRequirement);

        $alternative1 = $this->createTestFoodItem();
        $alternative1->setId(2);
        $alternative1->setNutritionValues(22.0, 8.0, 4.0, 10.0, 5.0, 51.0);
        
        $alternative2 = $this->createTestFoodItem();
        $alternative2->setId(3);
        $alternative2->setNutritionValues(18.0, 6.0, 4.0, 10.0, 5.0, 57.0);

        $alternatives = [$currentFood, $alternative1, $alternative2]; // Include current food to test filtering
        
        $this->foodItemRepository
            ->expects($this->once())
            ->method('findByCategory')
            ->with($currentFood->getCategory())
            ->willReturn($alternatives);

        $result = $this->service->getAlternatives($currentFood, $pet, 5);

        // Should exclude current food and return alternatives
        $this->assertCount(2, $result);
        $this->assertNotEquals(1, $result[0]['food']->getId());
        $this->assertNotEquals(1, $result[1]['food']->getId());
    }

    public function testNutritionalAnalysis(): void
    {
        $nutrientRequirement = new NutrientRequirement(1000, 50.0, 22.0, 100.0, 10.0, []);
        
        // Excellent match food
        $excellentFood = $this->createTestFoodItem();
        $excellentFood->setNutritionValues(20.0, 8.0, 4.0, 10.0, 5.0, 53.0);
        
        $this->foodItemRepository
            ->expects($this->once())
            ->method('findByNutritionalNeeds')
            ->willReturn([$excellentFood]);

        $recommendations = $this->service->getRecommendationsByRequirement(
            $nutrientRequirement,
            'dog',
            'adult'
        );

        $analysis = $recommendations[0]['nutritional_analysis'];
        
        $this->assertEquals('excellent', $analysis['overall_match']);
        $this->assertEquals('excellent', $analysis['protein_analysis']);
        $this->assertEquals('excellent', $analysis['fat_analysis']);
        $this->assertEmpty($analysis['recommendations']); // No recommendations needed for perfect match
    }

    private function createTestPet(): Pet
    {
        return new Pet(
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
    }

    private function createTestNutrientRequirement(): NutrientRequirement
    {
        return new NutrientRequirement(
            1000, // calories
            50.0, // protein grams
            22.0, // fat grams
            100.0, // carb grams
            10.0, // fiber grams
            ['calcium' => 1000, 'phosphorus' => 800]
        );
    }

    private function createTestFoodItem(): FoodItem
    {
        $foodItem = new FoodItem(
            'Premium Dog Food',
            FoodCategory::DRY_KIBBLE,
            ['dog'],
            ['adult'],
            400 // calories per 100g
        );
        
        $foodItem->setBrand('Test Brand');
        $foodItem->setNutritionValues(20.0, 8.0, 4.0, 10.0, 5.0, 53.0);
        $foodItem->setAafcoApproved(true);
        $foodItem->setAvailabilityStatus(AvailabilityStatus::AVAILABLE);
        
        return $foodItem;
    }
}