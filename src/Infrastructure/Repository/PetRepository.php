<?php

declare(strict_types=1);

namespace App\Infrastructure\Repository;

use App\Domain\Pet\Pet;
use App\Domain\Pet\PetSpecies;
use App\Domain\Pet\PetRepositoryInterface;
use App\Infrastructure\Database\DatabaseManager;
use App\Infrastructure\Database\QueryOptimizer;
use App\Infrastructure\Cache\CacheManager;

class PetRepository implements PetRepositoryInterface
{
    private DatabaseManager $db;
    private QueryOptimizer $queryOptimizer;
    private CacheManager $cache;

    public function __construct(
        DatabaseManager $db,
        QueryOptimizer $queryOptimizer,
        CacheManager $cache
    ) {
        $this->db = $db;
        $this->queryOptimizer = $queryOptimizer;
        $this->cache = $cache;
    }

    public function findById(int $id): ?Pet
    {
        $cacheKey = "pet:{$id}";
        
        return $this->cache->remember($cacheKey, function () use ($id) {
            $sql = "SELECT * FROM pets WHERE id = ? AND deleted_at IS NULL";
            $stmt = $this->queryOptimizer->executeQuery($sql, [$id]);
            
            $data = $stmt->fetch();
            return $data ? Pet::fromArray($data) : null;
        }, 3600); // Cache for 1 hour
    }

    public function findByUserId(int $userId): array
    {
        $cacheKey = "pets:user:{$userId}";
        
        return $this->cache->remember($cacheKey, function () use ($userId) {
            $sql = "SELECT * FROM pets WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC";
            $stmt = $this->queryOptimizer->executeQuery($sql, [$userId]);
            
            $pets = [];
            while ($data = $stmt->fetch()) {
                $pets[] = Pet::fromArray($data);
            }
            
            return $pets;
        }, 1800); // Cache for 30 minutes
    }

    public function findByVeterinarianId(int $veterinarianId): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM pets 
            WHERE veterinarian_id = ? AND deleted_at IS NULL 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$veterinarianId]);
        
        $pets = [];
        while ($data = $stmt->fetch()) {
            $pets[] = Pet::fromArray($data);
        }
        
        return $pets;
    }

    public function create(Pet $pet): Pet
    {
        $sql = "INSERT INTO pets (
            user_id, name, species, breed, date_of_birth, gender, 
            is_neutered, microchip_id, current_weight, ideal_weight, 
            activity_level, body_condition_score, health_conditions, 
            allergies, medications, personality_traits, photo_url, 
            veterinarian_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";

        $dateOfBirth = $pet->getDateOfBirth()?->format('Y-m-d');
        $healthConditions = json_encode($pet->getHealthConditions());
        $allergies = json_encode($pet->getAllergies());
        $medications = json_encode($pet->getMedications());
        $personalityTraits = json_encode($pet->getPersonalityTraits());

        $params = [
            $pet->getUserId(),
            $pet->getName(),
            $pet->getSpecies()->value,
            $pet->getBreed(),
            $dateOfBirth,
            $pet->getGender()->value,
            $pet->isNeutered() ? 1 : 0,
            $pet->getMicrochipId(),
            $pet->getCurrentWeight(),
            $pet->getIdealWeight(),
            $pet->getActivityLevel()->value,
            $pet->getBodyConditionScore(),
            $healthConditions,
            $allergies,
            $medications,
            $personalityTraits,
            $pet->getPhotoUrl(),
            $pet->getVeterinarianId()
        ];

        $stmt = $this->queryOptimizer->executeQuery($sql, $params);
        $id = (int) $this->db->lastInsertId();
        
        // Invalidate related caches
        $this->cache->delete("pets:user:{$pet->getUserId()}");
        
        return $this->findById($id);
    }

    public function update(Pet $pet): Pet
    {
        $sql = "UPDATE pets SET 
            name = ?, species = ?, breed = ?, date_of_birth = ?, 
            gender = ?, is_neutered = ?, microchip_id = ?, 
            current_weight = ?, ideal_weight = ?, activity_level = ?, 
            body_condition_score = ?, health_conditions = ?, 
            allergies = ?, medications = ?, personality_traits = ?, 
            photo_url = ?, veterinarian_id = ?, updated_at = NOW()
        WHERE id = ?";

        $dateOfBirth = $pet->getDateOfBirth()?->format('Y-m-d');
        $healthConditions = json_encode($pet->getHealthConditions());
        $allergies = json_encode($pet->getAllergies());
        $medications = json_encode($pet->getMedications());
        $personalityTraits = json_encode($pet->getPersonalityTraits());

        $params = [
            $pet->getName(),
            $pet->getSpecies()->value,
            $pet->getBreed(),
            $dateOfBirth,
            $pet->getGender()->value,
            $pet->isNeutered() ? 1 : 0,
            $pet->getMicrochipId(),
            $pet->getCurrentWeight(),
            $pet->getIdealWeight(),
            $pet->getActivityLevel()->value,
            $pet->getBodyConditionScore(),
            $healthConditions,
            $allergies,
            $medications,
            $personalityTraits,
            $pet->getPhotoUrl(),
            $pet->getVeterinarianId(),
            $pet->getId()
        ];

        $stmt = $this->queryOptimizer->executeQuery($sql, $params);
        
        // Invalidate related caches
        $this->cache->delete("pet:{$pet->getId()}");
        $this->cache->delete("pets:user:{$pet->getUserId()}");

        return $this->findById($pet->getId());
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("
            UPDATE pets SET deleted_at = NOW() WHERE id = ?
        ");
        return $stmt->execute([$id]);
    }

    public function findByMicrochipId(string $microchipId): ?Pet
    {
        $stmt = $this->db->prepare("
            SELECT * FROM pets 
            WHERE microchip_id = ? AND deleted_at IS NULL
        ");
        $stmt->execute([$microchipId]);
        
        $data = $stmt->fetch();
        return $data ? Pet::fromArray($data) : null;
    }

    public function findBySpecies(PetSpecies $species): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM pets 
            WHERE species = ? AND deleted_at IS NULL 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$species->value]);
        
        $pets = [];
        while ($data = $stmt->fetch()) {
            $pets[] = Pet::fromArray($data);
        }
        
        return $pets;
    }

    public function countByUserId(int $userId): int
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM pets 
            WHERE user_id = ? AND deleted_at IS NULL
        ");
        $stmt->execute([$userId]);
        
        return (int) $stmt->fetchColumn();
    }

    public function findOverweightPets(): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM pets 
            WHERE current_weight > (ideal_weight * 1.1) 
            AND current_weight IS NOT NULL 
            AND ideal_weight IS NOT NULL 
            AND deleted_at IS NULL 
            ORDER BY (current_weight / ideal_weight) DESC
        ");
        $stmt->execute();
        
        $pets = [];
        while ($data = $stmt->fetch()) {
            $pets[] = Pet::fromArray($data);
        }
        
        return $pets;
    }

    public function findSeniorPets(): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM pets 
            WHERE date_of_birth IS NOT NULL 
            AND (
                (species = 'dog' AND DATEDIFF(NOW(), date_of_birth) >= 2555) OR
                (species = 'cat' AND DATEDIFF(NOW(), date_of_birth) >= 2555) OR
                (species IN ('rabbit', 'bird', 'other') AND DATEDIFF(NOW(), date_of_birth) >= 1825)
            )
            AND deleted_at IS NULL 
            ORDER BY date_of_birth ASC
        ");
        $stmt->execute();
        
        $pets = [];
        while ($data = $stmt->fetch()) {
            $pets[] = Pet::fromArray($data);
        }
        
        return $pets;
    }
}