<?php
/**
 * File-based storage system for user data
 * This provides real data persistence without requiring a database
 */

// Ensure data directory exists
$dataDir = __DIR__ . '/../../data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// File paths
define('USERS_FILE', $dataDir . '/users.json');
define('PETS_FILE', $dataDir . '/pets.json');

/**
 * Load data from JSON file
 */
function loadData($file) {
    if (!file_exists($file)) {
        return [];
    }
    
    $content = file_get_contents($file);
    return json_decode($content, true) ?: [];
}

/**
 * Save data to JSON file
 */
function saveData($file, $data) {
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

/**
 * Register a new user
 */
function registerUser($firstName, $lastName, $email, $password) {
    $users = loadData(USERS_FILE);
    
    // Check if email already exists
    foreach ($users as $user) {
        if ($user['email'] === $email) {
            return ['success' => false, 'error' => 'Email already registered'];
        }
    }
    
    // Create new user
    $newUser = [
        'id' => count($users) + 1,
        'first_name' => $firstName,
        'last_name' => $lastName,
        'email' => $email,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'created_at' => date('Y-m-d H:i:s'),
        'last_login' => null,
        'status' => 'active'
    ];
    
    $users[] = $newUser;
    
    if (saveData(USERS_FILE, $users)) {
        // Remove password hash from response
        unset($newUser['password_hash']);
        return ['success' => true, 'user' => $newUser];
    }
    
    return ['success' => false, 'error' => 'Failed to save user data'];
}

/**
 * Authenticate user login
 */
function authenticateUser($email, $password) {
    $users = loadData(USERS_FILE);
    
    foreach ($users as &$user) {
        if ($user['email'] === $email) {
            if (password_verify($password, $user['password_hash'])) {
                // Update last login
                $user['last_login'] = date('Y-m-d H:i:s');
                saveData(USERS_FILE, $users);
                
                // Remove password hash from response
                unset($user['password_hash']);
                return ['success' => true, 'user' => $user];
            } else {
                return ['success' => false, 'error' => 'Invalid password'];
            }
        }
    }
    
    return ['success' => false, 'error' => 'User not found'];
}

/**
 * Get user by ID
 */
function getUserById($userId) {
    $users = loadData(USERS_FILE);
    
    foreach ($users as $user) {
        if ($user['id'] == $userId) {
            unset($user['password_hash']);
            return $user;
        }
    }
    
    return null;
}

/**
 * Get pets for a user
 */
function getUserPets($userId) {
    $pets = loadData(PETS_FILE);
    $userPets = [];
    
    foreach ($pets as $pet) {
        if ($pet['user_id'] == $userId) {
            $userPets[] = $pet;
        }
    }
    
    return $userPets;
}

/**
 * Add a new pet with comprehensive data structure
 */
function addPet($userId, $petData) {
    $pets = loadData(PETS_FILE);
    
    $newPet = [
        'id' => count($pets) + 1,
        'user_id' => $userId,
        
        // Basic Information
        'name' => $petData['name'],
        'species' => strtolower($petData['species']),
        'breed' => $petData['breed'] ?? '',
        'gender' => $petData['gender'] ?? null,
        
        // Physical Information
        'age' => (float)($petData['age'] ?? 1),
        'weight' => (float)($petData['weight'] ?? 0),
        'ideal_weight' => (float)($petData['ideal_weight'] ?? $petData['weight'] ?? 0),
        'body_condition_score' => (int)($petData['body_condition_score'] ?? null),
        
        // Activity & Health
        'activity_level' => strtolower($petData['activity_level']),
        'spayed_neutered' => $petData['spayed_neutered'] ?? null,
        'medical_conditions' => $petData['medical_conditions'] ?? '',
        'medications' => $petData['medications'] ?? '',
        
        // Additional Information
        'personality' => $petData['personality'] ?? '',
        'dietary_notes' => $petData['dietary_notes'] ?? '',
        
        // System Fields
        'health_status' => 'healthy',
        'photo' => getPetEmoji($petData['species']),
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s'),
        
        // Nutrition Data (for future engine)
        'nutrition_data' => [
            'daily_calories' => null,
            'protein_requirement' => null,
            'fat_requirement' => null,
            'carb_requirement' => null,
            'feeding_schedule' => [],
            'current_food' => null,
            'food_preferences' => [],
            'allergies' => []
        ],
        
        // Health Tracking Data
        'health_records' => [],
        'weight_history' => [
            [
                'date' => date('Y-m-d'),
                'weight' => (float)($petData['weight'] ?? 0),
                'body_condition_score' => (int)($petData['body_condition_score'] ?? null),
                'notes' => 'Initial weight record'
            ]
        ]
    ];
    
    $pets[] = $newPet;
    
    if (saveData(PETS_FILE, $pets)) {
        return ['success' => true, 'pet' => $newPet];
    }
    
    return ['success' => false, 'error' => 'Failed to save pet data'];
}

/**
 * Update a pet
 */
function updatePet($userId, $petData) {
    $pets = loadData(PETS_FILE);
    
    foreach ($pets as &$pet) {
        if ($pet['id'] == $petData['pet_id'] && $pet['user_id'] == $userId) {
            // Update basic information
            $pet['name'] = $petData['name'];
            $pet['species'] = strtolower($petData['species']);
            $pet['breed'] = $petData['breed'] ?? '';
            $pet['gender'] = $petData['gender'] ?? null;
            
            // Update physical information
            $pet['age'] = (float)($petData['age'] ?? $pet['age']);
            $pet['weight'] = (float)($petData['weight'] ?? $pet['weight']);
            $pet['ideal_weight'] = $petData['ideal_weight'] ? (float)$petData['ideal_weight'] : $pet['ideal_weight'];
            $pet['body_condition_score'] = $petData['body_condition_score'] ? (int)$petData['body_condition_score'] : $pet['body_condition_score'];
            
            // Update activity & health
            $pet['activity_level'] = strtolower($petData['activity_level']);
            $pet['spayed_neutered'] = $petData['spayed_neutered'] ?? $pet['spayed_neutered'];
            $pet['medical_conditions'] = $petData['medical_conditions'] ?? '';
            $pet['medications'] = $petData['medications'] ?? '';
            
            // Update additional information
            $pet['personality'] = $petData['personality'] ?? '';
            $pet['dietary_notes'] = $petData['dietary_notes'] ?? '';
            
            // Update system fields
            $pet['photo'] = getPetEmoji($petData['species']);
            $pet['updated_at'] = date('Y-m-d H:i:s');
            
            // Add weight history entry if weight changed
            if (isset($pet['weight_history']) && $pet['weight'] != $petData['weight']) {
                $pet['weight_history'][] = [
                    'date' => date('Y-m-d'),
                    'weight' => (float)$petData['weight'],
                    'body_condition_score' => $petData['body_condition_score'] ? (int)$petData['body_condition_score'] : null,
                    'notes' => 'Weight updated'
                ];
            }
            
            if (saveData(PETS_FILE, $pets)) {
                return ['success' => true, 'pet' => $pet];
            } else {
                return ['success' => false, 'error' => 'Failed to save pet data'];
            }
        }
    }
    
    return ['success' => false, 'error' => 'Pet not found'];
}

/**
 * Delete a pet
 */
function deletePet($userId, $petId) {
    $pets = loadData(PETS_FILE);
    
    foreach ($pets as $index => $pet) {
        if ($pet['id'] == $petId && $pet['user_id'] == $userId) {
            unset($pets[$index]);
            $pets = array_values($pets); // Reindex array
            
            if (saveData(PETS_FILE, $pets)) {
                return ['success' => true];
            } else {
                return ['success' => false, 'error' => 'Failed to delete pet data'];
            }
        }
    }
    
    return ['success' => false, 'error' => 'Pet not found'];
}

/**
 * Get appropriate emoji for pet species
 */
function getPetEmoji($species) {
    $emojis = [
        'dog' => '🐕',
        'cat' => '🐱',
        'rabbit' => '🐰',
        'bird' => '🐦',
        'fish' => '🐠',
        'reptile' => '🦎',
        'other' => '🐾'
    ];
    
    return $emojis[strtolower($species)] ?? '🐾';
}

/**
 * Initialize with sample data if files don't exist
 */
function initializeSampleData() {
    if (!file_exists(USERS_FILE)) {
        $sampleUsers = [
            [
                'id' => 1,
                'first_name' => 'Test',
                'last_name' => 'User',
                'email' => 'test@example.com',
                'password_hash' => password_hash('password', PASSWORD_DEFAULT),
                'created_at' => date('Y-m-d H:i:s'),
                'last_login' => null,
                'status' => 'active'
            ]
        ];
        saveData(USERS_FILE, $sampleUsers);
    }
    
    if (!file_exists(PETS_FILE)) {
        $samplePets = [
            [
                'id' => 1,
                'user_id' => 1,
                'name' => 'Buddy',
                'species' => 'Dog',
                'breed' => 'Golden Retriever',
                'age' => 3,
                'weight' => 25.5,
                'ideal_weight' => 24.0,
                'activity_level' => 'Medium',
                'health_status' => 'Healthy',
                'photo' => '🐕',
                'personality' => 'Friendly and energetic',
                'created_at' => date('Y-m-d H:i:s')
            ]
        ];
        saveData(PETS_FILE, $samplePets);
    }
}

/**
 * Update user profile
 */
function updateUserProfile($userId, $profileData) {
    $users = loadData(USERS_FILE);
    
    foreach ($users as &$user) {
        if ($user['id'] == $userId) {
            // Check if email is being changed and if it conflicts with another user
            if ($user['email'] !== $profileData['email']) {
                foreach ($users as $otherUser) {
                    if ($otherUser['id'] != $userId && $otherUser['email'] === $profileData['email']) {
                        return ['success' => false, 'error' => 'Email already in use'];
                    }
                }
            }
            
            // Update profile fields
            $user['first_name'] = $profileData['first_name'];
            $user['last_name'] = $profileData['last_name'];
            $user['email'] = $profileData['email'];
            $user['updated_at'] = date('Y-m-d H:i:s');
            
            // Update password if provided
            if (!empty($profileData['password'])) {
                if (strlen($profileData['password']) < 6) {
                    return ['success' => false, 'error' => 'Password must be at least 6 characters'];
                }
                $user['password_hash'] = password_hash($profileData['password'], PASSWORD_DEFAULT);
            }
            
            if (saveData(USERS_FILE, $users)) {
                // Remove password hash from response
                unset($user['password_hash']);
                return ['success' => true, 'user' => $user];
            } else {
                return ['success' => false, 'error' => 'Failed to save profile data'];
            }
        }
    }
    
    return ['success' => false, 'error' => 'User not found'];
}

/**
 * Add weight record to pet
 */
function addWeightRecord($userId, $recordData) {
    $pets = loadData(PETS_FILE);
    
    foreach ($pets as &$pet) {
        if ($pet['id'] == $recordData['pet_id'] && $pet['user_id'] == $userId) {
            // Initialize weight_history if not exists
            if (!isset($pet['weight_history'])) {
                $pet['weight_history'] = [];
            }
            
            $weightRecord = [
                'date' => $recordData['date'],
                'weight' => (float)$recordData['weight'],
                'body_condition_score' => $recordData['body_condition_score'] ? (int)$recordData['body_condition_score'] : null,
                'notes' => $recordData['notes'] ?? '',
                'recorded_at' => date('Y-m-d H:i:s')
            ];
            
            // Add to weight history
            $pet['weight_history'][] = $weightRecord;
            
            // Update current weight if this is the most recent record
            $pet['weight'] = (float)$recordData['weight'];
            if ($recordData['body_condition_score']) {
                $pet['body_condition_score'] = (int)$recordData['body_condition_score'];
            }
            $pet['updated_at'] = date('Y-m-d H:i:s');
            
            if (saveData(PETS_FILE, $pets)) {
                return ['success' => true, 'record' => $weightRecord];
            } else {
                return ['success' => false, 'error' => 'Failed to save weight record'];
            }
        }
    }
    
    return ['success' => false, 'error' => 'Pet not found'];
}

/**
 * Add health record to pet
 */
function addHealthRecord($userId, $recordData) {
    $pets = loadData(PETS_FILE);
    
    foreach ($pets as &$pet) {
        if ($pet['id'] == $recordData['pet_id'] && $pet['user_id'] == $userId) {
            // Initialize health_records if not exists
            if (!isset($pet['health_records'])) {
                $pet['health_records'] = [];
            }
            
            $healthRecord = [
                'id' => count($pet['health_records']) + 1,
                'type' => $recordData['type'],
                'date' => $recordData['date'],
                'title' => $recordData['title'],
                'notes' => $recordData['notes'] ?? '',
                'vet_name' => $recordData['vet_name'] ?? '',
                'recorded_at' => date('Y-m-d H:i:s')
            ];
            
            // Add to health records
            $pet['health_records'][] = $healthRecord;
            $pet['updated_at'] = date('Y-m-d H:i:s');
            
            if (saveData(PETS_FILE, $pets)) {
                return ['success' => true, 'record' => $healthRecord];
            } else {
                return ['success' => false, 'error' => 'Failed to save health record'];
            }
        }
    }
    
    return ['success' => false, 'error' => 'Pet not found'];
}

/**
 * Add medication to pet
 */
function addMedication($userId, $medicationData) {
    $pets = loadData(PETS_FILE);
    
    foreach ($pets as &$pet) {
        if ($pet['id'] == $medicationData['pet_id'] && $pet['user_id'] == $userId) {
            // Initialize medications_list if not exists
            if (!isset($pet['medications_list'])) {
                $pet['medications_list'] = [];
            }
            
            $medication = [
                'id' => count($pet['medications_list']) + 1,
                'name' => $medicationData['name'],
                'dosage' => $medicationData['dosage'],
                'frequency' => $medicationData['frequency'],
                'start_date' => $medicationData['start_date'],
                'end_date' => $medicationData['end_date'] ?? null,
                'notes' => $medicationData['notes'] ?? '',
                'active' => $medicationData['active'] ?? true,
                'recorded_at' => date('Y-m-d H:i:s')
            ];
            
            // Add to medications list
            $pet['medications_list'][] = $medication;
            $pet['updated_at'] = date('Y-m-d H:i:s');
            
            if (saveData(PETS_FILE, $pets)) {
                return ['success' => true, 'medication' => $medication];
            } else {
                return ['success' => false, 'error' => 'Failed to save medication'];
            }
        }
    }
    
    return ['success' => false, 'error' => 'Pet not found'];
}

/**
 * Add activity log to pet
 */
function addActivityLog($userId, $activityData) {
    $pets = loadData(PETS_FILE);
    
    foreach ($pets as &$pet) {
        if ($pet['id'] == $activityData['pet_id'] && $pet['user_id'] == $userId) {
            // Initialize activity_log if not exists
            if (!isset($pet['activity_log'])) {
                $pet['activity_log'] = [];
            }
            
            $activity = [
                'id' => count($pet['activity_log']) + 1,
                'type' => $activityData['type'],
                'date' => $activityData['date'],
                'duration' => (int)$activityData['duration'],
                'intensity' => $activityData['intensity'],
                'notes' => $activityData['notes'] ?? '',
                'recorded_at' => date('Y-m-d H:i:s')
            ];
            
            // Add to activity log
            $pet['activity_log'][] = $activity;
            $pet['updated_at'] = date('Y-m-d H:i:s');
            
            if (saveData(PETS_FILE, $pets)) {
                return ['success' => true, 'activity' => $activity];
            } else {
                return ['success' => false, 'error' => 'Failed to save activity log'];
            }
        }
    }
    
    return ['success' => false, 'error' => 'Pet not found'];
}

// Initialize sample data
initializeSampleData();
?>