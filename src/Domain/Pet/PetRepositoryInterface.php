<?php

declare(strict_types=1);

namespace App\Domain\Pet;

interface PetRepositoryInterface
{
    public function findById(int $id): ?Pet;
    public function findByUserId(int $userId): array;
    public function findByVeterinarianId(int $veterinarianId): array;
    public function create(Pet $pet): Pet;
    public function update(Pet $pet): Pet;
    public function delete(int $id): bool;
    public function findByMicrochipId(string $microchipId): ?Pet;
    public function findBySpecies(PetSpecies $species): array;
    public function countByUserId(int $userId): int;
    public function findOverweightPets(): array;
    public function findSeniorPets(): array;
}