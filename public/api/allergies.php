<?php
/**
 * Allergies Management API
 * Handles CRUD operations for pet allergies
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
            handleGetAllergies($db, $request, $response);
            break;
            
        case 'POST':
            handleCreateAllergy($db, $request, $response);
            break;
            
        case 'PUT':
            handleUpdateAllergy($db, $request, $response);
            break;
            
        case 'DELETE':
            handleDeleteAllergy($db, $request, $response);
            break;
            
        default:
            $response->error('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log('Allergies API Error: ' . $e->getMessage());
    $response = new Response();
    $response->error('Internal server error: ' . $e->getMessage(), 500);
}

/**
 * Get allergies for a pet
 */
function handleGetAllergies($db, $request, $response) {
    $petId = $request->getQuery('pet_id');
    
    if (!$petId) {
        $response->error('Pet ID is required', 400);
        return;
    }
    
    try {
        // Verify pet exists and user has access
        $petQuery = \"SELECT id FROM pets WHERE id = :pet_id\";
        $petStmt = $db->prepare($petQuery);
        $petStmt->bindParam(':pet_id', $petId, PDO::PARAM_INT);
        $petStmt->execute();
        
        if (!$petStmt->fetch()) {
            $response->error('Pet not found', 404);
            return;
        }
        
        // Get allergies
        $query = \"
            SELECT 
                id,
                category,
                allergen,
                severity,
                reaction_type,
                symptoms,
                treatment,
                created_at,
                updated_at
            FROM pet_allergies 
            WHERE pet_id = :pet_id 
            ORDER BY severity DESC, category ASC, allergen ASC
        \";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':pet_id', $petId, PDO::PARAM_INT);
        $stmt->execute();
        
        $allergies = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $response->success([
            'allergies' => $allergies,
            'count' => count($allergies)
        ]);
        
    } catch (PDOException $e) {
        error_log('Database error in getAllergies: ' . $e->getMessage());
        $response->error('Database error occurred', 500);
    }
}

/**
 * Create a new allergy
 */
function handleCreateAllergy($db, $request, $response) {
    $data = $request->getJsonBody();
    
    // Validate required fields
    $required = ['pet_id', 'category', 'allergen', 'severity'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            $response->error(\"Field '{$field}' is required\", 400);
            return;
        }
    }
    
    // Validate category
    $validCategories = ['food', 'environmental', 'medication', 'other'];
    if (!in_array($data['category'], $validCategories)) {
        $response->error('Invalid category', 400);
        return;
    }
    
    // Validate severity
    $validSeverities = ['mild', 'moderate', 'severe'];
    if (!in_array($data['severity'], $validSeverities)) {
        $response->error('Invalid severity level', 400);
        return;
    }
    
    try {
        // Verify pet exists
        $petQuery = \"SELECT id FROM pets WHERE id = :pet_id\";
        $petStmt = $db->prepare($petQuery);
        $petStmt->bindParam(':pet_id', $data['pet_id'], PDO::PARAM_INT);
        $petStmt->execute();
        
        if (!$petStmt->fetch()) {
            $response->error('Pet not found', 404);
            return;
        }
        
        // Check for duplicate allergy
        $duplicateQuery = \"
            SELECT id FROM pet_allergies 
            WHERE pet_id = :pet_id AND category = :category AND LOWER(allergen) = LOWER(:allergen)
        \";
        $duplicateStmt = $db->prepare($duplicateQuery);
        $duplicateStmt->bindParam(':pet_id', $data['pet_id'], PDO::PARAM_INT);
        $duplicateStmt->bindParam(':category', $data['category']);
        $duplicateStmt->bindParam(':allergen', $data['allergen']);
        $duplicateStmt->execute();
        
        if ($duplicateStmt->fetch()) {
            $response->error('This allergy already exists for this pet', 409);
            return;
        }
        
        // Insert new allergy
        $query = \"
            INSERT INTO pet_allergies (
                pet_id, category, allergen, severity, reaction_type, symptoms, treatment, created_at
            ) VALUES (
                :pet_id, :category, :allergen, :severity, :reaction_type, :symptoms, :treatment, NOW()
            )
        \";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':pet_id', $data['pet_id'], PDO::PARAM_INT);
        $stmt->bindParam(':category', $data['category']);
        $stmt->bindParam(':allergen', $data['allergen']);
        $stmt->bindParam(':severity', $data['severity']);
        $stmt->bindParam(':reaction_type', $data['reaction_type'] ?? null);
        $stmt->bindParam(':symptoms', $data['symptoms'] ?? null);
        $stmt->bindParam(':treatment', $data['treatment'] ?? null);
        
        if ($stmt->execute()) {
            $allergyId = $db->lastInsertId();
            
            // Get the created allergy
            $selectQuery = \"
                SELECT 
                    id, category, allergen, severity, reaction_type, symptoms, treatment, created_at
                FROM pet_allergies 
                WHERE id = :id
            \";
            $selectStmt = $db->prepare($selectQuery);
            $selectStmt->bindParam(':id', $allergyId, PDO::PARAM_INT);
            $selectStmt->execute();
            
            $allergy = $selectStmt->fetch(PDO::FETCH_ASSOC);
            
            $response->success([
                'message' => 'Allergy created successfully',
                'allergy' => $allergy
            ], 201);
        } else {
            $response->error('Failed to create allergy', 500);
        }
        
    } catch (PDOException $e) {
        error_log('Database error in createAllergy: ' . $e->getMessage());
        $response->error('Database error occurred', 500);
    }
}

/**
 * Update an existing allergy
 */
function handleUpdateAllergy($db, $request, $response) {
    $allergyId = $request->getQuery('id');
    $data = $request->getJsonBody();
    
    if (!$allergyId) {
        $response->error('Allergy ID is required', 400);
        return;
    }
    
    try {
        // Verify allergy exists
        $existsQuery = \"SELECT pet_id FROM pet_allergies WHERE id = :id\";
        $existsStmt = $db->prepare($existsQuery);
        $existsStmt->bindParam(':id', $allergyId, PDO::PARAM_INT);
        $existsStmt->execute();
        
        if (!$existsStmt->fetch()) {
            $response->error('Allergy not found', 404);
            return;
        }
        
        // Build update query dynamically
        $updateFields = [];
        $params = [':id' => $allergyId];
        
        $allowedFields = ['category', 'allergen', 'severity', 'reaction_type', 'symptoms', 'treatment'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = \"{$field} = :{$field}\";
                $params[\":{$field}\"] = $data[$field];
            }
        }
        
        if (empty($updateFields)) {
            $response->error('No valid fields to update', 400);
            return;
        }
        
        // Validate category and severity if provided
        if (isset($data['category'])) {
            $validCategories = ['food', 'environmental', 'medication', 'other'];
            if (!in_array($data['category'], $validCategories)) {
                $response->error('Invalid category', 400);
                return;
            }
        }
        
        if (isset($data['severity'])) {
            $validSeverities = ['mild', 'moderate', 'severe'];
            if (!in_array($data['severity'], $validSeverities)) {
                $response->error('Invalid severity level', 400);
                return;
            }
        }
        
        $updateFields[] = 'updated_at = NOW()';
        
        $query = \"UPDATE pet_allergies SET \" . implode(', ', $updateFields) . \" WHERE id = :id\";
        
        $stmt = $db->prepare($query);
        
        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }
        
        if ($stmt->execute()) {
            // Get updated allergy
            $selectQuery = \"
                SELECT 
                    id, category, allergen, severity, reaction_type, symptoms, treatment, created_at, updated_at
                FROM pet_allergies 
                WHERE id = :id
            \";
            $selectStmt = $db->prepare($selectQuery);
            $selectStmt->bindParam(':id', $allergyId, PDO::PARAM_INT);
            $selectStmt->execute();
            
            $allergy = $selectStmt->fetch(PDO::FETCH_ASSOC);
            
            $response->success([
                'message' => 'Allergy updated successfully',
                'allergy' => $allergy
            ]);
        } else {
            $response->error('Failed to update allergy', 500);
        }
        
    } catch (PDOException $e) {
        error_log('Database error in updateAllergy: ' . $e->getMessage());
        $response->error('Database error occurred', 500);
    }
}

/**
 * Delete an allergy
 */
function handleDeleteAllergy($db, $request, $response) {
    $allergyId = $request->getQuery('id');
    
    if (!$allergyId) {
        $response->error('Allergy ID is required', 400);
        return;
    }
    
    try {
        // Verify allergy exists
        $existsQuery = \"SELECT id FROM pet_allergies WHERE id = :id\";
        $existsStmt = $db->prepare($existsQuery);
        $existsStmt->bindParam(':id', $allergyId, PDO::PARAM_INT);
        $existsStmt->execute();
        
        if (!$existsStmt->fetch()) {
            $response->error('Allergy not found', 404);
            return;
        }
        
        // Delete allergy
        $query = \"DELETE FROM pet_allergies WHERE id = :id\";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $allergyId, PDO::PARAM_INT);
        
        if ($stmt->execute()) {
            $response->success([
                'message' => 'Allergy deleted successfully'
            ]);
        } else {
            $response->error('Failed to delete allergy', 500);
        }
        
    } catch (PDOException $e) {
        error_log('Database error in deleteAllergy: ' . $e->getMessage());
        $response->error('Database error occurred', 500);
    }
}
?>"