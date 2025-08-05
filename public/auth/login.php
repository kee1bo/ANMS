<?php
session_start();

// Simple demo login - in production, you'd validate against database
if ($_POST['email'] && $_POST['password']) {
    // Set session variables
    $_SESSION['user_id'] = 1;
    $_SESSION['user_name'] = 'Demo User';
    $_SESSION['user_email'] = $_POST['email'];
    
    // Redirect to dashboard
    header('Location: ../index.php');
    exit;
} else {
    // Redirect back to login with error
    header('Location: ../login.html?error=invalid');
    exit;
}
?>