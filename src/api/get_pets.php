<?php
session_start();

header('Content-Type: application/json');

require_once __DIR__ . '/../includes/db_connect.php';

$response = ['success' => false, 'message' => '', 'pets' => []];

if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'User not logged in.';
    echo json_encode($response);
    exit();
}

$user_id = $_SESSION['user_id'];

// Use mock data if available
if (defined('USE_MOCK_DATA') && USE_MOCK_DATA) {
    $response['success'] = true;
    $response['pets'] = getMockPets($user_id);
    echo json_encode($response);
    exit();
}

$sql = "SELECT id, name, species, breed, age, weight, ideal_weight, activity_level, health_status, last_weighed_date, photo, personality FROM pets WHERE user_id = ? ORDER BY name ASC";

if ($stmt = $mysqli->prepare($sql)) {
    $stmt->bind_param("i", $user_id);
    if ($stmt->execute()) {
        $result = $stmt->get_result();
        $pets = [];
        while ($row = $result->fetch_assoc()) {
            $pets[] = $row;
        }
        $response['success'] = true;
        $response['pets'] = $pets;
    } else {
        $response['message'] = 'Error executing query: ' . $stmt->error;
    }
    $stmt->close();
} else {
    $response['message'] = 'Error preparing statement: ' . $mysqli->error;
}

$mysqli->close();

echo json_encode($response);
?>