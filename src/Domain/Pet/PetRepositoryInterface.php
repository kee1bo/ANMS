<?php

declare(strict_types=1);

namespace App\Domain\Pet;

/**
 * Pet Repository Interface
 * Defines the contract for pet data persistence operations
 */
interface PetRepositoryInterface
{
    /**
     * Find a pet by ID
     */
    public function findById(int $id): ?Pet;

    /**
     * Find all pets for a specific user
     */
    public function findByUserId(int $userId, array $filters = [], int $limit = 50, int $offset = 0): array;

    /**
     * Create a new pet
     */
    public function create(Pet $pet): Pet;

    /**
     * Update an existing pet
     */
    public function update(Pet $pet): Pet;

    /**
     * Delete a pet (soft delete)
     */
    public function delete(int $id): bool;

    /**
     * Search pets by name, breed, or species
     */
    public function search(int $userId, string $query, array $filters = []): array;

    /**
     * Count total pets for a user
     */
    public function countByUserId(int $userId, array $filters = []): int;

    /**
     * Get pet with all related data (photos, health conditions, allergies)
     */
    public function findByIdWithRelations(int $id): ?Pet;

    /**
     * Check if user owns the pet
     */
    public function isOwnedByUser(int $petId, int $userId): bool;

    /**
     * Get pets by species
     */
    public function findBySpecies(int $userId, string $species): array;

    /**
     * Get recently updated pets
     */
    public function findRecentlyUpdated(int $userId, int $limit = 10): array;
}