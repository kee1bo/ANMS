<?php
/**
 * Activity Repository
 * Handles database operations for activity tracking
 */

require_once __DIR__ . '/../../Domain/Activity.php';

class ActivityRepository
{
    private $pdo;
    
    public function __construct($pdo = null)
    {
        $this->pdo = $pdo ?? $GLOBALS['pdo'];
        $this->ensureTableExists();
    }
    
    /**
     * Create activities table if it doesn't exist
     */
    private function ensureTableExists(): void
    {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type VARCHAR(50) NOT NULL,
                description TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                pet_id INTEGER NULL,
                metadata TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
            )";
            
            $this->pdo->exec($sql);
            
            // Create indexes for better performance
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_activities_pet_id ON activities(pet_id)");
            
        } catch (PDOException $e) {
            error_log("Error creating activities table: " . $e->getMessage());
        }
    }
    
    /**
     * Create a new activity
     */
    public function create(Activity $activity): Activity
    {
        try {
            $sql = "INSERT INTO activities (user_id, type, description, timestamp, pet_id, metadata) 
                    VALUES (?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $activity->getUserId(),
                $activity->getType(),
                $activity->getDescription(),
                $activity->getTimestamp(),
                $activity->getPetId(),
                json_encode($activity->getMetadata())
            ]);
            
            $activity->setId($this->pdo->lastInsertId());
            
            return $activity;
            
        } catch (PDOException $e) {
            error_log("Error creating activity: " . $e->getMessage());
            throw new Exception("Failed to create activity");
        }
    }
    
    /**
     * Find activities by user ID
     */
    public function findByUserId(int $userId, int $limit = 10, int $offset = 0): array
    {
        try {
            $sql = "SELECT * FROM activities 
                    WHERE user_id = ? 
                    ORDER BY timestamp DESC 
                    LIMIT ? OFFSET ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId, $limit, $offset]);
            
            $activities = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $activities[] = new Activity($row);
            }
            
            return $activities;
            
        } catch (PDOException $e) {
            error_log("Error finding activities: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Find activities by type
     */
    public function findByType(int $userId, string $type, int $limit = 10): array
    {
        try {
            $sql = "SELECT * FROM activities 
                    WHERE user_id = ? AND type = ? 
                    ORDER BY timestamp DESC 
                    LIMIT ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId, $type, $limit]);
            
            $activities = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $activities[] = new Activity($row);
            }
            
            return $activities;
            
        } catch (PDOException $e) {
            error_log("Error finding activities by type: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Find activities by pet ID
     */
    public function findByPetId(int $userId, int $petId, int $limit = 10): array
    {
        try {
            $sql = "SELECT * FROM activities 
                    WHERE user_id = ? AND pet_id = ? 
                    ORDER BY timestamp DESC 
                    LIMIT ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId, $petId, $limit]);
            
            $activities = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $activities[] = new Activity($row);
            }
            
            return $activities;
            
        } catch (PDOException $e) {
            error_log("Error finding activities by pet: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get recent activities with pet names
     */
    public function getRecentActivitiesWithPetNames(int $userId, int $limit = 10): array
    {
        try {
            $sql = "SELECT a.*, p.name as pet_name 
                    FROM activities a 
                    LEFT JOIN pets p ON a.pet_id = p.id 
                    WHERE a.user_id = ? 
                    ORDER BY a.timestamp DESC 
                    LIMIT ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId, $limit]);
            
            $activities = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $activity = new Activity($row);
                $activityData = $activity->toArray();
                $activityData['pet_name'] = $row['pet_name'];
                $activities[] = $activityData;
            }
            
            return $activities;
            
        } catch (PDOException $e) {
            error_log("Error getting recent activities: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Count activities for a user
     */
    public function countByUserId(int $userId): int
    {
        try {
            $sql = "SELECT COUNT(*) FROM activities WHERE user_id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId]);
            
            return (int) $stmt->fetchColumn();
            
        } catch (PDOException $e) {
            error_log("Error counting activities: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Delete old activities (cleanup)
     */
    public function deleteOldActivities(int $daysOld = 90): int
    {
        try {
            $sql = "DELETE FROM activities 
                    WHERE timestamp < datetime('now', '-{$daysOld} days')";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            
            return $stmt->rowCount();
            
        } catch (PDOException $e) {
            error_log("Error deleting old activities: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Get activity statistics
     */
    public function getActivityStats(int $userId): array
    {
        try {
            // Activities by type
            $sql = "SELECT type, COUNT(*) as count 
                    FROM activities 
                    WHERE user_id = ? 
                    GROUP BY type 
                    ORDER BY count DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId]);
            $byType = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            
            // Activities by day (last 7 days)
            $sql = "SELECT date(timestamp) as date, COUNT(*) as count 
                    FROM activities 
                    WHERE user_id = ? 
                    AND timestamp >= datetime('now', '-7 days')
                    GROUP BY date(timestamp) 
                    ORDER BY date DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId]);
            $byDay = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            
            return [
                'by_type' => $byType,
                'by_day' => $byDay,
                'total' => $this->countByUserId($userId)
            ];
            
        } catch (PDOException $e) {
            error_log("Error getting activity stats: " . $e->getMessage());
            return [
                'by_type' => [],
                'by_day' => [],
                'total' => 0
            ];
        }
    }
    
    /**
     * Log activity helper method
     */
    public static function log(string $type, int $userId, array $data = []): bool
    {
        try {
            $repository = new self();
            $activity = Activity::create($type, $userId, $data);
            $repository->create($activity);
            return true;
            
        } catch (Exception $e) {
            error_log("Error logging activity: " . $e->getMessage());
            return false;
        }
    }
}
?>