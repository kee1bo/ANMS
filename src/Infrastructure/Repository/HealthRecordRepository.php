<?php

declare(strict_types=1);

namespace App\Infrastructure\Repository;

use App\Domain\Health\HealthRecord;
use App\Domain\Health\HealthRecordRepositoryInterface;
use App\Domain\Health\HealthRecordType;
use App\Infrastructure\Database\DatabaseManager;
use DateTime;
use PDO;

class HealthRecordRepository implements HealthRecordRepositoryInterface
{
    private PDO $pdo;

    public function __construct(DatabaseManager $databaseManager)
    {
        $this->pdo = $databaseManager->getConnection();
    }

    public function save(HealthRecord $healthRecord): HealthRecord
    {
        $data = $healthRecord->toArray();
        
        if (isset($data['id']) && $data['id'] !== null) {
            return $this->update($healthRecord);
        }
        
        return $this->insert($healthRecord);
    }

    private function insert(HealthRecord $healthRecord): HealthRecord
    {
        $sql = "INSERT INTO health_records (
            pet_id, record_type, recorded_date, recorded_time, numeric_value, 
            text_value, json_data, recorded_by_user_id, veterinarian_verified,
            verified_by_user_id, verified_at, attachments, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $this->pdo->prepare($sql);
        $data = $healthRecord->toArray();
        
        $stmt->execute([
            $data['pet_id'],
            $data['record_type'],
            $data['recorded_date'],
            $data['recorded_time'],
            $data['numeric_value'],
            $data['text_value'],
            $data['json_data'],
            $data['recorded_by_user_id'],
            $data['veterinarian_verified'] ? 1 : 0,
            $data['verified_by_user_id'],
            $data['verified_at'],
            $data['attachments'],
            $data['created_at'],
            $data['updated_at']
        ]);

        $healthRecord->setId((int) $this->pdo->lastInsertId());
        return $healthRecord;
    }

    private function update(HealthRecord $healthRecord): HealthRecord
    {
        $sql = "UPDATE health_records SET 
            numeric_value = ?, text_value = ?, json_data = ?, 
            veterinarian_verified = ?, verified_by_user_id = ?, verified_at = ?,
            attachments = ?, updated_at = ?
            WHERE id = ?";

        $stmt = $this->pdo->prepare($sql);
        $data = $healthRecord->toArray();
        
        $stmt->execute([
            $data['numeric_value'],
            $data['text_value'],
            $data['json_data'],
            $data['veterinarian_verified'] ? 1 : 0,
            $data['verified_by_user_id'],
            $data['verified_at'],
            $data['attachments'],
            $data['updated_at'],
            $data['id']
        ]);

        return $healthRecord;
    }

    public function findById(int $id): ?HealthRecord
    {
        $sql = "SELECT * FROM health_records WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        return $data ? $this->mapToHealthRecord($data) : null;
    }

    public function findByPetId(int $petId, ?int $limit = null, ?int $offset = null): array
    {
        $sql = "SELECT * FROM health_records WHERE pet_id = ? ORDER BY recorded_date DESC, created_at DESC";
        
        if ($limit !== null) {
            $sql .= " LIMIT " . $limit;
            if ($offset !== null) {
                $sql .= " OFFSET " . $offset;
            }
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$petId]);
        
        $records = [];
        while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $records[] = $this->mapToHealthRecord($data);
        }
        
        return $records;
    }

    public function findByPetIdAndType(int $petId, HealthRecordType $type, ?int $limit = null): array
    {
        $sql = "SELECT * FROM health_records WHERE pet_id = ? AND record_type = ? 
                ORDER BY recorded_date DESC, created_at DESC";
        
        if ($limit !== null) {
            $sql .= " LIMIT " . $limit;
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$petId, $type->value]);
        
        $records = [];
        while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $records[] = $this->mapToHealthRecord($data);
        }
        
        return $records;
    }

    public function findByPetIdAndDateRange(
        int $petId, 
        DateTime $startDate, 
        DateTime $endDate,
        ?HealthRecordType $type = null
    ): array {
        $sql = "SELECT * FROM health_records WHERE pet_id = ? AND recorded_date BETWEEN ? AND ?";
        $params = [$petId, $startDate->format('Y-m-d'), $endDate->format('Y-m-d')];
        
        if ($type !== null) {
            $sql .= " AND record_type = ?";
            $params[] = $type->value;
        }
        
        $sql .= " ORDER BY recorded_date DESC, created_at DESC";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        $records = [];
        while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $records[] = $this->mapToHealthRecord($data);
        }
        
        return $records;
    }

    public function getLatestByPetIdAndType(int $petId, HealthRecordType $type): ?HealthRecord
    {
        $sql = "SELECT * FROM health_records WHERE pet_id = ? AND record_type = ? 
                ORDER BY recorded_date DESC, created_at DESC LIMIT 1";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$petId, $type->value]);
        
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        return $data ? $this->mapToHealthRecord($data) : null;
    }

    public function getWeightHistory(int $petId, ?int $limit = null): array
    {
        return $this->findByPetIdAndType($petId, HealthRecordType::WEIGHT, $limit);
    }

    public function getBodyConditionHistory(int $petId, ?int $limit = null): array
    {
        return $this->findByPetIdAndType($petId, HealthRecordType::BODY_CONDITION, $limit);
    }

    public function getActivityHistory(int $petId, ?int $limit = null): array
    {
        return $this->findByPetIdAndType($petId, HealthRecordType::ACTIVITY, $limit);
    }

    public function delete(int $id): bool
    {
        $sql = "DELETE FROM health_records WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$id]);
    }

    public function deleteByPetId(int $petId): bool
    {
        $sql = "DELETE FROM health_records WHERE pet_id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$petId]);
    }

    public function getHealthSummary(int $petId): array
    {
        $sql = "SELECT 
            record_type,
            COUNT(*) as total_records,
            MAX(recorded_date) as latest_date,
            AVG(CASE WHEN numeric_value IS NOT NULL THEN numeric_value END) as avg_value,
            MIN(CASE WHEN numeric_value IS NOT NULL THEN numeric_value END) as min_value,
            MAX(CASE WHEN numeric_value IS NOT NULL THEN numeric_value END) as max_value
        FROM health_records 
        WHERE pet_id = ? 
        GROUP BY record_type";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$petId]);
        
        $summary = [];
        while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $summary[$data['record_type']] = [
                'total_records' => (int) $data['total_records'],
                'latest_date' => $data['latest_date'],
                'avg_value' => $data['avg_value'] ? (float) $data['avg_value'] : null,
                'min_value' => $data['min_value'] ? (float) $data['min_value'] : null,
                'max_value' => $data['max_value'] ? (float) $data['max_value'] : null,
            ];
        }
        
        return $summary;
    }

    public function getRecordsByUser(int $userId, ?int $limit = null): array
    {
        $sql = "SELECT hr.*, p.name as pet_name 
                FROM health_records hr 
                JOIN pets p ON hr.pet_id = p.id 
                WHERE hr.recorded_by_user_id = ? 
                ORDER BY hr.created_at DESC";
        
        if ($limit !== null) {
            $sql .= " LIMIT " . $limit;
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId]);
        
        $records = [];
        while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $record = $this->mapToHealthRecord($data);
            $records[] = [
                'record' => $record,
                'pet_name' => $data['pet_name']
            ];
        }
        
        return $records;
    }

    private function mapToHealthRecord(array $data): HealthRecord
    {
        $healthRecord = new HealthRecord(
            petId: (int) $data['pet_id'],
            recordType: HealthRecordType::from($data['record_type']),
            recordedDate: new DateTime($data['recorded_date']),
            recordedByUserId: (int) $data['recorded_by_user_id'],
            recordedTime: $data['recorded_time'],
            numericValue: $data['numeric_value'] ? (float) $data['numeric_value'] : null,
            textValue: $data['text_value'],
            jsonData: $data['json_data'] ? json_decode($data['json_data'], true) : null,
            attachments: $data['attachments'] ? json_decode($data['attachments'], true) : null
        );

        $healthRecord->setId((int) $data['id']);

        // Set verification data if present
        if ($data['veterinarian_verified']) {
            $healthRecord->verifyByVeterinarian((int) $data['verified_by_user_id']);
        }

        return $healthRecord;
    }
}