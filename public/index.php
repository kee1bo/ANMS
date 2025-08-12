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
        <link rel="stylesheet" href="assets/css/style.css">
        <link rel="stylesheet" href="assets/css/dashboard.css">
        <link rel="stylesheet" href="assets/css/app.css">
        <link rel="stylesheet" href="assets/css/professional-modal.css">
        <link rel="stylesheet" href="assets/css/nutrition-calculator.css">
        <link rel="stylesheet" href="assets/css/meal-planner.css">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
            /* Ensure modal is properly hidden by default */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: none !important;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            
            .modal-overlay.show {
                display: flex !important;
            }
            
            .modal-content {
                background: white;
                border-radius: 12px;
                padding: 20px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            }
            
            .modal-close {
                position: absolute;
                top: 10px;
                right: 15px;
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #666;
                padding: 5px;
            }
            
            .modal-close:hover {
                color: #333;
            }
        </style>
    <?php else: ?>
        <!-- Landing Page CSS - Only load when NOT logged in -->
        <link rel="stylesheet" href="assets/css/style.css">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
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
    <div id="modal-overlay" class="modal-overlay" style="display: none;">
        <div class="modal-content" style="max-width: unset; width: auto;">
            <button class="modal-close" onclick="closeModal()">
                <i class="fas fa-times"></i>
            </button>
            <div id="modal-body"></div>
        </div>
    </div>

    <?php if ($isLoggedIn): ?>
        <!-- Dashboard JavaScript - Only load when logged in -->
        <script src="assets/js/app.js"></script>
        <script src="assets/js/components/pet-dashboard.js"></script>
        <script src="assets/js/components/nutrition-calculator.js"></script>
        <script src="assets/js/components/meal-planner.js"></script>
        <script>
            // Modal functions - Override app.js modal functions
            function closeModal() {
                const modal = document.getElementById('modal-overlay');
                modal.style.display = 'none';
                modal.classList.remove('show');
            }
            
            function showModal(content) {
                document.getElementById('modal-body').innerHTML = content;
                const modal = document.getElementById('modal-overlay');
                modal.style.display = 'flex';
                modal.classList.add('show');
            }
            
            // Ensure modal is hidden on page load
            document.addEventListener('DOMContentLoaded', function() {
                closeModal();
            });
            
            // Close modal when clicking outside
            document.getElementById('modal-overlay').addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal();
                }
            });
            
            // Override the app.js modal methods to prevent automatic showing
            window.addEventListener('load', function() {
                if (window.app && window.app.closeModal) {
                    window.app.closeModal();
                }
            });
        </script>
    <?php else: ?>
        <!-- Landing Page JavaScript - Minimal scripts when NOT logged in -->
        <script>
            // Smooth scrolling for navigation links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                });
            });
        </script>

    <?php endif; ?>
</body>
</html>