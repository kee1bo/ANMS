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
            
            <div class="nav-section">
                <div class="nav-section-title">Tools</div>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="#" class="nav-link" data-tab="reports">
                            <i class="fas fa-chart-bar"></i>
                            <span>Reports</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" data-tab="settings">
                            <i class="fas fa-cog"></i>
                            <span>Settings</span>
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
                <button class="user-menu-btn" onclick="toggleUserMenu()">
                    <i class="fas fa-chevron-up"></i>
                </button>
            </div>
            <div class="user-menu" id="user-menu">
                <a href="#" class="user-menu-item" onclick="showUserProfile()">
                    <i class="fas fa-user"></i> Profile
                </a>
                <a href="#" class="user-menu-item" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a>
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
                            <div class="stat-change positive">
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
                            <div class="stat-change neutral">
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
                            <div class="stat-change positive">
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
                            <div class="stat-change neutral">
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
                                <div class="activity-item">
                                    <div class="activity-icon">
                                        <i class="fas fa-utensils"></i>
                                    </div>
                                    <div class="activity-content">
                                        <div class="activity-text">Fed Buddy breakfast</div>
                                        <div class="activity-time">2 hours ago</div>
                                    </div>
                                </div>
                                <div class="activity-item">
                                    <div class="activity-icon">
                                        <i class="fas fa-weight"></i>
                                    </div>
                                    <div class="activity-content">
                                        <div class="activity-text">Recorded Whiskers weight</div>
                                        <div class="activity-time">1 day ago</div>
                                    </div>
                                </div>
                                <div class="activity-item">
                                    <div class="activity-icon">
                                        <i class="fas fa-plus"></i>
                                    </div>
                                    <div class="activity-content">
                                        <div class="activity-text">Added new pet profile</div>
                                        <div class="activity-time">3 days ago</div>
                                    </div>
                                </div>
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
                                <button class="quick-action-btn" onclick="generateReport()">
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
                    <div class="pets-view-toggle">
                        <button class="view-toggle-btn active" data-view="grid">
                            <i class="fas fa-th"></i>
                        </button>
                        <button class="view-toggle-btn" data-view="list">
                            <i class="fas fa-list"></i>
                        </button>
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
                            <button class="btn btn-outline" onclick="window.mealPlanner?.createMealPlan(1)">
                                <i class="fas fa-calendar-alt"></i>
                                Meal Planner
                            </button>
                        </div>
                    </div>
                    <div id="nutrition-plans">
                        <div class="empty-state">
                            <i class="fas fa-utensils"></i>
                            <h3>Nutrition & Meal Planning Tools</h3>
                            <p>Calculate precise nutrition requirements and create weekly meal plans for your pets</p>
                            <div class="feature-cards">
                                <div class="feature-card">
                                    <i class="fas fa-calculator"></i>
                                    <h4>Nutrition Calculator</h4>
                                    <p>Calculate daily calories and macronutrients based on veterinary guidelines</p>
                                </div>
                                <div class="feature-card">
                                    <i class="fas fa-calendar-alt"></i>
                                    <h4>Meal Planner</h4>
                                    <p>Create weekly meal plans with drag-and-drop food scheduling</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Health Tab -->
            <div id="health-tab" class="tab-content">
                <div id="health-content" class="health-content">
                    <!-- Health tracking content will be loaded here by JavaScript -->
                    <div class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading health tracking...</p>
                    </div>
                </div>
            </div>
            
            <!-- Reports Tab -->
            <div id="reports-tab" class="tab-content">
                <div class="reports-content">
                    <h3>Health & Nutrition Reports</h3>
                    <div class="empty-state">
                        <i class="fas fa-chart-bar"></i>
                        <h3>Reports coming soon</h3>
                        <p>Detailed analytics and insights about your pet's health</p>
                    </div>
                </div>
            </div>
            
            <!-- Settings Tab -->
            <div id="settings-tab" class="tab-content">
                <div class="settings-content">
                    <h3>Account Settings</h3>
                    <div class="empty-state">
                        <i class="fas fa-cog"></i>
                        <h3>Settings coming soon</h3>
                        <p>Manage your account preferences and notifications</p>
                    </div>
                </div>
            </div>
            
        </div>
    </main>
</div>