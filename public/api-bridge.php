<?php
/**
 * Modern API Bridge for PetNutri Application
 * Bridges the modern frontend with the existing PHP backend
 * Handles JWT authentication and modern API patterns
 */

// Set CORS headers for frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Include required files
require_once __DIR__ . '/../src/includes/db_connect.php';
if (file_exists(__DIR__ . '/../src/includes/functions.php')) {
    require_once __DIR__ . '/../src/includes/functions.php';
}
// Nutrition calculation service (used for calculator + planner)
if (file_exists(__DIR__ . '/../src/Application/Services/NutritionCalculationService.php')) {
    require_once __DIR__ . '/../src/Application/Services/NutritionCalculationService.php';
}
// New core services
if (file_exists(__DIR__ . '/../src/Application/Services/NutritionEngineService.php')) {
    require_once __DIR__ . '/../src/Application/Services/NutritionEngineService.php';
}
if (file_exists(__DIR__ . '/../src/Application/Services/MealPlannerService.php')) {
    require_once __DIR__ . '/../src/Application/Services/MealPlannerService.php';
}
// Activity logging
if (file_exists(__DIR__ . '/../src/Infrastructure/Repository/ActivityRepository.php')) {
    require_once __DIR__ . '/../src/Infrastructure/Repository/ActivityRepository.php';
}

// JWT Helper functions (simplified)
function generateJWT($userId, $email) {
    $header = base64url_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload = base64url_encode(json_encode([
        'user_id' => $userId,
        'email' => $email,
        'iat' => time(),
        'exp' => time() + (24 * 60 * 60) // 24 hours
    ]));
    $signature = base64url_encode(hash_hmac('sha256', "$header.$payload", 'your-secret-key', true));
    return "$header.$payload.$signature";
}

function validateJWT($token) {
    if (!$token) return false;
    
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    
    try {
        $payload = json_decode(base64url_decode($parts[1]), true);
        if (!$payload || $payload['exp'] < time()) return false;
        
        // Verify signature (simplified)
        $header = $parts[0];
        $data = $parts[1];
        $signature = base64url_encode(hash_hmac('sha256', "$header.$data", 'your-secret-key', true));
        
        if ($signature !== $parts[2]) return false;
        
        return $payload;
    } catch (Exception $e) {
        return false;
    }
}

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
}

// Get Authorization header
function getAuthorizationHeader() {
    $headers = apache_request_headers();
    if (isset($headers['Authorization'])) {
        return $headers['Authorization'];
    }
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        return $_SERVER['HTTP_AUTHORIZATION'];
    }
    return null;
}

// Get current user from JWT or session
function getCurrentUser() {
    // First try JWT token
    $authHeader = getAuthorizationHeader();
    if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
        $payload = validateJWT($token);
        
        if ($payload) {
            return [
                'id' => $payload['user_id'],
                'email' => $payload['email']
            ];
        }
    }
    
    // Fallback to session-based authentication
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    if (isset($_SESSION['user_id'])) {
        return [
            'id' => $_SESSION['user_id'],
            'email' => $_SESSION['user_email'] ?? ''
        ];
    }
    
    return null;
}

// Response helper
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

function sendError($message, $code = 'ERROR', $statusCode = 400) {
    sendResponse([
        'success' => false,
        'error' => $message,
        'code' => $code
    ], $statusCode);
}

function sendSuccess($data = null, $message = 'Success') {
    $response = [
        'success' => true,
        'message' => $message
    ];
    
    if ($data !== null) {
        if (is_array($data)) {
            $response = array_merge($response, $data);
        } else {
            $response['data'] = $data;
        }
    }
    
    sendResponse($response);
}

// Get request data
function getRequestData() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE && !empty($input)) {
        // Try to parse as form data
        parse_str($input, $data);
    }
    
    // Merge with POST data
    if (!empty($_POST)) {
        $data = array_merge($data ?: [], $_POST);
    }
    
    return $data ?: [];
}

// Main API routing
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($action) {
        case 'auth':
            handleAuth();
            break;
        case 'get_pets':
            handleGetPets();
            break;
        case 'add_pet':
            handleAddPet();
            break;
        case 'update_pet':
            handleUpdatePet();
            break;
        case 'delete_pet':
            handleDeletePet();
            break;
        case 'diet_plan':
            handleDietPlan();
            break;
        case 'get_nutrition_plan':
            handleGetNutritionPlan();
            break;
        case 'save_nutrition_plan':
            handleSaveNutritionPlan();
            break;
        case 'update_profile':
            handleUpdateProfile();
            break;
        case 'add_weight_record':
            handleAddWeightRecord();
            break;
        case 'add_health_record':
            handleAddHealthRecord();
            break;
        case 'health':
            handleHealth();
            break;
        case 'nutrition_calculator':
            handleNutritionCalculator();
            break;
        case 'nutrition_engine':
            handleNutritionEngine();
            break;
        case 'meal_planner_generate':
            handleMealPlannerGenerate();
            break;
        default:
            sendError('API endpoint not found', 'NOT_FOUND', 404);
    }
} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    sendError('Internal server error', 'INTERNAL_ERROR', 500);
}

// Authentication handler
function handleAuth() {
    global $mysqli;
    
    $data = getRequestData();
    $authAction = $data['action'] ?? '';
    
    switch ($authAction) {
        case 'login':
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';
            
            // Use SQLite database if available
            if (defined('USE_SQLITE') && USE_SQLITE) {
                $pdo = $GLOBALS['pdo'];
                
                $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND status = 'active'");
                $stmt->execute([$email]);
                $user = $stmt->fetch();
                
                if ($user && password_verify($password, $user['password_hash'])) {
                    // Update last login
                    $stmt = $pdo->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?");
                    $stmt->execute([$user['id']]);
                    
                    // Set session
                    if (session_status() === PHP_SESSION_NONE) {
                        session_start();
                    }
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
                    $_SESSION['user_email'] = $user['email'];
                    
                    // Generate JWT token
                    $token = generateJWT($user['id'], $user['email']);
                    $refreshToken = generateJWT($user['id'], $user['email'], true);
                    
                    // Remove password hash from response
                    unset($user['password_hash']);
                    
                    sendSuccess([
                        'user' => $user,
                        'token' => $token,
                        'refresh_token' => $refreshToken
                    ], 'Login successful');
                } else {
                    sendError('Invalid credentials', 'LOGIN_FAILED', 401);
                }
                return;
            }
            
            // Use file storage if available
            if (defined('USE_FILE_STORAGE') && USE_FILE_STORAGE) {
                $result = authenticateUser($email, $password);
                if ($result['success']) {
                    $user = $result['user'];
                    
                    // Set session
                    if (session_status() === PHP_SESSION_NONE) {
                        session_start();
                    }
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
                    $_SESSION['user_email'] = $user['email'];
                    
                    // Generate JWT token
                    $token = generateJWT($user['id'], $user['email']);
                    $refreshToken = generateJWT($user['id'], $user['email'], true);
                    
                    sendSuccess([
                        'user' => $user,
                        'token' => $token,
                        'refresh_token' => $refreshToken
                    ], 'Login successful');
                } else {
                    sendError($result['error'], 'LOGIN_FAILED', 401);
                }
                return;
            }
            
            if (!$email || !$password) {
                sendError('Email and password are required', 'MISSING_CREDENTIALS');
            }
            
            // Check if using mock data
            if (defined('USE_MOCK_DATA') && USE_MOCK_DATA) {
                // Use mock authentication
                if ($email === 'test@example.com' && $password === 'password') {
                    $token = generateJWT(1, $email);
                    
                    // Also set session for PHP frontend
                    session_start();
                    $_SESSION['user_id'] = 1;
                    $_SESSION['user_name'] = 'Test User';
                    $_SESSION['user_email'] = $email;
                    
                    sendSuccess([
                        'user' => [
                            'id' => 1,
                            'first_name' => 'Test',
                            'last_name' => 'User',
                            'email' => $email,
                            'name' => 'Test User'
                        ],
                        'token' => $token,
                        'refresh_token' => $token,
                        'expires_in' => 86400
                    ], 'Login successful');
                } else {
                    sendError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
                }
            } else {
                // Use database authentication
                $sql = "SELECT id, name, email, password FROM users WHERE email = ?";
                if ($stmt = $mysqli->prepare($sql)) {
                    $stmt->bind_param("s", $email);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    
                    if ($user = $result->fetch_assoc()) {
                        if (password_verify($password, $user['password'])) {
                            $token = generateJWT($user['id'], $user['email']);
                            
                            // Split name into first and last for frontend compatibility
                            $nameParts = explode(' ', trim($user['name']), 2);
                            $firstName = $nameParts[0];
                            $lastName = isset($nameParts[1]) ? $nameParts[1] : '';
                            
                            sendSuccess([
                                'user' => [
                                    'id' => $user['id'],
                                    'first_name' => $firstName,
                                    'last_name' => $lastName,
                                    'email' => $user['email'],
                                    'name' => $user['name']
                                ],
                                'token' => $token,
                                'refresh_token' => $token, // Simplified - same for now
                                'expires_in' => 86400
                            ], 'Login successful');
                        } else {
                            sendError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
                        }
                    } else {
                        sendError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
                    }
                    $stmt->close();
                } else {
                    sendError('Database error', 'DB_ERROR', 500);
                }
            }
            break;
            
        case 'logout':
            // Clear session data
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            // Clear all session variables
            $_SESSION = array();
            
            // Destroy the session cookie
            if (ini_get("session.use_cookies")) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000,
                    $params["path"], $params["domain"],
                    $params["secure"], $params["httponly"]
                );
            }
            
            // Destroy the session
            session_destroy();
            
            sendSuccess(null, 'Logout successful');
            break;
            
        case 'register':
            $firstName = $data['first_name'] ?? '';
            $lastName = $data['last_name'] ?? '';
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';
            
            if (!$firstName || !$lastName || !$email || !$password) {
                sendError('All fields are required', 'MISSING_FIELDS');
            }
            
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                sendError('Invalid email address', 'INVALID_EMAIL');
            }
            
            if (strlen($password) < 6) {
                sendError('Password must be at least 6 characters', 'WEAK_PASSWORD');
            }
            
            // Use SQLite database if available
            if (defined('USE_SQLITE') && USE_SQLITE) {
                $pdo = $GLOBALS['pdo'];
                
                // Check if email already exists
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->execute([$email]);
                
                if ($stmt->fetch()) {
                    sendError('Email already registered', 'EMAIL_EXISTS', 400);
                    return;
                }
                
                // Create new user
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("
                    INSERT INTO users (first_name, last_name, email, password_hash) 
                    VALUES (?, ?, ?, ?)
                ");
                
                if ($stmt->execute([$firstName, $lastName, $email, $hashedPassword])) {
                    $userId = $pdo->lastInsertId();
                    
                    // Get the created user
                    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
                    $stmt->execute([$userId]);
                    $user = $stmt->fetch();
                    
                    // Set session
                    if (session_status() === PHP_SESSION_NONE) {
                        session_start();
                    }
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
                    $_SESSION['user_email'] = $user['email'];
                    
                    // Generate JWT token
                    $token = generateJWT($user['id'], $user['email']);
                    $refreshToken = generateJWT($user['id'], $user['email'], true);
                    
                    // Remove password hash from response
                    unset($user['password_hash']);
                    
                    sendSuccess([
                        'user' => $user,
                        'token' => $token,
                        'refresh_token' => $refreshToken
                    ], 'Registration successful');
                } else {
                    sendError('Failed to create user', 'REGISTRATION_FAILED', 500);
                }
                return;
            }
            
            // Use file storage if available
            if (defined('USE_FILE_STORAGE') && USE_FILE_STORAGE) {
                $result = registerUser($firstName, $lastName, $email, $password);
                if ($result['success']) {
                    $user = $result['user'];
                    
                    // Set session
                    if (session_status() === PHP_SESSION_NONE) {
                        session_start();
                    }
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
                    $_SESSION['user_email'] = $user['email'];
                    
                    // Generate JWT token
                    $token = generateJWT($user['id'], $user['email']);
                    $refreshToken = generateJWT($user['id'], $user['email'], true);
                    
                    sendSuccess([
                        'user' => $user,
                        'token' => $token,
                        'refresh_token' => $refreshToken
                    ], 'Registration successful');
                } else {
                    sendError($result['error'], 'REGISTRATION_FAILED', 400);
                }
                return;
            }
            
            // Check if using mock data
            if (defined('USE_MOCK_DATA') && USE_MOCK_DATA) {
                // Mock registration - simulate success for any valid input
                $userId = 2; // Use ID 2 for new registrations
                $fullName = trim($firstName . ' ' . $lastName);
                $token = generateJWT($userId, $email);
                
                sendSuccess([
                    'user' => [
                        'id' => $userId,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'email' => $email,
                        'name' => $fullName
                    ],
                    'token' => $token,
                    'refresh_token' => $token,
                    'expires_in' => 86400
                ], 'Registration successful');
            } else {
                // Use database registration
                // Check if email exists
                $sql = "SELECT id FROM users WHERE email = ?";
                if ($stmt = $mysqli->prepare($sql)) {
                    $stmt->bind_param("s", $email);
                    $stmt->execute();
                    $stmt->store_result();
                    
                    if ($stmt->num_rows > 0) {
                        sendError('Email already exists', 'EMAIL_EXISTS');
                    }
                    $stmt->close();
                }
                
                // Create user - combine first and last name for existing schema
                $fullName = trim($firstName . ' ' . $lastName);
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $sql = "INSERT INTO users (name, email, password, member_since) VALUES (?, ?, ?, NOW())";
                
                if ($stmt = $mysqli->prepare($sql)) {
                    $stmt->bind_param("sss", $fullName, $email, $hashedPassword);
                    
                    if ($stmt->execute()) {
                        $userId = $mysqli->insert_id;
                        $token = generateJWT($userId, $email);
                        
                        sendSuccess([
                            'user' => [
                                'id' => $userId,
                                'first_name' => $firstName,
                                'last_name' => $lastName,
                                'email' => $email,
                                'name' => $fullName
                            ],
                            'token' => $token,
                            'refresh_token' => $token,
                            'expires_in' => 86400
                        ], 'Registration successful');
                    } else {
                        sendError('Failed to create user', 'REGISTRATION_FAILED', 500);
                    }
                    $stmt->close();
                } else {
                    sendError('Database error', 'DB_ERROR', 500);
                }
            }
            break;
            
        case 'profile':
            $user = getCurrentUser();
            if (!$user) {
                sendError('Unauthorized', 'UNAUTHORIZED', 401);
            }
            
            // Get full user profile
            $sql = "SELECT id, name, email, member_since FROM users WHERE id = ?";
            if ($stmt = $mysqli->prepare($sql)) {
                $stmt->bind_param("i", $user['id']);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($userProfile = $result->fetch_assoc()) {
                    // Split name into first and last for frontend compatibility
                    $nameParts = explode(' ', trim($userProfile['name']), 2);
                    $firstName = $nameParts[0];
                    $lastName = isset($nameParts[1]) ? $nameParts[1] : '';
                    
                    sendSuccess([
                        'user' => [
                            'id' => $userProfile['id'],
                            'first_name' => $firstName,
                            'last_name' => $lastName,
                            'email' => $userProfile['email'],
                            'name' => $userProfile['name'],
                            'member_since' => $userProfile['member_since']
                        ]
                    ]);
                } else {
                    sendError('User not found', 'USER_NOT_FOUND', 404);
                }
                $stmt->close();
            }
            break;
            
        default:
            sendError('Invalid auth action', 'INVALID_ACTION');
    }
}

// Get pets handler
function handleGetPets() {
    global $mysqli;
    
    $user = getCurrentUser();
    if (!$user) {
        sendError('Unauthorized', 'UNAUTHORIZED', 401);
    }
    
    $data = getRequestData();
    $petId = $data['pet_id'] ?? null;
    
    // Use SQLite database if available
    if (defined('USE_SQLITE') && USE_SQLITE) {
        $pdo = $GLOBALS['pdo'];
        
        if ($petId) {
            // Get single pet
            $stmt = $pdo->prepare("SELECT * FROM pets WHERE id = ? AND user_id = ?");
            $stmt->execute([$petId, $user['id']]);
            $pet = $stmt->fetch();
            
            if ($pet) {
                sendSuccess(['pet' => $pet]);
            } else {
                sendError('Pet not found', 'PET_NOT_FOUND', 404);
            }
        } else {
            // Get all pets for user
            $stmt = $pdo->prepare("SELECT * FROM pets WHERE user_id = ? ORDER BY name ASC");
            $stmt->execute([$user['id']]);
            $pets = $stmt->fetchAll();
            
            sendSuccess(['pets' => $pets]);
        }
        return;
    }
    
    // Use file storage if available
    if (defined('USE_FILE_STORAGE') && USE_FILE_STORAGE) {
        $pets = getUserPets($user['id']);
        
        if ($petId) {
            // Get single pet
            foreach ($pets as $pet) {
                if ($pet['id'] == $petId) {
                    sendSuccess(['pet' => $pet]);
                    return;
                }
            }
            sendError('Pet not found', 'PET_NOT_FOUND', 404);
        } else {
            // Get all pets
            sendSuccess(['pets' => $pets]);
        }
        return;
    }
    
    // Check if using mock data
    if (defined('USE_MOCK_DATA') && USE_MOCK_DATA) {
        $mockPets = getMockPets($user['id']);
        
        if ($petId) {
            // Get single pet
            foreach ($mockPets as $pet) {
                if ($pet['id'] == $petId) {
                    sendSuccess(['pet' => $pet]);
                    return;
                }
            }
            sendError('Pet not found', 'PET_NOT_FOUND', 404);
        } else {
            // Get all pets
            sendSuccess(['pets' => $mockPets]);
        }
    } else {
        // Use database
        if ($petId) {
            // Get single pet
            $sql = "SELECT * FROM pets WHERE id = ? AND user_id = ?";
            if ($stmt = $mysqli->prepare($sql)) {
                $stmt->bind_param("ii", $petId, $user['id']);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($pet = $result->fetch_assoc()) {
                    sendSuccess(['pet' => $pet]);
                } else {
                    sendError('Pet not found', 'PET_NOT_FOUND', 404);
                }
                $stmt->close();
            }
        } else {
            // Get all pets for user
            $sql = "SELECT * FROM pets WHERE user_id = ? ORDER BY name ASC";
            if ($stmt = $mysqli->prepare($sql)) {
                $stmt->bind_param("i", $user['id']);
                $stmt->execute();
                $result = $stmt->get_result();
                
                $pets = [];
                while ($row = $result->fetch_assoc()) {
                    $pets[] = $row;
                }
                
                sendSuccess(['pets' => $pets]);
                $stmt->close();
            }
        }
    }
}

// Add pet handler
function handleAddPet() {
    global $mysqli;
    
    $user = getCurrentUser();
    if (!$user) {
        sendError('Unauthorized', 'UNAUTHORIZED', 401);
    }
    
    $data = getRequestData();
    
    // Validate required fields
    $required = ['name', 'species', 'weight', 'activity_level'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendError("Field '$field' is required", 'MISSING_FIELD');
        }
    }
    
    // Map frontend fields to database schema
    $age = isset($data['age']) ? (int)$data['age'] : 1;
    $weight = (float)($data['weight'] ?? $data['current_weight'] ?? 0);
    $idealWeight = (float)($data['ideal_weight'] ?? $weight);
    $personality = $data['notes'] ?? $data['personality'] ?? null;
    
    // Use SQLite database if available
    if (defined('USE_SQLITE') && USE_SQLITE) {
        $pdo = $GLOBALS['pdo'];
        
        $stmt = $pdo->prepare("
            INSERT INTO pets (user_id, name, species, breed, age, weight, ideal_weight, activity_level, health_status, photo, personality) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $photo = $data['species'] === 'dog' ? '🐕' : ($data['species'] === 'cat' ? '🐱' : '🐾');
        
        if ($stmt->execute([
            $user['id'],
            $data['name'],
            ucfirst(strtolower($data['species'])),
            $data['breed'] ?? '',
            $age,
            $weight,
            $idealWeight,
            strtolower($data['activity_level']),
            'healthy',
            $photo,
            $personality
        ])) {
            $petId = $pdo->lastInsertId();
            
            // Get the created pet
            $stmt = $pdo->prepare("SELECT * FROM pets WHERE id = ?");
            $stmt->execute([$petId]);
            $pet = $stmt->fetch();
            
            sendSuccess(['pet' => $pet], 'Pet added successfully');
        } else {
            sendError('Failed to add pet', 'ADD_FAILED', 500);
        }
        return;
    }
    
    // Use file storage if available
    if (defined('USE_FILE_STORAGE') && USE_FILE_STORAGE) {
        $result = addPet($user['id'], $data);
        if ($result['success']) {
            sendSuccess(['pet' => $result['pet']], 'Pet added successfully');
        } else {
            sendError($result['error'], 'ADD_FAILED', 500);
        }
        return;
    }
    
    // Check if using mock data
    if (defined('USE_MOCK_DATA') && USE_MOCK_DATA) {
        // For mock data, simulate successful pet creation
        $newPet = [
            'id' => rand(100, 999), // Generate random ID for mock
            'name' => $data['name'],
            'species' => ucfirst(strtolower($data['species'])),
            'breed' => $data['breed'] ?? '',
            'age' => $age,
            'weight' => $weight,
            'ideal_weight' => $idealWeight,
            'activity_level' => ucfirst(strtolower($data['activity_level'])),
            'health_status' => 'Healthy',
            'photo' => $data['species'] === 'dog' ? '🐕' : ($data['species'] === 'cat' ? '🐱' : '🐾'),
            'personality' => $personality
        ];
        
        sendSuccess(['pet' => $newPet], 'Pet added successfully');
        return;
    }
    
    // Insert pet using existing schema
    $sql = "INSERT INTO pets (user_id, name, species, breed, age, weight, ideal_weight, activity_level, health_status, photo, personality) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    if ($stmt = $mysqli->prepare($sql)) {
        $stmt->bind_param("isssiddsss", 
            $user['id'],
            $data['name'],
            $data['species'],
            $data['breed'] ?? '',
            $age,
            $weight,
            $idealWeight,
            ucfirst(strtolower($data['activity_level'])), // Convert to title case
            'Healthy',
            $data['photo'] ?? '🐾',
            $personality
        );
        
        if ($stmt->execute()) {
            $petId = $mysqli->insert_id;
            
            // Return the created pet
            $sql = "SELECT * FROM pets WHERE id = ?";
            if ($getStmt = $mysqli->prepare($sql)) {
                $getStmt->bind_param("i", $petId);
                $getStmt->execute();
                $result = $getStmt->get_result();
                $pet = $result->fetch_assoc();
                $getStmt->close();
                
                sendSuccess(['pet' => $pet], 'Pet added successfully');
            }
        } else {
            sendError('Failed to add pet', 'ADD_FAILED', 500);
        }
        $stmt->close();
    } else {
        sendError('Database error', 'DB_ERROR', 500);
    }
}

// Update pet handler
function handleUpdatePet() {
    global $mysqli;
    
    $user = getCurrentUser();
    if (!$user) {
        sendError('Unauthorized', 'UNAUTHORIZED', 401);
    }
    
    $data = getRequestData();
    $petId = $data['pet_id'] ?? null;
    
    if (!$petId) {
        sendError('Pet ID is required', 'MISSING_PET_ID');
    }
    
    // Use file storage if available
    if (defined('USE_FILE_STORAGE') && USE_FILE_STORAGE) {
        $result = updatePet($user['id'], $data);
        if ($result['success']) {
            sendSuccess(['pet' => $result['pet']], 'Pet updated successfully');
        } else {
            sendError($result['error'], 'UPDATE_FAILED', 500);
        }
        return;
    }
    
    // Database implementation would go here
    sendError('Pet update not implemented for current storage', 'NOT_IMPLEMENTED', 500);
}

// Delete pet handler
function handleDeletePet() {
    global $mysqli;
    
    $user = getCurrentUser();
    if (!$user) {
        sendError('Unauthorized', 'UNAUTHORIZED', 401);
    }
    
    $data = getRequestData();
    $petId = $data['pet_id'] ?? null;
    
    if (!$petId) {
        sendError('Pet ID is required', 'MISSING_PET_ID');
    }
    
    // Use file storage if available
    if (defined('USE_FILE_STORAGE') && USE_FILE_STORAGE) {
        $result = deletePet($user['id'], $petId);
        if ($result['success']) {
            sendSuccess(null, 'Pet deleted successfully');
        } else {
            sendError($result['error'], 'DELETE_FAILED', 500);
        }
        return;
    }
    
    // Database implementation would go here
    sendError('Pet deletion not implemented for current storage', 'NOT_IMPLEMENTED', 500);
}

// Diet plan handler
function handleDietPlan() {
    // Prefer SQLite (local dev) if available
    $user = getCurrentUser();
    if (!$user) {
        sendError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    $data = getRequestData();
    $petId = $data['pet_id'] ?? null;
    if (!$petId) {
        sendError('Pet ID is required', 'MISSING_PET_ID');
    }

    // Load pet
    if (defined('USE_SQLITE') && USE_SQLITE) {
        $pdo = $GLOBALS['pdo'];
        $stmt = $pdo->prepare("SELECT * FROM pets WHERE id = ? AND user_id = ?");
        $stmt->execute([$petId, $user['id']]);
        $pet = $stmt->fetch();
        if (!$pet) {
            sendError('Pet not found', 'PET_NOT_FOUND', 404);
        }

        // Use nutrition service for accurate plan
        $service = class_exists('NutritionCalculationService') ? new NutritionCalculationService() : null;
        $weight = (float)($pet['weight'] ?? $pet['current_weight'] ?? 0);
        $species = strtolower($pet['species'] ?? 'dog');
        $age = (float)($pet['age'] ?? 1);
        $activity = strtolower($pet['activity_level'] ?? 'medium');

        $petData = [
            'weight' => $weight,
            'species' => $species,
            'age' => $age,
            'activity_level' => $activity
        ];

        if ($service) {
            $calorieData = $service->calculateDailyCalories($petData);
            $macros = $service->calculateMacronutrients($petData, $calorieData['der']);
            $mealPlan = $service->generateMealPlan($petData, $calorieData);
            $mealsPerDay = $mealPlan['meals_per_day'];
            $feedingSchedule = $mealPlan['meal_schedule'];
        } else {
            // Fallback simple calculation
            $baseCalories = $species === 'dog' ? (70 * pow($weight, 0.75)) : (70 * pow($weight, 0.67));
            $multipliers = ['low' => 1.2, 'medium' => 1.6, 'high' => 2.0];
            $der = round($baseCalories * ($multipliers[$activity] ?? 1.6));
            $calorieData = ['rer' => (int)round($baseCalories), 'der' => $der, 'lifestage_multiplier' => 1.0, 'activity_multiplier' => ($multipliers[$activity] ?? 1.6), 'calculation_method' => 'Basic'];
            $macros = ['protein_grams' => round($weight * 2.5), 'fat_grams' => round($der * 0.15 / 9), 'carbohydrate_grams' => max(0, round(($der - ($weight*2.5*4) - ($der*0.15)) / 4, 1))];
            $mealsPerDay = 2;
            $feedingSchedule = ['08:00','18:00'];
        }

        // Persist to SQLite (upsert-style)
        savePlanToSqlite($petId, $calorieData, $macros, $mealsPerDay, $feedingSchedule, [
            'source' => 'diet_plan',
        ]);

        $plan = [
            'pet_id' => $petId,
            'daily_calories' => (int)$calorieData['der'],
            'meals_per_day' => (int)$mealsPerDay,
            'daily_protein_grams' => (float)$macros['protein_grams'],
            'daily_fat_grams' => (float)$macros['fat_grams'],
            'feeding_schedule' => $feedingSchedule,
            'created_at' => date('Y-m-d H:i:s')
        ];

        sendSuccess(['nutrition_plan' => $plan], 'Nutrition plan generated successfully');
        return;
    }

    // Fallback (legacy) – keep previous behavior if not using SQLite
    global $mysqli;
    $sql = "SELECT * FROM pets WHERE id = ? AND user_id = ?";
    if ($stmt = $mysqli->prepare($sql)) {
        $stmt->bind_param("ii", $petId, $user['id']);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($pet = $result->fetch_assoc()) {
            $weight = (float)($pet['current_weight'] ?? 0);
            $activityLevel = strtolower($pet['activity_level'] ?? 'medium');
            $baseCalories = $pet['species'] === 'dog' ? (70 * pow($weight, 0.75)) : (70 * pow($weight, 0.67));
            $activityMultiplier = ['low' => 1.2, 'moderate' => 1.6, 'high' => 2.0, 'medium' => 1.6];
            $dailyCalories = round($baseCalories * ($activityMultiplier[$activityLevel] ?? 1.6));
            $plan = [
                'pet_id' => $petId,
                'daily_calories' => $dailyCalories,
                'meals_per_day' => 2,
                'daily_protein_grams' => round($weight * 2.5),
                'daily_fat_grams' => round($dailyCalories * 0.15 / 9),
                'special_instructions' => 'Provide fresh water at all times. Adjust portions based on activity level and weight changes.',
                'created_at' => date('Y-m-d H:i:s')
            ];
            sendSuccess(['nutrition_plan' => $plan], 'Nutrition plan generated successfully');
        } else {
            sendError('Pet not found', 'PET_NOT_FOUND', 404);
        }
        $stmt->close();
    }
}

// Update profile handler
function handleUpdateProfile() {
    $user = getCurrentUser();
    if (!$user) {
        sendError('Unauthorized', 'UNAUTHORIZED', 401);
    }
    
    $data = getRequestData();
    
    // Validate required fields
    $required = ['first_name', 'last_name', 'email'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendError("Field '$field' is required", 'MISSING_FIELD');
        }
    }
    
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        sendError('Invalid email address', 'INVALID_EMAIL');
    }
    
    // Use file storage if available
    if (defined('USE_FILE_STORAGE') && USE_FILE_STORAGE) {
        $result = updateUserProfile($user['id'], $data);
        if ($result['success']) {
            sendSuccess(['user' => $result['user']], 'Profile updated successfully');
        } else {
            sendError($result['error'], 'UPDATE_FAILED', 500);
        }
        return;
    }
    
    sendError('Profile update not implemented for current storage', 'NOT_IMPLEMENTED', 500);
}

// Add weight record handler
function handleAddWeightRecord() {
    $user = getCurrentUser();
    if (!$user) {
        sendError('Unauthorized', 'UNAUTHORIZED', 401);
    }
    
    $data = getRequestData();
    
    // Validate required fields
    $required = ['pet_id', 'date', 'weight'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendError("Field '$field' is required", 'MISSING_FIELD');
        }
    }
    
    // Use file storage if available
    if (defined('USE_FILE_STORAGE') && USE_FILE_STORAGE) {
        $result = addWeightRecord($user['id'], $data);
        if ($result['success']) {
            sendSuccess(['record' => $result['record']], 'Weight record added successfully');
        } else {
            sendError($result['error'], 'ADD_FAILED', 500);
        }
        return;
    }
    
    sendError('Weight record not implemented for current storage', 'NOT_IMPLEMENTED', 500);
}

// Add health record handler
function handleAddHealthRecord() {
    $user = getCurrentUser();
    if (!$user) {
        sendError('Unauthorized', 'UNAUTHORIZED', 401);
    }
    
    $data = getRequestData();
    
    // Validate required fields
    $required = ['pet_id', 'type', 'date', 'title'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendError("Field '$field' is required", 'MISSING_FIELD');
        }
    }
    
    // Use file storage if available
    if (defined('USE_FILE_STORAGE') && USE_FILE_STORAGE) {
        $result = addHealthRecord($user['id'], $data);
        if ($result['success']) {
            sendSuccess(['record' => $result['record']], 'Health record added successfully');
        } else {
            sendError($result['error'], 'ADD_FAILED', 500);
        }
        return;
    }
    
    sendError('Health record not implemented for current storage', 'NOT_IMPLEMENTED', 500);
}

// Health check handler
function handleHealth() {
    sendSuccess([
        'status' => 'healthy',
        'timestamp' => date('c'),
        'version' => '1.0.0'
    ], 'API is healthy');
}

// =============================
// Nutrition: Calculator + Plans
// =============================
function handleNutritionCalculator() {
    if (!class_exists('NutritionCalculationService')) {
        sendError('Nutrition service not available', 'SERVICE_MISSING', 500);
    }

    $user = getCurrentUser();
    if (!$user) {
        sendError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    $data = getRequestData();
    $op = strtolower($data['action'] ?? $data['subaction'] ?? 'calculate_nutrition');

    $service = new NutritionCalculationService();

    if ($op === 'calculate' || $op === 'calculate_nutrition') {
        $petId = $data['pet_id'] ?? null;
        $weight = (float)($data['weight'] ?? $data['current_weight'] ?? 0);
        $species = strtolower($data['species'] ?? 'dog');
        $age = (float)($data['age'] ?? 1);
        $activity = strtolower($data['activity_level'] ?? 'medium');

        if (!$petId || !$weight || !$species || !$age) {
            sendError('Missing pet_id, weight, species or age', 'MISSING_DATA', 400);
        }

        $petData = [
            'weight' => $weight,
            'species' => $species,
            'age' => $age,
            'activity_level' => $activity
        ];

        $calories = $service->calculateDailyCalories($petData);
        $macros = $service->calculateMacronutrients($petData, $calories['der']);
        $validation = $service->validateCalculations($petData, array_merge($calories, $macros));
        $meal = $service->generateMealPlan($petData, $calories);

        // Persist plan automatically
        savePlanToSqlite($petId, $calories, $macros, $meal['meals_per_day'], $meal['meal_schedule'], [
            'source' => 'nutrition_calculator',
            'portion_guidance' => $meal['portion_guidance'] ?? null,
            'feeding_guidelines' => $meal['feeding_guidelines'] ?? null
        ]);
        
        // Log activity
        try {
            $petName = getPetName($petId);
            ActivityRepository::log('nutrition_calculated', $user['id'], [
                'pet_id' => $petId,
                'pet_name' => $petName,
                'calories' => $calories['der'],
                'meals_per_day' => $meal['meals_per_day']
            ]);
        } catch (Exception $e) {
            // Don't fail the request if activity logging fails
            error_log('Failed to log nutrition calculation activity: ' . $e->getMessage());
        }

        sendSuccess([
            'pet_data' => $petData,
            'calories' => $calories,
            'macronutrients' => $macros,
            'validation' => $validation,
            'meal' => $meal
        ], 'Nutrition calculated and saved');
        return;
    }

    if ($op === 'generate_meal_plan') {
        $petId = $data['pet_id'] ?? null;
        if (!$petId) {
            sendError('Pet ID is required', 'MISSING_PET_ID');
        }

        // Load pet from DB
        if (!(defined('USE_SQLITE') && USE_SQLITE)) {
            sendError('Meal planner supported only in SQLite mode in this build', 'NOT_SUPPORTED', 500);
        }
        $pdo = $GLOBALS['pdo'];
        $stmt = $pdo->prepare('SELECT * FROM pets WHERE id = ? AND user_id = ?');
        $stmt->execute([$petId, getCurrentUser()['id']]);
        $pet = $stmt->fetch();
        if (!$pet) {
            sendError('Pet not found', 'PET_NOT_FOUND', 404);
        }

        // Try to reuse latest plan calories if available
        $plan = getLatestPlanFromSqlite($petId);

        $petData = [
            'weight' => (float)($pet['weight'] ?? $pet['current_weight'] ?? 0),
            'species' => strtolower($pet['species'] ?? 'dog'),
            'age' => (float)($pet['age'] ?? 1),
            'activity_level' => strtolower($pet['activity_level'] ?? 'medium')
        ];
        $calories = $plan['calories'] ?? (new NutritionCalculationService())->calculateDailyCalories($petData);

        $meal = $service->generateMealPlan($petData, $calories);

        // Update stored plan with schedule
        savePlanToSqlite($petId, $calories, $plan['macros'] ?? ['protein_grams'=>null,'fat_grams'=>null,'carbohydrate_grams'=>null], $meal['meals_per_day'], $meal['meal_schedule'], [
            'source' => 'meal_planner',
            'portion_guidance' => $meal['portion_guidance'] ?? null,
            'feeding_guidelines' => $meal['feeding_guidelines'] ?? null
        ]);
        
        // Log activity
        try {
            $petName = getPetName($petId);
            if (class_exists('ActivityRepository')) {
                $activityRepo = new ActivityRepository($GLOBALS['pdo']);
                $activityRepo->create([
                    'user_id' => $user['id'],
                    'type' => 'meal_plan_created',
                    'description' => "Created meal plan for {$petName}",
                    'pet_id' => $petId,
                    'metadata' => json_encode([
                        'pet_name' => $petName,
                        'meals_per_day' => $meal['meals_per_day'],
                        'source' => 'meal_planner'
                    ])
                ]);
            }
        } catch (Exception $e) {
            error_log('Failed to log meal plan activity: ' . $e->getMessage());
        }

        sendSuccess(['meal_plan' => $meal], 'Meal plan generated');
        return;
    }
    
    if ($op === 'save_nutrition_plan') {
        $petId = $data['pet_id'] ?? null;
        $nutritionData = $data['nutrition_data'] ?? null;
        
        if (!$petId || !$nutritionData) {
            sendError('Pet ID and nutrition data are required', 'MISSING_DATA');
        }
        
        try {
            // Save nutrition plan to database
            $calories = [
                'rer' => $nutritionData['rer'] ?? 0,
                'der' => $nutritionData['der'] ?? 0
            ];
            
            $macros = [
                'protein_grams' => $nutritionData['protein'] ?? 0,
                'fat_grams' => $nutritionData['fat'] ?? 0,
                'carbohydrate_grams' => $nutritionData['carbohydrates'] ?? 0
            ];
            
            $mealsPerDay = $nutritionData['mealsPerDay'] ?? 2;
            $mealSchedule = generateDefaultMealSchedule($mealsPerDay);
            
            savePlanToSqlite($petId, $calories, $macros, $mealsPerDay, $mealSchedule, [
                'source' => 'nutrition_calculator_save',
                'calculated_at' => $nutritionData['calculatedAt'] ?? date('c'),
                'input_data' => $nutritionData['inputData'] ?? null
            ]);
            
            // Log activity
            try {
                $petName = getPetName($petId);
                if (class_exists('ActivityRepository')) {
                    $activityRepo = new ActivityRepository($GLOBALS['pdo']);
                    $activityRepo->create([
                        'user_id' => $user['id'],
                        'type' => 'nutrition_plan_saved',
                        'description' => "Saved nutrition plan for {$petName}",
                        'pet_id' => $petId,
                        'metadata' => json_encode([
                            'pet_name' => $petName,
                            'calories' => $nutritionData['der'] ?? 0,
                            'meals_per_day' => $mealsPerDay,
                            'source' => 'nutrition_calculator_save'
                        ])
                    ]);
                }
            } catch (Exception $e) {
                error_log('Failed to log nutrition plan save activity: ' . $e->getMessage());
            }
            
            sendSuccess(['plan_id' => $petId], 'Nutrition plan saved successfully');
            return;
            
        } catch (Exception $e) {
            error_log('Failed to save nutrition plan: ' . $e->getMessage());
            sendError('Failed to save nutrition plan: ' . $e->getMessage(), 'SAVE_FAILED', 500);
        }
    }
    
    if ($op === 'update_meal_schedule') {
        $petId = $data['pet_id'] ?? null;
        $mealsPerDay = (int)($data['meals_per_day'] ?? 2);
        $mealSchedule = $data['meal_schedule'] ?? generateDefaultMealSchedule($mealsPerDay);
        
        if (!$petId) {
            sendError('Pet ID is required', 'MISSING_PET_ID');
        }
        
        try {
            // Update meal schedule in database
            $pdo = $GLOBALS['pdo'];
            $stmt = $pdo->prepare('UPDATE nutrition_plans SET meals_per_day = ?, special_instructions = JSON_SET(COALESCE(special_instructions, "{}"), "$.feeding_schedule", ?) WHERE pet_id = ?');
            $stmt->execute([$mealsPerDay, json_encode($mealSchedule), $petId]);
            
            sendSuccess(['meal_schedule' => $mealSchedule], 'Meal schedule updated successfully');
            return;
        } catch (Exception $e) {
            sendError('Failed to update meal schedule: ' . $e->getMessage(), 'UPDATE_FAILED', 500);
        }
    }
    
    if ($op === 'log_meal_fed') {
        $petId = $data['pet_id'] ?? null;
        $dayIndex = $data['day_index'] ?? null;
        $mealTime = $data['meal_time'] ?? null;
        $fedAt = $data['fed_at'] ?? date('c');
        
        if (!$petId || $dayIndex === null || !$mealTime) {
            sendError('Pet ID, day index, and meal time are required', 'MISSING_DATA');
        }
        
        try {
            // Log meal feeding (could be stored in a separate meals_log table)
            // For now, just log as activity
            $petName = getPetName($petId);
            if (class_exists('ActivityRepository')) {
                $activityRepo = new ActivityRepository($GLOBALS['pdo']);
                $activityRepo->create([
                    'user_id' => $user['id'],
                    'type' => 'meal_fed',
                    'description' => "Fed {$petName} at {$mealTime}",
                    'pet_id' => $petId,
                    'metadata' => json_encode([
                        'pet_name' => $petName,
                        'meal_time' => $mealTime,
                        'day_index' => $dayIndex,
                        'fed_at' => $fedAt
                    ])
                ]);
            }
            
            sendSuccess(['logged' => true], 'Meal logged successfully');
            return;
        } catch (Exception $e) {
            sendError('Failed to log meal: ' . $e->getMessage(), 'LOG_FAILED', 500);
        }
    }
    
    if ($op === 'save_meal_plan') {
        $petId = $data['pet_id'] ?? null;
        $mealPlan = $data['meal_plan'] ?? null;
        
        if (!$petId || !$mealPlan) {
            sendError('Pet ID and meal plan are required', 'MISSING_DATA');
        }
        
        try {
            // Update meal plan in database
            $calories = [
                'der' => $mealPlan['total_calories'] ?? 0
            ];
            
            $macros = [
                'protein_grams' => 0,
                'fat_grams' => 0,
                'carbohydrate_grams' => 0
            ];
            
            $mealsPerDay = $mealPlan['meals_per_day'] ?? 2;
            $mealSchedule = $mealPlan['meal_schedule'] ?? generateDefaultMealSchedule($mealsPerDay);
            
            savePlanToSqlite($petId, $calories, $macros, $mealsPerDay, $mealSchedule, [
                'source' => 'meal_planner_save',
                'saved_at' => date('c'),
                'meal_plan_data' => $mealPlan
            ]);
            
            sendSuccess(['plan_saved' => true], 'Meal plan saved successfully');
            return;
        } catch (Exception $e) {
            sendError('Failed to save meal plan: ' . $e->getMessage(), 'SAVE_FAILED', 500);
        }
    }

    sendError('Invalid nutrition calculator action', 'INVALID_ACTION', 400);
}

// New engine-first handler (uses NutritionEngineService and saves plan)
function handleNutritionEngine() {
    if (!class_exists('NutritionEngineService')) {
        sendError('Nutrition engine not available', 'SERVICE_MISSING', 500);
    }
    $user = getCurrentUser();
    if (!$user) sendError('Unauthorized', 'UNAUTHORIZED', 401);
    $data = getRequestData();
    $petId = $data['pet_id'] ?? null;
    if (!$petId) sendError('Pet ID is required', 'MISSING_PET_ID');

    // Load pet (SQLite only for local dev)
    if (!(defined('USE_SQLITE') && USE_SQLITE)) sendError('Engine supported only in SQLite mode in this build', 'NOT_SUPPORTED', 500);
    $pdo = $GLOBALS['pdo'];
    $stmt = $pdo->prepare('SELECT * FROM pets WHERE id = ? AND user_id = ?');
    $stmt->execute([$petId, $user['id']]);
    $pet = $stmt->fetch();
    if (!$pet) sendError('Pet not found', 'PET_NOT_FOUND', 404);

    $engine = new NutritionEngineService();
    $input = [
        'species' => strtolower($pet['species']),
        'weight' => (float)($pet['weight'] ?? $pet['current_weight'] ?? 0),
        'age' => (float)($pet['age'] ?? 1),
        'activity_level' => strtolower($pet['activity_level'] ?? 'medium'),
        'body_condition' => $data['body_condition'] ?? 'ideal',
        'spay_neuter' => $data['spay_neuter'] ?? 'altered'
    ];
    $calc = $engine->calculate($input);

    // Persist using helper
    savePlanToSqlite(
        $petId,
        ['rer'=>$calc['rer'], 'der'=>$calc['der'], 'lifestage_multiplier'=>$calc['lifestage_multiplier'], 'activity_multiplier'=>$calc['activity_multiplier'], 'calculation_method'=>$calc['calculation_method']],
        ['protein_grams'=>$calc['macros']['protein_grams'], 'fat_grams'=>$calc['macros']['fat_grams'], 'carbohydrate_grams'=>$calc['macros']['carbohydrate_grams']],
        0,
        null,
        ['engine'=>$calc]
    );

    sendSuccess(['engine'=>$calc], 'Nutrition engine calculated and saved');
}

function handleMealPlannerGenerate() {
    if (!class_exists('MealPlannerService') || !class_exists('NutritionEngineService')) {
        sendError('Meal planner prerequisites missing', 'SERVICE_MISSING', 500);
    }
    $user = getCurrentUser();
    if (!$user) sendError('Unauthorized', 'UNAUTHORIZED', 401);
    $data = getRequestData();
    $petId = $data['pet_id'] ?? null;
    if (!$petId) sendError('Pet ID is required', 'MISSING_PET_ID');

    if (!(defined('USE_SQLITE') && USE_SQLITE)) sendError('Planner supported only in SQLite mode in this build', 'NOT_SUPPORTED', 500);
    $pdo = $GLOBALS['pdo'];
    $stmt = $pdo->prepare('SELECT * FROM pets WHERE id = ? AND user_id = ?');
    $stmt->execute([$petId, $user['id']]);
    $pet = $stmt->fetch();
    if (!$pet) sendError('Pet not found', 'PET_NOT_FOUND', 404);

    // Use latest plan or compute engine first
    $plan = getLatestPlanFromSqlite($petId);
    if (!$plan || empty($plan['calories']['der'])) {
        $engine = new NutritionEngineService();
        $calc = $engine->calculate([
            'species'=>strtolower($pet['species']),
            'weight'=>(float)($pet['weight'] ?? $pet['current_weight'] ?? 0),
            'age'=>(float)($pet['age'] ?? 1),
            'activity_level'=>strtolower($pet['activity_level'] ?? 'medium')
        ]);
        $plan = ['calories'=>['der'=>$calc['der']], 'macros'=>$calc['macros']];
    }

    $planner = new MealPlannerService();
    $weekly = $planner->generateWeeklyPlan(
        [
            'species'=>strtolower($pet['species']),
            'age'=>(float)($pet['age'] ?? 1),
            'weight'=>(float)($pet['weight'] ?? $pet['current_weight'] ?? 0)
        ],
        ['der'=>$plan['calories']['der']]
    );

    savePlanToSqlite(
        $petId,
        ['der'=>$plan['calories']['der']],
        $plan['macros'] ?? ['protein_grams'=>null,'fat_grams'=>null,'carbohydrate_grams'=>null],
        $weekly['meals_per_day'],
        $weekly['times'],
        ['weekly_plan'=>$weekly]
    );

    sendSuccess(['meal_plan'=>$weekly], 'Weekly meal plan generated and saved');
}

function handleGetNutritionPlan() {
    $user = getCurrentUser();
    if (!$user) {
        sendError('Unauthorized', 'UNAUTHORIZED', 401);
    }
    $data = getRequestData();
    $petId = $data['pet_id'] ?? null;
    if (!$petId) {
        sendError('Pet ID is required', 'MISSING_PET_ID');
    }

    $plan = getLatestPlanFromSqlite($petId);
    if (!$plan) {
        sendError('No plan found', 'PLAN_NOT_FOUND', 404);
    }
    sendSuccess(['nutrition_plan' => $plan]);
}

function handleSaveNutritionPlan() {
    $user = getCurrentUser();
    if (!$user) {
        sendError('Unauthorized', 'UNAUTHORIZED', 401);
    }
    $data = getRequestData();
    $petId = $data['pet_id'] ?? null;
    if (!$petId) {
        sendError('Pet ID is required', 'MISSING_PET_ID');
    }

    $calories = [
        'rer' => (int)($data['rer'] ?? 0),
        'der' => (int)($data['daily_calories'] ?? $data['der'] ?? 0),
        'lifestage_multiplier' => $data['lifestage_multiplier'] ?? 1.0,
        'activity_multiplier' => $data['activity_multiplier'] ?? 1.0,
        'calculation_method' => $data['calculation_method'] ?? 'manual'
    ];
    $macros = [
        'protein_grams' => isset($data['daily_protein_grams']) ? (float)$data['daily_protein_grams'] : ($data['protein_grams'] ?? null),
        'fat_grams' => isset($data['daily_fat_grams']) ? (float)$data['daily_fat_grams'] : ($data['fat_grams'] ?? null),
        'carbohydrate_grams' => $data['carbohydrate_grams'] ?? null
    ];
    $mealsPerDay = (int)($data['meals_per_day'] ?? 2);
    $feedingSchedule = $data['feeding_schedule'] ?? null;
    $extras = [ 'source' => 'manual_save' ];

    savePlanToSqlite($petId, $calories, $macros, $mealsPerDay, $feedingSchedule, $extras);
    $plan = getLatestPlanFromSqlite($petId);
    sendSuccess(['nutrition_plan' => $plan], 'Nutrition plan saved');
}

// Helpers for SQLite persistence
function savePlanToSqlite($petId, $calorieData, $macronutrients, $mealsPerDay = 2, $feedingSchedule = null, $extras = []) {
    if (!(defined('USE_SQLITE') && USE_SQLITE)) {
        return false;
    }
    $pdo = $GLOBALS['pdo'];

    // Build special instructions JSON payload
    $special = [
        'rer' => $calorieData['rer'] ?? null,
        'der' => $calorieData['der'] ?? null,
        'lifestage_multiplier' => $calorieData['lifestage_multiplier'] ?? null,
        'activity_multiplier' => $calorieData['activity_multiplier'] ?? null,
        'calculation_method' => $calorieData['calculation_method'] ?? null,
        'carbohydrate_grams' => $macronutrients['carbohydrate_grams'] ?? null,
        'feeding_schedule' => $feedingSchedule,
        'meta' => $extras
    ];

    // Check if plan exists
    $check = $pdo->prepare('SELECT id FROM nutrition_plans WHERE pet_id = ? ORDER BY id DESC LIMIT 1');
    $check->execute([$petId]);
    $existingId = $check->fetchColumn();

    if ($existingId) {
        $stmt = $pdo->prepare('UPDATE nutrition_plans SET daily_calories = ?, meals_per_day = ?, daily_protein_grams = ?, daily_fat_grams = ?, special_instructions = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        return $stmt->execute([
            (int)($calorieData['der'] ?? 0),
            (int)$mealsPerDay,
            $macronutrients['protein_grams'] ?? null,
            $macronutrients['fat_grams'] ?? null,
            json_encode($special),
            $existingId
        ]);
    }

    $stmt = $pdo->prepare('INSERT INTO nutrition_plans (pet_id, daily_calories, meals_per_day, daily_protein_grams, daily_fat_grams, special_instructions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
    return $stmt->execute([
        $petId,
        (int)($calorieData['der'] ?? 0),
        (int)$mealsPerDay,
        $macronutrients['protein_grams'] ?? null,
        $macronutrients['fat_grams'] ?? null,
        json_encode($special)
    ]);
}

function getLatestPlanFromSqlite($petId) {
    if (!(defined('USE_SQLITE') && USE_SQLITE)) {
        return null;
    }
    $pdo = $GLOBALS['pdo'];
    $stmt = $pdo->prepare('SELECT * FROM nutrition_plans WHERE pet_id = ? ORDER BY id DESC LIMIT 1');
    $stmt->execute([$petId]);
    $row = $stmt->fetch();
    if (!$row) return null;
    $extra = [];
    if (!empty($row['special_instructions'])) {
        $decoded = json_decode($row['special_instructions'], true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $extra = $decoded;
        }
    }
    return [
        'id' => (int)$row['id'],
        'pet_id' => (int)$row['pet_id'],
        'daily_calories' => (int)$row['daily_calories'],
        'meals_per_day' => (int)$row['meals_per_day'],
        'daily_protein_grams' => isset($row['daily_protein_grams']) ? (float)$row['daily_protein_grams'] : null,
        'daily_fat_grams' => isset($row['daily_fat_grams']) ? (float)$row['daily_fat_grams'] : null,
        'feeding_schedule' => $extra['feeding_schedule'] ?? null,
        'calculation_details' => $extra,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
        // Convenience fields
        'calories' => [
            'rer' => $extra['rer'] ?? null,
            'der' => (int)$row['daily_calories'],
            'lifestage_multiplier' => $extra['lifestage_multiplier'] ?? null,
            'activity_multiplier' => $extra['activity_multiplier'] ?? null,
            'calculation_method' => $extra['calculation_method'] ?? null
        ],
        'macros' => [
            'protein_grams' => isset($row['daily_protein_grams']) ? (float)$row['daily_protein_grams'] : null,
            'fat_grams' => isset($row['daily_fat_grams']) ? (float)$row['daily_fat_grams'] : null,
            'carbohydrate_grams' => $extra['carbohydrate_grams'] ?? null
        ]
    ];
}
?>
/**

 * Helper function to get pet name by ID
 */
function getPetName($petId) {
    try {
        $pdo = $GLOBALS['pdo'];
        $stmt = $pdo->prepare("SELECT name FROM pets WHERE id = ?");
        $stmt->execute([$petId]);
        return $stmt->fetchColumn() ?: 'Unknown Pet';
    } catch (Exception $e) {
        return 'Unknown Pet';
    }
}
/
**
 * Get pet name by ID
 */
function getPetName($petId) {
    if (!(defined('USE_SQLITE') && USE_SQLITE)) {
        return "Pet #{$petId}";
    }
    
    try {
        $pdo = $GLOBALS['pdo'];
        $stmt = $pdo->prepare('SELECT name FROM pets WHERE id = ?');
        $stmt->execute([$petId]);
        $name = $stmt->fetchColumn();
        return $name ?: "Pet #{$petId}";
    } catch (Exception $e) {
        return "Pet #{$petId}";
    }
}

/**
 * Generate default meal schedule based on meals per day
 */
function generateDefaultMealSchedule($mealsPerDay) {
    switch ($mealsPerDay) {
        case 1:
            return ['08:00'];
        case 2:
            return ['08:00', '18:00'];
        case 3:
            return ['08:00', '13:00', '18:00'];
        case 4:
            return ['07:00', '12:00', '17:00', '21:00'];
        default:
            return ['08:00', '18:00'];
    }
}