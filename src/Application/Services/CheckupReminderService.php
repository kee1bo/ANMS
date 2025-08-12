<?php

/**
 * Checkup Reminder Service
 * Manages veterinary checkup reminders and scheduling suggestions
 */
class CheckupReminderService
{
    private $pdo;
    
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }
    
    /**
     * Get checkup reminders for a user's pets
     */
    public function getUserCheckupReminders($userId)
    {
        $reminders = [
            'overdue_checkups' => [],
            'upcoming_checkups' => [],
            'scheduling_suggestions' => [],
            'next_checkup_days' => null
        ];
        
        try {
            // Get all pets for the user
            $pets = $this->getUserPets($userId);
            
            if (empty($pets)) {
                return $reminders;
            }
            
            foreach ($pets as $pet) {
                $checkupInfo = $this->calculatePetCheckupStatus($pet);
                
                if ($checkupInfo['status'] === 'overdue') {
                    $reminders['overdue_checkups'][] = $checkupInfo;
                } elseif ($checkupInfo['status'] === 'due_soon') {
                    $reminders['upcoming_checkups'][] = $checkupInfo;
                }
                
                // Track the most urgent checkup
                if ($reminders['next_checkup_days'] === null || 
                    $checkupInfo['days_until_due'] < $reminders['next_checkup_days']) {
                    $reminders['next_checkup_days'] = $checkupInfo['days_until_due'];
                }
            }
            
            // Generate scheduling suggestions
            $reminders['scheduling_suggestions'] = $this->generateSchedulingSuggestions($reminders);
            
            // Sort by urgency
            usort($reminders['overdue_checkups'], function($a, $b) {
                return $a['days_until_due'] - $b['days_until_due'];
            });
            
            usort($reminders['upcoming_checkups'], function($a, $b) {
                return $a['days_until_due'] - $b['days_until_due'];
            });
            
        } catch (Exception $e) {
            error_log('Error getting checkup reminders: ' . $e->getMessage());
        }
        
        return $reminders;
    }
    
    /**
     * Calculate checkup status for a specific pet
     */
    public function calculatePetCheckupStatus($pet)
    {
        $checkupInfo = [
            'pet_id' => $pet['id'],
            'pet_name' => $pet['name'],
            'species' => $pet['species'] ?? 'dog',
            'age' => $pet['age'] ?? 0,
            'last_checkup_date' => null,
            'days_since_last_checkup' => null,
            'days_until_due' => 0,
            'recommended_frequency' => 365, // Default annual checkup
            'status' => 'current',
            'priority' => 'low',
            'recommendations' => []
        ];
        
        // Determine recommended checkup frequency based on age and species
        $checkupInfo['recommended_frequency'] = $this->getRecommendedCheckupFrequency($pet);
        
        // Get last checkup date
        $lastCheckup = $this->getLastCheckupDate($pet['id']);
        if ($lastCheckup) {
            $checkupInfo['last_checkup_date'] = $lastCheckup;
            $checkupInfo['days_since_last_checkup'] = $this->daysSince($lastCheckup);
            $checkupInfo['days_until_due'] = $checkupInfo['recommended_frequency'] - $checkupInfo['days_since_last_checkup'];
        } else {
            // Never had a checkup
            $checkupInfo['days_until_due'] = 0;
            $checkupInfo['days_since_last_checkup'] = 9999; // Very high number
        }
        
        // Determine status and priority
        if ($checkupInfo['days_until_due'] <= 0) {
            $checkupInfo['status'] = 'overdue';
            $checkupInfo['priority'] = $checkupInfo['days_until_due'] < -90 ? 'critical' : 'high';
        } elseif ($checkupInfo['days_until_due'] <= 30) {
            $checkupInfo['status'] = 'due_soon';
            $checkupInfo['priority'] = 'medium';
        } else {
            $checkupInfo['status'] = 'current';
            $checkupInfo['priority'] = 'low';
        }
        
        // Generate recommendations
        $checkupInfo['recommendations'] = $this->generateCheckupRecommendations($checkupInfo);
        
        return $checkupInfo;
    }
    
    /**
     * Get recommended checkup frequency based on pet characteristics
     */
    private function getRecommendedCheckupFrequency($pet)
    {
        $age = $pet['age'] ?? 0;
        $species = strtolower($pet['species'] ?? 'dog');
        
        // Senior pets need more frequent checkups
        if ($age >= 7) {
            return 180; // Every 6 months for senior pets
        }
        
        // Young pets (under 1 year) need more frequent checkups
        if ($age < 1) {
            return 120; // Every 4 months for puppies/kittens
        }
        
        // Adult pets
        return 365; // Annual checkups for adult pets
    }
    
    /**
     * Get the last checkup date for a pet
     */
    private function getLastCheckupDate($petId)
    {
        try {
            // Check activities table for vet visits
            $stmt = $this->pdo->prepare("
                SELECT MAX(created_at) as last_checkup
                FROM activities 
                WHERE pet_id = ? 
                AND (type LIKE '%vet%' OR type LIKE '%checkup%' OR type LIKE '%veterinary%')
            ");
            $stmt->execute([$petId]);
            $result = $stmt->fetchColumn();
            
            if ($result) {
                return $result;
            }
            
            // Check health_records table if it exists
            if ($this->tableExists('health_records')) {
                $stmt = $this->pdo->prepare("
                    SELECT MAX(recorded_date) as last_checkup
                    FROM health_records 
                    WHERE pet_id = ? 
                    AND record_type = 'vet_visit'
                ");
                $stmt->execute([$petId]);
                $result = $stmt->fetchColumn();
                
                if ($result) {
                    return $result;
                }
            }
            
            return null;
            
        } catch (Exception $e) {
            error_log('Error getting last checkup date: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Generate checkup recommendations based on pet status
     */
    private function generateCheckupRecommendations($checkupInfo)
    {
        $recommendations = [];
        
        switch ($checkupInfo['status']) {
            case 'overdue':
                if ($checkupInfo['priority'] === 'critical') {
                    $recommendations[] = [
                        'type' => 'urgent_checkup',
                        'title' => 'Urgent Veterinary Checkup Required',
                        'description' => 'This pet is significantly overdue for a checkup. Schedule immediately.',
                        'action' => 'schedule_urgent_checkup',
                        'priority' => 'critical'
                    ];
                } else {
                    $recommendations[] = [
                        'type' => 'overdue_checkup',
                        'title' => 'Checkup Overdue',
                        'description' => 'Schedule a veterinary checkup as soon as possible.',
                        'action' => 'schedule_checkup',
                        'priority' => 'high'
                    ];
                }
                break;
                
            case 'due_soon':
                $recommendations[] = [
                    'type' => 'upcoming_checkup',
                    'title' => 'Checkup Due Soon',
                    'description' => "Schedule a checkup within the next {$checkupInfo['days_until_due']} days.",
                    'action' => 'schedule_checkup',
                    'priority' => 'medium'
                ];
                break;
                
            case 'current':
                if ($checkupInfo['age'] >= 7) {
                    $recommendations[] = [
                        'type' => 'senior_monitoring',
                        'title' => 'Senior Pet Monitoring',
                        'description' => 'Consider more frequent checkups for senior pets.',
                        'action' => 'schedule_senior_checkup',
                        'priority' => 'low'
                    ];
                }
                break;
        }
        
        // Add age-specific recommendations
        if ($checkupInfo['age'] < 1) {
            $recommendations[] = [
                'type' => 'puppy_kitten_care',
                'title' => 'Young Pet Care',
                'description' => 'Ensure vaccination schedule is up to date.',
                'action' => 'check_vaccinations',
                'priority' => 'medium'
            ];
        }
        
        return $recommendations;
    }
    
    /**
     * Generate scheduling suggestions
     */
    private function generateSchedulingSuggestions($reminders)
    {
        $suggestions = [];
        
        $overdueCount = count($reminders['overdue_checkups']);
        $upcomingCount = count($reminders['upcoming_checkups']);
        
        if ($overdueCount > 0) {
            $suggestions[] = [
                'type' => 'batch_scheduling',
                'title' => 'Schedule Multiple Checkups',
                'description' => "You have {$overdueCount} overdue checkup" . ($overdueCount > 1 ? 's' : '') . ". Consider scheduling them together.",
                'action' => 'schedule_multiple_checkups',
                'priority' => 'high',
                'pet_count' => $overdueCount
            ];
        }
        
        if ($upcomingCount > 1) {
            $suggestions[] = [
                'type' => 'preventive_scheduling',
                'title' => 'Plan Ahead',
                'description' => "Schedule upcoming checkups in advance to ensure consistent care.",
                'action' => 'schedule_preventive_checkups',
                'priority' => 'medium',
                'pet_count' => $upcomingCount
            ];
        }
        
        // Seasonal suggestions
        $currentMonth = (int) date('n');
        if ($currentMonth >= 3 && $currentMonth <= 5) { // Spring
            $suggestions[] = [
                'type' => 'seasonal_checkup',
                'title' => 'Spring Health Check',
                'description' => 'Spring is a great time for preventive care and parasite prevention.',
                'action' => 'schedule_seasonal_checkup',
                'priority' => 'low'
            ];
        }
        
        return $suggestions;
    }
    
    /**
     * Create a checkup reminder notification
     */
    public function createCheckupReminder($petId, $reminderType = 'checkup_due', $scheduledDate = null)
    {
        try {
            // Get pet information
            $pet = $this->getPetById($petId);
            if (!$pet) {
                throw new Exception('Pet not found');
            }
            
            // Create activity for the reminder
            require_once __DIR__ . '/../../Infrastructure/Repository/ActivityRepository.php';
            $activityRepo = new ActivityRepository($this->pdo);
            
            $description = $this->getReminderDescription($reminderType, $pet['name'], $scheduledDate);
            
            $activity = $activityRepo->create([
                'user_id' => $pet['user_id'],
                'type' => 'checkup_reminder',
                'description' => $description,
                'pet_id' => $petId,
                'metadata' => json_encode([
                    'reminder_type' => $reminderType,
                    'scheduled_date' => $scheduledDate,
                    'pet_name' => $pet['name']
                ])
            ]);
            
            return $activity;
            
        } catch (Exception $e) {
            error_log('Error creating checkup reminder: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Mark a checkup as completed
     */
    public function markCheckupCompleted($petId, $checkupDate = null, $notes = '')
    {
        try {
            $checkupDate = $checkupDate ?: date('Y-m-d H:i:s');
            
            // Get pet information
            $pet = $this->getPetById($petId);
            if (!$pet) {
                throw new Exception('Pet not found');
            }
            
            // Create activity for completed checkup
            require_once __DIR__ . '/../../Infrastructure/Repository/ActivityRepository.php';
            $activityRepo = new ActivityRepository($this->pdo);
            
            $activity = $activityRepo->create([
                'user_id' => $pet['user_id'],
                'type' => 'vet_checkup_completed',
                'description' => "Completed veterinary checkup for {$pet['name']}",
                'pet_id' => $petId,
                'metadata' => json_encode([
                    'checkup_date' => $checkupDate,
                    'notes' => $notes,
                    'pet_name' => $pet['name']
                ])
            ]);
            
            return $activity;
            
        } catch (Exception $e) {
            error_log('Error marking checkup completed: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Helper methods
     */
    private function getUserPets($userId)
    {
        $stmt = $this->pdo->prepare("
            SELECT id, name, species, age, user_id, created_at
            FROM pets 
            WHERE user_id = ? 
            ORDER BY name
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getPetById($petId)
    {
        $stmt = $this->pdo->prepare("
            SELECT id, name, species, age, user_id, created_at
            FROM pets 
            WHERE id = ?
        ");
        $stmt->execute([$petId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    private function tableExists($tableName)
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
    
    private function daysSince($date)
    {
        $then = new DateTime($date);
        $now = new DateTime();
        return $now->diff($then)->days;
    }
    
    private function getReminderDescription($reminderType, $petName, $scheduledDate = null)
    {
        switch ($reminderType) {
            case 'checkup_overdue':
                return "Checkup reminder: {$petName} is overdue for a veterinary checkup";
            case 'checkup_due_soon':
                return "Checkup reminder: {$petName} has a checkup due soon";
            case 'checkup_scheduled':
                $dateStr = $scheduledDate ? date('M j, Y', strtotime($scheduledDate)) : 'soon';
                return "Checkup scheduled for {$petName} on {$dateStr}";
            default:
                return "Checkup reminder for {$petName}";
        }
    }
}