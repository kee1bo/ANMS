<?php
session_start();

require_once __DIR__ . '/../includes/db_connect.php';

// Handle registration
if (isset($_POST['register'])) {
    $name = trim($_POST['first_name']) . ' ' . trim($_POST['last_name']);
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];

    // Basic validation
    if ($password !== $confirm_password) {
        $_SESSION['register_error'] = "Passwords do not match.";
        header("location: index.php?action=register");
        exit;
    }

    // Use mock data if available (for demo purposes)
    if (defined('USE_MOCK_DATA') && USE_MOCK_DATA) {
        // In a real scenario, you would add the user to a mock user array
        // For this demo, we'll just log them in as the test user
        mockLogin($email, $password); // This will fail unless it's the test user, which is fine for demo
        header("location: index.php?page=dashboard");
        exit;
    }

    // Check if email already exists
    $sql = "SELECT id FROM users WHERE email = ?";
    if ($stmt = $mysqli->prepare($sql)) {
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows > 0) {
            $_SESSION['register_error'] = "An account with this email already exists.";
            header("location: index.php?action=register");
            exit;
        }
        $stmt->close();
    }

    // Hash password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Insert new user
    $sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    if ($stmt = $mysqli->prepare($sql)) {
        $stmt->bind_param("sss", $name, $email, $hashed_password);
        if ($stmt->execute()) {
            // New user created, log them in
            $_SESSION['user_id'] = $mysqli->insert_id;
            $_SESSION['user_name'] = $name;
            $_SESSION['user_email'] = $email;
            $_SESSION['user_location'] = null; // Or a default value
            $_SESSION['member_since'] = date('Y-m-d H:i:s');
            header("location: index.php?page=dashboard");
            exit;
        } else {
            $_SESSION['register_error'] = "Something went wrong. Please try again.";
            header("location: index.php?action=register");
            exit;
        }
        $stmt->close();
    }
}

// Handle login
if (isset($_POST['login'])) {
    $email = $_POST['email'];
    $password = $_POST['password'];

    // Use mock data if available
    if (defined('USE_MOCK_DATA') && USE_MOCK_DATA) {
        if (mockLogin($email, $password)) {
            header("location: index.php?page=dashboard");
            exit;
        } else {
            $_SESSION['login_error'] = "Invalid email or password.";
            header("location: index.php?action=login");
            exit;
        }
    }

    // Prepare a select statement
    $sql = "SELECT id, name, email, password, location, member_since FROM users WHERE email = ?";

    if ($stmt = $mysqli->prepare($sql)) {
        // Bind variables to the prepared statement as parameters
        $stmt->bind_param("s", $email);

        // Attempt to execute the prepared statement
        if ($stmt->execute()) {
            // Store result
            $stmt->store_result();

            // Check if email exists, if yes then verify password
            if ($stmt->num_rows == 1) {
                // Bind result variables
                $stmt->bind_result($id, $name, $email_result, $hashed_password, $location, $member_since);
                if ($stmt->fetch()) {
                    if (password_verify($password, $hashed_password)) {
                        // Password is correct, start a new session
                        session_regenerate_id(true); // Prevent session fixation
                        $_SESSION['user_id'] = $id;
                        $_SESSION['user_name'] = $name;
                        $_SESSION['user_email'] = $email_result;
                        $_SESSION['user_location'] = $location;
                        $_SESSION['member_since'] = $member_since;

                        // Redirect user to dashboard page
                        header("location: index.php?page=dashboard");
                        exit;
                    } else {
                        // Password is not valid
                        $_SESSION['login_error'] = "Invalid email or password.";
                        header("location: index.php?action=login");
                        exit;
                    }
                }
            } else {
                // Email doesn't exist
                $_SESSION['login_error'] = "Invalid email or password.";
                header("location: index.php?action=login");
                exit;
            }
        } else {
            echo "Oops! Something went wrong. Please try again later.";
        }

        // Close statement
        $stmt->close();
    }
}

// Handle logout
if (isset($_GET['logout'])) {
    // Unset all of the session variables
    $_SESSION = array();

    // Destroy the session. 
    session_destroy();

    // Redirect to login page
    header("location: index.php");
    exit;
}

// Close connection only if it exists
if (isset($mysqli) && $mysqli instanceof mysqli) {
    $mysqli->close();
}
?>