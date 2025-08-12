<?php
/**
 * Activity Domain Model
 * Represents user activities across the application for dashboard tracking
 */

class Activity
{
    private $id;
    private $userId;
    private $type;
    private $description;
    private $timestamp;
    private $petId;
    private $metadata;
    
    public function __construct(array $data = [])
    {
        $this->id = $data['id'] ?? null;
        $this->userId = $data['user_id'] ?? null;
        $this->type = $data['type'] ?? '';
        $this->description = $data['description'] ?? '';
        $this->timestamp = $data['timestamp'] ?? date('Y-m-d H:i:s');
        $this->petId = $data['pet_id'] ?? null;
        $this->metadata = $data['metadata'] ?? [];
        
        // Ensure metadata is an array
        if (is_string($this->metadata)) {
            $this->metadata = json_decode($this->metadata, true) ?? [];
        }
    }
    
    // Getters
    public function getId(): ?int
    {
        return $this->id;
    }
    
    public function getUserId(): ?int
    {
        return $this->userId;
    }
    
    public function getType(): string
    {
        return $this->type;
    }
    
    public function getDescription(): string
    {
        return $this->description;
    }
    
    public function getTimestamp(): string
    {
        return $this->timestamp;
    }
    
    public function getPetId(): ?int
    {
        return $this->petId;
    }
    
    public function getMetadata(): array
    {
        return $this->metadata;
    }
    
    // Setters
    public function setId(int $id): void
    {
        $this->id = $id;
    }
    
    public function setUserId(int $userId): void
    {
        $this->userId = $userId;
    }
    
    public function setType(string $type): void
    {
        $this->type = $type;
    }
    
    public function setDescription(string $description): void
    {
        $this->description = $description;
    }
    
    public function setPetId(?int $petId): void
    {
        $this->petId = $petId;
    }
    
    public function setMetadata(array $metadata): void
    {
        $this->metadata = $metadata;
    }
    
    /**
     * Convert to array for API responses
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->userId,
            'type' => $this->type,
            'description' => $this->description,
            'timestamp' => $this->timestamp,
            'time_ago' => $this->getTimeAgo(),
            'pet_id' => $this->petId,
            'metadata' => $this->metadata,
            'icon' => $this->getIcon(),
            'color' => $this->getColor()
        ];
    }
    
    /**
     * Get human-readable time ago string
     */
    public function getTimeAgo(): string
    {
        $time = time() - strtotime($this->timestamp);
        
        if ($time < 60) return 'just now';
        if ($time < 3600) return floor($time/60) . ' minutes ago';
        if ($time < 86400) return floor($time/3600) . ' hours ago';
        if ($time < 2592000) return floor($time/86400) . ' days ago';
        if ($time < 31536000) return floor($time/2592000) . ' months ago';
        return floor($time/31536000) . ' years ago';
    }
    
    /**
     * Get icon for activity type
     */
    public function getIcon(): string
    {
        $icons = [
            'pet_added' => 'fas fa-plus',
            'pet_updated' => 'fas fa-edit',
            'pet_deleted' => 'fas fa-trash',
            'weight_logged' => 'fas fa-weight',
            'health_updated' => 'fas fa-heartbeat',
            'nutrition_calculated' => 'fas fa-calculator',
            'meal_planned' => 'fas fa-calendar-alt',
            'photo_uploaded' => 'fas fa-camera',
            'checkup_scheduled' => 'fas fa-calendar-check',
            'medication_added' => 'fas fa-pills',
            'allergy_added' => 'fas fa-exclamation-triangle',
            'profile_updated' => 'fas fa-user-edit',
            'report_generated' => 'fas fa-chart-bar'
        ];
        
        return $icons[$this->type] ?? 'fas fa-info-circle';
    }
    
    /**
     * Get color for activity type
     */
    public function getColor(): string
    {
        $colors = [
            'pet_added' => 'success',
            'pet_updated' => 'info',
            'pet_deleted' => 'danger',
            'weight_logged' => 'primary',
            'health_updated' => 'warning',
            'nutrition_calculated' => 'info',
            'meal_planned' => 'success',
            'photo_uploaded' => 'info',
            'checkup_scheduled' => 'warning',
            'medication_added' => 'danger',
            'allergy_added' => 'warning',
            'profile_updated' => 'info',
            'report_generated' => 'primary'
        ];
        
        return $colors[$this->type] ?? 'secondary';
    }
    
    /**
     * Create activity from action data
     */
    public static function create(string $type, int $userId, array $data): self
    {
        $descriptions = [
            'pet_added' => 'Added new pet: ' . ($data['pet_name'] ?? 'Unknown'),
            'pet_updated' => 'Updated pet: ' . ($data['pet_name'] ?? 'Unknown'),
            'pet_deleted' => 'Removed pet: ' . ($data['pet_name'] ?? 'Unknown'),
            'weight_logged' => 'Logged weight for ' . ($data['pet_name'] ?? 'pet') . ': ' . ($data['weight'] ?? '0') . 'kg',
            'health_updated' => 'Updated health records for ' . ($data['pet_name'] ?? 'pet'),
            'nutrition_calculated' => 'Calculated nutrition plan for ' . ($data['pet_name'] ?? 'pet'),
            'meal_planned' => 'Created meal plan for ' . ($data['pet_name'] ?? 'pet'),
            'photo_uploaded' => 'Uploaded photo for ' . ($data['pet_name'] ?? 'pet'),
            'checkup_scheduled' => 'Scheduled checkup for ' . ($data['pet_name'] ?? 'pet'),
            'medication_added' => 'Added medication for ' . ($data['pet_name'] ?? 'pet'),
            'allergy_added' => 'Added allergy information for ' . ($data['pet_name'] ?? 'pet'),
            'profile_updated' => 'Updated profile information',
            'report_generated' => 'Generated health report for ' . ($data['pet_name'] ?? 'pet')
        ];
        
        return new self([
            'user_id' => $userId,
            'type' => $type,
            'description' => $descriptions[$type] ?? 'Performed action: ' . $type,
            'pet_id' => $data['pet_id'] ?? null,
            'metadata' => $data
        ]);
    }
    
    /**
     * Validate activity data
     */
    public function validate(): array
    {
        $errors = [];
        
        if (empty($this->userId)) {
            $errors[] = 'User ID is required';
        }
        
        if (empty($this->type)) {
            $errors[] = 'Activity type is required';
        }
        
        if (empty($this->description)) {
            $errors[] = 'Activity description is required';
        }
        
        return $errors;
    }
}
?>