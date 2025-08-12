<?php

declare(strict_types=1);

namespace App\Infrastructure\Repository;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Photo Repository
 * Handles database operations for pet photos
 */
class PhotoRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Save photo metadata to database
     */
    public function create(int $petId, array $photoData): array
    {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO pet_photos (
                    pet_id, filename, original_filename, file_size, mime_type, is_primary, upload_date
                ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ");

            $stmt->execute([
                $petId,
                $photoData['filename'],
                $photoData['original_filename'],
                $photoData['file_size'],
                $photoData['mime_type'],
                $photoData['is_primary'] ?? false
            ]);

            $photoId = (int)$this->pdo->lastInsertId();
            return $this->findById($photoId);
        } catch (PDOException $e) {
            throw new RuntimeException("Failed to save photo metadata: " . $e->getMessage());
        }
    }

    /**
     * Find photo by ID
     */
    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM pet_photos WHERE id = ?
            ");
            $stmt->execute([$id]);
            
            $photo = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$photo) {
                return null;
            }

            return $this->addUrls($photo);
        } catch (PDOException $e) {
            throw new RuntimeException("Failed to find photo: " . $e->getMessage());
        }
    }

    /**
     * Find all photos for a pet
     */
    public function findByPetId(int $petId): array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM pet_photos 
                WHERE pet_id = ? 
                ORDER BY is_primary DESC, upload_date DESC
            ");
            $stmt->execute([$petId]);
            
            $photos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return array_map([$this, 'addUrls'], $photos);
        } catch (PDOException $e) {
            throw new RuntimeException("Failed to find photos for pet: " . $e->getMessage());
        }
    }

    /**
     * Set a photo as primary (and unset others)
     */
    public function setPrimary(int $photoId, int $petId): bool
    {
        try {
            $this->pdo->beginTransaction();

            // Unset all primary photos for this pet
            $stmt = $this->pdo->prepare("
                UPDATE pet_photos SET is_primary = FALSE WHERE pet_id = ?
            ");
            $stmt->execute([$petId]);

            // Set the specified photo as primary
            $stmt = $this->pdo->prepare("
                UPDATE pet_photos SET is_primary = TRUE WHERE id = ? AND pet_id = ?
            ");
            $result = $stmt->execute([$photoId, $petId]);

            $this->pdo->commit();
            return $result && $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            throw new RuntimeException("Failed to set primary photo: " . $e->getMessage());
        }
    }

    /**
     * Delete a photo
     */
    public function delete(int $id): ?array
    {
        try {
            // Get photo data before deletion
            $photo = $this->findById($id);
            if (!$photo) {
                return null;
            }

            $stmt = $this->pdo->prepare("DELETE FROM pet_photos WHERE id = ?");
            $stmt->execute([$id]);

            return $photo;
        } catch (PDOException $e) {
            throw new RuntimeException("Failed to delete photo: " . $e->getMessage());
        }
    }

    /**
     * Check if user owns the photo (through pet ownership)
     */
    public function isOwnedByUser(int $photoId, int $userId): bool
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) FROM pet_photos pp
                JOIN pets p ON pp.pet_id = p.id
                WHERE pp.id = ? AND p.user_id = ? AND p.deleted_at IS NULL
            ");
            $stmt->execute([$photoId, $userId]);

            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new RuntimeException("Failed to check photo ownership: " . $e->getMessage());
        }
    }

    /**
     * Get primary photo for a pet
     */
    public function getPrimaryPhoto(int $petId): ?array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM pet_photos 
                WHERE pet_id = ? AND is_primary = TRUE
                LIMIT 1
            ");
            $stmt->execute([$petId]);
            
            $photo = $stmt->fetch(PDO::FETCH_ASSOC);
            return $photo ? $this->addUrls($photo) : null;
        } catch (PDOException $e) {
            throw new RuntimeException("Failed to get primary photo: " . $e->getMessage());
        }
    }

    /**
     * Count photos for a pet
     */
    public function countByPetId(int $petId): int
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) FROM pet_photos WHERE pet_id = ?
            ");
            $stmt->execute([$petId]);

            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new RuntimeException("Failed to count photos: " . $e->getMessage());
        }
    }

    /**
     * Clean up orphaned photos (photos without pets)
     */
    public function cleanupOrphanedPhotos(): int
    {
        try {
            $stmt = $this->pdo->prepare("
                DELETE FROM pet_photos 
                WHERE pet_id NOT IN (SELECT id FROM pets WHERE deleted_at IS NULL)
            ");
            $stmt->execute();

            return $stmt->rowCount();
        } catch (PDOException $e) {
            throw new RuntimeException("Failed to cleanup orphaned photos: " . $e->getMessage());
        }
    }

    /**
     * Add URL fields to photo data
     */
    private function addUrls(array $photo): array
    {
        $photo['url'] = '/storage/pet-photos/' . $photo['filename'];
        $photo['thumbnail_url'] = '/storage/pet-photos/thumbnails/' . $photo['filename'];
        return $photo;
    }
}