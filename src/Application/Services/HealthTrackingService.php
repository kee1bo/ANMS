<?php

declare(strict_types=1);

namespace App\Application\Services;

use App\Domain\Health\HealthRecord;
use App\Domain\Health\HealthRecordRepositoryInterface;
use App\Domain\Health\HealthRecordType;
use App\Domain\Pet\PetRepositoryInterface;
use DateTime;
use InvalidArgumentException;

class HealthTrackingService
{
    private HealthRecordRepositoryInterface $healthRecordRepository;
    private PetRepositoryInterface $petRepository;

    public function __construct(
        HealthRecordRepositoryInterface $healthRecordRepository,
        PetRepositoryInterface $petRepository
    ) {
        $this->healthRecordRepository = $healthRecordRepository;
        $this->petRepository = $petRepository;
    }

    public function logWeight(
        int $petId, 
        float $weight, 
        DateTime $date, 
        int $userId,
        ?string $notes = null,
        ?string $recordedTime = null,
        ?int $bodyConditionScore = null,
        ?string $measurementMethod = 'home_scale',
        ?string $activityBeforeWeighing = null,
        ?string $feedingStatus = null
    ): HealthRecord {
        $this->validatePetOwnership($petId, $userId);
        
        // Enhanced validation
        $this->validateWeightData($weight, $bodyConditionScore);
        
        // Get previous weights for trend analysis
        $previousWeights = $this->getRecentWeightHistory($petId, 5);
        $trendAnalysis = $this->analyzeWeightTrend($weight, $previousWeights);
        
        // Build JSON data with additional information
        $jsonData = [
            'measurement_method' => $measurementMethod,
            'activity_before_weighing' => $activityBeforeWeighing,
            'feeding_status' => $feedingStatus,
            'trend_analysis' => $trendAnalysis
        ];
        
        if ($bodyConditionScore !== null) {
            $jsonData['body_condition_score'] = $bodyConditionScore;
        }

        $healthRecord = new HealthRecord(
            petId: $petId,
            recordType: HealthRecordType::WEIGHT,
            recordedDate: $date,
            recordedByUserId: $userId,
            recordedTime: $recordedTime,
            numericValue: $weight,
            textValue: $notes,
            jsonData: $jsonData
        );

        $savedRecord = $this->healthRecordRepository->save($healthRecord);
        
        // Update pet's current weight and body condition
        $pet = $this->petRepository->findById($petId);
        if ($pet) {
            $pet->updateWeight($weight);
            if ($bodyConditionScore !== null) {
                $pet->updateBodyConditionScore($bodyConditionScore);
            }
            $this->petRepository->save($pet);
        }

        // Generate alerts if needed
        $this->checkWeightAlerts($petId, $weight, $trendAnalysis);

        return $savedRecord;
    }

    public function logBodyCondition(
        int $petId, 
        int $score, 
        DateTime $date, 
        int $userId,
        ?string $notes = null
    ): HealthRecord {
        $this->validatePetOwnership($petId, $userId);
        
        if ($score < 1 || $score > 9) {
            throw new InvalidArgumentException('Body condition score must be between 1 and 9');
        }

        $healthRecord = new HealthRecord(
            petId: $petId,
            recordType: HealthRecordType::BODY_CONDITION,
            recordedDate: $date,
            recordedByUserId: $userId,
            numericValue: (float) $score,
            textValue: $notes
        );

        $savedRecord = $this->healthRecordRepository->save($healthRecord);
        
        // Update pet's body condition score
        $pet = $this->petRepository->findById($petId);
        if ($pet) {
            $pet->updateBodyConditionScore($score);
            $this->petRepository->save($pet);
        }

        return $savedRecord;
    }

    public function logActivity(
        int $petId, 
        float $hours, 
        DateTime $date, 
        int $userId,
        ?string $activityType = null
    ): HealthRecord {
        $this->validatePetOwnership($petId, $userId);
        
        if ($hours < 0 || $hours > 24) {
            throw new InvalidArgumentException('Activity hours must be between 0 and 24');
        }

        $jsonData = $activityType ? ['activity_type' => $activityType] : null;

        $healthRecord = new HealthRecord(
            petId: $petId,
            recordType: HealthRecordType::ACTIVITY,
            recordedDate: $date,
            recordedByUserId: $userId,
            numericValue: $hours,
            jsonData: $jsonData
        );

        return $this->healthRecordRepository->save($healthRecord);
    }

    public function logHealthNote(
        int $petId, 
        string $note, 
        DateTime $date, 
        int $userId,
        ?array $tags = null
    ): HealthRecord {
        $this->validatePetOwnership($petId, $userId);
        
        $jsonData = $tags ? ['tags' => $tags] : null;

        $healthRecord = new HealthRecord(
            petId: $petId,
            recordType: HealthRecordType::HEALTH_NOTE,
            recordedDate: $date,
            recordedByUserId: $userId,
            textValue: $note,
            jsonData: $jsonData
        );

        return $this->healthRecordRepository->save($healthRecord);
    }

    public function logMedication(
        int $petId, 
        string $medicationName, 
        string $dosage, 
        DateTime $date, 
        int $userId,
        ?string $frequency = null,
        ?DateTime $endDate = null
    ): HealthRecord {
        $this->validatePetOwnership($petId, $userId);
        
        $jsonData = [
            'medication_name' => $medicationName,
            'dosage' => $dosage,
            'frequency' => $frequency,
            'end_date' => $endDate?->format('Y-m-d')
        ];

        $healthRecord = new HealthRecord(
            petId: $petId,
            recordType: HealthRecordType::MEDICATION,
            recordedDate: $date,
            recordedByUserId: $userId,
            textValue: "$medicationName - $dosage",
            jsonData: $jsonData
        );

        return $this->healthRecordRepository->save($healthRecord);
    }

    public function logVetVisit(
        int $petId, 
        string $reason, 
        DateTime $date, 
        int $userId,
        ?string $veterinarian = null,
        ?string $diagnosis = null,
        ?string $treatment = null,
        ?DateTime $nextVisit = null
    ): HealthRecord {
        $this->validatePetOwnership($petId, $userId);
        
        $jsonData = [
            'reason' => $reason,
            'veterinarian' => $veterinarian,
            'diagnosis' => $diagnosis,
            'treatment' => $treatment,
            'next_visit' => $nextVisit?->format('Y-m-d')
        ];

        $healthRecord = new HealthRecord(
            petId: $petId,
            recordType: HealthRecordType::VET_VISIT,
            recordedDate: $date,
            recordedByUserId: $userId,
            textValue: $reason,
            jsonData: $jsonData
        );

        return $this->healthRecordRepository->save($healthRecord);
    }

    public function getHealthHistory(int $petId, int $userId, ?int $limit = null): array
    {
        $this->validatePetOwnership($petId, $userId);
        return $this->healthRecordRepository->findByPetId($petId, $limit);
    }

    public function getWeightTrend(int $petId, int $userId, ?int $days = 90): array
    {
        $this->validatePetOwnership($petId, $userId);
        
        $endDate = new DateTime();
        $startDate = (clone $endDate)->modify("-{$days} days");
        
        $records = $this->healthRecordRepository->findByPetIdAndDateRange(
            $petId, 
            $startDate, 
            $endDate, 
            HealthRecordType::WEIGHT
        );

        return $this->calculateTrend($records);
    }

    public function getBodyConditionTrend(int $petId, int $userId, ?int $days = 90): array
    {
        $this->validatePetOwnership($petId, $userId);
        
        $endDate = new DateTime();
        $startDate = (clone $endDate)->modify("-{$days} days");
        
        $records = $this->healthRecordRepository->findByPetIdAndDateRange(
            $petId, 
            $startDate, 
            $endDate, 
            HealthRecordType::BODY_CONDITION
        );

        return $this->calculateTrend($records);
    }

    public function getHealthSummary(int $petId, int $userId): array
    {
        $this->validatePetOwnership($petId, $userId);
        
        $summary = $this->healthRecordRepository->getHealthSummary($petId);
        
        // Add trend analysis
        $weightTrend = $this->getWeightTrend($petId, $userId, 30);
        $bodyConditionTrend = $this->getBodyConditionTrend($petId, $userId, 30);
        
        return [
            'summary' => $summary,
            'trends' => [
                'weight' => $weightTrend,
                'body_condition' => $bodyConditionTrend
            ],
            'alerts' => $this->generateHealthAlerts($petId, $summary)
        ];
    }

    public function generateHealthReport(
        int $petId, 
        int $userId, 
        DateTime $startDate, 
        DateTime $endDate
    ): array {
        $this->validatePetOwnership($petId, $userId);
        
        $records = $this->healthRecordRepository->findByPetIdAndDateRange($petId, $startDate, $endDate);
        
        $report = [
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d')
            ],
            'total_records' => count($records),
            'records_by_type' => [],
            'weight_analysis' => null,
            'body_condition_analysis' => null,
            'activity_analysis' => null,
            'health_events' => []
        ];

        // Group records by type
        foreach ($records as $record) {
            $type = $record->getRecordType()->value;
            if (!isset($report['records_by_type'][$type])) {
                $report['records_by_type'][$type] = [];
            }
            $report['records_by_type'][$type][] = $record;
        }

        // Analyze weight data
        if (isset($report['records_by_type']['weight'])) {
            $report['weight_analysis'] = $this->analyzeWeightData($report['records_by_type']['weight']);
        }

        // Analyze body condition data
        if (isset($report['records_by_type']['body_condition'])) {
            $report['body_condition_analysis'] = $this->analyzeBodyConditionData($report['records_by_type']['body_condition']);
        }

        // Analyze activity data
        if (isset($report['records_by_type']['activity'])) {
            $report['activity_analysis'] = $this->analyzeActivityData($report['records_by_type']['activity']);
        }

        // Extract health events
        $healthEvents = array_merge(
            $report['records_by_type']['health_note'] ?? [],
            $report['records_by_type']['medication'] ?? [],
            $report['records_by_type']['vet_visit'] ?? []
        );
        
        usort($healthEvents, function($a, $b) {
            return $b->getRecordedDate() <=> $a->getRecordedDate();
        });
        
        $report['health_events'] = array_slice($healthEvents, 0, 10);

        return $report;
    }

    private function validatePetOwnership(int $petId, int $userId): void
    {
        $pet = $this->petRepository->findById($petId);
        if (!$pet || $pet->getUserId() !== $userId) {
            throw new InvalidArgumentException('Pet not found or access denied');
        }
    }

    private function calculateTrend(array $records): array
    {
        if (count($records) < 2) {
            return [
                'trend' => 'insufficient_data',
                'change' => 0,
                'change_percentage' => 0,
                'data_points' => count($records)
            ];
        }

        $values = array_map(fn($record) => $record->getNumericValue(), $records);
        $values = array_reverse($values); // Oldest first for trend calculation
        
        $firstValue = $values[0];
        $lastValue = end($values);
        $change = $lastValue - $firstValue;
        $changePercentage = $firstValue > 0 ? ($change / $firstValue) * 100 : 0;

        // Simple trend classification
        $trend = 'stable';
        if (abs($changePercentage) > 5) {
            $trend = $change > 0 ? 'increasing' : 'decreasing';
        }

        return [
            'trend' => $trend,
            'change' => round($change, 2),
            'change_percentage' => round($changePercentage, 2),
            'data_points' => count($records),
            'first_value' => $firstValue,
            'last_value' => $lastValue
        ];
    }

    private function generateHealthAlerts(int $petId, array $summary): array
    {
        $alerts = [];
        
        // Check for missing recent weight records
        if (isset($summary['weight']['latest_date'])) {
            $lastWeightDate = new DateTime($summary['weight']['latest_date']);
            $daysSinceLastWeight = (new DateTime())->diff($lastWeightDate)->days;
            
            if ($daysSinceLastWeight > 30) {
                $alerts[] = [
                    'type' => 'warning',
                    'message' => 'No weight recorded in the last 30 days',
                    'action' => 'log_weight'
                ];
            }
        } else {
            $alerts[] = [
                'type' => 'info',
                'message' => 'No weight records found. Start tracking your pet\'s weight.',
                'action' => 'log_weight'
            ];
        }

        // Check for body condition concerns
        if (isset($summary['body_condition']['max_value'])) {
            $latestBodyCondition = $summary['body_condition']['max_value'];
            if ($latestBodyCondition <= 3) {
                $alerts[] = [
                    'type' => 'warning',
                    'message' => 'Pet may be underweight. Consider veterinary consultation.',
                    'action' => 'vet_consultation'
                ];
            } elseif ($latestBodyCondition >= 7) {
                $alerts[] = [
                    'type' => 'warning',
                    'message' => 'Pet may be overweight. Consider dietary adjustments.',
                    'action' => 'nutrition_plan'
                ];
            }
        }

        return $alerts;
    }

    private function analyzeWeightData(array $weightRecords): array
    {
        $weights = array_map(fn($record) => $record->getNumericValue(), $weightRecords);
        
        return [
            'count' => count($weights),
            'average' => round(array_sum($weights) / count($weights), 2),
            'min' => min($weights),
            'max' => max($weights),
            'range' => max($weights) - min($weights),
            'trend' => $this->calculateTrend($weightRecords)
        ];
    }

    private function analyzeBodyConditionData(array $bodyConditionRecords): array
    {
        $scores = array_map(fn($record) => $record->getNumericValue(), $bodyConditionRecords);
        
        return [
            'count' => count($scores),
            'average' => round(array_sum($scores) / count($scores), 1),
            'min' => min($scores),
            'max' => max($scores),
            'latest' => end($scores),
            'trend' => $this->calculateTrend($bodyConditionRecords)
        ];
    }

    private function analyzeActivityData(array $activityRecords): array
    {
        $hours = array_map(fn($record) => $record->getNumericValue(), $activityRecords);
        
        return [
            'count' => count($hours),
            'average_daily' => round(array_sum($hours) / count($hours), 1),
            'min' => min($hours),
            'max' => max($hours),
            'total' => array_sum($hours),
            'trend' => $this->calculateTrend($activityRecords)
        ];
    }

    // Enhanced validation methods
    private function validateWeightData(float $weight, ?int $bodyConditionScore = null): void
    {
        if ($weight <= 0 || $weight > 200) {
            throw new InvalidArgumentException('Weight must be between 0.1 and 200 kg');
        }

        if ($bodyConditionScore !== null && ($bodyConditionScore < 1 || $bodyConditionScore > 9)) {
            throw new InvalidArgumentException('Body condition score must be between 1 and 9');
        }
    }

    private function getRecentWeightHistory(int $petId, int $limit = 5): array
    {
        return $this->healthRecordRepository->findByPetIdAndType($petId, HealthRecordType::WEIGHT, $limit);
    }

    private function analyzeWeightTrend(float $currentWeight, array $previousWeights): array
    {
        if (empty($previousWeights)) {
            return [
                'status' => 'no_history',
                'change' => 0,
                'change_percentage' => 0,
                'trend_direction' => 'unknown'
            ];
        }

        $lastWeight = $previousWeights[0]->getNumericValue();
        $change = $currentWeight - $lastWeight;
        $changePercentage = $lastWeight > 0 ? ($change / $lastWeight) * 100 : 0;

        // Determine trend direction
        $trendDirection = 'stable';
        if (abs($changePercentage) > 2) {
            $trendDirection = $change > 0 ? 'increasing' : 'decreasing';
        }

        // Calculate velocity if we have multiple points
        $velocity = 0;
        if (count($previousWeights) >= 2) {
            $weights = array_map(fn($record) => $record->getNumericValue(), $previousWeights);
            $weights[] = $currentWeight;
            $velocity = $this->calculateWeightVelocity($weights);
        }

        return [
            'status' => 'analyzed',
            'change' => round($change, 2),
            'change_percentage' => round($changePercentage, 2),
            'trend_direction' => $trendDirection,
            'velocity' => $velocity,
            'is_significant' => abs($changePercentage) > 10
        ];
    }

    private function calculateWeightVelocity(array $weights): float
    {
        if (count($weights) < 2) {
            return 0;
        }

        $changes = [];
        for ($i = 1; $i < count($weights); $i++) {
            $changes[] = $weights[$i] - $weights[$i - 1];
        }

        return round(array_sum($changes) / count($changes), 3);
    }

    private function checkWeightAlerts(int $petId, float $weight, array $trendAnalysis): void
    {
        $pet = $this->petRepository->findById($petId);
        if (!$pet) {
            return;
        }

        $alerts = [];

        // Check for significant weight change
        if ($trendAnalysis['is_significant']) {
            $alerts[] = [
                'type' => 'warning',
                'title' => 'Significant Weight Change',
                'message' => sprintf(
                    'Weight changed by %.1f%% (%+.1fkg) since last measurement',
                    $trendAnalysis['change_percentage'],
                    $trendAnalysis['change']
                ),
                'severity' => 'medium'
            ];
        }

        // Check against ideal weight if available
        if ($pet->getIdealWeight()) {
            $idealWeight = $pet->getIdealWeight();
            $deviation = abs($weight - $idealWeight);
            $deviationPercentage = ($deviation / $idealWeight) * 100;

            if ($deviationPercentage > 15) {
                $alerts[] = [
                    'type' => $weight > $idealWeight ? 'warning' : 'info',
                    'title' => 'Weight vs Ideal',
                    'message' => sprintf(
                        'Current weight (%.1fkg) is %.1f%% %s ideal weight (%.1fkg)',
                        $weight,
                        $deviationPercentage,
                        $weight > $idealWeight ? 'above' : 'below',
                        $idealWeight
                    ),
                    'severity' => $deviationPercentage > 25 ? 'high' : 'medium'
                ];
            }
        }

        // Store alerts if any (this would typically go to an alerts table)
        foreach ($alerts as $alert) {
            $this->logHealthAlert($petId, $alert);
        }
    }

    private function logHealthAlert(int $petId, array $alertData): void
    {
        // This would typically save to a health_alerts table
        // For now, we'll log it as a health note
        $alertMessage = sprintf('[ALERT] %s: %s', $alertData['title'], $alertData['message']);
        
        $this->healthRecordRepository->save(new HealthRecord(
            petId: $petId,
            recordType: HealthRecordType::HEALTH_NOTE,
            recordedDate: new DateTime(),
            recordedByUserId: 0, // System generated
            textValue: $alertMessage,
            jsonData: [
                'alert_type' => $alertData['type'],
                'severity' => $alertData['severity'],
                'auto_generated' => true
            ]
        ));
    }

    // Enhanced medication logging with dosage validation
    public function logMedicationWithValidation(
        int $petId,
        string $medicationName,
        string $dosage,
        string $frequency,
        DateTime $startDate,
        int $userId,
        ?DateTime $endDate = null,
        ?string $administrationMethod = 'oral',
        ?array $administrationTimes = null,
        ?string $withFood = null,
        ?string $prescribedBy = null,
        ?DateTime $prescriptionDate = null,
        ?string $purpose = null,
        ?string $specialInstructions = null
    ): HealthRecord {
        $this->validatePetOwnership($petId, $userId);
        
        // Enhanced validation
        $this->validateMedicationData($medicationName, $dosage, $frequency, $startDate, $endDate);
        
        // Get pet weight for dosage validation
        $pet = $this->petRepository->findById($petId);
        $petWeight = $pet ? $pet->getCurrentWeight() : null;
        
        if ($petWeight) {
            $dosageValidation = $this->validateDosage($dosage, $medicationName, $petWeight);
            if (!empty($dosageValidation['warnings'])) {
                // Log dosage warnings as health notes
                foreach ($dosageValidation['warnings'] as $warning) {
                    $this->logHealthNote($petId, "[DOSAGE WARNING] $warning", new DateTime(), $userId);
                }
            }
        }

        $jsonData = [
            'medication_name' => $medicationName,
            'dosage' => $dosage,
            'frequency' => $frequency,
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate?->format('Y-m-d'),
            'administration_method' => $administrationMethod,
            'administration_times' => $administrationTimes,
            'with_food' => $withFood,
            'prescribed_by' => $prescribedBy,
            'prescription_date' => $prescriptionDate?->format('Y-m-d'),
            'purpose' => $purpose,
            'special_instructions' => $specialInstructions,
            'pet_weight_at_prescription' => $petWeight
        ];

        $healthRecord = new HealthRecord(
            petId: $petId,
            recordType: HealthRecordType::MEDICATION,
            recordedDate: $startDate,
            recordedByUserId: $userId,
            textValue: "$medicationName - $dosage ($frequency)",
            jsonData: $jsonData
        );

        return $this->healthRecordRepository->save($healthRecord);
    }

    private function validateMedicationData(
        string $medicationName,
        string $dosage,
        string $frequency,
        DateTime $startDate,
        ?DateTime $endDate = null
    ): void {
        if (empty(trim($medicationName))) {
            throw new InvalidArgumentException('Medication name is required');
        }

        if (empty(trim($dosage))) {
            throw new InvalidArgumentException('Dosage is required');
        }

        $validFrequencies = [
            'once_daily', 'twice_daily', 'three_times_daily', 
            'every_other_day', 'weekly', 'as_needed'
        ];
        
        if (!in_array($frequency, $validFrequencies)) {
            throw new InvalidArgumentException('Invalid frequency specified');
        }

        if ($endDate && $endDate <= $startDate) {
            throw new InvalidArgumentException('End date must be after start date');
        }
    }

    private function validateDosage(string $dosage, string $medicationName, float $petWeight): array
    {
        $warnings = [];
        
        // Extract numeric value from dosage string
        if (!preg_match('/(\d+(?:\.\d+)?)/', $dosage, $matches)) {
            return ['warnings' => ['Unable to parse dosage for validation']];
        }

        $dosageAmount = (float) $matches[1];
        $dosagePerKg = $dosageAmount / $petWeight;

        // Common medication dosage ranges (mg/kg)
        $dosageRanges = [
            'rimadyl' => ['min' => 2.0, 'max' => 4.0, 'unit' => 'mg/kg'],
            'metacam' => ['min' => 0.1, 'max' => 0.2, 'unit' => 'mg/kg'],
            'tramadol' => ['min' => 2.0, 'max' => 5.0, 'unit' => 'mg/kg'],
            'gabapentin' => ['min' => 5.0, 'max' => 20.0, 'unit' => 'mg/kg'],
            'prednisone' => ['min' => 0.5, 'max' => 2.0, 'unit' => 'mg/kg']
        ];

        $medName = strtolower($medicationName);
        if (isset($dosageRanges[$medName])) {
            $range = $dosageRanges[$medName];
            
            if ($dosagePerKg < $range['min']) {
                $warnings[] = sprintf(
                    'Dosage may be below recommended range for %s (%.2f %s, recommended: %.1f-%.1f %s)',
                    $medicationName,
                    $dosagePerKg,
                    $range['unit'],
                    $range['min'],
                    $range['max'],
                    $range['unit']
                );
            } elseif ($dosagePerKg > $range['max']) {
                $warnings[] = sprintf(
                    'Dosage may be above recommended range for %s (%.2f %s, recommended: %.1f-%.1f %s)',
                    $medicationName,
                    $dosagePerKg,
                    $range['unit'],
                    $range['min'],
                    $range['max'],
                    $range['unit']
                );
            }
        }

        return ['warnings' => $warnings];
    }

    // Bulk health data import functionality
    public function importBulkHealthData(int $petId, int $userId, array $healthDataArray): array
    {
        $this->validatePetOwnership($petId, $userId);
        
        $results = [
            'total' => count($healthDataArray),
            'successful' => 0,
            'failed' => 0,
            'errors' => [],
            'imported_records' => []
        ];

        foreach ($healthDataArray as $index => $data) {
            try {
                $record = $this->processHealthDataImport($petId, $userId, $data);
                $results['successful']++;
                $results['imported_records'][] = $record;
            } catch (Exception $e) {
                $results['failed']++;
                $results['errors'][] = [
                    'index' => $index,
                    'data' => $data,
                    'error' => $e->getMessage()
                ];
            }
        }

        return $results;
    }

    private function processHealthDataImport(int $petId, int $userId, array $data): HealthRecord
    {
        // Determine record type based on data structure
        if (isset($data['weight'])) {
            return $this->logWeight(
                $petId,
                (float) $data['weight'],
                new DateTime($data['recorded_date']),
                $userId,
                $data['notes'] ?? null,
                $data['recorded_time'] ?? null,
                isset($data['body_condition_score']) ? (int) $data['body_condition_score'] : null,
                $data['measurement_method'] ?? 'home_scale',
                $data['activity_before_weighing'] ?? null,
                $data['feeding_status'] ?? null
            );
        } elseif (isset($data['medication_name'])) {
            return $this->logMedicationWithValidation(
                $petId,
                $data['medication_name'],
                $data['dosage'],
                $data['frequency'],
                new DateTime($data['start_date']),
                $userId,
                isset($data['end_date']) ? new DateTime($data['end_date']) : null,
                $data['administration_method'] ?? 'oral',
                $data['administration_times'] ?? null,
                $data['with_food'] ?? null,
                $data['prescribed_by'] ?? null,
                isset($data['prescription_date']) ? new DateTime($data['prescription_date']) : null,
                $data['purpose'] ?? null,
                $data['special_instructions'] ?? null
            );
        } elseif (isset($data['activity_hours'])) {
            return $this->logActivity(
                $petId,
                (float) $data['activity_hours'],
                new DateTime($data['recorded_date']),
                $userId,
                $data['activity_type'] ?? null
            );
        } elseif (isset($data['reason'])) {
            return $this->logVetVisit(
                $petId,
                $data['reason'],
                new DateTime($data['recorded_date']),
                $userId,
                $data['veterinarian'] ?? null,
                $data['diagnosis'] ?? null,
                $data['treatment'] ?? null,
                isset($data['next_visit']) ? new DateTime($data['next_visit']) : null
            );
        } else {
            throw new InvalidArgumentException('Unknown health data type');
        }
    }
}