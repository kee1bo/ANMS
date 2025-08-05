<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Controllers;

use App\Application\Services\PetService;
use App\Application\Services\NutritionService;
use App\Infrastructure\Http\Request;
use App\Infrastructure\Http\Response;
use Exception;

class PetController extends ApiController
{
    private PetService $petService;
    private NutritionService $nutritionService;

    public function __construct(PetService $petService, NutritionService $nutritionService)
    {
        $this->petService = $petService;
        $this->nutritionService = $nutritionService;
    }

    public function index(Request $request): Response
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            $pets = $this->petService->getPetsByUserId($user->getId());

            $petsData = array_map(fn($pet) => $pet->jsonSerialize(), $pets);

            return $this->successResponse([
                'pets' => $petsData,
                'total' => count($petsData)
            ]);

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function show(Request $request): Response
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            $petId = (int) $request->getParameter('id');

            $pet = $this->petService->getPetById($petId);

            if (!$pet) {
                return $this->errorResponse('Pet not found', 'PET_NOT_FOUND', 404);
            }

            // Check ownership
            if ($pet->getUserId() !== $user->getId() && !$user->isVeterinarian()) {
                return $this->errorResponse('Access denied', 'ACCESS_DENIED', 403);
            }

            return $this->successResponse([
                'pet' => $pet->jsonSerialize()
            ]);

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function store(Request $request): Response
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            $data = $request->getJsonBody();

            if (!$data) {
                return $this->errorResponse('Invalid JSON data', 'INVALID_JSON');
            }

            $this->validateRequired($data, ['name', 'species']);

            $pet = $this->petService->createPet($user->getId(), $data);

            return $this->successResponse([
                'pet' => $pet->jsonSerialize()
            ], 'Pet created successfully', 201);

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function update(Request $request): Response
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            $petId = (int) $request->getParameter('id');
            $data = $request->getJsonBody();

            if (!$data) {
                return $this->errorResponse('Invalid JSON data', 'INVALID_JSON');
            }

            $pet = $this->petService->getPetById($petId);

            if (!$pet) {
                return $this->errorResponse('Pet not found', 'PET_NOT_FOUND', 404);
            }

            // Check ownership
            if ($pet->getUserId() !== $user->getId() && !$user->isVeterinarian()) {
                return $this->errorResponse('Access denied', 'ACCESS_DENIED', 403);
            }

            $updatedPet = $this->petService->updatePet($petId, $data);

            return $this->successResponse([
                'pet' => $updatedPet->jsonSerialize()
            ], 'Pet updated successfully');

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function destroy(Request $request): Response
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            $petId = (int) $request->getParameter('id');

            $pet = $this->petService->getPetById($petId);

            if (!$pet) {
                return $this->errorResponse('Pet not found', 'PET_NOT_FOUND', 404);
            }

            // Check ownership
            if ($pet->getUserId() !== $user->getId()) {
                return $this->errorResponse('Access denied', 'ACCESS_DENIED', 403);
            }

            $success = $this->petService->deletePet($petId);

            if (!$success) {
                return $this->errorResponse('Failed to delete pet', 'DELETE_FAILED');
            }

            return $this->successResponse(null, 'Pet deleted successfully');

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function generateNutritionPlan(Request $request): Response
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            $petId = (int) $request->getParameter('id');
            $data = $request->getJsonBody() ?? [];

            $pet = $this->petService->getPetById($petId);

            if (!$pet) {
                return $this->errorResponse('Pet not found', 'PET_NOT_FOUND', 404);
            }

            // Check ownership
            if ($pet->getUserId() !== $user->getId() && !$user->isVeterinarian()) {
                return $this->errorResponse('Access denied', 'ACCESS_DENIED', 403);
            }

            $preferences = $data['preferences'] ?? [];
            $plan = $this->nutritionService->generateNutritionPlan($pet, $preferences);

            // Validate the plan
            $validationIssues = $this->nutritionService->validateNutritionPlan($pet, $plan);

            return $this->successResponse([
                'nutrition_plan' => $plan->jsonSerialize(),
                'validation_issues' => $validationIssues
            ], 'Nutrition plan generated successfully');

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function getNutritionRequirements(Request $request): Response
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            $petId = (int) $request->getParameter('id');

            $pet = $this->petService->getPetById($petId);

            if (!$pet) {
                return $this->errorResponse('Pet not found', 'PET_NOT_FOUND', 404);
            }

            // Check ownership
            if ($pet->getUserId() !== $user->getId() && !$user->isVeterinarian()) {
                return $this->errorResponse('Access denied', 'ACCESS_DENIED', 403);
            }

            $requirements = $this->nutritionService->calculateNutritionalRequirements($pet);

            return $this->successResponse([
                'requirements' => $requirements->toArray()
            ]);

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function addHealthCondition(Request $request): Response
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            $petId = (int) $request->getParameter('id');
            $data = $request->getJsonBody();

            if (!$data || !isset($data['condition'])) {
                return $this->errorResponse('Health condition required', 'MISSING_CONDITION');
            }

            $pet = $this->petService->getPetById($petId);

            if (!$pet) {
                return $this->errorResponse('Pet not found', 'PET_NOT_FOUND', 404);
            }

            // Check ownership
            if ($pet->getUserId() !== $user->getId() && !$user->isVeterinarian()) {
                return $this->errorResponse('Access denied', 'ACCESS_DENIED', 403);
            }

            $updatedPet = $this->petService->addHealthCondition($petId, $data['condition']);

            return $this->successResponse([
                'pet' => $updatedPet->jsonSerialize()
            ], 'Health condition added successfully');

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function removeHealthCondition(Request $request): Response
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            $petId = (int) $request->getParameter('id');
            $condition = $request->getParameter('condition');

            if (!$condition) {
                return $this->errorResponse('Health condition required', 'MISSING_CONDITION');
            }

            $pet = $this->petService->getPetById($petId);

            if (!$pet) {
                return $this->errorResponse('Pet not found', 'PET_NOT_FOUND', 404);
            }

            // Check ownership
            if ($pet->getUserId() !== $user->getId() && !$user->isVeterinarian()) {
                return $this->errorResponse('Access denied', 'ACCESS_DENIED', 403);
            }

            $updatedPet = $this->petService->removeHealthCondition($petId, $condition);

            return $this->successResponse([
                'pet' => $updatedPet->jsonSerialize()
            ], 'Health condition removed successfully');

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function addAllergy(Request $request): Response
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            $petId = (int) $request->getParameter('id');
            $data = $request->getJsonBody();

            if (!$data || !isset($data['allergen'])) {
                return $this->errorResponse('Allergen required', 'MISSING_ALLERGEN');
            }

            $pet = $this->petService->getPetById($petId);

            if (!$pet) {
                return $this->errorResponse('Pet not found', 'PET_NOT_FOUND', 404);
            }

            // Check ownership
            if ($pet->getUserId() !== $user->getId() && !$user->isVeterinarian()) {
                return $this->errorResponse('Access denied', 'ACCESS_DENIED', 403);
            }

            $updatedPet = $this->petService->addAllergy($petId, $data['allergen']);

            return $this->successResponse([
                'pet' => $updatedPet->jsonSerialize()
            ], 'Allergy added successfully');

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function removeAllergy(Request $request): Response
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            $petId = (int) $request->getParameter('id');
            $allergen = $request->getParameter('allergen');

            if (!$allergen) {
                return $this->errorResponse('Allergen required', 'MISSING_ALLERGEN');
            }

            $pet = $this->petService->getPetById($petId);

            if (!$pet) {
                return $this->errorResponse('Pet not found', 'PET_NOT_FOUND', 404);
            }

            // Check ownership
            if ($pet->getUserId() !== $user->getId() && !$user->isVeterinarian()) {
                return $this->errorResponse('Access denied', 'ACCESS_DENIED', 403);
            }

            $updatedPet = $this->petService->removeAllergy($petId, $allergen);

            return $this->successResponse([
                'pet' => $updatedPet->jsonSerialize()
            ], 'Allergy removed successfully');

        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }
}