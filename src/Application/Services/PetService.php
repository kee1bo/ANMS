<?php

declare(strict_types=1);

namespace App\Application\Services;

use App\Domain\Pet\Pet;
use App\Domain\Pet\PetSpecies;
use App\Domain\Pet\PetGender;
use App\Domain\Pet\ActivityLevel;
use App\Domain\Pet\PetRepositoryInterface;
use DateTime;
use InvalidArgumentException;

class PetService
{
    private PetRepositoryInterface $petRepository;

    public function __construct(PetRepositoryInterface $petRepository)
    {
        $this->petRepository = $petRepository;
    }

    public function createPet(int $userId, array $petData): Pet
    {
        $this->validatePetData($petData);

        $pet = new Pet(
            $userId,
            $petData['name'],
            PetSpecies::from($petData['species']),
            $petData['breed'] ?? null,
            isset($petData['date_of_birth']) ? new DateTime($petData['date_of_birth']) : null,
            PetGender::from($petData['gender'] ?? 'unknown'),
            (bool) ($petData['is_neutered'] ?? false)
        );

        // Set optional fields
        if (isset($petData['microchip_id'])) {
            $pet->setMicrochipId($petData['microchip_id']);
        }

        if (isset($petData['current_weight'])) {
            $pet->updateWeight(
                (float) $petData['current_weight'],
                isset($petData['ideal_weight']) ? (float) $petData['ideal_weight'] : null
            );
        }

        if (isset($petData['activity_level'])) {
            $pet->updateActivityLevel(ActivityLevel::from($petData['activity_level']));
        }

        if (isset($petData['body_condition_score'])) {
            $pet->updateBodyConditionScore((int) $petData['body_condition_score']);
        }

        if (isset($petData['health_conditions']) && is_array($petData['health_conditions'])) {
            $pet->updateHealthConditions($petData['health_conditions']);
        }

        if (isset($petData['allergies']) && is_array($petData['allergies'])) {
            $pet->updateAllergies($petData['allergies']);
        }

        if (isset($petData['medications']) && is_array($petData['medications'])) {
            $pet->updateMedications($petData['medications']);
        }

        if (isset($petData['personality_traits']) && is_array($petData['personality_traits'])) {
            $pet->updatePersonalityTraits($petData['personality_traits']);
        }

        if (isset($petData['photo_url'])) {
            $pet->setPhotoUrl($petData['photo_url']);
        }

        if (isset($petData['veterinarian_id'])) {
            $pet->assignVeterinarian((int) $petData['veterinarian_id']);
        }

        return $this->petRepository->create($pet);
    }

    public function updatePet(int $petId, array $petData): Pet
    {
        $pet = $this->petRepository->findById($petId);
        if (!$pet) {
            throw new InvalidArgumentException('Pet not found');
        }

        $this->validatePetData($petData, false);

        // Update basic information
        if (isset($petData['name']) || isset($petData['breed']) || isset($petData['date_of_birth']) || 
            isset($petData['gender']) || isset($petData['is_neutered'])) {
            
            $pet->updateBasicInfo(
                $petData['name'] ?? $pet->getName(),
                $petData['breed'] ?? $pet->getBreed(),
                isset($petData['date_of_birth']) ? new DateTime($petData['date_of_birth']) : $pet->getDateOfBirth(),
                isset($petData['gender']) ? PetGender::from($petData['gender']) : $pet->getGender(),
                isset($petData['is_neutered']) ? (bool) $petData['is_neutered'] : $pet->isNeutered()
            );
        }

        // Update weight information
        if (isset($petData['current_weight'])) {
            $pet->updateWeight(
                (float) $petData['current_weight'],
                isset($petData['ideal_weight']) ? (float) $petData['ideal_weight'] : $pet->getIdealWeight()
            );
        } elseif (isset($petData['ideal_weight'])) {
            $pet->updateWeight(
                $pet->getCurrentWeight() ?? 0,
                (float) $petData['ideal_weight']
            );
        }

        // Update activity level
        if (isset($petData['activity_level'])) {
            $pet->updateActivityLevel(ActivityLevel::from($petData['activity_level']));
        }

        // Update body condition score
        if (isset($petData['body_condition_score'])) {
            $pet->updateBodyConditionScore((int) $petData['body_condition_score']);
        }

        // Update microchip ID
        if (isset($petData['microchip_id'])) {
            $pet->setMicrochipId($petData['microchip_id']);
        }

        // Update photo URL
        if (isset($petData['photo_url'])) {
            $pet->setPhotoUrl($petData['photo_url']);
        }

        // Update veterinarian assignment
        if (isset($petData['veterinarian_id'])) {
            $pet->assignVeterinarian((int) $petData['veterinarian_id']);
        }

        // Update health-related arrays
        if (isset($petData['health_conditions']) && is_array($petData['health_conditions'])) {
            $pet->updateHealthConditions($petData['health_conditions']);
        }

        if (isset($petData['allergies']) && is_array($petData['allergies'])) {
            $pet->updateAllergies($petData['allergies']);
        }

        if (isset($petData['medications']) && is_array($petData['medications'])) {
            $pet->updateMedications($petData['medications']);
        }

        if (isset($petData['personality_traits']) && is_array($petData['personality_traits'])) {
            $pet->updatePersonalityTraits($petData['personality_traits']);
        }

        return $this->petRepository->update($pet);
    }

    public function getPetById(int $petId): ?Pet
    {
        return $this->petRepository->findById($petId);
    }

    public function getPetsByUserId(int $userId): array
    {
        return $this->petRepository->findByUserId($userId);
    }

    public function getPetsByVeterinarianId(int $veterinarianId): array
    {
        return $this->petRepository->findByVeterinarianId($veterinarianId);
    }

    public function deletePet(int $petId): bool
    {
        return $this->petRepository->delete($petId);
    }

    public function findPetByMicrochip(string $microchipId): ?Pet
    {
        return $this->petRepository->findByMicrochipId($microchipId);
    }

    public function getPetsBySpecies(PetSpecies $species): array
    {
        return $this->petRepository->findBySpecies($species);
    }

    public function getUserPetCount(int $userId): int
    {
        return $this->petRepository->countByUserId($userId);
    }

    public function getOverweightPets(): array
    {
        return $this->petRepository->findOverweightPets();
    }

    public function getSeniorPets(): array
    {
        return $this->petRepository->findSeniorPets();
    }

    public function addHealthCondition(int $petId, string $condition): Pet
    {
        $pet = $this->petRepository->findById($petId);
        if (!$pet) {
            throw new InvalidArgumentException('Pet not found');
        }

        $pet->addHealthCondition($condition);
        return $this->petRepository->update($pet);
    }

    public function removeHealthCondition(int $petId, string $condition): Pet
    {
        $pet = $this->petRepository->findById($petId);
        if (!$pet) {
            throw new InvalidArgumentException('Pet not found');
        }

        $pet->removeHealthCondition($condition);
        return $this->petRepository->update($pet);
    }

    public function addAllergy(int $petId, string $allergen): Pet
    {
        $pet = $this->petRepository->findById($petId);
        if (!$pet) {
            throw new InvalidArgumentException('Pet not found');
        }

        $pet->addAllergy($allergen);
        return $this->petRepository->update($pet);
    }

    public function removeAllergy(int $petId, string $allergen): Pet
    {
        $pet = $this->petRepository->findById($petId);
        if (!$pet) {
            throw new InvalidArgumentException('Pet not found');
        }

        $pet->removeAllergy($allergen);
        return $this->petRepository->update($pet);
    }

    public function calculateIdealWeight(Pet $pet): ?float
    {
        // Basic ideal weight calculation based on species and breed
        // This is a simplified version - in reality, this would use more complex algorithms
        
        if (!$pet->getCurrentWeight()) {
            return null;
        }

        $currentWeight = $pet->getCurrentWeight();
        $bodyConditionScore = $pet->getBodyConditionScore();

        if (!$bodyConditionScore) {
            return $currentWeight; // No adjustment without BCS
        }

        // Ideal BCS is 5 for most pets (scale 1-9)
        $idealBCS = 5;
        $adjustment = ($bodyConditionScore - $idealBCS) * 0.1; // 10% per BCS point

        return $currentWeight * (1 - $adjustment);
    }

    private function validatePetData(array $data, bool $isCreate = true): void
    {
        $errors = [];

        // Required field validation for creation
        if ($isCreate) {
            $required = ['name', 'species'];
            
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    $errors[] = "Field '{$field}' is required";
                }
            }
        }

        // Name validation
        if (isset($data['name'])) {
            $name = trim($data['name']);
            if (strlen($name) < 2) {
                $errors[] = 'Pet name must be at least 2 characters long';
            }
            if (strlen($name) > 50) {
                $errors[] = 'Pet name must be no more than 50 characters long';
            }
            if (!preg_match('/^[a-zA-Z0-9\s\-\'\.]+$/', $name)) {
                $errors[] = 'Pet name contains invalid characters';
            }
        }

        // Species validation with specific constraints
        if (isset($data['species'])) {
            $validSpecies = ['dog', 'cat', 'rabbit', 'bird', 'other'];
            if (!in_array($data['species'], $validSpecies)) {
                $errors[] = 'Invalid species selected';
            }
        }

        // Breed validation (species-specific)
        if (isset($data['breed']) && isset($data['species'])) {
            $this->validateBreedForSpecies($data['breed'], $data['species'], $errors);
        }

        // Gender validation
        if (isset($data['gender']) && !in_array($data['gender'], ['male', 'female', 'unknown'])) {
            $errors[] = 'Invalid gender selected';
        }

        // Activity level validation
        if (isset($data['activity_level']) && !in_array($data['activity_level'], ['low', 'moderate', 'high'])) {
            $errors[] = 'Invalid activity level selected';
        }

        // Body condition score validation (species-specific)
        if (isset($data['body_condition_score'])) {
            $this->validateBodyConditionScore($data['body_condition_score'], $data['species'] ?? null, $errors);
        }

        // Weight validation (species-specific)
        if (isset($data['current_weight'])) {
            $this->validateWeight($data['current_weight'], 'current', $data['species'] ?? null, $errors);
        }

        if (isset($data['ideal_weight'])) {
            $this->validateWeight($data['ideal_weight'], 'ideal', $data['species'] ?? null, $errors);
        }

        // Weight consistency validation
        if (isset($data['current_weight']) && isset($data['ideal_weight'])) {
            $this->validateWeightConsistency($data['current_weight'], $data['ideal_weight'], $errors);
        }

        // Date of birth validation (species-specific age limits)
        if (isset($data['date_of_birth'])) {
            $this->validateDateOfBirth($data['date_of_birth'], $data['species'] ?? null, $errors);
        }

        // Microchip ID validation
        if (isset($data['microchip_id']) && !empty($data['microchip_id'])) {
            if (!preg_match('/^[0-9A-Fa-f]{15}$/', $data['microchip_id'])) {
                $errors[] = 'Microchip ID must be 15 alphanumeric characters';
            }
        }

        // Health conditions validation
        if (isset($data['health_conditions']) && is_array($data['health_conditions'])) {
            $this->validateHealthConditions($data['health_conditions'], $data['species'] ?? null, $errors);
        }

        // Allergies validation
        if (isset($data['allergies']) && is_array($data['allergies'])) {
            $this->validateAllergies($data['allergies'], $data['species'] ?? null, $errors);
        }

        // Medications validation
        if (isset($data['medications']) && !empty($data['medications'])) {
            if (strlen($data['medications']) > 1000) {
                $errors[] = 'Medications description is too long (maximum 1000 characters)';
            }
        }

        if (!empty($errors)) {
            throw new InvalidArgumentException('Validation failed: ' . implode(', ', $errors));
        }
    }

    private function validateBreedForSpecies(string $breed, string $species, array &$errors): void
    {
        $speciesBreeds = [
            'dog' => [
                'Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'Bulldog', 'Poodle',
                'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund', 'Siberian Husky',
                'Boxer', 'Border Collie', 'Australian Shepherd', 'Chihuahua', 'Shih Tzu',
                'Boston Terrier', 'Pomeranian', 'Australian Cattle Dog', 'Cocker Spaniel',
                'Mixed Breed', 'Other'
            ],
            'cat' => [
                'Persian', 'Maine Coon', 'British Shorthair', 'Ragdoll', 'Bengal',
                'Abyssinian', 'Birman', 'Oriental Shorthair', 'Siamese', 'American Shorthair',
                'Scottish Fold', 'Sphynx', 'Russian Blue', 'Munchkin', 'Norwegian Forest Cat',
                'Exotic Shorthair', 'Devon Rex', 'Cornish Rex', 'Turkish Angora',
                'Mixed Breed', 'Other'
            ],
            'rabbit' => [
                'Holland Lop', 'Netherland Dwarf', 'Mini Rex', 'Lionhead', 'Dutch',
                'Flemish Giant', 'English Angora', 'New Zealand', 'Californian',
                'Mixed Breed', 'Other'
            ],
            'bird' => [
                'Budgerigar', 'Cockatiel', 'Canary', 'Lovebird', 'Conure',
                'African Grey', 'Macaw', 'Cockatoo', 'Finch', 'Parakeet',
                'Other'
            ],
            'other' => ['Various', 'Unknown']
        ];

        $validBreeds = $speciesBreeds[$species] ?? [];
        if (!empty($validBreeds) && !in_array($breed, $validBreeds) && $breed !== 'Other') {
            $errors[] = "Selected breed '{$breed}' is not typical for {$species}";
        }
    }

    private function validateBodyConditionScore(int $score, ?string $species, array &$errors): void
    {
        $scoreRanges = [
            'dog' => ['min' => 1, 'max' => 9],
            'cat' => ['min' => 1, 'max' => 9],
            'rabbit' => ['min' => 1, 'max' => 5],
            'bird' => ['min' => 1, 'max' => 5],
            'other' => ['min' => 1, 'max' => 9]
        ];

        $range = $scoreRanges[$species] ?? $scoreRanges['other'];
        
        if ($score < $range['min'] || $score > $range['max']) {
            $errors[] = "Body condition score must be between {$range['min']} and {$range['max']} for {$species}";
        }
    }

    private function validateWeight(float $weight, string $type, ?string $species, array &$errors): void
    {
        if ($weight <= 0) {
            $errors[] = ucfirst($type) . ' weight must be positive';
            return;
        }

        $weightRanges = [
            'dog' => ['min' => 0.5, 'max' => 100],
            'cat' => ['min' => 1, 'max' => 15],
            'rabbit' => ['min' => 0.5, 'max' => 10],
            'bird' => ['min' => 0.01, 'max' => 2],
            'other' => ['min' => 0.01, 'max' => 50]
        ];

        $range = $weightRanges[$species] ?? $weightRanges['other'];
        
        if ($weight < $range['min'] || $weight > $range['max']) {
            $errors[] = ucfirst($type) . " weight ({$weight} kg) is outside normal range for {$species} ({$range['min']}-{$range['max']} kg)";
        }
    }

    private function validateWeightConsistency(float $currentWeight, float $idealWeight, array &$errors): void
    {
        $difference = abs($currentWeight - $idealWeight);
        $percentDifference = ($difference / $idealWeight) * 100;
        
        // Allow up to 50% difference between current and ideal weight
        if ($percentDifference > 50) {
            $errors[] = 'Current weight and ideal weight seem inconsistent (difference > 50%)';
        }
    }

    private function validateDateOfBirth(string $dateOfBirth, ?string $species, array &$errors): void
    {
        try {
            $birthDate = new DateTime($dateOfBirth);
            $today = new DateTime();
            
            if ($birthDate > $today) {
                $errors[] = 'Date of birth cannot be in the future';
                return;
            }

            // Check reasonable age limits by species
            $ageInYears = $today->diff($birthDate)->y;
            $maxAges = [
                'dog' => 20,
                'cat' => 25,
                'rabbit' => 12,
                'bird' => 80,
                'other' => 30
            ];

            $maxAge = $maxAges[$species] ?? $maxAges['other'];
            
            if ($ageInYears > $maxAge) {
                $errors[] = "Age ({$ageInYears} years) seems unrealistic for {$species} (max expected: {$maxAge} years)";
            }
        } catch (Exception $e) {
            $errors[] = 'Invalid date format for date of birth';
        }
    }

    private function validateHealthConditions(array $conditions, ?string $species, array &$errors): void
    {
        $speciesConditions = [
            'dog' => [
                'Hip Dysplasia', 'Elbow Dysplasia', 'Heart Disease', 'Diabetes',
                'Arthritis', 'Allergies', 'Skin Conditions', 'Eye Problems',
                'Dental Disease', 'Obesity', 'Cancer', 'Kidney Disease'
            ],
            'cat' => [
                'Kidney Disease', 'Diabetes', 'Hyperthyroidism', 'Heart Disease',
                'Dental Disease', 'Arthritis', 'Urinary Tract Disease', 'Cancer',
                'Respiratory Issues', 'Skin Conditions', 'Eye Problems', 'Obesity'
            ],
            'rabbit' => [
                'Dental Problems', 'GI Stasis', 'Respiratory Issues', 'Parasites',
                'Urinary Sludge', 'Arthritis', 'Cancer', 'Eye Problems'
            ],
            'bird' => [
                'Respiratory Issues', 'Feather Plucking', 'Nutritional Deficiencies',
                'Parasites', 'Egg Binding', 'Liver Disease', 'Kidney Disease'
            ],
            'other' => ['Various conditions']
        ];

        $validConditions = $speciesConditions[$species] ?? $speciesConditions['other'];
        
        foreach ($conditions as $condition) {
            if (!in_array($condition, $validConditions) && $species !== 'other') {
                $errors[] = "Health condition '{$condition}' is not commonly associated with {$species}";
            }
        }
    }

    private function validateAllergies(array $allergies, ?string $species, array &$errors): void
    {
        $speciesAllergies = [
            'dog' => [
                'Chicken', 'Beef', 'Dairy', 'Wheat', 'Corn', 'Soy',
                'Eggs', 'Fish', 'Lamb', 'Pork', 'Environmental Allergens'
            ],
            'cat' => [
                'Fish', 'Chicken', 'Beef', 'Dairy', 'Grains', 'Eggs',
                'Environmental Allergens', 'Flea Allergies', 'Food Additives'
            ],
            'rabbit' => [
                'Certain Vegetables', 'Fruits', 'Pellet Ingredients', 'Hay Types'
            ],
            'bird' => [
                'Certain Seeds', 'Food Additives', 'Environmental Toxins'
            ],
            'other' => ['Various allergens']
        ];

        $validAllergies = $speciesAllergies[$species] ?? $speciesAllergies['other'];
        
        foreach ($allergies as $allergy) {
            if (!in_array($allergy, $validAllergies) && $species !== 'other') {
                $errors[] = "Allergy '{$allergy}' is not commonly associated with {$species}";
            }
        }
    }
}