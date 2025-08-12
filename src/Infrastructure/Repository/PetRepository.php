<?php

declare(strict_types=1);

namespace App\Infrastructure\Repository;

use App\Domain\Pet\Pet;
use App\Domain\Pet\PetRepositoryInterface;
use PDO;
use PDOException;
use InvalidArgumentException;

/**
 * Pet Repository Implementation
 * Handles all database operations for pets using SQLite
 */
class PetRepository implements PetRepositoryInterface
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findById(int $id): ?Pet
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM pets 
                WHERE id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            return $data ? new Pet($data) : null;
        } catch (PDOException $e) {
            throw new \RuntimeException("Failed to find pet by ID: " . $e->getMessage());
        }
    }

    public function findByUserId(int $userId, array $filters = [], int $limit = 50, int $offset = 0): array
    {
        try {
            $sql = "SELECT * FROM pets WHERE user_id = ? AND deleted_at IS NULL";
            $params = [$userId];

            // Apply filters
            if (!empty($filters['species'])) {
                $sql .= " AND species = ?";
                $params[] = $filters['species'];
            }

            if (!empty($filters['breed'])) {
                $sql .= " AND breed LIKE ?";
                $params[] = '%' . $filters['breed'] . '%';
            }

            if (!empty($filters['activity_level'])) {
                $sql .= " AND activity_level = ?";
                $params[] = $filters['activity_level'];
            }

            if (!empty($filters['health_status'])) {
                $sql .= " AND health_status = ?";
                $params[] = $filters['health_status'];
            }

            // Apply sorting
            $orderBy = $filters['sort'] ?? 'name';
            $orderDirection = $filters['order'] ?? 'ASC';
            $validSortFields = ['name', 'species', 'breed', 'age', 'weight', 'created_at', 'updated_at'];
            
            if (in_array($orderBy, $validSortFields)) {
                $sql .= " ORDER BY {$orderBy} {$orderDirection}";
            } else {
                $sql .= " ORDER BY name ASC";
            }

            // Apply pagination
            $sql .= " LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return array_map(fn($data) => new Pet($data), $results);
        } catch (PDOException $e) {
            throw new \RuntimeException("Failed to find pets by user ID: " . $e->getMessage());
        }
    }

    public function create(Pet $pet): Pet
    {
        try {
            $this->pdo->beginTransaction();

            $stmt = $this->pdo->prepare("
                INSERT INTO pets (
                    user_id, name, species, breed, gender, birth_date, weight, ideal_weight,
                    activity_level, body_condition_score, health_status, spay_neuter_status,
                    microchip_id, personality, emergency_contact, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ");

            $stmt->execute([
                $pet->getUserId(),
                $pet->getName(),
                $pet->getSpecies(),
                $pet->getBreed(),
                $pet->getGender(),
                $pet->getBirthDate()?->format('Y-m-d'),
                $pet->getWeight(),
                $pet->getIdealWeight(),
                $pet->getActivityLevel(),
                $pet->getBodyConditionScore(),
                $pet->getHealthStatus(),
                $pet->getSpayNeuterStatus(),
                $pet->getMicrochipId(),
                $pet->getPersonality(),
                $pet->getEmergencyContact()
            ]);

            $petId = (int)$this->pdo->lastInsertId();

            // Log the creation in audit log
            $this->logAuditEntry($petId, $pet->getUserId(), 'created', 'pet_profile', null, 'Pet profile created');

            $this->pdo->commit();

            // Return the created pet with ID
            return $this->findById($petId);
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            throw new \RuntimeException("Failed to create pet: " . $e->getMessage());
        }
    }

    public function update(Pet $pet): Pet
    {
        try {
            $this->pdo->beginTransaction();

            // Get current pet data for audit logging
            $currentPet = $this->findById($pet->getId());
            if (!$currentPet) {
                throw new InvalidArgumentException("Pet not found for update");
            }

            $stmt = $this->pdo->prepare("
                UPDATE pets SET
                    name = ?, species = ?, breed = ?, gender = ?, birth_date = ?, weight = ?,
                    ideal_weight = ?, activity_level = ?, body_condition_score = ?, health_status = ?,
                    spay_neuter_status = ?, microchip_id = ?, personality = ?, emergency_contact = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");

            $stmt->execute([
                $pet->getName(),
                $pet->getSpecies(),
                $pet->getBreed(),
                $pet->getGender(),
                $pet->getBirthDate()?->format('Y-m-d'),
                $pet->getWeight(),
                $pet->getIdealWeight(),
                $pet->getActivityLevel(),
                $pet->getBodyConditionScore(),
                $pet->getHealthStatus(),
                $pet->getSpayNeuterStatus(),
                $pet->getMicrochipId(),
                $pet->getPersonality(),
                $pet->getEmergencyContact(),
                $pet->getId()
            ]);

            // Log significant changes
            $this->logPetChanges($currentPet, $pet);

            $this->pdo->commit();

            return $this->findById($pet->getId());
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            throw new \RuntimeException("Failed to update pet: " . $e->getMessage());
        }
    }

    public function delete(int $id): bool
    {
        try {
            $pet = $this->findById($id);
            if (!$pet) {
                return false;
            }

            $this->pdo->beginTransaction();

            // Soft delete - add deleted_at timestamp
            $stmt = $this->pdo->prepare("
                UPDATE pets SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?
            ");
            $result = $stmt->execute([$id]);

            // Log the deletion
            $this->logAuditEntry($id, $pet->getUserId(), 'deleted', 'pet_profile', 'active', 'deleted');

            $this->pdo->commit();

            return $result && $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            throw new \RuntimeException("Failed to delete pet: " . $e->getMessage());
        }
    }

    public function search(int $userId, string $query, array $filters = []): array
    {
        try {
            $sql = "
                SELECT * FROM pets 
                WHERE user_id = ? AND deleted_at IS NULL
                AND (name LIKE ? OR breed LIKE ? OR species LIKE ?)
            ";
            $params = [$userId, "%{$query}%", "%{$query}%", "%{$query}%"];

            // Apply additional filters
            if (!empty($filters['species'])) {
                $sql .= " AND species = ?";
                $params[] = $filters['species'];
            }

            $sql .= " ORDER BY name ASC LIMIT 20";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return array_map(fn($data) => new Pet($data), $results);
        } catch (PDOException $e) {
            throw new \RuntimeException("Failed to search pets: " . $e->getMessage());
        }
    }

    public function countByUserId(int $userId, array $filters = []): int
    {
        try {
            $sql = "SELECT COUNT(*) FROM pets WHERE user_id = ? AND deleted_at IS NULL";
            $params = [$userId];

            // Apply filters
            if (!empty($filters['species'])) {
                $sql .= " AND species = ?";
                $params[] = $filters['species'];
            }

            if (!empty($filters['health_status'])) {
                $sql .= " AND health_status = ?";
                $params[] = $filters['health_status'];
            }

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);

            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new \RuntimeException("Failed to count pets: " . $e->getMessage());
        }
    }

    public function findByIdWithRelations(int $id): ?Pet
    {
        $pet = $this->findById($id);
        if (!$pet) {
            return null;
        }

        try {
            // Load photos
            $stmt = $this->pdo->prepare("
                SELECT * FROM pet_photos 
                WHERE pet_id = ? 
                ORDER BY is_primary DESC, upload_date DESC
            ");
            $stmt->execute([$id]);
            $photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Load health conditions
            $stmt = $this->pdo->prepare("
                SELECT * FROM pet_health_conditions 
                WHERE pet_id = ? 
                ORDER BY is_active DESC, created_at DESC
            ");
            $stmt->execute([$id]);
            $healthConditions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Load allergies
            $stmt = $this->pdo->prepare("
                SELECT * FROM pet_allergies 
                WHERE pet_id = ? 
                ORDER BY created_at DESC
            ");
            $stmt->execute([$id]);
            $allergies = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Create new pet with relations
            $petData = $pet->toArray();
            $petData['photos'] = $photos;
            $petData['health_conditions'] = $healthConditions;
            $petData['allergies'] = $allergies;

            return new Pet($petData);
        } catch (PDOException $e) {
            throw new \RuntimeException("Failed to load pet relations: " . $e->getMessage());
        }
    }

    public function isOwnedByUser(int $petId, int $userId): bool
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) FROM pets 
                WHERE id = ? AND user_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$petId, $userId]);

            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new \RuntimeException("Failed to check pet ownership: " . $e->getMessage());
        }
    }

    public function findBySpecies(int $userId, string $species): array
    {
        return $this->findByUserId($userId, ['species' => $species]);
    }

    public function findRecentlyUpdated(int $userId, int $limit = 10): array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM pets 
                WHERE user_id = ? AND deleted_at IS NULL
                ORDER BY updated_at DESC 
                LIMIT ?
            ");
            $stmt->execute([$userId, $limit]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return array_map(fn($data) => new Pet($data), $results);
        } catch (PDOException $e) {
            throw new \RuntimeException("Failed to find recently updated pets: " . $e->getMessage());
        }
    }

    private function logAuditEntry(int $petId, int $userId, string $action, string $fieldName = null, string $oldValue = null, string $newValue = null): void
    {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO pet_audit_log (pet_id, user_id, action, field_name, old_value, new_value, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ");
            $stmt->execute([$petId, $userId, $action, $fieldName, $oldValue, $newValue]);
        } catch (PDOException $e) {
            // Log audit failures but don't fail the main operation
            error_log("Failed to log audit entry: " . $e->getMessage());
        }
    }

    private function logPetChanges(Pet $oldPet, Pet $newPet): void
    {
        $changes = [
            'name' => [$oldPet->getName(), $newPet->getName()],
            'weight' => [$oldPet->getWeight(), $newPet->getWeight()],
            'health_status' => [$oldPet->getHealthStatus(), $newPet->getHealthStatus()],
            'activity_level' => [$oldPet->getActivityLevel(), $newPet->getActivityLevel()]
        ];

        foreach ($changes as $field => $values) {
            [$oldValue, $newValue] = $values;
            if ($oldValue !== $newValue) {
                $this->logAuditEntry(
                    $newPet->getId(),
                    $newPet->getUserId(),
                    'updated',
                    $field,
                    (string)$oldValue,
                    (string)$newValue
                );
            }
        }
    }
}