<?php

declare(strict_types=1);

namespace App\Domain\Nutrition;

interface FoodItemRepositoryInterface
{
    public function findById(int $id): ?FoodItem;
    public function findAll(int $limit = 50, int $offset = 0): array;
    public function findByCategory(FoodCategory $category): array;
    public function findBySpecies(string $species): array;
    public function findByLifeStage(string $lifeStage): array;
    public function findByNutritionalNeeds(NutrientRequirement $requirement, string $species, string $lifeStage): array;
    public function findAllergenFree(array $allergens): array;
    public function create(FoodItem $foodItem): FoodItem;
    public function update(FoodItem $foodItem): FoodItem;
    public function delete(int $id): bool;
    public function search(string $query): array;
}