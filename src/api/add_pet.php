<?php
session_start();

header('Content-Type: application/json');

require_once __DIR__ . '/../includes/db_connect.php';

$response = ['success' => false, 'message' => ''];

if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'User not logged in.';
    echo json_encode($response);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = $_SESSION['user_id'];

    // Use mock data if available
    if (defined('USE_MOCK_DATA') && USE_MOCK_DATA) {
        $response['success'] = true;
        $response['message'] = 'Pet added successfully! (Demo mode - not actually saved)';
        echo json_encode($response);
        exit();
    }

    // Collect and sanitize input data
    $name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING);
    $species = filter_input(INPUT_POST, 'species', FILTER_SANITIZE_STRING);
    $breed = filter_input(INPUT_POST, 'breed', FILTER_SANITIZE_STRING);
    $age = filter_input(INPUT_POST, 'age', FILTER_VALIDATE_INT);
    $weight = filter_input(INPUT_POST, 'weight', FILTER_VALIDATE_FLOAT);
    $activity_level = filter_input(INPUT_POST, 'activity_level', FILTER_SANITIZE_STRING);
    $personality = filter_input(INPUT_POST, 'personality', FILTER_SANITIZE_STRING);
    $photo = filter_input(INPUT_POST, 'photo', FILTER_SANITIZE_STRING); // Assuming emoji or simple string for now

    // Basic validation
    if (empty($name) || empty($species) || empty($age) || empty($weight) || empty($activity_level)) {
        $response['message'] = 'Please fill in all required fields.';
        echo json_encode($response);
        exit();
    }

    // Prepare an insert statement
    $sql = "INSERT INTO pets (user_id, name, species, breed, age, weight, activity_level, personality, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    if ($stmt = $mysqli->prepare($sql)) {
        $stmt->bind_param("isssidsis", $user_id, $name, $species, $breed, $age, $weight, $activity_level, $personality, $photo);

        if ($stmt->execute()) {
            $response['success'] = true;
            $response['message'] = 'Pet added successfully!';
        } else {
            $response['message'] = 'Error adding pet: ' . $stmt->error;
        }
        $stmt->close();
    } else {
        $response['message'] = 'Error preparing statement: ' . $mysqli->error;
    }
} else {
    $response['message'] = 'Invalid request method.';
}

$mysqli->close();

echo json_encode($response);
?>