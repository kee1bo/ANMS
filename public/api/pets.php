<?php
/**
 * Pet Management API Endpoints
 * Handles all pet-related API requests
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
require_once __DIR__ . '/../../src/Domain/Pet/Pet.php';
require_once __DIR__ . '/../../src/Domain/Pet/PetRepositoryInterface.php';
require_once __DIR__ . '/../../src/Infrastructure/Repository/PetRepository.php';
require_once __DIR__ . '/../../src/Infrastructure/Repository/ActivityRepository.php';
require_once __DIR__ . '/../../src/Infrastructure/Http/Request.php';
require_once __DIR__ . '/../../src/Infrastructure/Http/Response.php';
require_once __DIR__ . '/../../src/Infrastructure/Http/Controllers/PetController.php';

use App\Infrastructure\Http\Request;
use App\Infrastructure\Http\Controllers\PetController;

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
    $request = new Request();
    $controller = new PetController();
    
    $method = $request->getMethod();
    $uri = $request->getUri();
    
    // Parse the URI to extract path and ID
    $path = parse_url($uri, PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    
    // Remove 'api' and 'pets.php' from path parts
    $pathParts = array_filter($pathParts, fn($part) => $part !== 'api' && $part !== 'pets.php');
    $pathParts = array_values($pathParts);
    
    // Route the request
    if ($method === 'GET') {
        // Check for ID in query parameter first
        $petId = $request->getQuery('id');
        
        if ($petId && is_numeric($petId)) {
            // GET /api/pets?id={id} - Get specific pet
            $request->setPathParam('id', $petId);
            $response = $controller->show($request);
        } elseif (empty($pathParts)) {
            // GET /api/pets - List all pets
            $response = $controller->index($request);
        } elseif ($pathParts[0] === 'search') {
            // GET /api/pets/search - Search pets
            $response = $controller->search($request);
        } elseif ($pathParts[0] === 'stats') {
            // GET /api/pets/stats - Get statistics
            $response = $controller->stats($request);
        } elseif (is_numeric($pathParts[0])) {
            // GET /api/pets/{id} - Get specific pet
            $request->setPathParam('id', $pathParts[0]);
            $response = $controller->show($request);
        } else {
            throw new Exception('Invalid endpoint');
        }
    } elseif ($method === 'POST') {
        if (empty($pathParts)) {
            // POST /api/pets - Create new pet
            $response = $controller->store($request);
        } else {
            throw new Exception('Invalid endpoint');
        }
    } elseif ($method === 'PUT') {
        if (is_numeric($pathParts[0])) {
            // PUT /api/pets/{id} - Update pet
            $request->setPathParam('id', $pathParts[0]);
            $response = $controller->update($request);
        } else {
            throw new Exception('Invalid endpoint');
        }
    } elseif ($method === 'DELETE') {
        if (is_numeric($pathParts[0])) {
            // DELETE /api/pets/{id} - Delete pet
            $request->setPathParam('id', $pathParts[0]);
            $response = $controller->destroy($request);
        } else {
            throw new Exception('Invalid endpoint');
        }
    } else {
        throw new Exception('Method not allowed');
    }
    
    $response->send();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}
?>