<?php

/**
 * Health Metrics Calculator Service
 * Computes health scores and trends based on pet data including weight, BCS, vet visits
 */
class HealthMetricsCalculator
{
    private $pdo;
    
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }
    
    /**
     * Calculate comprehensive health metrics for a user's pets
     */
    public function calculateUserHealthMetrics($userId)
    {
        $metrics = [
            'overall_health_score' => 0,
            'pet_health_scores' => [],
            'health_trends' => [],
            'health_alerts' => [],
            'recommendations' => []
        ];
        
        try {
            // Get all pets for the user
            $pets = $this->getUserPets($userId);
            
            if (empty($pets)) {
                return $metrics;
            }
            
            $totalScore = 0;
            $petCount = 0;
            
            foreach ($pets as $pet) {
                $petMetrics = $this->calculatePetHealthMetrics($pet);
                $metrics['pet_health_scores'][] = $petMetrics;
                
                if ($petMetrics['health_score'] > 0) {
                    $totalScore += $petMetrics['health_score'];
                    $petCount++;
                }
                
                // Collect alerts and recommendations
                $metrics['health_alerts'] = array_merge($metrics['health_alerts'], $petMetrics['alerts']);
                $metrics['recommendations'] = array_merge($metrics['recommendations'], $petMetrics['recommendations']);
            }
            
            // Calculate overall health score
            if ($petCount > 0) {
                $metrics['overall_health_score'] = round($totalScore / $petCount);
            }
            
            // Get health trends
            $metrics['health_trends'] = $this->calculateHealthTrends($userId);
            
            // Sort alerts by priority
            usort($metrics['health_alerts'], function($a, $b) {
                $priorityOrder = ['critical' => 0, 'high' => 1, 'medium' => 2, 'low' => 3];
                return $priorityOrder[$a['priority']] - $priorityOrder[$b['priority']];
            });
            
            // Limit alerts and recommendations
            $metrics['health_alerts'] = array_slice($metrics['health_alerts'], 0, 10);
            $metrics['recommendations'] = array_slice($metrics['recommendations'], 0, 10);
            
        } catch (Exception $e) {
            error_log('Error calculating health metrics: ' . $e->getMessage());
        }
        
        return $metrics;
    }
    
    /**
     * Calculate health metrics for a specific pet
     */
    public function calculatePetHealthMetrics($pet)
    {
        $metrics = [
            'pet_id' => $pet['id'],
            'pet_name' => $pet['name'],
            'health_score' => 100,
            'score_factors' => [],
            'alerts' => [],
            'recommendations' => [],
            'trends' => []
        ];
        
        // Weight-based health assessment (30 points)
        $weightMetrics = $this->assessWeight($pet);
        $metrics['health_score'] -= $weightMetrics['penalty'];
        $metrics['score_factors'] = array_merge($metrics['score_factors'], $weightMetrics['factors']);
        $metrics['alerts'] = array_merge($metrics['alerts'], $weightMetrics['alerts']);
        $metrics['recommendations'] = array_merge($metrics['recommendations'], $weightMetrics['recommendations']);
        
        // Body condition score assessment (25 points)
        $bcsMetrics = $this->assessBodyCondition($pet);
        $metrics['health_score'] -= $bcsMetrics['penalty'];
        $metrics['score_factors'] = array_merge($metrics['score_factors'], $bcsMetrics['factors']);
        $metrics['alerts'] = array_merge($metrics['alerts'], $bcsMetrics['alerts']);
        $metrics['recommendations'] = array_merge($metrics['recommendations'], $bcsMetrics['recommendations']);
        
        // Age-related health assessment (20 points)
        $ageMetrics = $this->assessAgeRelatedHealth($pet);
        $metrics['health_score'] -= $ageMetrics['penalty'];
        $metrics['score_factors'] = array_merge($metrics['score_factors'], $ageMetrics['factors']);
        $metrics['alerts'] = array_merge($metrics['alerts'], $ageMetrics['alerts']);
        $metrics['recommendations'] = array_merge($metrics['recommendations'], $ageMetrics['recommendations']);
        
        // Veterinary care assessment (15 points)
        $vetMetrics = $this->assessVeterinaryCare($pet);
        $metrics['health_score'] -= $vetMetrics['penalty'];
        $metrics['score_factors'] = array_merge($metrics['score_factors'], $vetMetrics['factors']);
        $metrics['alerts'] = array_merge($metrics['alerts'], $vetMetrics['alerts']);
        $metrics['recommendations'] = array_merge($metrics['recommendations'], $vetMetrics['recommendations']);
        
        // Activity and exercise assessment (10 points)
        $activityMetrics = $this->assessActivity($pet);
        $metrics['health_score'] -= $activityMetrics['penalty'];
        $metrics['score_factors'] = array_merge($metrics['score_factors'], $activityMetrics['factors']);
        $metrics['recommendations'] = array_merge($metrics['recommendations'], $activityMetrics['recommendations']);
        
        // Ensure score doesn't go below 0
        $metrics['health_score'] = max(0, $metrics['health_score']);
        
        // Get health trends for this pet
        $metrics['trends'] = $this->getPetHealthTrends($pet['id']);
        
        return $metrics;
    }
    
    /**
     * Assess weight-related health factors
     */
    private function assessWeight($pet)
    {
        $result = [
            'penalty' => 0,
            'factors' => [],
            'alerts' => [],
            'recommendations' => []
        ];
        
        $currentWeight = $pet['weight'] ?? $pet['current_weight'] ?? null;
        $idealWeight = $pet['ideal_weight'] ?? null;
        
        if (!$currentWeight) {
            $result['penalty'] = 15;
            $result['factors'][] = 'No current weight recorded (-15)';
            $result['recommendations'][] = [
                'type' => 'weight_recording',
                'priority' => 'medium',
                'title' => 'Record Current Weight',
                'description' => 'Regular weight monitoring is essential for health tracking'
            ];
            return $result;
        }
        
        if (!$idealWeight) {
            $result['penalty'] = 5;
            $result['factors'][] = 'No ideal weight set (-5)';
            $result['recommendations'][] = [
                'type' => 'ideal_weight',
                'priority' => 'low',
                'title' => 'Set Ideal Weight',
                'description' => 'Setting an ideal weight helps track weight management goals'
            ];
        } else {
            // Calculate weight ratio
            $weightRatio = $currentWeight / $idealWeight;
            
            if ($weightRatio > 1.25) { // More than 25% overweight
                $result['penalty'] = 30;
                $result['factors'][] = 'Severely overweight (-30)';
                $result['alerts'][] = [
                    'type' => 'weight_critical',
                    'priority' => 'critical',
                    'pet_id' => $pet['id'],
                    'pet_name' => $pet['name'],
                    'title' => 'Critical Weight Issue',
                    'description' => 'Pet is severely overweight - immediate veterinary consultation recommended'
                ];
                $result['recommendations'][] = [
                    'type' => 'weight_management_urgent',
                    'priority' => 'high',
                    'title' => 'Urgent Weight Management',
                    'description' => 'Consult veterinarian immediately for weight loss plan'
                ];
            } elseif ($weightRatio > 1.15) { // 15-25% overweight
                $result['penalty'] = 20;
                $result['factors'][] = 'Significantly overweight (-20)';
                $result['alerts'][] = [
                    'type' => 'weight_high',
                    'priority' => 'high',
                    'pet_id' => $pet['id'],
                    'pet_name' => $pet['name'],
                    'title' => 'Weight Management Needed',
                    'description' => 'Pet is significantly overweight'
                ];
                $result['recommendations'][] = [
                    'type' => 'weight_management',
                    'priority' => 'high',
                    'title' => 'Weight Management Plan',
                    'description' => 'Reduce portions and increase exercise gradually'
                ];
            } elseif ($weightRatio > 1.05) { // 5-15% overweight
                $result['penalty'] = 10;
                $result['factors'][] = 'Slightly overweight (-10)';
                $result['recommendations'][] = [
                    'type' => 'weight_monitoring',
                    'priority' => 'medium',
                    'title' => 'Monitor Weight',
                    'description' => 'Watch portion sizes and maintain regular exercise'
                ];
            } elseif ($weightRatio < 0.85) { // More than 15% underweight
                $result['penalty'] = 25;
                $result['factors'][] = 'Significantly underweight (-25)';
                $result['alerts'][] = [
                    'type' => 'weight_low',
                    'priority' => 'high',
                    'pet_id' => $pet['id'],
                    'pet_name' => $pet['name'],
                    'title' => 'Underweight Concern',
                    'description' => 'Pet is significantly underweight'
                ];
                $result['recommendations'][] = [
                    'type' => 'weight_gain',
                    'priority' => 'high',
                    'title' => 'Weight Gain Program',
                    'description' => 'Increase caloric intake and consult veterinarian'
                ];
            } elseif ($weightRatio < 0.95) { // 5-15% underweight
                $result['penalty'] = 10;
                $result['factors'][] = 'Slightly underweight (-10)';
                $result['recommendations'][] = [
                    'type' => 'nutrition_increase',
                    'priority' => 'medium',
                    'title' => 'Increase Nutrition',
                    'description' => 'Consider increasing meal portions slightly'
                ];
            } else {
                $result['factors'][] = 'Healthy weight (+0)';
            }
        }
        
        // Check for recent weight changes
        $weightTrend = $this->getWeightTrend($pet['id']);
        if ($weightTrend) {
            if ($weightTrend['change_percentage'] > 10) {
                $result['alerts'][] = [
                    'type' => 'weight_gain_rapid',
                    'priority' => 'medium',
                    'pet_id' => $pet['id'],
                    'pet_name' => $pet['name'],
                    'title' => 'Rapid Weight Gain',
                    'description' => 'Pet has gained significant weight recently'
                ];
            } elseif ($weightTrend['change_percentage'] < -10) {
                $result['alerts'][] = [
                    'type' => 'weight_loss_rapid',
                    'priority' => 'high',
                    'pet_id' => $pet['id'],
                    'pet_name' => $pet['name'],
                    'title' => 'Rapid Weight Loss',
                    'description' => 'Pet has lost significant weight recently'
                ];
            }
        }
        
        return $result;
    }
    
    /**
     * Assess body condition score
     */
    private function assessBodyCondition($pet)
    {
        $result = [
            'penalty' => 0,
            'factors' => [],
            'alerts' => [],
            'recommendations' => []
        ];
        
        $bcs = $pet['body_condition_score'] ?? null;
        
        if (!$bcs) {
            $result['penalty'] = 10;
            $result['factors'][] = 'No body condition score recorded (-10)';
            $result['recommendations'][] = [
                'type' => 'bcs_assessment',
                'priority' => 'medium',
                'title' => 'Body Condition Assessment',
                'description' => 'Have a veterinarian assess body condition score'
            ];
            return $result;
        }
        
        if ($bcs <= 3) { // Underweight
            $result['penalty'] = 20;
            $result['factors'][] = 'Poor body condition - underweight (-20)';
            $result['alerts'][] = [
                'type' => 'bcs_low',
                'priority' => 'high',
                'pet_id' => $pet['id'],
                'pet_name' => $pet['name'],
                'title' => 'Poor Body Condition',
                'description' => 'Body condition score indicates underweight condition'
            ];
        } elseif ($bcs >= 7) { // Overweight
            $result['penalty'] = 15;
            $result['factors'][] = 'Poor body condition - overweight (-15)';
            $result['alerts'][] = [
                'type' => 'bcs_high',
                'priority' => 'medium',
                'pet_id' => $pet['id'],
                'pet_name' => $pet['name'],
                'title' => 'Overweight Condition',
                'description' => 'Body condition score indicates overweight condition'
            ];
        } elseif ($bcs == 4 || $bcs == 5) { // Ideal
            $result['factors'][] = 'Ideal body condition (+0)';
        } else { // Slightly off ideal
            $result['penalty'] = 5;
            $result['factors'][] = 'Slightly off ideal body condition (-5)';
        }
        
        return $result;
    }
    
    /**
     * Assess age-related health factors
     */
    private function assessAgeRelatedHealth($pet)
    {
        $result = [
            'penalty' => 0,
            'factors' => [],
            'alerts' => [],
            'recommendations' => []
        ];
        
        $age = $pet['age'] ?? null;
        $species = strtolower($pet['species'] ?? 'dog');
        
        if (!$age) {
            $result['penalty'] = 5;
            $result['factors'][] = 'Age not recorded (-5)';
            return $result;
        }
        
        // Determine life stage
        $lifeStage = $this->getLifeStage($age, $species);
        
        switch ($lifeStage) {
            case 'senior':
                $result['factors'][] = 'Senior pet - requires special attention (+0)';
                $result['recommendations'][] = [
                    'type' => 'senior_care',
                    'priority' => 'medium',
                    'title' => 'Senior Pet Care',
                    'description' => 'Consider senior-specific health monitoring and nutrition'
                ];
                
                // Check for senior-specific health indicators
                if (!$this->hasRecentVetVisit($pet['id'], 180)) { // 6 months
                    $result['penalty'] = 15;
                    $result['factors'][] = 'Senior pet without recent vet visit (-15)';
                    $result['alerts'][] = [
                        'type' => 'senior_checkup',
                        'priority' => 'high',
                        'pet_id' => $pet['id'],
                        'pet_name' => $pet['name'],
                        'title' => 'Senior Pet Checkup Due',
                        'description' => 'Senior pets need more frequent veterinary checkups'
                    ];
                }
                break;
                
            case 'adult':
                $result['factors'][] = 'Adult pet - maintain regular care (+0)';
                break;
                
            case 'young':
                $result['factors'][] = 'Young pet - ensure proper growth monitoring (+0)';
                $result['recommendations'][] = [
                    'type' => 'growth_monitoring',
                    'priority' => 'medium',
                    'title' => 'Growth Monitoring',
                    'description' => 'Monitor growth and development closely'
                ];
                break;
        }
        
        return $result;
    }
    
    /**
     * Assess veterinary care
     */
    private function assessVeterinaryCare($pet)
    {
        $result = [
            'penalty' => 0,
            'factors' => [],
            'alerts' => [],
            'recommendations' => []
        ];
        
        // Check for recent vet visits
        if (!$this->hasRecentVetVisit($pet['id'], 365)) { // 1 year
            $result['penalty'] = 15;
            $result['factors'][] = 'No vet visit in past year (-15)';
            $result['alerts'][] = [
                'type' => 'vet_visit_overdue',
                'priority' => 'high',
                'pet_id' => $pet['id'],
                'pet_name' => $pet['name'],
                'title' => 'Annual Checkup Overdue',
                'description' => 'Pet needs annual veterinary checkup'
            ];
            $result['recommendations'][] = [
                'type' => 'schedule_checkup',
                'priority' => 'high',
                'title' => 'Schedule Veterinary Checkup',
                'description' => 'Book annual health examination'
            ];
        } elseif (!$this->hasRecentVetVisit($pet['id'], 180)) { // 6 months
            $result['penalty'] = 5;
            $result['factors'][] = 'Vet visit due soon (-5)';
            $result['recommendations'][] = [
                'type' => 'checkup_reminder',
                'priority' => 'medium',
                'title' => 'Checkup Reminder',
                'description' => 'Consider scheduling next veterinary checkup'
            ];
        } else {
            $result['factors'][] = 'Recent vet visit recorded (+0)';
        }
        
        // Check vaccination status (if available)
        $vaccinationStatus = $this->getVaccinationStatus($pet['id']);
        if ($vaccinationStatus === 'overdue') {
            $result['penalty'] = 10;
            $result['factors'][] = 'Vaccinations overdue (-10)';
            $result['alerts'][] = [
                'type' => 'vaccination_overdue',
                'priority' => 'high',
                'pet_id' => $pet['id'],
                'pet_name' => $pet['name'],
                'title' => 'Vaccinations Overdue',
                'description' => 'Pet vaccinations need updating'
            ];
        }
        
        return $result;
    }
    
    /**
     * Assess activity and exercise
     */
    private function assessActivity($pet)
    {
        $result = [
            'penalty' => 0,
            'factors' => [],
            'alerts' => [],
            'recommendations' => []
        ];
        
        $activityLevel = strtolower($pet['activity_level'] ?? 'medium');
        $age = $pet['age'] ?? 0;
        $species = strtolower($pet['species'] ?? 'dog');
        
        // Age-appropriate activity assessment
        if ($age > 7 && $activityLevel === 'high') {
            $result['recommendations'][] = [
                'type' => 'senior_activity',
                'priority' => 'low',
                'title' => 'Senior Activity Adjustment',
                'description' => 'Consider adjusting exercise intensity for senior pet'
            ];
        } elseif ($age < 2 && $activityLevel === 'low') {
            $result['penalty'] = 5;
            $result['factors'][] = 'Young pet with low activity (-5)';
            $result['recommendations'][] = [
                'type' => 'increase_activity',
                'priority' => 'medium',
                'title' => 'Increase Activity',
                'description' => 'Young pets benefit from more active play and exercise'
            ];
        }
        
        // Species-specific activity needs
        if ($species === 'dog' && $activityLevel === 'low') {
            $result['penalty'] = 3;
            $result['factors'][] = 'Low activity for dog breed (-3)';
            $result['recommendations'][] = [
                'type' => 'dog_exercise',
                'priority' => 'medium',
                'title' => 'Increase Dog Exercise',
                'description' => 'Dogs typically need regular walks and active play'
            ];
        }
        
        return $result;
    }
    
    /**
     * Calculate health trends over time
     */
    public function calculateHealthTrends($userId)
    {
        $trends = [
            'weight_trends' => [],
            'health_score_trend' => [],
            'vet_visit_frequency' => []
        ];
        
        try {
            // Get weight trends for all pets
            $stmt = $this->pdo->prepare("
                SELECT p.id, p.name, wl.weight, wl.recorded_date
                FROM pets p
                LEFT JOIN pet_weight_logs wl ON p.id = wl.pet_id
                WHERE p.user_id = ? AND wl.recorded_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                ORDER BY p.id, wl.recorded_date
            ");
            $stmt->execute([$userId]);
            $weightData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Process weight trends by pet
            $petWeights = [];
            foreach ($weightData as $record) {
                if (!isset($petWeights[$record['id']])) {
                    $petWeights[$record['id']] = [
                        'pet_name' => $record['name'],
                        'weights' => []
                    ];
                }
                $petWeights[$record['id']]['weights'][] = [
                    'weight' => $record['weight'],
                    'date' => $record['recorded_date']
                ];
            }
            
            foreach ($petWeights as $petId => $data) {
                if (count($data['weights']) >= 2) {
                    $firstWeight = reset($data['weights'])['weight'];
                    $lastWeight = end($data['weights'])['weight'];
                    $changePercent = (($lastWeight - $firstWeight) / $firstWeight) * 100;
                    
                    $trends['weight_trends'][] = [
                        'pet_id' => $petId,
                        'pet_name' => $data['pet_name'],
                        'change_percent' => round($changePercent, 1),
                        'trend' => $changePercent > 5 ? 'increasing' : ($changePercent < -5 ? 'decreasing' : 'stable'),
                        'data_points' => count($data['weights'])
                    ];
                }
            }
            
        } catch (Exception $e) {
            error_log('Error calculating health trends: ' . $e->getMessage());
        }
        
        return $trends;
    }
    
    /**
     * Helper methods
     */
    private function getUserPets($userId)
    {
        $stmt = $this->pdo->prepare("
            SELECT * FROM pets WHERE user_id = ? ORDER BY name
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getLifeStage($age, $species)
    {
        if ($species === 'dog') {
            if ($age < 1) return 'young';
            if ($age >= 7) return 'senior';
            return 'adult';
        } elseif ($species === 'cat') {
            if ($age < 1) return 'young';
            if ($age >= 7) return 'senior';
            return 'adult';
        }
        return 'adult';
    }
    
    private function hasRecentVetVisit($petId, $days)
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) FROM activities
                WHERE pet_id = ? AND type LIKE '%vet%' OR type LIKE '%checkup%'
                AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ");
            $stmt->execute([$petId, $days]);
            return $stmt->fetchColumn() > 0;
        } catch (Exception $e) {
            return false;
        }
    }
    
    private function getVaccinationStatus($petId)
    {
        // This would check vaccination records if available
        // For now, return null (unknown status)
        return null;
    }
    
    private function getWeightTrend($petId)
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT weight, recorded_date
                FROM pet_weight_logs
                WHERE pet_id = ?
                ORDER BY recorded_date DESC
                LIMIT 2
            ");
            $stmt->execute([$petId]);
            $weights = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($weights) >= 2) {
                $recent = $weights[0]['weight'];
                $previous = $weights[1]['weight'];
                $changePercent = (($recent - $previous) / $previous) * 100;
                
                return [
                    'change_percentage' => $changePercent,
                    'recent_weight' => $recent,
                    'previous_weight' => $previous
                ];
            }
        } catch (Exception $e) {
            // Ignore errors
        }
        
        return null;
    }
    
    private function getPetHealthTrends($petId)
    {
        // This would return historical health scores and trends
        // For now, return empty array
        return [];
    }
}