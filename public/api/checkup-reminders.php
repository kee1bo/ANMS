<?php
/**
 * Checkup Reminders API
 * Manages veterinary checkup reminders and scheduling
 */

session_start();

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include required files
require_once __DIR__ . '/../../src/includes/db_connect.php';
require_once __DIR__ . '/../../src/Application/Services/CheckupReminderService.php';
require_once __DIR__ . '/../../src/Infrastructure/Repository/ActivityRepository.php';

// Check authentication
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Authentication required'
    ]);
    exit();
}

try {
    $userId = $_SESSION['user_id'];
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? 'reminders';
    
    $reminderService = new CheckupReminderService($pdo);
    
    switch ($action) {
        case 'reminders':
            handleGetReminders($reminderService, $userId);
            break;
        case 'pet_status':
            handleGetPetStatus($reminderService, $userId);
            break;
        case 'create_reminder':
            handleCreateReminder($reminderService, $userId);
            break;
        case 'mark_completed':
            handleMarkCompleted($reminderService, $userId);
            break;
        case 'schedule_checkup':
            handleScheduleCheckup($reminderService, $userId);
            break;
        default:
            throw new Exception('Invalid action');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}

/**
 * Get checkup reminders for user
 */
function handleGetReminders($reminderService, $userId) {
    try {
        $reminders = $reminderService->getUserCheckupReminders($userId);
        
        echo json_encode([
            'success' => true,
            'reminders' => $reminders,
            'summary' => [
                'overdue_count' => count($reminders['overdue_checkups']),
                'upcoming_count' => count($reminders['upcoming_checkups']),
                'next_checkup_days' => $reminders['next_checkup_days'],
                'suggestions_count' => count($reminders['scheduling_suggestions'])
            ]
        ]);
        
    } catch (Exception $e) {
        throw new Exception('Failed to get reminders: ' . $e->getMessage());
    }
}

/**
 * Get checkup status for a specific pet
 */
function handleGetPetStatus($reminderService, $userId) {
    $petId = $_GET['pet_id'] ?? null;
    
    if (!$petId) {
        throw new Exception('Pet ID is required');
    }
    
    // Verify pet ownership
    $stmt = $GLOBALS['pdo']->prepare("SELECT id FROM pets WHERE id = ? AND user_id = ?");
    $stmt->execute([$petId, $userId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Pet not found or access denied'
        ]);
        return;
    }
    
    try {
        // Get pet data
        $stmt = $GLOBALS['pdo']->prepare("SELECT * FROM pets WHERE id = ?");
        $stmt->execute([$petId]);
        $pet = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$pet) {
            throw new Exception('Pet not found');
        }
        
        $status = $reminderService->calculatePetCheckupStatus($pet);
        
        echo json_encode([
            'success' => true,
            'pet_status' => $status
        ]);
        
    } catch (Exception $e) {
        throw new Exception('Failed to get pet status: ' . $e->getMessage());
    }
}

/**
 * Create a checkup reminder
 */
function handleCreateReminder($reminderService, $userId) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed'
        ]);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $petId = $input['pet_id'] ?? null;
    $reminderType = $input['reminder_type'] ?? 'checkup_due';
    $scheduledDate = $input['scheduled_date'] ?? null;
    
    if (!$petId) {
        throw new Exception('Pet ID is required');
    }
    
    // Verify pet ownership
    $stmt = $GLOBALS['pdo']->prepare("SELECT id FROM pets WHERE id = ? AND user_id = ?");
    $stmt->execute([$petId, $userId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Pet not found or access denied'
        ]);
        return;
    }
    
    try {
        $reminder = $reminderService->createCheckupReminder($petId, $reminderType, $scheduledDate);
        
        if ($reminder) {
            echo json_encode([
                'success' => true,
                'reminder' => $reminder->toArray(),
                'message' => 'Checkup reminder created successfully'
            ]);
        } else {
            throw new Exception('Failed to create reminder');
        }
        
    } catch (Exception $e) {
        throw new Exception('Failed to create reminder: ' . $e->getMessage());
    }
}

/**
 * Mark checkup as completed
 */
function handleMarkCompleted($reminderService, $userId) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed'
        ]);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $petId = $input['pet_id'] ?? null;
    $checkupDate = $input['checkup_date'] ?? null;
    $notes = $input['notes'] ?? '';
    
    if (!$petId) {
        throw new Exception('Pet ID is required');
    }
    
    // Verify pet ownership
    $stmt = $GLOBALS['pdo']->prepare("SELECT id FROM pets WHERE id = ? AND user_id = ?");
    $stmt->execute([$petId, $userId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Pet not found or access denied'
        ]);
        return;
    }
    
    try {
        $activity = $reminderService->markCheckupCompleted($petId, $checkupDate, $notes);
        
        if ($activity) {
            // Trigger dashboard update
            triggerDashboardUpdate($userId, 'health_checkup');
            
            echo json_encode([
                'success' => true,
                'activity' => $activity->toArray(),
                'message' => 'Checkup marked as completed successfully'
            ]);
        } else {
            throw new Exception('Failed to mark checkup as completed');
        }
        
    } catch (Exception $e) {
        throw new Exception('Failed to mark checkup completed: ' . $e->getMessage());
    }
}

/**
 * Schedule a checkup (placeholder for future integration)
 */
function handleScheduleCheckup($reminderService, $userId) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed'
        ]);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $petId = $input['pet_id'] ?? null;
    $scheduledDate = $input['scheduled_date'] ?? null;
    $vetClinic = $input['vet_clinic'] ?? '';
    $notes = $input['notes'] ?? '';
    
    if (!$petId || !$scheduledDate) {
        throw new Exception('Pet ID and scheduled date are required');
    }
    
    // Verify pet ownership
    $stmt = $GLOBALS['pdo']->prepare("SELECT id FROM pets WHERE id = ? AND user_id = ?");
    $stmt->execute([$petId, $userId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Pet not found or access denied'
        ]);
        return;
    }
    
    try {
        // Create a scheduled checkup reminder
        $reminder = $reminderService->createCheckupReminder($petId, 'checkup_scheduled', $scheduledDate);
        
        // Log the scheduling activity
        $activityRepo = new ActivityRepository($GLOBALS['pdo']);
        $petName = getPetName($GLOBALS['pdo'], $petId);
        
        $activity = $activityRepo->create([
            'user_id' => $userId,
            'type' => 'checkup_scheduled',
            'description' => "Scheduled veterinary checkup for {$petName} on " . date('M j, Y', strtotime($scheduledDate)),
            'pet_id' => $petId,
            'metadata' => json_encode([
                'scheduled_date' => $scheduledDate,
                'vet_clinic' => $vetClinic,
                'notes' => $notes,
                'pet_name' => $petName
            ])
        ]);
        
        // Trigger dashboard update
        triggerDashboardUpdate($userId, 'checkup_scheduled');
        
        echo json_encode([
            'success' => true,
            'reminder' => $reminder ? $reminder->toArray() : null,
            'activity' => $activity->toArray(),
            'message' => 'Checkup scheduled successfully'
        ]);
        
    } catch (Exception $e) {
        throw new Exception('Failed to schedule checkup: ' . $e->getMessage());
    }
}

/**
 * Helper functions
 */
function getPetName($pdo, $petId) {
    if (!$petId) return 'Unknown Pet';
    
    try {
        $stmt = $pdo->prepare("SELECT name FROM pets WHERE id = ?");
        $stmt->execute([$petId]);
        $name = $stmt->fetchColumn();
        return $name ?: "Pet #{$petId}";
    } catch (Exception $e) {
        return "Pet #{$petId}";
    }
}

function triggerDashboardUpdate($userId, $updateType = 'general') {
    try {
        // Clear any cached dashboard statistics
        $cacheKey = "dashboard_stats_{$userId}";
        
        // Log the update trigger
        error_log("Dashboard update triggered for user {$userId}, type: {$updateType}");
        
        // In a real-time system, this could trigger WebSocket updates
        // or publish to a message queue for dashboard refresh
        
    } catch (Exception $e) {
        error_log('Failed to trigger dashboard update: ' . $e->getMessage());
    }
}
?>