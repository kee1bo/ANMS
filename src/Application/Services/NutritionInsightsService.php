<?php

/**
 * Nutrition Insights Service
 * Provides intelligent insights and recommendations based on nutrition data
 */
class NutritionInsightsService
{
    private $pdo;
    
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }
    
    /**
     * Get comprehensive nutrition insights for a user's pets
     */
    public function getUserNutritionInsights($userId)
    {
        $insights = [
            'meal_reminders' => $this->getUpcomingMealReminders($userId),
            'health_scores' => $this->calculateNutritionHealthScores($userId),
            'recommendations' => $this->getNutritionRecommendations($userId),
            'compliance_metrics' => $this->getComplianceMetrics($userId),
            'trends' => $this->getNutritionTrends($userId)
        ];
        
        return $insights;
    }
    
    /**
     * Get upcoming meal reminders based on nutrition plans
     */
    public function getUpcomingMealReminders($userId)
    {
        $reminders = [];
        
        try {
            // Get pets with active nutrition plans
            $stmt = $this->pdo->prepare("
                SELECT p.id, p.name, p.species, np.meals_per_day, np.special_instructions
                FROM pets p
                JOIN nutrition_plans np ON p.id = np.pet_id
                WHERE p.user_id = ?
                ORDER BY p.name
            ");
            $stmt->execute([$userId]);
            $pets = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $currentTime = new DateTime();
            $today = $currentTime->format('Y-m-d');
            
            foreach ($pets as $pet) {
                $specialInstructions = json_decode($pet['special_instructions'], true);
                $feedingSchedule = $specialInstructions['feeding_schedule'] ?? $this->getDefaultSchedule($pet['meals_per_day']);
                
                foreach ($feedingSchedule as $mealTime) {
                    $mealDateTime = DateTime::createFromFormat('Y-m-d H:i', $today . ' ' . $mealTime);
                    
                    if ($mealDateTime > $currentTime) {
                        $timeDiff = $currentTime->diff($mealDateTime);
                        $minutesUntil = ($timeDiff->h * 60) + $timeDiff->i;
                        
                        // Only include reminders for the next 4 hours
                        if ($minutesUntil <= 240) {
                            $reminders[] = [
                                'pet_id' => $pet['id'],
                                'pet_name' => $pet['name'],
                                'pet_species' => $pet['species'],
                                'meal_time' => $mealTime,
                                'minutes_until' => $minutesUntil,
                                'formatted_time' => $mealDateTime->format('g:i A'),
                                'urgency' => $this->getMealUrgency($minutesUntil)
                            ];
                        }
                    }
                }
            }
            
            // Sort by urgency and time
            usort($reminders, function($a, $b) {
                return $a['minutes_until'] - $b['minutes_until'];
            });
            
        } catch (Exception $e) {
            error_log('Error getting meal reminders: ' . $e->getMessage());
        }
        
        return array_slice($reminders, 0, 5); // Limit to 5 upcoming reminders
    }
    
    /**
     * Calculate health scores based on nutrition compliance
     */
    public function calculateNutritionHealthScores($userId)
    {
        $scores = [];
        
        try {
            $stmt = $this->pdo->prepare("
                SELECT p.id, p.name, p.species, p.age, p.weight, p.ideal_weight,
                       np.daily_calories, np.meals_per_day, np.created_at, np.updated_at
                FROM pets p
                LEFT JOIN nutrition_plans np ON p.id = np.pet_id
                WHERE p.user_id = ?
            ");
            $stmt->execute([$userId]);
            $pets = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($pets as $pet) {
                $score = $this->calculateIndividualHealthScore($pet);
                $scores[] = [
                    'pet_id' => $pet['id'],
                    'pet_name' => $pet['name'],
                    'health_score' => $score['score'],
                    'score_factors' => $score['factors'],
                    'recommendations' => $score['recommendations']
                ];
            }
            
        } catch (Exception $e) {
            error_log('Error calculating health scores: ' . $e->getMessage());
        }
        
        return $scores;
    }
    
    /**
     * Calculate individual pet health score
     */
    private function calculateIndividualHealthScore($pet)
    {
        $score = 100;
        $factors = [];
        $recommendations = [];
        
        // Factor 1: Nutrition plan existence (20 points)
        if (!$pet['daily_calories']) {
            $score -= 20;
            $factors[] = 'No nutrition plan (-20)';
            $recommendations[] = 'Create a nutrition plan for optimal health';
        } else {
            $factors[] = 'Has nutrition plan (+0)';
        }
        
        // Factor 2: Weight management (25 points)
        if ($pet['weight'] && $pet['ideal_weight']) {
            $weightRatio = $pet['weight'] / $pet['ideal_weight'];
            if ($weightRatio > 1.15) { // More than 15% overweight
                $score -= 25;
                $factors[] = 'Significantly overweight (-25)';
                $recommendations[] = 'Consider weight management program';
            } elseif ($weightRatio > 1.05) { // 5-15% overweight
                $score -= 10;
                $factors[] = 'Slightly overweight (-10)';
                $recommendations[] = 'Monitor portion sizes and increase activity';
            } elseif ($weightRatio < 0.85) { // More than 15% underweight
                $score -= 20;
                $factors[] = 'Underweight (-20)';
                $recommendations[] = 'Increase caloric intake and consult vet';
            } else {
                $factors[] = 'Healthy weight (+0)';
            }
        }
        
        // Factor 3: Plan freshness (15 points)
        if ($pet['updated_at']) {
            $planAge = (time() - strtotime($pet['updated_at'])) / (24 * 60 * 60); // days
            if ($planAge > 90) {
                $score -= 15;
                $factors[] = 'Nutrition plan outdated (-15)';
                $recommendations[] = 'Update nutrition plan - it\'s over 3 months old';
            } elseif ($planAge > 30) {
                $score -= 5;
                $factors[] = 'Nutrition plan aging (-5)';
                $recommendations[] = 'Consider reviewing nutrition plan';
            }
        }
        
        // Factor 4: Age-appropriate nutrition (15 points)
        if ($pet['age']) {
            $ageGroup = $this->getAgeGroup($pet['age'], $pet['species']);
            $mealsPerDay = $pet['meals_per_day'] ?? 2;
            
            if ($ageGroup === 'puppy' && $mealsPerDay < 3) {
                $score -= 10;
                $factors[] = 'Insufficient meals for young pet (-10)';
                $recommendations[] = 'Young pets need 3+ meals per day';
            } elseif ($ageGroup === 'senior' && $mealsPerDay < 2) {
                $score -= 5;
                $factors[] = 'Consider more frequent meals for senior pet (-5)';
                $recommendations[] = 'Senior pets benefit from smaller, frequent meals';
            }
        }
        
        // Factor 5: Recent activity (10 points)
        $recentActivity = $this->getRecentNutritionActivity($pet['id']);
        if ($recentActivity < 1) { // No activity in last 7 days
            $score -= 10;
            $factors[] = 'No recent nutrition tracking (-10)';
            $recommendations[] = 'Log meals and track nutrition regularly';
        }
        
        // Ensure score doesn't go below 0
        $score = max(0, $score);
        
        return [
            'score' => $score,
            'factors' => $factors,
            'recommendations' => $recommendations
        ];
    }
    
    /**
     * Get nutrition recommendations for user's pets
     */
    public function getNutritionRecommendations($userId)
    {
        $recommendations = [];
        
        try {
            $stmt = $this->pdo->prepare("
                SELECT p.id, p.name, p.species, p.age, p.weight, p.ideal_weight,
                       p.activity_level, np.daily_calories, np.updated_at
                FROM pets p
                LEFT JOIN nutrition_plans np ON p.id = np.pet_id
                WHERE p.user_id = ?
            ");
            $stmt->execute([$userId]);
            $pets = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($pets as $pet) {
                $petRecommendations = $this->generatePetRecommendations($pet);
                if (!empty($petRecommendations)) {
                    $recommendations[] = [
                        'pet_id' => $pet['id'],
                        'pet_name' => $pet['name'],
                        'recommendations' => $petRecommendations
                    ];
                }
            }
            
        } catch (Exception $e) {
            error_log('Error getting recommendations: ' . $e->getMessage());
        }
        
        return $recommendations;
    }
    
    /**
     * Generate recommendations for a specific pet
     */
    private function generatePetRecommendations($pet)
    {
        $recommendations = [];
        
        // Check if pet needs nutrition plan
        if (!$pet['daily_calories']) {
            $recommendations[] = [
                'type' => 'create_plan',
                'priority' => 'high',
                'title' => 'Create Nutrition Plan',
                'description' => 'Set up a personalized nutrition plan to ensure optimal health',
                'action' => 'calculate_nutrition',
                'icon' => 'fa-calculator'
            ];
        }
        
        // Check for weight management needs
        if ($pet['weight'] && $pet['ideal_weight']) {
            $weightRatio = $pet['weight'] / $pet['ideal_weight'];
            if ($weightRatio > 1.1) {
                $recommendations[] = [
                    'type' => 'weight_management',
                    'priority' => 'medium',
                    'title' => 'Weight Management',
                    'description' => 'Consider reducing portions or increasing activity',
                    'action' => 'update_nutrition',
                    'icon' => 'fa-weight'
                ];
            }
        }
        
        // Check for plan updates based on age
        if ($pet['updated_at']) {
            $planAge = (time() - strtotime($pet['updated_at'])) / (24 * 60 * 60);
            if ($planAge > 90) {
                $recommendations[] = [
                    'type' => 'update_plan',
                    'priority' => 'medium',
                    'title' => 'Update Nutrition Plan',
                    'description' => 'Your pet\'s nutrition plan is over 3 months old',
                    'action' => 'recalculate_nutrition',
                    'icon' => 'fa-sync'
                ];
            }
        }
        
        // Age-specific recommendations
        if ($pet['age']) {
            $ageGroup = $this->getAgeGroup($pet['age'], $pet['species']);
            if ($ageGroup === 'senior' && !$this->hasSpecialDiet($pet['id'])) {
                $recommendations[] = [
                    'type' => 'senior_diet',
                    'priority' => 'low',
                    'title' => 'Senior Pet Nutrition',
                    'description' => 'Consider senior-specific nutrition for joint and organ health',
                    'action' => 'explore_senior_options',
                    'icon' => 'fa-heart'
                ];
            }
        }
        
        return $recommendations;
    }
    
    /**
     * Get compliance metrics for nutrition plans
     */
    public function getComplianceMetrics($userId)
    {
        $metrics = [
            'overall_compliance' => 0,
            'pets_with_plans' => 0,
            'total_pets' => 0,
            'recent_activity_score' => 0,
            'plan_freshness_score' => 0
        ];
        
        try {
            // Get total pets
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM pets WHERE user_id = ?");
            $stmt->execute([$userId]);
            $metrics['total_pets'] = $stmt->fetchColumn();
            
            // Get pets with nutrition plans
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) FROM pets p
                JOIN nutrition_plans np ON p.id = np.pet_id
                WHERE p.user_id = ?
            ");
            $stmt->execute([$userId]);
            $metrics['pets_with_plans'] = $stmt->fetchColumn();
            
            // Calculate compliance percentage
            if ($metrics['total_pets'] > 0) {
                $metrics['overall_compliance'] = round(($metrics['pets_with_plans'] / $metrics['total_pets']) * 100);
            }
            
            // Get recent activity score (activities in last 7 days)
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) FROM activities
                WHERE user_id = ? AND type LIKE '%nutrition%' OR type LIKE '%meal%'
                AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ");
            $stmt->execute([$userId]);
            $recentActivities = $stmt->fetchColumn();
            $metrics['recent_activity_score'] = min(100, $recentActivities * 10); // 10 points per activity, max 100
            
            // Get plan freshness score
            $stmt = $this->pdo->prepare("
                SELECT AVG(DATEDIFF(NOW(), np.updated_at)) as avg_age
                FROM pets p
                JOIN nutrition_plans np ON p.id = np.pet_id
                WHERE p.user_id = ?
            ");
            $stmt->execute([$userId]);
            $avgAge = $stmt->fetchColumn();
            
            if ($avgAge !== null) {
                // Score decreases as plans get older (100 for fresh, 0 for 90+ days old)
                $metrics['plan_freshness_score'] = max(0, 100 - ($avgAge * 1.11)); // 1.11 to reach 0 at 90 days
            }
            
        } catch (Exception $e) {
            error_log('Error calculating compliance metrics: ' . $e->getMessage());
        }
        
        return $metrics;
    }
    
    /**
     * Get nutrition trends over time
     */
    public function getNutritionTrends($userId)
    {
        $trends = [
            'activity_trend' => [],
            'plan_updates' => [],
            'weight_trends' => []
        ];
        
        try {
            // Get activity trend for last 30 days
            $stmt = $this->pdo->prepare("
                SELECT DATE(created_at) as date, COUNT(*) as count
                FROM activities
                WHERE user_id = ? AND (type LIKE '%nutrition%' OR type LIKE '%meal%')
                AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date
            ");
            $stmt->execute([$userId]);
            $trends['activity_trend'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get plan update history
            $stmt = $this->pdo->prepare("
                SELECT p.name as pet_name, np.updated_at, np.daily_calories
                FROM pets p
                JOIN nutrition_plans np ON p.id = np.pet_id
                WHERE p.user_id = ?
                ORDER BY np.updated_at DESC
                LIMIT 10
            ");
            $stmt->execute([$userId]);
            $trends['plan_updates'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            error_log('Error getting nutrition trends: ' . $e->getMessage());
        }
        
        return $trends;
    }
    
    /**
     * Helper methods
     */
    private function getDefaultSchedule($mealsPerDay)
    {
        switch ($mealsPerDay) {
            case 1: return ['08:00'];
            case 2: return ['08:00', '18:00'];
            case 3: return ['08:00', '13:00', '18:00'];
            case 4: return ['07:00', '12:00', '17:00', '21:00'];
            default: return ['08:00', '18:00'];
        }
    }
    
    private function getMealUrgency($minutesUntil)
    {
        if ($minutesUntil <= 15) return 'urgent';
        if ($minutesUntil <= 60) return 'soon';
        return 'upcoming';
    }
    
    private function getAgeGroup($age, $species)
    {
        $species = strtolower($species);
        if ($species === 'dog') {
            if ($age < 1) return 'puppy';
            if ($age >= 7) return 'senior';
            return 'adult';
        } elseif ($species === 'cat') {
            if ($age < 1) return 'kitten';
            if ($age >= 7) return 'senior';
            return 'adult';
        }
        return 'adult';
    }
    
    private function getRecentNutritionActivity($petId)
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) FROM activities
                WHERE pet_id = ? AND (type LIKE '%nutrition%' OR type LIKE '%meal%')
                AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ");
            $stmt->execute([$petId]);
            return $stmt->fetchColumn();
        } catch (Exception $e) {
            return 0;
        }
    }
    
    private function hasSpecialDiet($petId)
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT special_instructions FROM nutrition_plans
                WHERE pet_id = ?
            ");
            $stmt->execute([$petId]);
            $instructions = $stmt->fetchColumn();
            
            if ($instructions) {
                $data = json_decode($instructions, true);
                return isset($data['special_diet']) && $data['special_diet'];
            }
        } catch (Exception $e) {
            // Ignore errors
        }
        
        return false;
    }
}