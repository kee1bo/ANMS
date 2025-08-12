<?php
/**
 * Health Conditions API
 * Manages pet health conditions with CRUD operations
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
    
    switch ($method) {
        case 'GET':
            handleGetConditions($pdo, $userId);
            break;
        case 'POST':
            handleCreateCondition($pdo, $userId);
            break;
        case 'PUT':
            handleUpdateCondition($pdo, $userId);
            break;
        case 'DELETE':
            handleDeleteCondition($pdo, $userId);
            break;
        default:
            throw new Exception('Method not allowed');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}

function handleGetConditions($pdo, $userId) {
    $petId = $_GET['pet_id'] ?? null;
    
    if (!$petId) {
        throw new Exception('Pet ID is required');
    }
    
    // Verify pet ownership
    $stmt = $pdo->prepare("SELECT id FROM pets WHERE id = ? AND user_id = ?");
    $stmt->execute([$petId, $userId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Pet not found or access denied'
        ]);
        return;
    }
    
    // Get health conditions
    $stmt = $pdo->prepare("
        SELECT 
            id,
            condition_name,
            severity,
            diagnosis_date,
            notes,
            status,
            created_at,
            updated_at
        FROM pet_health_conditions 
        WHERE pet_id = ? 
        ORDER BY 
            CASE WHEN status = 'active' THEN 0 ELSE 1 END,
            created_at DESC
    ");
    $stmt->execute([$petId]);
    $conditions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'conditions' => $conditions
    ]);
}

function handleCreateCondition($pdo, $userId) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $petId = $input['pet_id'] ?? null;
    $conditionName = trim($input['condition_name'] ?? '');
    $severity = $input['severity'] ?? null;
    $diagnosisDate = $input['diagnosis_date'] ?? null;
    $notes = trim($input['notes'] ?? '');
    $status = $input['status'] ?? 'active';
    
    // Validate required fields
    if (!$petId || !$conditionName || !$severity) {
        throw new Exception('Pet ID, condition name, and severity are required');
    }
    
    // Verify pet ownership
    $stmt = $pdo->prepare("SELECT id FROM pets WHERE id = ? AND user_id = ?");
    $stmt->execute([$petId, $userId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Pet not found or access denied'
        ]);
        return;
    }
    
    // Validate severity
    if (!in_array($severity, ['mild', 'moderate', 'severe'])) {
        throw new Exception('Invalid severity level');
    }
    
    // Validate status
    if (!in_array($status, ['active', 'resolved'])) {
        throw new Exception('Invalid status');
    }
    
    // Insert health condition
    $stmt = $pdo->prepare("
        INSERT INTO pet_health_conditions 
        (pet_id, condition_name, severity, diagnosis_date, notes, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    
    $stmt->execute([
        $petId,
        $conditionName,
        $severity,
        $diagnosisDate ?: null,
        $notes ?: null,
        $status
    ]);
    
    $conditionId = $pdo->lastInsertId();
    
    // Get the created condition
    $stmt = $pdo->prepare("
        SELECT 
            id,
            condition_name,
            severity,
            diagnosis_date,
            notes,
            status,
            created_at,
            updated_at
        FROM pet_health_conditions 
        WHERE id = ?
    ");
    $stmt->execute([$conditionId]);
    $condition = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Log activity
    try {
        $activityRepo = new ActivityRepository($pdo);
        $petName = getPetName($pdo, $petId);
        $activityRepo->create([
            'user_id' => $userId,
            'type' => 'health_condition_added',
            'description' => "Added health condition '{$conditionName}' for {$petName}",
            'pet_id' => $petId,
            'metadata' => json_encode([
                'condition_name' => $conditionName,
                'severity' => $severity,
                'status' => $status,
                'pet_name' => $petName
            ])
        ]);
        
        // Trigger dashboard health metrics update
        triggerDashboardUpdate($userId, 'health_metrics');
        
    } catch (Exception $e) {
        error_log('Failed to log health condition activity: ' . $e->getMessage());
    }
    
    echo json_encode([
        'success' => true,
        'condition' => $condition,
        'message' => 'Health condition added successfully'
    ]);
}

function handleUpdateCondition($pdo, $userId) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $conditionId = $input['condition_id'] ?? null;
    $conditionName = trim($input['condition_name'] ?? '');
    $severity = $input['severity'] ?? null;
    $diagnosisDate = $input['diagnosis_date'] ?? null;
    $notes = trim($input['notes'] ?? '');
    $status = $input['status'] ?? null;
    
    if (!$conditionId) {
        throw new Exception('Condition ID is required');
    }
    
    // Verify condition ownership through pet ownership
    $stmt = $pdo->prepare("
        SELECT hc.id 
        FROM pet_health_conditions hc
        JOIN pets p ON hc.pet_id = p.id
        WHERE hc.id = ? AND p.user_id = ?
    ");
    $stmt->execute([$conditionId, $userId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Condition not found or access denied'
        ]);
        return;
    }
    
    // Build update query dynamically
    $updateFields = [];
    $updateValues = [];
    
    if ($conditionName) {
        $updateFields[] = "condition_name = ?";
        $updateValues[] = $conditionName;
    }
    
    if ($severity && in_array($severity, ['mild', 'moderate', 'severe'])) {
        $updateFields[] = "severity = ?";
        $updateValues[] = $severity;
    }
    
    if ($diagnosisDate !== null) {
        $updateFields[] = "diagnosis_date = ?";
        $updateValues[] = $diagnosisDate ?: null;
    }
    
    if ($notes !== null) {
        $updateFields[] = "notes = ?";
        $updateValues[] = $notes ?: null;
    }
    
    if ($status && in_array($status, ['active', 'resolved'])) {
        $updateFields[] = "status = ?";
        $updateValues[] = $status;
    }
    
    if (empty($updateFields)) {
        throw new Exception('No valid fields to update');
    }
    
    $updateFields[] = "updated_at = NOW()";
    $updateValues[] = $conditionId;
    
    $sql = "UPDATE pet_health_conditions SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($updateValues);
    
    // Get the updated condition
    $stmt = $pdo->prepare("
        SELECT 
            id,
            condition_name,
            severity,
            diagnosis_date,
            notes,
            status,
            created_at,
            updated_at
        FROM pet_health_conditions 
        WHERE id = ?
    ");
    $stmt->execute([$conditionId]);
    $condition = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Log activity
    try {
        $activityRepo = new ActivityRepository($pdo);
        $petName = getPetName($pdo, $condition['pet_id'] ?? null);
        $activityRepo->create([
            'user_id' => $userId,
            'type' => 'health_condition_updated',
            'description' => "Updated health condition '{$condition['condition_name']}' for {$petName}",
            'pet_id' => $condition['pet_id'] ?? null,
            'metadata' => json_encode([
                'condition_name' => $condition['condition_name'],
                'severity' => $condition['severity'],
                'status' => $condition['status'],
                'pet_name' => $petName
            ])
        ]);
        
        // Trigger dashboard health metrics update
        triggerDashboardUpdate($userId, 'health_metrics');
        
    } catch (Exception $e) {
        error_log('Failed to log health condition update activity: ' . $e->getMessage());
    }
    
    echo json_encode([
        'success' => true,
        'condition' => $condition,
        'message' => 'Health condition updated successfully'
    ]);
}

function handleDeleteCondition($pdo, $userId) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $conditionId = $input['condition_id'] ?? null;
    
    if (!$conditionId) {
        throw new Exception('Condition ID is required');
    }
    
    // Verify condition ownership through pet ownership
    $stmt = $pdo->prepare("
        SELECT hc.id 
        FROM pet_health_conditions hc
        JOIN pets p ON hc.pet_id = p.id
        WHERE hc.id = ? AND p.user_id = ?
    ");
    $stmt->execute([$conditionId, $userId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Condition not found or access denied'
        ]);
        return;
    }
    
    // Delete the condition
    $stmt = $pdo->prepare("DELETE FROM pet_health_conditions WHERE id = ?");
    $stmt->execute([$conditionId]);
    
    // Log activity
    try {
        $activityRepo = new ActivityRepository($pdo);
        // Get condition details before deletion for logging
        $stmt = $pdo->prepare("
            SELECT hc.condition_name, p.name as pet_name, hc.pet_id
            FROM pet_health_conditions hc
            JOIN pets p ON hc.pet_id = p.id
            WHERE hc.id = ?
        ");
        $stmt->execute([$conditionId]);
        $conditionInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($conditionInfo) {
            $activityRepo->create([
                'user_id' => $userId,
                'type' => 'health_condition_deleted',
                'description' => "Removed health condition '{$conditionInfo['condition_name']}' for {$conditionInfo['pet_name']}",
                'pet_id' => $conditionInfo['pet_id'],
                'metadata' => json_encode([
                    'condition_name' => $conditionInfo['condition_name'],
                    'pet_name' => $conditionInfo['pet_name']
                ])
            ]);
        }
    } catch (Exception $e) {
        error_log('Failed to log health condition deletion activity: ' . $e->getMessage());
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Health condition deleted successfully'
    ]);
}
?>
/**
 * Get pet name by ID
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

/**
 * Trigger dashboard update for real-time statistics
 */
function triggerDashboardUpdate($userId, $updateType = 'general') {
    try {
        // Clear any cached dashboard statistics
        $cacheKey = "dashboard_stats_{$userId}";
        
        // If using a cache system, clear the cache here
        // For now, we'll just log the update trigger
        error_log("Dashboard update triggered for user {$userId}, type: {$updateType}");
        
        // In a real-time system, this could trigger WebSocket updates
        // or publish to a message queue for dashboard refresh
        
    } catch (Exception $e) {
        error_log('Failed to trigger dashboard update: ' . $e->getMessage());
    }
}