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
    
    // Get pet details
    $sql = "SELECT * FROM pets WHERE id = ? AND user_id = ?";
    if ($stmt = $mysqli->prepare($sql)) {
        $stmt->bind_param("ii", $petId, $user['id']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($pet = $result->fetch_assoc()) {
            // Generate basic nutrition plan (simplified)
            $weight = (float)$pet['current_weight'];
            $activityLevel = $pet['activity_level'];
            
            // Basic calorie calculation
            $baseCalories = $pet['species'] === 'dog' ? 
                (70 * pow($weight, 0.75)) : 
                (70 * pow($weight, 0.67));
            
            $activityMultiplier = [
                'low' => 1.2,
                'moderate' => 1.6,
                'high' => 2.0
            ];
            
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
?>