<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Controllers;

use App\Domain\Pet\Pet;
use App\Domain\Pet\PetRepositoryInterface;
use App\Infrastructure\Repository\PetRepository;
use App\Infrastructure\Http\Request;
use App\Infrastructure\Http\Response;
use InvalidArgumentException;
use Exception;

/**
 * Pet Controller
 * Handles all HTTP requests for pet management
 */
class PetController
{
    private PetRepositoryInterface $petRepository;

    public function __construct()
    {
        global $pdo;
        $this->petRepository = new PetRepository($pdo);
    }

    /**
     * GET /api/pets - Get all pets for the authenticated user
     */
    public function index(Request $request): Response
    {
        try {
            $userId = $this->getUserId($request);
            
            // Get query parameters
            $page = max(1, (int)($request->getQuery('page') ?? 1));
            $limit = min(50, max(1, (int)($request->getQuery('limit') ?? 20)));
            $offset = ($page - 1) * $limit;
            
            // Get filters
            $filters = [
                'species' => $request->getQuery('species'),
                'breed' => $request->getQuery('breed'),
                'activity_level' => $request->getQuery('activity_level'),
                'health_status' => $request->getQuery('health_status'),
                'sort' => $request->getQuery('sort') ?? 'name',
                'order' => strtoupper($request->getQuery('order') ?? 'ASC')
            ];
            
            // Remove empty filters
            $filters = array_filter($filters, fn($value) => $value !== null && $value !== '');
            
            // Get pets and total count
            $pets = $this->petRepository->findByUserId($userId, $filters, $limit, $offset);
            $total = $this->petRepository->countByUserId($userId, $filters);
            
            // Convert to arrays
            $petsData = array_map(fn(Pet $pet) => $pet->toArray(), $pets);
            
            return Response::json([
                'success' => true,
                'pets' => $petsData,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ]);
            
        } catch (Exception $e) {
            return Response::json([
                'success' => false,
                'error' => 'Failed to retrieve pets',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/pets/{id} - Get a specific pet with all relations
     */
    public function show(Request $request): Response
    {
        try {
            $petId = (int)$request->getPathParam('id');
            $userId = $this->getUserId($request);
            
            // Check ownership
            if (!$this->petRepository->isOwnedByUser($petId, $userId)) {
                return Response::json([
                    'success' => false,
                    'error' => 'Pet not found or access denied'
                ], 404);
            }
            
            $pet = $this->petRepository->findByIdWithRelations($petId);
            
            if (!$pet) {
                return Response::json([
                    'success' => false,
                    'error' => 'Pet not found'
                ], 404);
            }
            
            return Response::json([
                'success' => true,
                'pet' => $pet->toArray()
            ]);
            
        } catch (Exception $e) {
            return Response::json([
                'success' => false,
                'error' => 'Failed to retrieve pet',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/pets - Create a new pet
     */
    public function store(Request $request): Response
    {
        try {
            $userId = $this->getUserId($request);
            $data = $request->getJsonBody();
            
            // Validate required fields
            $requiredFields = ['name', 'species', 'weight'];
            foreach ($requiredFields as $field) {
                if (empty($data[$field])) {
                    return Response::json([
                        'success' => false,
                        'error' => "Field '{$field}' is required"
                    ], 400);
                }
            }
            
            // Add user ID to data
            $data['user_id'] = $userId;
            $data['id'] = 0; // Will be set by database
            
            // Create pet
            $pet = new Pet($data);
            $createdPet = $this->petRepository->create($pet);
            
            // Log activity
            ActivityRepository::log('pet_added', $userId, [
                'pet_id' => $createdPet->getId(),
                'pet_name' => $createdPet->getName()
            ]);
            
            return Response::json([
                'success' => true,
                'pet' => $createdPet->toArray(),
                'message' => 'Pet created successfully'
            ], 201);
            
        } catch (InvalidArgumentException $e) {
            return Response::json([
                'success' => false,
                'error' => 'Validation error',
                'message' => $e->getMessage()
            ], 400);
        } catch (Exception $e) {
            return Response::json([
                'success' => false,
                'error' => 'Failed to create pet',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PUT /api/pets/{id} - Update an existing pet
     */
    public function update(Request $request): Response
    {
        try {
            $petId = (int)$request->getPathParam('id');
            $userId = $this->getUserId($request);
            $data = $request->getJsonBody();
            
            // Check ownership
            if (!$this->petRepository->isOwnedByUser($petId, $userId)) {
                return Response::json([
                    'success' => false,
                    'error' => 'Pet not found or access denied'
                ], 404);
            }
            
            // Get existing pet
            $existingPet = $this->petRepository->findById($petId);
            if (!$existingPet) {
                return Response::json([
                    'success' => false,
                    'error' => 'Pet not found'
                ], 404);
            }
            
            // Merge existing data with updates
            $existingData = $existingPet->toArray();
            $updatedData = array_merge($existingData, $data);
            $updatedData['id'] = $petId;
            $updatedData['user_id'] = $userId;
            
            // Create updated pet
            $pet = new Pet($updatedData);
            $updatedPet = $this->petRepository->update($pet);
            
            // Log activity
            ActivityRepository::log('pet_updated', $userId, [
                'pet_id' => $updatedPet->getId(),
                'pet_name' => $updatedPet->getName()
            ]);
            
            return Response::json([
                'success' => true,
                'pet' => $updatedPet->toArray(),
                'message' => 'Pet updated successfully'
            ]);
            
        } catch (InvalidArgumentException $e) {
            return Response::json([
                'success' => false,
                'error' => 'Validation error',
                'message' => $e->getMessage()
            ], 400);
        } catch (Exception $e) {
            return Response::json([
                'success' => false,
                'error' => 'Failed to update pet',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * DELETE /api/pets/{id} - Delete a pet (soft delete)
     */
    public function destroy(Request $request): Response
    {
        try {
            $petId = (int)$request->getPathParam('id');
            $userId = $this->getUserId($request);
            
            // Check ownership
            if (!$this->petRepository->isOwnedByUser($petId, $userId)) {
                return Response::json([
                    'success' => false,
                    'error' => 'Pet not found or access denied'
                ], 404);
            }
            
            $success = $this->petRepository->delete($petId);
            
            if (!$success) {
                return Response::json([
                    'success' => false,
                    'error' => 'Pet not found'
                ], 404);
            }
            
            return Response::json([
                'success' => true,
                'message' => 'Pet deleted successfully'
            ]);
            
        } catch (Exception $e) {
            return Response::json([
                'success' => false,
                'error' => 'Failed to delete pet',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/pets/search - Search pets
     */
    public function search(Request $request): Response
    {
        try {
            $userId = $this->getUserId($request);
            $query = $request->getQuery('q') ?? '';
            
            if (strlen($query) < 2) {
                return Response::json([
                    'success' => false,
                    'error' => 'Search query must be at least 2 characters'
                ], 400);
            }
            
            $filters = [
                'species' => $request->getQuery('species')
            ];
            $filters = array_filter($filters);
            
            $pets = $this->petRepository->search($userId, $query, $filters);
            $petsData = array_map(fn(Pet $pet) => $pet->toArray(), $pets);
            
            return Response::json([
                'success' => true,
                'pets' => $petsData,
                'query' => $query
            ]);
            
        } catch (Exception $e) {
            return Response::json([
                'success' => false,
                'error' => 'Search failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/pets/stats - Get pet statistics for dashboard
     */
    public function stats(Request $request): Response
    {
        try {
            $userId = $this->getUserId($request);
            
            $totalPets = $this->petRepository->countByUserId($userId);
            $dogCount = $this->petRepository->countByUserId($userId, ['species' => 'dog']);
            $catCount = $this->petRepository->countByUserId($userId, ['species' => 'cat']);
            $recentlyUpdated = $this->petRepository->findRecentlyUpdated($userId, 5);
            
            return Response::json([
                'success' => true,
                'stats' => [
                    'total_pets' => $totalPets,
                    'dogs' => $dogCount,
                    'cats' => $catCount,
                    'other' => $totalPets - $dogCount - $catCount,
                    'recently_updated' => array_map(fn(Pet $pet) => [
                        'id' => $pet->getId(),
                        'name' => $pet->getName(),
                        'species' => $pet->getSpecies(),
                        'updated_at' => $pet->getUpdatedAt()->format('Y-m-d H:i:s')
                    ], $recentlyUpdated)
                ]
            ]);
            
        } catch (Exception $e) {
            return Response::json([
                'success' => false,
                'error' => 'Failed to get statistics',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function getUserId(Request $request): int
    {
        // Get user ID from session
        if (!isset($_SESSION['user_id'])) {
            throw new Exception('User not authenticated');
        }
        
        return (int)$_SESSION['user_id'];
    }
}