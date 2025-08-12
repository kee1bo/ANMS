<?php
/**
 * Pet Photo Management API
 * Handles photo upload, management, and retrieval
 */

session_start();

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

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
require_once __DIR__ . '/../../src/Infrastructure/Repository/PhotoRepository.php';
require_once __DIR__ . '/../../src/Infrastructure/Services/FileUploadService.php';

use App\Infrastructure\Services\FileUploadService;
use App\Infrastructure\Repository\PhotoRepository;
use App\Infrastructure\Repository\PetRepository;

// Check authentication
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Authentication required'
    ]);
    exit();
}

$userId = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

// Parse the URI
$path = parse_url($uri, PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$pathParts = array_filter($pathParts, fn($part) => $part !== 'api' && $part !== 'photos.php');
$pathParts = array_values($pathParts);

try {
    $photoRepo = new PhotoRepository($pdo);
    $petRepo = new PetRepository($pdo);
    $uploadService = new FileUploadService();

    if ($method === 'POST' && count($pathParts) >= 2 && $pathParts[0] === 'pets') {
        // POST /api/photos.php/pets/{petId} - Upload photo for pet
        $petId = (int)$pathParts[1];
        
        // Check if user owns the pet
        if (!$petRepo->isOwnedByUser($petId, $userId)) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Pet not found or access denied'
            ]);
            exit();
        }
        
        // Check if file was uploaded
        if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'No photo file uploaded or upload error occurred'
            ]);
            exit();
        }
        
        // Upload and process the photo
        $photoData = $uploadService->uploadPetPhoto($_FILES['photo'], $petId);
        
        // Check if this should be the primary photo (if it's the first photo)
        $existingPhotosCount = $photoRepo->countByPetId($petId);
        $photoData['is_primary'] = $existingPhotosCount === 0;
        
        // Save to database
        $savedPhoto = $photoRepo->create($petId, $photoData);
        
        // Log activity for photo upload
        try {
            require_once __DIR__ . '/../../src/Infrastructure/Repository/ActivityRepository.php';
            $activityRepo = new ActivityRepository($pdo);
            $petName = getPetName($pdo, $petId);
            
            $activityRepo->create([
                'user_id' => $userId,
                'type' => 'photo_uploaded',
                'description' => "Uploaded new photo for {$petName}",
                'pet_id' => $petId,
                'metadata' => json_encode([
                    'photo_id' => $savedPhoto['id'],
                    'filename' => $savedPhoto['filename'],
                    'is_primary' => $savedPhoto['is_primary'],
                    'pet_name' => $petName
                ])
            ]);
            
            // Trigger dashboard update
            triggerDashboardUpdate($userId, 'photo_upload');
            
        } catch (Exception $e) {
            error_log('Failed to log photo upload activity: ' . $e->getMessage());
        }
        
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'photo' => $savedPhoto,
            'message' => 'Photo uploaded successfully'
        ]);
        
    } elseif ($method === 'GET' && count($pathParts) >= 2 && $pathParts[0] === 'pets') {
        // GET /api/photos.php/pets/{petId} - Get all photos for pet
        $petId = (int)$pathParts[1];
        
        // Check if user owns the pet
        if (!$petRepo->isOwnedByUser($petId, $userId)) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Pet not found or access denied'
            ]);
            exit();
        }
        
        $photos = $photoRepo->findByPetId($petId);
        
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'photos' => $photos
        ]);
        
    } elseif ($method === 'PUT' && count($pathParts) >= 2 && is_numeric($pathParts[0])) {
        // PUT /api/photos.php/{photoId}/primary - Set photo as primary
        $photoId = (int)$pathParts[0];
        
        if (!isset($pathParts[1]) || $pathParts[1] !== 'primary') {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid endpoint'
            ]);
            exit();
        }
        
        // Check if user owns the photo
        if (!$photoRepo->isOwnedByUser($photoId, $userId)) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Photo not found or access denied'
            ]);
            exit();
        }
        
        // Get photo to find pet ID
        $photo = $photoRepo->findById($photoId);
        if (!$photo) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Photo not found'
            ]);
            exit();
        }
        
        $success = $photoRepo->setPrimary($photoId, $photo['pet_id']);
        
        // Log activity for primary photo change
        if ($success) {
            try {
                require_once __DIR__ . '/../../src/Infrastructure/Repository/ActivityRepository.php';
                $activityRepo = new ActivityRepository($pdo);
                $petName = getPetName($pdo, $photo['pet_id']);
                
                $activityRepo->create([
                    'user_id' => $userId,
                    'type' => 'photo_primary_changed',
                    'description' => "Changed primary photo for {$petName}",
                    'pet_id' => $photo['pet_id'],
                    'metadata' => json_encode([
                        'photo_id' => $photoId,
                        'filename' => $photo['filename'],
                        'pet_name' => $petName
                    ])
                ]);
                
                // Trigger dashboard update
                triggerDashboardUpdate($userId, 'photo_primary');
                
            } catch (Exception $e) {
                error_log('Failed to log primary photo change activity: ' . $e->getMessage());
            }
        }
        
        header('Content-Type: application/json');
        echo json_encode([
            'success' => $success,
            'message' => $success ? 'Primary photo updated' : 'Failed to update primary photo'
        ]);
        
    } elseif ($method === 'DELETE' && count($pathParts) >= 1 && is_numeric($pathParts[0])) {
        // DELETE /api/photos.php/{photoId} - Delete photo
        $photoId = (int)$pathParts[0];
        
        // Check if user owns the photo
        if (!$photoRepo->isOwnedByUser($photoId, $userId)) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Photo not found or access denied'
            ]);
            exit();
        }
        
        // Get photo data before deletion
        $photo = $photoRepo->findById($photoId);
        if (!$photo) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Photo not found'
            ]);
            exit();
        }
        
        // Delete from database
        $deletedPhoto = $photoRepo->delete($photoId);
        
        // Delete physical files
        if ($deletedPhoto) {
            $uploadService->deletePetPhoto($deletedPhoto['filename']);
            
            // Log activity for photo deletion
            try {
                require_once __DIR__ . '/../../src/Infrastructure/Repository/ActivityRepository.php';
                $activityRepo = new ActivityRepository($pdo);
                $petName = getPetName($pdo, $photo['pet_id']);
                
                $activityRepo->create([
                    'user_id' => $userId,
                    'type' => 'photo_deleted',
                    'description' => "Deleted photo for {$petName}",
                    'pet_id' => $photo['pet_id'],
                    'metadata' => json_encode([
                        'photo_id' => $photoId,
                        'filename' => $photo['filename'],
                        'pet_name' => $petName
                    ])
                ]);
                
                // Trigger dashboard update
                triggerDashboardUpdate($userId, 'photo_delete');
                
            } catch (Exception $e) {
                error_log('Failed to log photo deletion activity: ' . $e->getMessage());
            }
        }
        
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'message' => 'Photo deleted successfully'
        ]);
        
    } elseif ($method === 'GET' && count($pathParts) >= 1 && is_numeric($pathParts[0])) {
        // GET /api/photos.php/{photoId} - Get specific photo
        $photoId = (int)$pathParts[0];
        
        // Check if user owns the photo
        if (!$photoRepo->isOwnedByUser($photoId, $userId)) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Photo not found or access denied'
            ]);
            exit();
        }
        
        $photo = $photoRepo->findById($photoId);
        
        if (!$photo) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Photo not found'
            ]);
            exit();
        }
        
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'photo' => $photo
        ]);
        
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Endpoint not found'
        ]);
    }
    
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Validation error',
        'message' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
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