<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Pet;

use App\Domain\Pet\Pet;
use PHPUnit\Framework\TestCase;
use InvalidArgumentException;

class PetTest extends TestCase
{
    private array $validPetData;

    protected function setUp(): void
    {
        $this->validPetData = [
            'id' => 1,
            'user_id' => 1,
            'name' => 'Buddy',
            'species' => 'dog',
            'breed' => 'Golden Retriever',
            'gender' => 'male',
            'birth_date' => '2020-01-15',
            'weight' => 25.5,
            'ideal_weight' => 24.0,
            'activity_level' => 'medium',
            'body_condition_score' => 5,
            'health_status' => 'healthy',
            'spay_neuter_status' => 'neutered',
            'microchip_id' => '982000123456789',
            'personality' => 'Friendly and energetic',
            'emergency_contact' => 'City Vet - (555) 123-4567',
            'created_at' => '2024-01-01 10:00:00',
            'updated_at' => '2024-01-01 10:00:00'
        ];
    }

    public function testCreateValidPet(): void
    {
        $pet = new Pet($this->validPetData);

        $this->assertEquals(1, $pet->getId());
        $this->assertEquals(1, $pet->getUserId());
        $this->assertEquals('Buddy', $pet->getName());
        $this->assertEquals('dog', $pet->getSpecies());
        $this->assertEquals('Golden Retriever', $pet->getBreed());
        $this->assertEquals('male', $pet->getGender());
        $this->assertEquals(25.5, $pet->getWeight());
        $this->assertEquals(24.0, $pet->getIdealWeight());
        $this->assertEquals('medium', $pet->getActivityLevel());
        $this->assertEquals(5, $pet->getBodyConditionScore());
        $this->assertEquals('healthy', $pet->getHealthStatus());
        $this->assertEquals('neutered', $pet->getSpayNeuterStatus());
    }

    public function testAgeCalculation(): void
    {
        $pet = new Pet($this->validPetData);
        
        // Pet born in 2020, should be around 4-5 years old
        $this->assertGreaterThanOrEqual(4, $pet->getAge());
        $this->assertLessThanOrEqual(5, $pet->getAge());
    }

    public function testWeightStatus(): void
    {
        // Normal weight
        $pet = new Pet($this->validPetData);
        $this->assertEquals('normal', $pet->getWeightStatus());
        $this->assertFalse($pet->isOverweight());
        $this->assertFalse($pet->isUnderweight());

        // Overweight
        $overweightData = $this->validPetData;
        $overweightData['weight'] = 30.0; // 25% over ideal weight
        $overweightPet = new Pet($overweightData);
        $this->assertEquals('overweight', $overweightPet->getWeightStatus());
        $this->assertTrue($overweightPet->isOverweight());

        // Underweight
        $underweightData = $this->validPetData;
        $underweightData['weight'] = 18.0; // 25% under ideal weight
        $underweightPet = new Pet($underweightData);
        $this->assertEquals('underweight', $underweightPet->getWeightStatus());
        $this->assertTrue($underweightPet->isUnderweight());
    }

    public function testHealthSummary(): void
    {
        $petData = $this->validPetData;
        $petData['health_conditions'] = [
            ['condition_name' => 'Arthritis', 'is_active' => true],
            ['condition_name' => 'Old injury', 'is_active' => false]
        ];
        $petData['allergies'] = [
            ['allergen' => 'Chicken'],
            ['allergen' => 'Dust']
        ];

        $pet = new Pet($petData);
        $summary = $pet->getHealthSummary();

        $this->assertEquals(1, $summary['active_conditions']);
        $this->assertEquals(2, $summary['total_conditions']);
        $this->assertEquals(2, $summary['allergies']);
        $this->assertEquals('healthy', $summary['health_status']);
    }

    public function testInvalidName(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Pet name cannot be empty');

        $invalidData = $this->validPetData;
        $invalidData['name'] = '';
        new Pet($invalidData);
    }

    public function testInvalidSpecies(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid species');

        $invalidData = $this->validPetData;
        $invalidData['species'] = 'dragon';
        new Pet($invalidData);
    }

    public function testInvalidWeight(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Weight must be positive');

        $invalidData = $this->validPetData;
        $invalidData['weight'] = -5.0;
        new Pet($invalidData);
    }

    public function testInvalidActivityLevel(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid activity level');

        $invalidData = $this->validPetData;
        $invalidData['activity_level'] = 'extreme';
        new Pet($invalidData);
    }

    public function testInvalidBodyConditionScore(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Body condition score must be between 1 and 9');

        $invalidData = $this->validPetData;
        $invalidData['body_condition_score'] = 15;
        new Pet($invalidData);
    }

    public function testFutureBirthDate(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Birth date cannot be in the future');

        $invalidData = $this->validPetData;
        $invalidData['birth_date'] = date('Y-m-d', strtotime('+1 year'));
        new Pet($invalidData);
    }

    public function testToArray(): void
    {
        $pet = new Pet($this->validPetData);
        $array = $pet->toArray();

        $this->assertIsArray($array);
        $this->assertEquals('Buddy', $array['name']);
        $this->assertEquals('dog', $array['species']);
        $this->assertArrayHasKey('health_summary', $array);
        $this->assertArrayHasKey('weight_status', $array);
        $this->assertArrayHasKey('primary_photo', $array);
    }

    public function testGetValidEnums(): void
    {
        $species = Pet::getValidSpecies();
        $this->assertContains('dog', $species);
        $this->assertContains('cat', $species);

        $genders = Pet::getValidGenders();
        $this->assertContains('male', $genders);
        $this->assertContains('female', $genders);

        $activityLevels = Pet::getValidActivityLevels();
        $this->assertContains('low', $activityLevels);
        $this->assertContains('medium', $activityLevels);
        $this->assertContains('high', $activityLevels);
    }

    public function testMinimalPetData(): void
    {
        $minimalData = [
            'user_id' => 1,
            'name' => 'Test Pet',
            'species' => 'cat',
            'weight' => 4.5
        ];

        $pet = new Pet($minimalData);
        
        $this->assertEquals('Test Pet', $pet->getName());
        $this->assertEquals('cat', $pet->getSpecies());
        $this->assertEquals(4.5, $pet->getWeight());
        $this->assertEquals('medium', $pet->getActivityLevel()); // default
        $this->assertEquals('healthy', $pet->getHealthStatus()); // default
        $this->assertNull($pet->getBreed());
        $this->assertNull($pet->getGender());
    }
}