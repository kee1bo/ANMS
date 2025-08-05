<?php

declare(strict_types=1);

namespace App\Infrastructure\Repository;

use App\Domain\Nutrition\FoodItem;
use App\Domain\Nutrition\FoodCategory;
use App\Domain\Nutrition\FoodItemRepositoryInterface;
use App\Domain\Nutrition\NutrientRequirement;
use App\Infrastructure\Database\DatabaseManager;

class FoodItemRepository implements FoodItemRepositoryInterface
{
    private DatabaseManager $db;

    public function __construct(DatabaseManager $db)
    {
        $this->db = $db;
    }

    public function findById(int $id): ?FoodItem
    {
        $stmt = $this->db->prepare("
            SELECT * FROM food_items 
            WHERE id = ?
        ");
        $stmt->execute([$id]);
        
        $data = $stmt->fetch();
        return $data ? $this->createFoodItemFromData($data) : null;
    }

    public function findAll(int $limit = 50, int $offset = 0): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM food_items 
            ORDER BY name ASC 
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$limit, $offset]);
        
        $items = [];
        while ($data = $stmt->fetch()) {
            $items[] = $this->createFoodItemFromData($data);
        }
        
        return $items;
    }

    public function findByCategory(FoodCategory $category): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM food_items 
            WHERE category = ? 
            ORDER BY name ASC
        ");
        $stmt->execute([$category->value]);
        
        $items = [];
        while ($data = $stmt->fetch()) {
            $items[] = $this->createFoodItemFromData($data);
        }
        
        return $items;
    }

    public function findBySpecies(string $species): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM food_items 
            WHERE target_species LIKE ? 
            ORDER BY name ASC
        ");
        $stmt->execute(['%' . $species . '%']);
        
        $items = [];
        while ($data = $stmt->fetch()) {
            $items[] = $this->createFoodItemFromData($data);
        }
        
        return $items;
    }

    public function findByLifeStage(string $lifeStage): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM food_items 
            WHERE life_stage LIKE ? 
            ORDER BY name ASC
        ");
        $stmt->execute(['%' . $lifeStage . '%']);
        
        $items = [];
        while ($data = $stmt->fetch()) {
            $items[] = $this->createFoodItemFromData($data);
        }
        
        return $items;
    }

    public function findByNutritionalNeeds(NutrientRequirement $requirement, string $species, string $lifeStage): array
    {
        // Calculate protein percentage from requirement
        $proteinPercentage = $requirement->getProteinPercentage();
        $fatPercentage = $requirement->getFatPercentage();
        
        // Allow for some flexibility in matching (±20%)
        $minProtein = $proteinPercentage * 0.8;
        $maxProtein = $proteinPercentage * 1.2;
        $minFat = $fatPercentage * 0.8;
        $maxFat = $fatPercentage * 1.2;
        
        $stmt = $this->db->prepare("
            SELECT * FROM food_items 
            WHERE target_species LIKE ? 
            AND life_stage LIKE ? 
            AND protein_percentage BETWEEN ? AND ? 
            AND fat_percentage BETWEEN ? AND ? 
            AND availability_status = 'available' 
            ORDER BY ABS(protein_percentage - ?) ASC
        ");
        
        $stmt->execute([
            '%' . $species . '%',
            '%' . $lifeStage . '%',
            $minProtein,
            $maxProtein,
            $minFat,
            $maxFat,
            $proteinPercentage
        ]);
        
        $items = [];
        while ($data = $stmt->fetch()) {
            $items[] = $this->createFoodItemFromData($data);
        }
        
        return $items;
    }

    public function findAllergenFree(array $allergens): array
    {
        if (empty($allergens)) {
            return $this->findAll();
        }
        
        // This is a simplified implementation
        // In a real system, you'd need proper JSON querying
        $stmt = $this->db->prepare("
            SELECT * FROM food_items 
            ORDER BY name ASC
        ");
        $stmt->execute();
        
        $items = [];
        while ($data = $stmt->fetch()) {
            $foodItem = $this->createFoodItemFromData($data);
            $hasAllergen = false;
            
            foreach ($allergens as $allergen) {
                if ($foodItem->containsAllergen($allergen)) {
                    $hasAllergen = true;
                    break;
                }
            }
            
            if (!$hasAllergen) {
                $items[] = $foodItem;
            }
        }
        
        return $items;
    }

    public function create(FoodItem $foodItem): FoodItem
    {
        $stmt = $this->db->prepare("
            INSERT INTO food_items (
                name, brand, category, target_species, life_stage, 
                calories_per_100g, protein_percentage, fat_percentage, 
                fiber_percentage, moisture_percentage, ash_percentage, 
                carbohydrate_percentage, detailed_nutrition, ingredients, 
                feeding_guidelines, aafco_approved, organic_certified, 
                grain_free, allergen_info, price_per_unit, unit_size, 
                availability_status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");

        $targetSpecies = implode(',', $foodItem->getTargetSpecies());
        $lifeStage = implode(',', $foodItem->getLifeStage());
        $detailedNutrition = json_encode($foodItem->getDetailedNutrition());
        $feedingGuidelines = json_encode($foodItem->getFeedingGuidelines());
        $allergenInfo = json_encode($foodItem->getAllergenInfo());

        $stmt->execute([
            $foodItem->getName(),
            $foodItem->getBrand(),
            $foodItem->getCategory()->value,
            $targetSpecies,
            $lifeStage,
            $foodItem->getCaloriesPer100g(),
            $foodItem->getProteinPercentage(),
            $foodItem->getFatPercentage(),
            $foodItem->getFiberPercentage(),
            $foodItem->getMoisturePercentage(),
            $foodItem->getAshPercentage(),
            $foodItem->getCarbohydratePercentage(),
            $detailedNutrition,
            $foodItem->getIngredients(),
            $feedingGuidelines,
            $foodItem->isAafcoApproved() ? 1 : 0,
            $foodItem->isOrganicCertified() ? 1 : 0,
            $foodItem->isGrainFree() ? 1 : 0,
            $allergenInfo,
            $foodItem->getPricePerUnit(),
            $foodItem->getUnitSize(),
            $foodItem->getAvailabilityStatus()->value
        ]);

        $id = (int) $this->db->lastInsertId();
        return $this->findById($id);
    }

    public function update(FoodItem $foodItem): FoodItem
    {
        $stmt = $this->db->prepare("
            UPDATE food_items SET 
                name = ?, brand = ?, category = ?, target_species = ?, 
                life_stage = ?, calories_per_100g = ?, protein_percentage = ?, 
                fat_percentage = ?, fiber_percentage = ?, moisture_percentage = ?, 
                ash_percentage = ?, carbohydrate_percentage = ?, 
                detailed_nutrition = ?, ingredients = ?, feeding_guidelines = ?, 
                aafco_approved = ?, organic_certified = ?, grain_free = ?, 
                allergen_info = ?, price_per_unit = ?, unit_size = ?, 
                availability_status = ?, updated_at = NOW() 
            WHERE id = ?
        ");

        $targetSpecies = implode(',', $foodItem->getTargetSpecies());
        $lifeStage = implode(',', $foodItem->getLifeStage());
        $detailedNutrition = json_encode($foodItem->getDetailedNutrition());
        $feedingGuidelines = json_encode($foodItem->getFeedingGuidelines());
        $allergenInfo = json_encode($foodItem->getAllergenInfo());

        $stmt->execute([
            $foodItem->getName(),
            $foodItem->getBrand(),
            $foodItem->getCategory()->value,
            $targetSpecies,
            $lifeStage,
            $foodItem->getCaloriesPer100g(),
            $foodItem->getProteinPercentage(),
            $foodItem->getFatPercentage(),
            $foodItem->getFiberPercentage(),
            $foodItem->getMoisturePercentage(),
            $foodItem->getAshPercentage(),
            $foodItem->getCarbohydratePercentage(),
            $detailedNutrition,
            $foodItem->getIngredients(),
            $feedingGuidelines,
            $foodItem->isAafcoApproved() ? 1 : 0,
            $foodItem->isOrganicCertified() ? 1 : 0,
            $foodItem->isGrainFree() ? 1 : 0,
            $allergenInfo,
            $foodItem->getPricePerUnit(),
            $foodItem->getUnitSize(),
            $foodItem->getAvailabilityStatus()->value,
            $foodItem->getId()
        ]);

        return $this->findById($foodItem->getId());
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM food_items WHERE id = ?
        ");
        return $stmt->execute([$id]);
    }

    public function search(string $query): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM food_items 
            WHERE name LIKE ? 
            OR brand LIKE ? 
            OR ingredients LIKE ? 
            ORDER BY name ASC 
            LIMIT 50
        ");
        
        $likeParam = '%' . $query . '%';
        $stmt->execute([$likeParam, $likeParam, $likeParam]);
        
        $items = [];
        while ($data = $stmt->fetch()) {
            $items[] = $this->createFoodItemFromData($data);
        }
        
        return $items;
    }

    private function createFoodItemFromData(array $data): FoodItem
    {
        $targetSpecies = isset($data['target_species']) ? 
            explode(',', $data['target_species']) : [];

        $lifeStage = isset($data['life_stage']) ? 
            explode(',', $data['life_stage']) : [];

        $foodItem = new FoodItem(
            $data['name'],
            FoodCategory::from($data['category']),
            $targetSpecies,
            $lifeStage,
            (int) $data['calories_per_100g']
        );

        if (isset($data['id'])) {
            $foodItem->setId((int) $data['id']);
        }

        if (isset($data['brand'])) {
            $foodItem->setBrand($data['brand']);
        }

        $foodItem->setNutritionValues(
            isset($data['protein_percentage']) ? (float) $data['protein_percentage'] : null,
            isset($data['fat_percentage']) ? (float) $data['fat_percentage'] : null,
            isset($data['fiber_percentage']) ? (float) $data['fiber_percentage'] : null,
            isset($data['moisture_percentage']) ? (float) $data['moisture_percentage'] : null,
            isset($data['ash_percentage']) ? (float) $data['ash_percentage'] : null,
            isset($data['carbohydrate_percentage']) ? (float) $data['carbohydrate_percentage'] : null
        );

        if (isset($data['detailed_nutrition'])) {
            $detailedNutrition = is_string($data['detailed_nutrition']) ? 
                json_decode($data['detailed_nutrition'], true) : 
                $data['detailed_nutrition'];
            $foodItem->setDetailedNutrition($detailedNutrition ?: []);
        }

        if (isset($data['ingredients'])) {
            $foodItem->setIngredients($data['ingredients']);
        }

        if (isset($data['feeding_guidelines'])) {
            $feedingGuidelines = is_string($data['feeding_guidelines']) ? 
                json_decode($data['feeding_guidelines'], true) : 
                $data['feeding_guidelines'];
            $foodItem->setFeedingGuidelines($feedingGuidelines ?: []);
        }

        if (isset($data['aafco_approved'])) {
            $foodItem->setAafcoApproved((bool) $data['aafco_approved']);
        }

        if (isset($data['organic_certified'])) {
            $foodItem->setOrganicCertified((bool) $data['organic_certified']);
        }

        if (isset($data['grain_free'])) {
            $foodItem->setGrainFree((bool) $data['grain_free']);
        }

        if (isset($data['allergen_info'])) {
            $allergenInfo = is_string($data['allergen_info']) ? 
                json_decode($data['allergen_info'], true) : 
                $data['allergen_info'];
            $foodItem->setAllergenInfo($allergenInfo ?: []);
        }

        if (isset($data['price_per_unit']) && isset($data['unit_size'])) {
            $foodItem->setPricing(
                $data['price_per_unit'] ? (float) $data['price_per_unit'] : null,
                $data['unit_size']
            );
        }

        if (isset($data['availability_status'])) {
            $foodItem->setAvailabilityStatus(
                AvailabilityStatus::from($data['availability_status'])
            );
        }

        return $foodItem;
    }
}