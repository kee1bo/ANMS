<?php
session_start();

// Simple mock user for testing
if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = 1;
    $_SESSION['user_name'] = 'Test User';
    $_SESSION['user_email'] = 'test@example.com';
}

$user = [
    'id' => $_SESSION['user_id'],
    'name' => $_SESSION['user_name'],
    'email' => $_SESSION['user_email']
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Dashboard - ANMS</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/app.css">
    <link rel="stylesheet" href="assets/css/dashboard.css">
    <link rel="stylesheet" href="assets/css/professional-modal.css">
    <link rel="stylesheet" href="assets/css/nutrition-calculator.css">
    <link rel="stylesheet" href="assets/css/meal-planner.css">
</head>
<body>
    <div class="dashboard-container">
        <!-- Professional Dashboard Layout -->
        <div class="dashboard-layout">
            <!-- Sidebar Navigation -->
            <aside class="dashboard-sidebar">
                <div class="sidebar-header">
                    <div class="brand">
                        <div class="brand-icon">
                            <i class="fas fa-paw"></i>
                        </div>
                        <div class="brand-info">
                            <span class="brand-name">ANMS</span>
                            <span class="brand-subtitle">Pet Nutrition</span>
                        </div>
                    </div>
                </div>
                
                <nav class="sidebar-nav">
                    <div class="nav-section">
                        <div class="nav-section-title">Main</div>
                        <ul class="nav-list">
                            <li class="nav-item">
                                <a href="#" class="nav-link active" data-tab="dashboard">
                                    <i class="fas fa-home"></i>
                                    <span>Dashboard</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" class="nav-link" data-tab="pets">
                                    <i class="fas fa-paw"></i>
                                    <span>My Pets</span>
                                    <span class="nav-badge" id="pets-count">0</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" class="nav-link" data-tab="nutrition">
                                    <i class="fas fa-utensils"></i>
                                    <span>Nutrition Plans</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" class="nav-link" data-tab="health">
                                    <i class="fas fa-heart"></i>
                                    <span>Health Records</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </nav>
                
                <div class="sidebar-footer">
                    <div class="user-profile">
                        <div class="user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="user-info">
                            <div class="user-name"><?php echo htmlspecialchars($user['name']); ?></div>
                            <div class="user-email"><?php echo htmlspecialchars($user['email']); ?></div>
                        </div>
                    </div>
                </div>
            </aside>
            
            <!-- Main Content Area -->
            <main class="dashboard-main">
                <!-- Top Header -->
                <header class="dashboard-header">
                    <div class="header-left">
                        <h1 class="page-title" id="page-title">Dashboard</h1>
                        <p class="page-subtitle" id="page-subtitle">Welcome back! Here's what's happening with your pets.</p>
                    </div>
                    <div class="header-right">
                        <button class="btn btn-primary" onclick="showAddPet()">
                            <i class="fas fa-plus"></i>
                            Add Pet
                        </button>
                    </div>
                </header>
                
                <!-- Dashboard Content -->
                <div class="dashboard-content">
                    
                    <!-- Dashboard Tab -->
                    <div id="dashboard-tab" class="tab-content active">
                        <!-- Stats Cards -->
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-paw"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-value" id="total-pets">0</div>
                                    <div class="stat-label">Total Pets</div>
                                    <div class="stat-change positive" id="pets-change">
                                        <i class="fas fa-arrow-up"></i> +2 this month
                                    </div>
                                </div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-utensils"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-value" id="meals-today">0</div>
                                    <div class="stat-label">Meals Today</div>
                                    <div class="stat-change neutral" id="meals-change">
                                        <i class="fas fa-clock"></i> 2 upcoming
                                    </div>
                                </div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-heart"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-value" id="health-score">95%</div>
                                    <div class="stat-label">Health Score</div>
                                    <div class="stat-change positive" id="health-change">
                                        <i class="fas fa-arrow-up"></i> +3% this week
                                    </div>
                                </div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-calendar"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-value" id="next-checkup">12</div>
                                    <div class="stat-label">Days to Checkup</div>
                                    <div class="stat-change neutral" id="checkup-change">
                                        <i class="fas fa-calendar"></i> Schedule now
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Main Dashboard Grid -->
                        <div class="dashboard-grid">
                            <!-- Recent Activity -->
                            <div class="dashboard-card">
                                <div class="card-header">
                                    <h3 class="card-title">Recent Activity</h3>
                                    <button class="btn btn-ghost btn-sm">View All</button>
                                </div>
                                <div class="card-content">
                                    <div id="recent-activity" class="activity-list">
                                        <!-- Activity will be loaded here -->
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Quick Actions -->
                            <div class="dashboard-card">
                                <div class="card-header">
                                    <h3 class="card-title">Quick Actions</h3>
                                </div>
                                <div class="card-content">
                                    <div class="quick-actions">
                                        <button class="quick-action-btn" onclick="showAddPet()">
                                            <i class="fas fa-plus"></i>
                                            <span>Add New Pet</span>
                                        </button>
                                        <button class="quick-action-btn" onclick="switchTab('nutrition')">
                                            <i class="fas fa-utensils"></i>
                                            <span>Plan Meal</span>
                                        </button>
                                        <button class="quick-action-btn" onclick="switchTab('health')">
                                            <i class="fas fa-heart"></i>
                                            <span>Log Health</span>
                                        </button>
                                        <button class="quick-action-btn" onclick="alert('Reports coming soon!')">
                                            <i class="fas fa-chart-bar"></i>
                                            <span>View Reports</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Pets Tab -->
                    <div id="pets-tab" class="tab-content">
                        <div class="pets-header">
                            <div class="pets-filters">
                                <button class="filter-btn active" data-filter="all">All Pets</button>
                                <button class="filter-btn" data-filter="dogs">Dogs</button>
                                <button class="filter-btn" data-filter="cats">Cats</button>
                                <button class="filter-btn" data-filter="other">Other</button>
                            </div>
                        </div>
                        <div id="pets-container" class="pets-grid">
                            <!-- Pets will be loaded here -->
                        </div>
                    </div>
                    
                    <!-- Nutrition Tab -->
                    <div id="nutrition-tab" class="tab-content">
                        <div class="nutrition-content">
                            <div class="nutrition-header">
                                <h3>Nutrition & Meal Planning</h3>
                                <div class="nutrition-actions">
                                    <button class="btn btn-primary" onclick="window.nutritionCalculator?.loadNutritionInterface()">
                                        <i class="fas fa-calculator"></i>
                                        Calculate Nutrition
                                    </button>
                                    <button class="btn btn-outline" onclick="window.mealPlanner?.createMealPlan()">
                                        <i class="fas fa-calendar-alt"></i>
                                        Meal Planner
                                    </button>
                                </div>
                            </div>
                            <div id="nutrition-plans">
                                <!-- Nutrition content will be loaded here -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Health Tab -->
                    <div id="health-tab" class="tab-content">
                        <div id="health-content" class="health-content">
                            <!-- Health tracking content will be loaded here -->
                        </div>
                    </div>
                    
                </div>
            </main>
        </div>
    </div>

    <!-- Modal -->
    <div id="modal-overlay" class="modal-overlay" style="display: none;">
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()">
                <i class="fas fa-times"></i>
            </button>
            <div id="modal-body"></div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="assets/js/components/nutrition-calculator.js"></script>
    <script src="assets/js/components/meal-planner.js"></script>
    <script src="assets/js/app.js"></script>
    
    <script>
        // Simple working functions
        function showAddPet() {
            if (window.app) {
                window.app.showAddPet();
            }
        }

        function switchTab(tabName) {
            if (window.app) {
                window.app.switchTab(tabName);
            }
        }

        function closeModal() {
            if (window.app) {
                window.app.closeModal();
            }
        }
    </script>
</body>
</html>"