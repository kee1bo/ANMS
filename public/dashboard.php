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
            <div
                class="user-profile"
                data-user-name="<?php echo htmlspecialchars($user['name']); ?>"
                data-user-email="<?php echo htmlspecialchars($user['email']); ?>"
                data-user-avatar="<?php echo htmlspecialchars($_SESSION['user_avatar'] ?? ''); ?>">
                <div class="user-avatar">
                    <?php if (!empty($_SESSION['user_avatar'])): ?>
                        <img src="<?php echo htmlspecialchars($_SESSION['user_avatar']); ?>" alt="<?php echo htmlspecialchars($user['name']); ?>">
                    <?php else: ?>
                        <span class="user-avatar--letter"><?php echo strtoupper(substr($user['name'] ?? 'U', 0, 1)); ?></span>
                    <?php endif; ?>
                </div>
                <div class="user-info">
                    <div class="user-name"><?php echo htmlspecialchars($user['name']); ?></div>
                    <div class="user-email"><?php echo htmlspecialchars($user['email']); ?></div>
                </div>
                <button class="user-menu-btn" onclick="toggleUserMenu()" aria-label="Open account menu">
                    <i class="fas fa-chevron-up"></i>
                </button>
            </div>
            <div class="user-menu" id="user-menu">
                <a href="#" class="user-menu-item" onclick="switchToTab('settings')">
                    <i class="fas fa-sliders-h"></i> Settings
                </a>
                <a href="logout.php" class="user-menu-item">
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
                                <div class="quick-actions" style="grid-template-columns: repeat(2, 1fr);">
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
                            <select id="nutrition-pet-select" class="form-select" style="min-width: 220px">
                                <option value="" disabled selected>Select Pet...</option>
                            </select>
                            <button class="btn btn-primary" onclick="openNutritionCalculator()">
                                <i class="fas fa-calculator"></i>
                                Calculate Nutrition
                            </button>
                            <button class="btn btn-outline" onclick="openMealPlanner()">
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
                <div class="nutrition-header" style="margin-bottom:16px">
                    <h3>Health Records</h3>
                    <div class="nutrition-actions">
                        <select id="health-pet-select" class="form-select" style="min-width: 220px">
                            <option value="" disabled selected>Select Pet...</option>
                        </select>
                        <button class="btn btn-outline" onclick="switchTab('pets')"><i class="fas fa-plus"></i> Add Pet</button>
                    </div>
                </div>
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
                    <div class="np-panel">
                        <div class="np-toolbar">
                            <div class="np-title"><i class="fas fa-sliders-h"></i> Settings</div>
                            <div style="display:flex; gap:8px;">
                                <button class="btn btn-outline" onclick="applyThemeToggle()"><i class="fas fa-moon"></i> Toggle Theme</button>
                                <button class="btn btn-primary" id="settings-save" disabled>Save changes</button>
                                <button class="btn btn-outline" id="settings-reset">Reset</button>
                            </div>
                        </div>

                        <div class="settings-layout">
                            <!-- Left rail: User card + Section nav -->
                            <aside class="settings-left">
                                <div class="user-card">
                                    <div class="user-card__avatar">
                                        <?php if (!empty($_SESSION['user_avatar'])): ?>
                                            <img src="<?php echo htmlspecialchars($_SESSION['user_avatar']); ?>" alt="<?php echo htmlspecialchars($user['name']); ?>">
                                        <?php else: ?>
                                            <span class="initials"><?php echo strtoupper(substr($user['name'] ?? 'U', 0, 1)); ?></span>
                                        <?php endif; ?>
                                    </div>
                                    <div class="user-card__info">
                                        <div class="user-card__name"><?php echo htmlspecialchars($user['name']); ?></div>
                                        <div class="user-card__email"><?php echo htmlspecialchars($user['email']); ?></div>
                                    </div>
                                    <div class="user-card__actions">
                                        <button class="btn btn-primary" onclick="document.getElementById('section-profile').scrollIntoView({behavior:'smooth'})">Edit profile</button>
                                        <button class="btn btn-outline" onclick="document.getElementById('section-security').scrollIntoView({behavior:'smooth'})">Change password</button>
                                        <a class="btn btn-outline" href="logout.php">Sign out</a>
                                    </div>
                                </div>

                                <nav class="section-nav">
                                    <a href="#section-profile" class="active">Profile & Account</a>
                                    <a href="#section-preferences">Preferences</a>
                                    <a href="#section-privacy">Privacy & Security</a>
                                </nav>
                            </aside>

                            <!-- Right content: Sections -->
                            <section class="settings-right">
                                <!-- Profile & Account -->
                                <div id="section-profile" class="settings-section">
                                    <div class="section-header">
                                        <h3>Profile & Account</h3>
                                        <p>Manage your personal information and account security.</p>
                                    </div>
                                    <div class="form-grid">
                                        <div class="form-group">
                                            <label class="form-label">Full name</label>
                                            <input type="text" class="form-input" value="<?php echo htmlspecialchars($user['name']); ?>">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Email</label>
                                            <input type="email" class="form-input" value="<?php echo htmlspecialchars($user['email']); ?>" readonly>
                                        </div>
                                    </div>
                                    <div id="section-security" class="section-sub">
                                        <h4>Security</h4>
                                        <div class="section-actions">
                                            <button class="btn btn-outline">Change password</button>
                                            <button class="btn btn-outline">Manage sessions</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Preferences -->
                                <div id="section-preferences" class="settings-section">
                                    <div class="section-header">
                                        <h3>Preferences</h3>
                                        <p>Theme, density and notifications.</p>
                                    </div>
                                    <div class="section-block">
                                        <h4>Appearance</h4>
                                        <div class="form-grid">
                                            <div class="form-group">
                                                <label class="form-label">Theme</label>
                                                <div class="radio-group">
                                                    <label class="radio-option"><input type="radio" name="theme" onclick="setTheme('system')"><span class="radio-custom"></span> System</label>
                                                    <label class="radio-option"><input type="radio" name="theme" onclick="setTheme('light')"><span class="radio-custom"></span> Light</label>
                                                    <label class="radio-option"><input type="radio" name="theme" onclick="setTheme('dark')"><span class="radio-custom"></span> Dark</label>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="form-label">Density</label>
                                                <div class="radio-group">
                                                    <label class="radio-option"><input type="radio" name="density" checked><span class="radio-custom"></span> Comfortable</label>
                                                    <label class="radio-option"><input type="radio" name="density"><span class="radio-custom"></span> Compact</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="section-block">
                                        <h4>Notifications</h4>
                                        <div class="form-group">
                                            <label class="form-label">Email notifications</label>
                                            <label style="display:flex; align-items:center; gap:8px;"><input type="checkbox" id="notif-email" checked> <span>Meal reminders and health checkups</span></label>
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Product updates</label>
                                            <label style="display:flex; align-items:center; gap:8px;"><input type="checkbox" id="notif-updates"> <span>New features and tips</span></label>
                                        </div>
                                    </div>
                                </div>

                                <!-- Privacy & Security -->
                                <div id="section-privacy" class="settings-section">
                                    <div class="section-header">
                                        <h3>Privacy & Security</h3>
                                        <p>Control data usage and account privacy.</p>
                                    </div>
                                    <div class="form-group">
                                        <label style="display:flex; align-items:center; gap:8px;">
                                            <input type="checkbox" id="privacy-anon" checked>
                                            <span>Share anonymous usage data</span>
                                        </label>
                                        <p class="field-help">Aggregated analytics only. No personal or pet health data.</p>
                                    </div>
                                    <div class="section-actions">
                                        <button class="btn btn-outline">Download my data</button>
                                    </div>
                                    <div class="danger-zone">
                                        <div class="danger-title"><i class="fas fa-exclamation-triangle"></i> Danger zone</div>
                                        <p>Delete your account and all associated data.</p>
                                        <button class="btn btn-outline" style="border-color:#ef4444; color:#ef4444;">Delete account</button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    </main>
</div>