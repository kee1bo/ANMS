<?php
/**
 * Dashboard Service
 * Aggregates data from multiple sources for dashboard statistics and insights
 */

class DashboardService
{
    private $pdo;
    private $cacheManager;
    private $cachePrefix = 'dashboard_';
    private $cacheTtl = 300; // 5 minutes
    
    public function __construct($pdo = null)
    {
        $this->pdo = $pdo ?? $GLOBALS['pdo'];
        $this->cacheManager = new CacheManager();
    }
    
    /**
     * Get comprehensive dashboard statistics for a user
     */
    public function getDashboardStatistics(int $userId): array
    {
        $cacheKey = $this->cachePrefix . 'stats_' . $userId;
        
        // Try to get from cache first
        $cached = $this->cacheManager->get($cacheKey);
        if ($cached !== null) {
            return $cached;
        }
        
        // Calculate fresh statistics
        $stats = [
            'total_pets' => $this->calculatePetStatistics($userId),
            'nutrition' => $this->calculateNutritionStats($userId),
            'health' => $this->calculateHealthMetrics($userId),
            'activities' => $this->getActivitySummary($userId),
            'last_updated' => date('c')
        ];
        
        // Flatten structure for easier frontend consumption
        $flatStats = [
            'total_pets' => $stats['total_pets']['total'],
            'pets_this_month' => $stats['total_pets']['this_month'],
            'meals_today' => $stats['nutrition']['meals_today'],
            'upcoming_meals' => $stats['nutrition']['upcoming_meals'],
            'health_score' => $stats['health']['average_score'],
            'health_change' => $stats['health']['score_change'],
            'next_checkup' => $stats['health']['next_checkup_days'],
            'last_updated' => $stats['last_updated']
        ];
        
        // Cache the results
        $this->cacheManager->set($cacheKey, $flatStats, $this->cacheTtl);
        
        return $flatStats;
    }
    
    /**
     * Calculate pet-related statistics (optimized with single query)
     */
    public function calculatePetStatistics(int $userId): array
    {
        try {
            // Use optimized single query to get all pet statistics
            $stmt = $this->pdo->prepare("
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN datetime(created_at) >= datetime('now', '-1 month') THEN 1 ELSE 0 END) as this_month,
                    species,
                    COUNT(*) as species_count
                FROM pets 
                WHERE user_id = ? 
                GROUP BY species
                
                UNION ALL
                
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN datetime(created_at) >= datetime('now', '-1 month') THEN 1 ELSE 0 END) as this_month,
                    'TOTAL' as species,
                    0 as species_count
                FROM pets 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId, $userId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $stats = [
                'total' => 0,
                'this_month' => 0,
                'species_breakdown' => []
            ];
            
            foreach ($results as $row) {
                if ($row['species'] === 'TOTAL') {
                    // This is the total row
                    $stats['total'] = (int)$row['total'];
                    $stats['this_month'] = (int)$row['this_month'];
                } else {
                    // Individual species data
                    $stats['species_breakdown'][$row['species']] = (int)$row['species_count'];
                }
            }
            
            return $stats;
            
        } catch (Exception $e) {
            error_log("Error calculating pet statistics: " . $e->getMessage());
            return [
                'total' => 0,
                'this_month' => 0,
                'species_breakdown' => []
            ];
        }
    }
    
    /**
     * Calculate nutrition-related statistics
     */
    public function calculateNutritionStats(int $userId): array
    {
        try {
            $mealsToday = 0;
            $upcomingMeals = 0;
            
            // Check if nutrition_plans table exists
            if ($this->tableExists('nutrition_plans')) {
                // Get active nutrition plans for user's pets
                $stmt = $this->pdo->prepare(
                    "SELECT COALESCE(SUM(np.meals_per_day), 0) as meals_today
                     FROM nutrition_plans np
                     JOIN pets p ON p.id = np.pet_id
                     WHERE p.user_id = ?
                     AND date('now') >= date(np.active_from)
                     AND (np.active_until IS NULL OR date('now') <= date(np.active_until))"
                );
                $stmt->execute([$userId]);
                $mealsToday = (int) $stmt->fetchColumn();
                
                // For upcoming meals, we'll use the same value as a placeholder
                // In a real implementation, this would check scheduled vs completed meals
                $upcomingMeals = max(0, $mealsToday - 2); // Assume 2 meals already given
            }
            
            return [
                'meals_today' => $mealsToday,
                'upcoming_meals' => $upcomingMeals,
                'active_plans' => $this->getActivePlansCount($userId)
            ];
            
        } catch (Exception $e) {
            error_log("Error calculating nutrition statistics: " . $e->getMessage());
            return [
                'meals_today' => 0,
                'upcoming_meals' => 0,
                'active_plans' => 0
            ];
        }
    }
    
    /**
     * Calculate health-related metrics using HealthMetricsCalculator
     */
    public function calculateHealthMetrics(int $userId): array
    {
        try {
            // Use the comprehensive HealthMetricsCalculator
            require_once __DIR__ . '/HealthMetricsCalculator.php';
            $healthCalculator = new HealthMetricsCalculator($this->pdo);
            $healthMetrics = $healthCalculator->calculateUserHealthMetrics($userId);
            
            // Extract dashboard-specific metrics
            $averageScore = $healthMetrics['overall_health_score'] ?? 100;
            $alerts = $healthMetrics['health_alerts'] ?? [];
            $petScores = $healthMetrics['pet_health_scores'] ?? [];
            
            // Count pets needing attention (score < 80)
            $petsNeedingAttention = 0;
            foreach ($petScores as $petScore) {
                if ($petScore['health_score'] < 80) {
                    $petsNeedingAttention++;
                }
            }
            
            // Find next checkup from alerts
            $nextCheckupDays = $this->getNextCheckupFromAlerts($alerts, $userId);
            
            // Get health score change trend
            $scoreChange = $this->getHealthScoreChange($userId, $averageScore);
            
            return [
                'average_score' => $averageScore,
                'score_change' => $scoreChange,
                'next_checkup_days' => $nextCheckupDays,
                'pets_needing_attention' => $petsNeedingAttention,
                'critical_alerts' => count(array_filter($alerts, function($alert) {
                    return $alert['priority'] === 'critical';
                })),
                'high_alerts' => count(array_filter($alerts, function($alert) {
                    return $alert['priority'] === 'high';
                }))
            ];
            
        } catch (Exception $e) {
            error_log("Error calculating health metrics: " . $e->getMessage());
            
            // Fallback to basic calculation
            return $this->calculateBasicHealthMetrics($userId);
        }
    }
    
    /**
     * Fallback basic health metrics calculation
     */
    private function calculateBasicHealthMetrics(int $userId): array
    {
        try {
            // Get all pets for the user
            $stmt = $this->pdo->prepare(
                "SELECT id, weight, ideal_weight, body_condition_score 
                 FROM pets 
                 WHERE user_id = ?"
            );
            $stmt->execute([$userId]);
            $pets = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($pets)) {
                return [
                    'average_score' => 100,
                    'score_change' => 0,
                    'next_checkup_days' => 0,
                    'pets_needing_attention' => 0,
                    'critical_alerts' => 0,
                    'high_alerts' => 0
                ];
            }
            
            $scores = [];
            $nextCheckupDays = null;
            $petsNeedingAttention = 0;
            
            foreach ($pets as $pet) {
                $score = $this->calculatePetHealthScore($pet);
                $scores[] = $score;
                
                if ($score < 80) {
                    $petsNeedingAttention++;
                }
                
                // Calculate next checkup
                $checkupDays = $this->getNextCheckupDays($pet['id']);
                if ($nextCheckupDays === null || $checkupDays < $nextCheckupDays) {
                    $nextCheckupDays = $checkupDays;
                }
            }
            
            $averageScore = (int) round(array_sum($scores) / count($scores));
            $nextCheckupDays = $nextCheckupDays ?? 0;
            
            return [
                'average_score' => $averageScore,
                'score_change' => $this->getHealthScoreChange($userId, $averageScore),
                'next_checkup_days' => $nextCheckupDays,
                'pets_needing_attention' => $petsNeedingAttention,
                'critical_alerts' => $averageScore < 60 ? 1 : 0,
                'high_alerts' => $petsNeedingAttention
            ];
            
        } catch (Exception $e) {
            error_log("Error calculating basic health metrics: " . $e->getMessage());
            return [
                'average_score' => 100,
                'score_change' => 0,
                'next_checkup_days' => 0,
                'pets_needing_attention' => 0,
                'critical_alerts' => 0,
                'high_alerts' => 0
            ];
        }
    }
    
    /**
     * Extract next checkup days from health alerts
     */
    private function getNextCheckupFromAlerts(array $alerts, int $userId = null): int
    {
        $checkupAlerts = array_filter($alerts, function($alert) {
            return in_array($alert['type'], ['vet_visit_overdue', 'senior_checkup']);
        });
        
        if (!empty($checkupAlerts)) {
            // If there are overdue alerts, return 0 (overdue)
            foreach ($checkupAlerts as $alert) {
                if ($alert['type'] === 'vet_visit_overdue') {
                    return 0;
                }
            }
            // If senior checkup alert, return 30 days
            return 30;
        }
        
        // Try to get more accurate checkup data from CheckupReminderService
        if ($userId) {
            try {
                require_once __DIR__ . '/CheckupReminderService.php';
                $reminderService = new CheckupReminderService($this->pdo);
                $reminders = $reminderService->getUserCheckupReminders($userId);
                
                if ($reminders['next_checkup_days'] !== null) {
                    return $reminders['next_checkup_days'];
                }
            } catch (Exception $e) {
                error_log('Error getting checkup reminders: ' . $e->getMessage());
            }
        }
        
        // Default to 365 days if no alerts
        return 365;
    }
    
    /**
     * Calculate health score for a single pet
     */
    private function calculatePetHealthScore(array $pet): int
    {
        $score = 100;
        
        // Weight vs ideal weight penalty
        if (!empty($pet['weight']) && !empty($pet['ideal_weight']) && (float)$pet['ideal_weight'] > 0) {
            $ratio = (float)$pet['weight'] / (float)$pet['ideal_weight'];
            if ($ratio < 0.85 || $ratio > 1.15) {
                $score -= 15; // Significant weight deviation
            } elseif ($ratio < 0.9 || $ratio > 1.1) {
                $score -= 8; // Moderate weight deviation
            }
        }
        
        // Body condition score penalty
        if (!empty($pet['body_condition_score'])) {
            $bcs = (int)$pet['body_condition_score'];
            if ($bcs < 3 || $bcs > 7) {
                $score -= 12; // Poor body condition
            } elseif ($bcs < 4 || $bcs > 6) {
                $score -= 6; // Suboptimal body condition
            }
        }
        
        // Vet visit recency penalty
        if ($this->tableExists('health_records')) {
            $checkupDays = $this->getNextCheckupDays($pet['id']);
            if ($checkupDays <= 0) {
                $score -= 10; // Overdue for checkup
            } elseif ($checkupDays <= 30) {
                $score -= 5; // Due soon
            }
        }
        
        return max(0, min(100, $score));
    }
    
    /**
     * Get days until next recommended checkup
     */
    private function getNextCheckupDays(int $petId): int
    {
        if (!$this->tableExists('health_records')) {
            return 365; // Default if no health records table
        }
        
        try {
            $stmt = $this->pdo->prepare(
                "SELECT MAX(date(recorded_date)) as last_visit
                 FROM health_records 
                 WHERE pet_id = ? AND record_type = 'vet_visit'"
            );
            $stmt->execute([$petId]);
            $lastVisit = $stmt->fetchColumn();
            
            if ($lastVisit) {
                $daysSince = (new DateTime($lastVisit))->diff(new DateTime('now'))->days;
                return max(0, 365 - $daysSince);
            }
            
            return 0; // Never had a checkup, due now
            
        } catch (Exception $e) {
            return 365; // Default on error
        }
    }
    
    /**
     * Get health score change trend
     */
    private function getHealthScoreChange(int $userId, int $currentScore = null): int
    {
        try {
            // Try to get historical health score from cache or database
            $cacheKey = $this->cachePrefix . 'health_history_' . $userId;
            $history = $this->cacheManager->get($cacheKey);
            
            if ($history && isset($history['previous_score']) && $currentScore !== null) {
                $change = $currentScore - $history['previous_score'];
                
                // Update history with current score
                $this->cacheManager->set($cacheKey, [
                    'previous_score' => $currentScore,
                    'updated_at' => time()
                ], 86400); // 24 hours
                
                return max(-20, min(20, $change)); // Limit change to ±20
            }
            
            // First time or no history - store current score
            if ($currentScore !== null) {
                $this->cacheManager->set($cacheKey, [
                    'previous_score' => $currentScore,
                    'updated_at' => time()
                ], 86400);
            }
            
            return 0; // No change for first calculation
            
        } catch (Exception $e) {
            error_log("Error calculating health score change: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Get activity summary (optimized with single query)
     */
    public function getActivitySummary(int $userId): array
    {
        try {
            if (!$this->tableExists('activities')) {
                return [
                    'total_today' => 0,
                    'total_week' => 0
                ];
            }
            
            // Use single optimized query with conditional counting
            $stmt = $this->pdo->prepare("
                SELECT 
                    SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) as total_today,
                    SUM(CASE WHEN date(created_at) >= date('now', '-7 days') THEN 1 ELSE 0 END) as total_week
                FROM activities 
                WHERE user_id = ?
                AND created_at >= date('now', '-7 days')
            ");
            $stmt->execute([$userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return [
                'total_today' => (int)($result['total_today'] ?? 0),
                'total_week' => (int)($result['total_week'] ?? 0)
            ];
            
        } catch (Exception $e) {
            error_log("Error getting activity summary: " . $e->getMessage());
            return [
                'total_today' => 0,
                'total_week' => 0
            ];
        }
    }
    
    /**
     * Get count of active nutrition plans
     */
    private function getActivePlansCount(int $userId): int
    {
        if (!$this->tableExists('nutrition_plans')) {
            return 0;
        }
        
        try {
            $stmt = $this->pdo->prepare(
                "SELECT COUNT(*) FROM nutrition_plans np
                 JOIN pets p ON p.id = np.pet_id
                 WHERE p.user_id = ?
                 AND date('now') >= date(np.active_from)
                 AND (np.active_until IS NULL OR date('now') <= date(np.active_until))"
            );
            $stmt->execute([$userId]);
            return (int) $stmt->fetchColumn();
            
        } catch (Exception $e) {
            return 0;
        }
    }
    
    /**
     * Check if a table exists
     */
    private function tableExists(string $tableName): bool
    {
        try {
            $stmt = $this->pdo->prepare(
                "SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1"
            );
            $stmt->execute([$tableName]);
            return (bool) $stmt->fetchColumn();
        } catch (Exception $e) {
            return false;
        }
    }
    
    /**
     * Invalidate dashboard cache for a user
     */
    public function invalidateCache(int $userId): void
    {
        $cacheKey = $this->cachePrefix . 'stats_' . $userId;
        $this->cacheManager->delete($cacheKey);
    }
    
    /**
     * Get dashboard insights and recommendations
     */
    public function getDashboardInsights(int $userId): array
    {
        $stats = $this->getDashboardStatistics($userId);
        $insights = [];
        
        // Pet-related insights
        if ($stats['total_pets'] === 0) {
            $insights[] = [
                'type' => 'info',
                'icon' => 'fas fa-plus',
                'title' => 'Get Started',
                'message' => 'Add your first pet to start tracking their health and nutrition.',
                'action' => 'add_pet'
            ];
        }
        
        // Health insights
        if ($stats['health_score'] < 60) {
            $insights[] = [
                'type' => 'urgent',
                'icon' => 'fas fa-exclamation-triangle',
                'title' => 'Critical Health Issues',
                'message' => 'Your pets have critical health concerns that need immediate attention.',
                'action' => 'view_health_alerts'
            ];
        } elseif ($stats['health_score'] < 80) {
            $insights[] = [
                'type' => 'warning',
                'icon' => 'fas fa-heart',
                'title' => 'Health Attention Needed',
                'message' => 'Some of your pets may need health attention. Review their profiles.',
                'action' => 'view_health'
            ];
        }
        
        // Health score improvement
        if (isset($stats['health_change']) && $stats['health_change'] > 5) {
            $insights[] = [
                'type' => 'success',
                'icon' => 'fas fa-arrow-up',
                'title' => 'Health Improving',
                'message' => "Your pets' health scores have improved by {$stats['health_change']} points!",
                'action' => 'view_health_trends'
            ];
        } elseif (isset($stats['health_change']) && $stats['health_change'] < -5) {
            $insights[] = [
                'type' => 'warning',
                'icon' => 'fas fa-arrow-down',
                'title' => 'Health Declining',
                'message' => "Your pets' health scores have declined. Consider reviewing their care.",
                'action' => 'view_health_recommendations'
            ];
        }
        
        // Checkup reminders
        if ($stats['next_checkup'] <= 30 && $stats['next_checkup'] > 0) {
            $insights[] = [
                'type' => 'info',
                'icon' => 'fas fa-calendar',
                'title' => 'Checkup Due Soon',
                'message' => "A pet checkup is due in {$stats['next_checkup']} days.",
                'action' => 'schedule_checkup'
            ];
        } elseif ($stats['next_checkup'] <= 0) {
            $insights[] = [
                'type' => 'urgent',
                'icon' => 'fas fa-exclamation-triangle',
                'title' => 'Checkup Overdue',
                'message' => 'One or more pets are overdue for their veterinary checkup.',
                'action' => 'schedule_checkup'
            ];
        }
        
        // Nutrition insights
        if ($stats['total_pets'] > 0 && $stats['meals_today'] === 0) {
            $insights[] = [
                'type' => 'info',
                'icon' => 'fas fa-utensils',
                'title' => 'Plan Meals',
                'message' => 'Create nutrition plans for your pets to track their daily meals.',
                'action' => 'plan_nutrition'
            ];
        }
        
        return $insights;
    }
}

/**
 * Simple Cache Manager for dashboard data
 */
class CacheManager
{
    private $cacheDir;
    
    public function __construct()
    {
        $this->cacheDir = __DIR__ . '/../../data/cache/';
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }
    
    public function get(string $key)
    {
        $file = $this->cacheDir . md5($key) . '.cache';
        
        if (!file_exists($file)) {
            return null;
        }
        
        $data = unserialize(file_get_contents($file));
        
        if ($data['expires'] < time()) {
            unlink($file);
            return null;
        }
        
        return $data['value'];
    }
    
    public function set(string $key, $value, int $ttl = 300): void
    {
        $file = $this->cacheDir . md5($key) . '.cache';
        $data = [
            'value' => $value,
            'expires' => time() + $ttl
        ];
        
        file_put_contents($file, serialize($data));
    }
    
    public function delete(string $key): void
    {
        $file = $this->cacheDir . md5($key) . '.cache';
        if (file_exists($file)) {
            unlink($file);
        }
    }
}
?>