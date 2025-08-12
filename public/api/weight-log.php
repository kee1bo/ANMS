<?php
/**
 * Weight Log API
 * Handles weight tracking for pets
 */

require_once '../config/database.php';
require_once '../src/Infrastructure/Http/Request.php';
require_once '../src/Infrastructure/Http/Response.php';

use Infrastructure\Http\Request;
use Infrastructure\Http\Response;

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $request = new Request();
    $response = new Response();
    
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Route based on HTTP method
    switch ($request->getMethod()) {
        case 'GET':
            handleGetWeightHistory($db, $request, $response);
            break;
            
        case 'POST':
            handleLogWeight($db, $request, $response);
            break;
            
        case 'PUT':
            handleUpdateWeightLog($db, $request, $response);
            break;
            
        case 'DELETE':
            handleDeleteWeightLog($db, $request, $response);
            break;
            
        default:
            $response->error('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log('Weight Log API Error: ' . $e->getMessage());
    $response = new Response();
    $response->error('Internal server error: ' . $e->getMessage(), 500);
}

/**
 * Get weight history for a pet
 */
function handleGetWeightHistory($db, $request, $response) {
    $petId = $request->getQuery('pet_id');
    $limit = $request->getQuery('limit', 50);
    
    if (!$petId) {
        $response->error('Pet ID is required', 400);
        return;
    }
    
    try {
        // Verify pet exists
        $petQuery = "SELECT id, name FROM pets WHERE id = :pet_id";
        $petStmt = $db->prepare($petQuery);
        $petStmt->bindParam(':pet_id', $petId, PDO::PARAM_INT);
        $petStmt->execute();
        
        $pet = $petStmt->fetch(PDO::FETCH_ASSOC);
        if (!$pet) {
            $response->error('Pet not found', 404);
            return;
        }
        
        // Get weight history
        $query = "
            SELECT 
                id,
                weight,
                body_condition_score,
                notes,
                recorded_date,
                created_at
            FROM pet_weight_logs 
            WHERE pet_id = :pet_id 
            ORDER BY recorded_date DESC, created_at DESC
            LIMIT :limit
        ";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':pet_id', $petId, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $weightHistory = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate weight trends
        $trends = calculateWeightTrends($weightHistory);
        
        $response->success([
            'pet' => $pet,
            'weight_history' => $weightHistory,
            'trends' => $trends,
            'count' => count($weightHistory)
        ]);
        
    } catch (PDOException $e) {
        error_log('Database error in getWeightHistory: ' . $e->getMessage());
        $response->error('Database error occurred', 500);
    }
}

/**
 * Log a new weight entry
 */
function handleLogWeight($db, $request, $response) {
    $data = $request->getJsonBody();
    
    // Validate required fields
    $required = ['pet_id', 'weight', 'recorded_date'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            $response->error("Field '{$field}' is required", 400);
            return;
        }
    }
    
    // Validate weight
    $weight = floatval($data['weight']);
    if ($weight <= 0 || $weight > 200) {
        $response->error('Weight must be between 0.1 and 200 kg', 400);
        return;
    }
    
    // Validate body condition score if provided
    if (isset($data['body_condition_score']) && $data['body_condition_score'] !== '') {
        $bcs = intval($data['body_condition_score']);
        if ($bcs < 1 || $bcs > 9) {
            $response->error('Body condition score must be between 1 and 9', 400);
            return;
        }
    }
    
    try {
        // Verify pet exists
        $petQuery = "SELECT id, name FROM pets WHERE id = :pet_id";
        $petStmt = $db->prepare($petQuery);
        $petStmt->bindParam(':pet_id', $data['pet_id'], PDO::PARAM_INT);
        $petStmt->execute();
        
        $pet = $petStmt->fetch(PDO::FETCH_ASSOC);
        if (!$pet) {
            $response->error('Pet not found', 404);
            return;
        }
        
        // Insert weight log
        $query = "
            INSERT INTO pet_weight_logs (
                pet_id, weight, body_condition_score, notes, recorded_date, created_at
            ) VALUES (
                :pet_id, :weight, :body_condition_score, :notes, :recorded_date, NOW()
            )
        ";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':pet_id', $data['pet_id'], PDO::PARAM_INT);
        $stmt->bindParam(':weight', $weight);
        $stmt->bindParam(':body_condition_score', $data['body_condition_score'] ?? null, PDO::PARAM_INT);
        $stmt->bindParam(':notes', $data['notes'] ?? null);
        $stmt->bindParam(':recorded_date', $data['recorded_date']);
        
        if ($stmt->execute()) {
            $logId = $db->lastInsertId();
            
            // Update pet's current weight
            $updatePetQuery = "UPDATE pets SET weight = :weight, updated_at = NOW() WHERE id = :pet_id";
            $updateStmt = $db->prepare($updatePetQuery);
            $updateStmt->bindParam(':weight', $weight);
            $updateStmt->bindParam(':pet_id', $data['pet_id'], PDO::PARAM_INT);
            $updateStmt->execute();
            
            // Get the created log entry
            $selectQuery = "
                SELECT 
                    id, weight, body_condition_score, notes, recorded_date, created_at
                FROM pet_weight_logs 
                WHERE id = :id
            ";
            $selectStmt = $db->prepare($selectQuery);
            $selectStmt->bindParam(':id', $logId, PDO::PARAM_INT);
            $selectStmt->execute();
            
            $weightLog = $selectStmt->fetch(PDO::FETCH_ASSOC);
            
            $response->success([
                'message' => 'Weight logged successfully',
                'weight_log' => $weightLog,
                'pet' => $pet
            ], 201);
        } else {
            $response->error('Failed to log weight', 500);
        }
        
    } catch (PDOException $e) {
        error_log('Database error in logWeight: ' . $e->getMessage());
        $response->error('Database error occurred', 500);
    }
}

/**
 * Update an existing weight log
 */
function handleUpdateWeightLog($db, $request, $response) {
    $logId = $request->getQuery('id');
    $data = $request->getJsonBody();
    
    if (!$logId) {
        $response->error('Weight log ID is required', 400);
        return;
    }
    
    try {
        // Verify log exists
        $existsQuery = "SELECT pet_id FROM pet_weight_logs WHERE id = :id";
        $existsStmt = $db->prepare($existsQuery);
        $existsStmt->bindParam(':id', $logId, PDO::PARAM_INT);
        $existsStmt->execute();
        
        if (!$existsStmt->fetch()) {
            $response->error('Weight log not found', 404);
            return;
        }
        
        // Build update query dynamically
        $updateFields = [];
        $params = [':id' => $logId];
        
        $allowedFields = ['weight', 'body_condition_score', 'notes', 'recorded_date'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "{$field} = :{$field}";
                $params[":{$field}"] = $data[$field];
            }
        }
        
        if (empty($updateFields)) {
            $response->error('No valid fields to update', 400);
            return;
        }
        
        // Validate weight if provided
        if (isset($data['weight'])) {
            $weight = floatval($data['weight']);
            if ($weight <= 0 || $weight > 200) {
                $response->error('Weight must be between 0.1 and 200 kg', 400);
                return;
            }
        }
        
        // Validate body condition score if provided
        if (isset($data['body_condition_score']) && $data['body_condition_score'] !== '') {
            $bcs = intval($data['body_condition_score']);
            if ($bcs < 1 || $bcs > 9) {
                $response->error('Body condition score must be between 1 and 9', 400);
                return;
            }
        }
        
        $updateFields[] = 'updated_at = NOW()';
        
        $query = "UPDATE pet_weight_logs SET " . implode(', ', $updateFields) . " WHERE id = :id";
        
        $stmt = $db->prepare($query);
        
        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }
        
        if ($stmt->execute()) {
            // Get updated log
            $selectQuery = "
                SELECT 
                    id, weight, body_condition_score, notes, recorded_date, created_at, updated_at
                FROM pet_weight_logs 
                WHERE id = :id
            ";
            $selectStmt = $db->prepare($selectQuery);
            $selectStmt->bindParam(':id', $logId, PDO::PARAM_INT);
            $selectStmt->execute();
            
            $weightLog = $selectStmt->fetch(PDO::FETCH_ASSOC);
            
            $response->success([
                'message' => 'Weight log updated successfully',
                'weight_log' => $weightLog
            ]);
        } else {
            $response->error('Failed to update weight log', 500);
        }
        
    } catch (PDOException $e) {
        error_log('Database error in updateWeightLog: ' . $e->getMessage());
        $response->error('Database error occurred', 500);
    }
}

/**
 * Delete a weight log
 */
function handleDeleteWeightLog($db, $request, $response) {
    $logId = $request->getQuery('id');
    
    if (!$logId) {
        $response->error('Weight log ID is required', 400);
        return;
    }
    
    try {
        // Verify log exists
        $existsQuery = "SELECT id FROM pet_weight_logs WHERE id = :id";
        $existsStmt = $db->prepare($existsQuery);
        $existsStmt->bindParam(':id', $logId, PDO::PARAM_INT);
        $existsStmt->execute();
        
        if (!$existsStmt->fetch()) {
            $response->error('Weight log not found', 404);
            return;
        }
        
        // Delete log
        $query = "DELETE FROM pet_weight_logs WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $logId, PDO::PARAM_INT);
        
        if ($stmt->execute()) {
            $response->success([
                'message' => 'Weight log deleted successfully'
            ]);
        } else {
            $response->error('Failed to delete weight log', 500);
        }
        
    } catch (PDOException $e) {
        error_log('Database error in deleteWeightLog: ' . $e->getMessage());
        $response->error('Database error occurred', 500);
    }
}

/**
 * Calculate weight trends from history
 */
function calculateWeightTrends($weightHistory) {
    if (count($weightHistory) < 2) {
        return [
            'trend' => 'insufficient_data',
            'change' => 0,
            'change_percent' => 0
        ];
    }
    
    $latest = $weightHistory[0];
    $previous = $weightHistory[1];
    
    $change = $latest['weight'] - $previous['weight'];
    $changePercent = ($change / $previous['weight']) * 100;
    
    $trend = 'stable';
    if ($change > 0.1) {
        $trend = 'increasing';
    } elseif ($change < -0.1) {
        $trend = 'decreasing';
    }
    
    return [
        'trend' => $trend,
        'change' => round($change, 2),
        'change_percent' => round($changePercent, 2),
        'latest_weight' => $latest['weight'],
        'previous_weight' => $previous['weight']
    ];
}
?>"