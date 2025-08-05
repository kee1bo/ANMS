<?php
session_start();
require_once __DIR__ . '/../src/includes/db_connect.php';
require_once __DIR__ . '/../src/includes/mock_data.php';

// Check if user is logged in
$isLoggedIn = isset($_SESSION['user_id']);
$user = null;

if ($isLoggedIn) {
    $user = [
        'id' => $_SESSION['user_id'],
        'name' => $_SESSION['user_name'] ?? 'User',
        'email' => $_SESSION['user_email'] ?? ''
    ];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $isLoggedIn ? 'Dashboard - ANMS' : 'Animal Nutrition Management System - Professional Pet Care'; ?></title>
    <meta name="description" content="Professional pet nutrition management system. Track your pet's health, plan meals, and monitor nutrition with our comprehensive platform.">
    <?php if ($isLoggedIn): ?>
        <!-- Dashboard CSS - Only load when logged in -->
        <link rel="stylesheet" href="assets/css/app.css">
        <link rel="stylesheet" href="assets/css/nutrition-calculator.css">
        <link rel="stylesheet" href="assets/css/meal-planner.css">
    <?php else: ?>
        <!-- Landing Page CSS - Only load when NOT logged in -->
        <link rel="stylesheet" href="assets/css/design-tokens.css">
        <link rel="stylesheet" href="assets/css/design-system.css">
        <link rel="stylesheet" href="assets/css/modern-landing.css">
    <?php endif; ?>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <?php if ($isLoggedIn): ?>
        <!-- Professional Dashboard -->
        <div class="dashboard-container">
            <?php include 'dashboard.php'; ?>
        </div>
    <?php else: ?>
        <!-- Professional Landing Page -->
        <div class="landing-container">
            <?php include 'landing.php'; ?>
        </div>
    <?php endif; ?>

    <!-- Modals -->
    <div id="modal-overlay" class="modal-overlay">
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()">
                <i class="fas fa-times"></i>
            </button>
            <div id="modal-body"></div>
        </div>
    </div>

    <?php if ($isLoggedIn): ?>
        <!-- Dashboard JavaScript - Only load when logged in -->
        <script src="assets/js/app.js"></script>
        <script src="assets/js/components/nutrition-calculator.js"></script>
        <script src="assets/js/components/meal-planner.js"></script>
    <?php else: ?>
        <!-- Landing Page JavaScript - Minimal scripts when NOT logged in -->
        <script>
            // Simple modal functions for landing page
            function showLoginModal() {
                // Redirect to login page or show simple login form
                window.location.href = 'login.html';
            }
            
            function showRegisterModal() {
                // Redirect to register page or show simple register form
                window.location.href = 'register.html';
            }
        </script>
    <?php endif; ?>
</body>
</html>