<?php

declare(strict_types=1);

namespace App\Domain\Health;

use DateTime;

interface HealthRecordRepositoryInterface
{
    public function save(HealthRecord $healthRecord): HealthRecord;
    
    public function findById(int $id): ?HealthRecord;
    
    public function findByPetId(int $petId, ?int $limit = null, ?int $offset = null): array;
    
    public function findByPetIdAndType(int $petId, HealthRecordType $type, ?int $limit = null): array;
    
    public function findByPetIdAndDateRange(
        int $petId, 
        DateTime $startDate, 
        DateTime $endDate,
        ?HealthRecordType $type = null
    ): array;
    
    public function getLatestByPetIdAndType(int $petId, HealthRecordType $type): ?HealthRecord;
    
    public function getWeightHistory(int $petId, ?int $limit = null): array;
    
    public function getBodyConditionHistory(int $petId, ?int $limit = null): array;
    
    public function getActivityHistory(int $petId, ?int $limit = null): array;
    
    public function delete(int $id): bool;
    
    public function deleteByPetId(int $petId): bool;
    
    public function getHealthSummary(int $petId): array;
    
    public function getRecordsByUser(int $userId, ?int $limit = null): array;
}