// UI Manager for rendering components and managing UI state
class UIManager extends EventEmitter {
    constructor() {
        super();
        this.activeModal = null;
        this.notifications = [];
    }

    // Loading state management
    showLoadingState(show = true) {
        let loader = document.getElementById('global-loader');
        
        if (show && !loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'loading-overlay';
            loader.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Loading...</p>
                </div>
            `;
            document.body.appendChild(loader);
        } else if (!show && loader) {
            loader.remove();
        }
    }

    // Notification system
    showNotification(message, type = 'info', duration = 5000) {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        };

        this.notifications.push(notification);
        this.renderNotification(notification);

        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, duration);
        }

        return notification.id;
    }

    showSuccess(message, duration = 5000) {
        return this.showNotification(message, 'success', duration);
    }

    showError(message, duration = 8000) {
        return this.showNotification(message, 'error', duration);
    }

    showWarning(message, duration = 6000) {
        return this.showNotification(message, 'warning', duration);
    }

    renderNotification(notification) {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        const notificationEl = document.createElement('div');
        notificationEl.className = `notification notification--${notification.type}`;
        notificationEl.dataset.id = notification.id;
        notificationEl.innerHTML = `
            <div class="notification__content">
                <span class="notification__message">${notification.message}</span>
                <button class="notification__close" data-action="close-notification" data-id="${notification.id}">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `;

        container.appendChild(notificationEl);

        // Animate in
        setTimeout(() => {
            notificationEl.classList.add('notification--show');
        }, 10);
    }

    removeNotification(id) {
        const notificationEl = document.querySelector(`[data-id="${id}"]`);
        if (notificationEl) {
            notificationEl.classList.remove('notification--show');
            setTimeout(() => {
                notificationEl.remove();
            }, 300);
        }

        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    // Modal system using new Modal component
    createModal(title, content, size = 'medium') {
        this.closeModal(); // Close any existing modal

        this.activeModal = new Modal({
            title,
            content,
            size,
            focus: true,
            onHide: () => {
                this.activeModal = null;
            }
        });

        this.activeModal.show();
        return this.activeModal.element;
    }

    closeModal() {
        if (this.activeModal) {
            this.activeModal.hide();
        }
    }

    // Page rendering methods
    renderLandingPage() {
        return `
            <div class="landing-page">
                <header class="landing-header">
                    <div class="container">
                        <div class="landing-header__content">
                            <h1 class="landing-header__title">Animal Nutrition Management System</h1>
                            <p class="landing-header__subtitle">
                                Professional nutrition planning and health tracking for your beloved pets
                            </p>
                            <div class="landing-header__actions">
                                <button class="btn btn--primary btn--large" data-action="login">
                                    Sign In
                                </button>
                                <button class="btn btn--secondary btn--large" data-action="register">
                                    Get Started
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <main class="landing-main">
                    <section class="features">
                        <div class="container">
                            <h2 class="section-title">Why Choose ANMS?</h2>
                            <div class="features-grid">
                                <div class="feature-card">
                                    <div class="feature-card__icon">🐕</div>
                                    <h3 class="feature-card__title">Pet Profile Management</h3>
                                    <p class="feature-card__description">
                                        Create detailed profiles for each pet with health history and characteristics
                                    </p>
                                </div>
                                <div class="feature-card">
                                    <div class="feature-card__icon">🥗</div>
                                    <h3 class="feature-card__title">Scientific Nutrition Plans</h3>
                                    <p class="feature-card__description">
                                        Get personalized nutrition recommendations based on veterinary science
                                    </p>
                                </div>
                                <div class="feature-card">
                                    <div class="feature-card__icon">📊</div>
                                    <h3 class="feature-card__title">Health Tracking</h3>
                                    <p class="feature-card__description">
                                        Monitor weight, activity, and health metrics with detailed analytics
                                    </p>
                                </div>
                                <div class="feature-card">
                                    <div class="feature-card__icon">👨‍⚕️</div>
                                    <h3 class="feature-card__title">Professional Integration</h3>
                                    <p class="feature-card__description">
                                        Share data with veterinarians for comprehensive care coordination
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        `;
    }

    renderDashboard(pets = [], user = null) {
        const userName = user ? user.first_name : 'User';
        const greeting = this.getTimeBasedGreeting();
        
        return `
            <div class="dashboard">
                <header class="dashboard-header">
                    <div class="container">
                        <div class="dashboard-header__content">
                            <div class="dashboard-header__welcome">
                                <h1 class="dashboard-header__title">${greeting}, ${userName}!</h1>
                                <p class="dashboard-header__subtitle">Manage your pets' nutrition and health</p>
                            </div>
                            <div class="dashboard-header__actions">
                                <button class="btn btn--primary" data-action="add-pet">
                                    <span class="btn__icon">+</span>
                                    Add Pet
                                </button>
                                <div class="dropdown">
                                    <button class="btn btn--secondary dropdown__trigger" data-action="toggle-user-menu">
                                        ${userName}
                                        <span class="dropdown__arrow">▼</span>
                                    </button>
                                    <div class="dropdown__menu">
                                        <a href="#" class="dropdown__item" data-action="view-profile">Profile</a>
                                        <a href="#" class="dropdown__item" data-action="settings">Settings</a>
                                        <div class="dropdown__divider"></div>
                                        <a href="#" class="dropdown__item" data-action="logout">Logout</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main class="dashboard-main">
                    <div class="container">
                        ${this.renderDashboardStats(pets)}
                        ${pets.length === 0 ? this.renderEmptyState() : this.renderDashboardContent(pets)}
                    </div>
                </main>
            </div>
        `;
    }

    getTimeBasedGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    }

    renderDashboardStats(pets) {
        const totalPets = pets.length;
        const healthyPets = pets.filter(pet => !pet.health_conditions || pet.health_conditions.length === 0).length;
        const petsWithPlans = pets.filter(pet => pet.has_nutrition_plan).length;
        const recentActivity = this.getRecentActivityCount(pets);

        return `
            <div class="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-card__icon">🐾</div>
                    <div class="stat-card__content">
                        <div class="stat-card__number">${totalPets}</div>
                        <div class="stat-card__label">Total Pets</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__icon">💚</div>
                    <div class="stat-card__content">
                        <div class="stat-card__number">${healthyPets}</div>
                        <div class="stat-card__label">Healthy Pets</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__icon">🥗</div>
                    <div class="stat-card__content">
                        <div class="stat-card__number">${petsWithPlans}</div>
                        <div class="stat-card__label">Nutrition Plans</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__icon">📈</div>
                    <div class="stat-card__content">
                        <div class="stat-card__number">${recentActivity}</div>
                        <div class="stat-card__label">Recent Updates</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderDashboardContent(pets) {
        return `
            <div class="dashboard-content">
                <div class="dashboard-grid">
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2 class="section-title">Your Pets</h2>
                            <button class="btn btn--small btn--secondary" data-action="view-all-pets">
                                View All
                            </button>
                        </div>
                        ${this.renderPetGrid(pets.slice(0, 6))}
                        ${pets.length > 6 ? `
                            <div class="section-footer">
                                <button class="btn btn--secondary btn--full" data-action="view-all-pets">
                                    View All ${pets.length} Pets
                                </button>
                            </div>
                        ` : ''}
                    </div>

                    <div class="dashboard-sidebar">
                        ${this.renderQuickActions()}
                        ${this.renderRecentActivity(pets)}
                        ${this.renderHealthAlerts(pets)}
                    </div>
                </div>
            </div>
        `;
    }

    renderQuickActions() {
        return `
            <div class="dashboard-widget">
                <h3 class="widget-title">Quick Actions</h3>
                <div class="quick-actions">
                    <button class="quick-action" data-action="add-pet">
                        <div class="quick-action__icon">🐕</div>
                        <div class="quick-action__label">Add Pet</div>
                    </button>
                    <button class="quick-action" data-action="log-weight">
                        <div class="quick-action__icon">⚖️</div>
                        <div class="quick-action__label">Log Weight</div>
                    </button>
                    <button class="quick-action" data-action="schedule-feeding">
                        <div class="quick-action__icon">🍽️</div>
                        <div class="quick-action__label">Schedule Feeding</div>
                    </button>
                    <button class="quick-action" data-action="health-checkup">
                        <div class="quick-action__icon">🏥</div>
                        <div class="quick-action__label">Health Checkup</div>
                    </button>
                </div>
            </div>
        `;
    }

    renderRecentActivity(pets) {
        const activities = this.generateRecentActivities(pets);
        
        return `
            <div class="dashboard-widget">
                <h3 class="widget-title">Recent Activity</h3>
                <div class="activity-timeline">
                    ${activities.length > 0 ? activities.map(activity => `
                        <div class="activity-item">
                            <div class="activity-item__icon">${activity.icon}</div>
                            <div class="activity-item__content">
                                <div class="activity-item__text">${activity.text}</div>
                                <div class="activity-item__time">${activity.time}</div>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="activity-empty">
                            <p>No recent activity</p>
                            <button class="btn btn--small btn--primary" data-action="add-pet">
                                Get started by adding a pet
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    renderHealthAlerts(pets) {
        const alerts = this.generateHealthAlerts(pets);
        
        if (alerts.length === 0) return '';

        return `
            <div class="dashboard-widget">
                <h3 class="widget-title">Health Alerts</h3>
                <div class="health-alerts">
                    ${alerts.map(alert => `
                        <div class="health-alert health-alert--${alert.type}">
                            <div class="health-alert__icon">${alert.icon}</div>
                            <div class="health-alert__content">
                                <div class="health-alert__title">${alert.title}</div>
                                <div class="health-alert__message">${alert.message}</div>
                                ${alert.action ? `
                                    <button class="btn btn--small btn--primary" data-action="${alert.action.action}" data-pet-id="${alert.petId}">
                                        ${alert.action.label}
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getRecentActivityCount(pets) {
        // This would normally come from the backend
        return Math.floor(Math.random() * 10) + 1;
    }

    generateRecentActivities(pets) {
        // This would normally come from the backend
        const activities = [];
        
        pets.slice(0, 3).forEach(pet => {
            activities.push({
                icon: '📊',
                text: `Updated ${pet.name}'s weight`,
                time: '2 hours ago'
            });
        });

        return activities;
    }

    generateHealthAlerts(pets) {
        const alerts = [];
        
        pets.forEach(pet => {
            // Check for overdue weight updates
            if (!pet.last_weight_update || this.daysSince(pet.last_weight_update) > 30) {
                alerts.push({
                    type: 'warning',
                    icon: '⚠️',
                    title: `${pet.name} - Weight Update Needed`,
                    message: 'No weight recorded in the last 30 days',
                    petId: pet.id,
                    action: {
                        action: 'log-weight',
                        label: 'Log Weight'
                    }
                });
            }

            // Check for missing nutrition plan
            if (!pet.has_nutrition_plan) {
                alerts.push({
                    type: 'info',
                    icon: 'ℹ️',
                    title: `${pet.name} - Nutrition Plan`,
                    message: 'Create a personalized nutrition plan',
                    petId: pet.id,
                    action: {
                        action: 'generate-nutrition-plan',
                        label: 'Create Plan'
                    }
                });
            }
        });

        return alerts.slice(0, 3); // Limit to 3 alerts
    }

    daysSince(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state__icon">🐾</div>
                <h2 class="empty-state__title">No pets yet</h2>
                <p class="empty-state__description">
                    Add your first pet to start creating personalized nutrition plans and tracking their health.
                </p>
                <button class="btn btn--primary btn--large" data-action="add-pet">
                    Add Your First Pet
                </button>
            </div>
        `;
    }

    renderPetGrid(pets) {
        const petCards = pets.map(pet => this.renderPetCard(pet)).join('');
        
        return `
            <div class="pets-section">
                <h2 class="section-title">Your Pets</h2>
                <div class="pets-grid">
                    ${petCards}
                </div>
            </div>
        `;
    }

    renderPetCard(pet) {
        const age = this.calculateAge(pet.date_of_birth);
        const ageText = age ? `${age} years old` : 'Age unknown';
        
        return `
            <div class="pet-card" data-pet-id="${pet.id}">
                <div class="pet-card__image">
                    ${pet.photo_url ? 
                        `<img src="${pet.photo_url}" alt="${pet.name}" class="pet-card__photo">` :
                        `<div class="pet-card__placeholder">${pet.name.charAt(0)}</div>`
                    }
                </div>
                <div class="pet-card__content">
                    <h3 class="pet-card__name">${pet.name}</h3>
                    <p class="pet-card__details">
                        ${pet.species} • ${ageText}
                        ${pet.current_weight ? ` • ${pet.current_weight}kg` : ''}
                    </p>
                    <div class="pet-card__actions">
                        <button class="btn btn--small btn--primary" data-action="view-pet" data-pet-id="${pet.id}">
                            View Details
                        </button>
                        <button class="btn btn--small btn--secondary" data-action="generate-nutrition-plan" data-pet-id="${pet.id}">
                            Nutrition Plan
                        </button>
                        <button class="btn btn--small btn--accent" data-action="health-dashboard" data-pet-id="${pet.id}">
                            🏥 Health
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Form rendering methods
    renderLoginForm() {
        return `
            <form class="form" data-action="login">
                <div class="form-group">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" id="email" name="email" class="form-input" required>
                </div>
                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" name="password" class="form-input" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn--primary btn--full">Sign In</button>
                </div>
                <div class="form-footer">
                    <p>Don't have an account? <a href="#" data-action="show-register">Sign up</a></p>
                </div>
            </form>
        `;
    }

    renderRegisterForm() {
        return `
            <form class="form" data-action="register">
                <div class="form-row">
                    <div class="form-group">
                        <label for="first_name" class="form-label">First Name</label>
                        <input type="text" id="first_name" name="first_name" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="last_name" class="form-label">Last Name</label>
                        <input type="text" id="last_name" name="last_name" class="form-input" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" id="email" name="email" class="form-input" required>
                </div>
                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" name="password" class="form-input" required>
                </div>
                <div class="form-group">
                    <label for="password_confirmation" class="form-label">Confirm Password</label>
                    <input type="password" id="password_confirmation" name="password_confirmation" class="form-input" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn--primary btn--full">Create Account</button>
                </div>
                <div class="form-footer">
                    <p>Already have an account? <a href="#" data-action="show-login">Sign in</a></p>
                </div>
            </form>
        `;
    }

    renderAddPetForm() {
        return `
            <form class="form" data-action="add-pet">
                <div class="form-group">
                    <label for="name" class="form-label">Pet Name</label>
                    <input type="text" id="name" name="name" class="form-input" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="species" class="form-label">Species</label>
                        <select id="species" name="species" class="form-select" required>
                            <option value="">Select species</option>
                            <option value="dog">Dog</option>
                            <option value="cat">Cat</option>
                            <option value="rabbit">Rabbit</option>
                            <option value="bird">Bird</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="breed" class="form-label">Breed (Optional)</label>
                        <input type="text" id="breed" name="breed" class="form-input">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="date_of_birth" class="form-label">Date of Birth</label>
                        <input type="date" id="date_of_birth" name="date_of_birth" class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="gender" class="form-label">Gender</label>
                        <select id="gender" name="gender" class="form-select">
                            <option value="unknown">Unknown</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="current_weight" class="form-label">Current Weight (kg)</label>
                        <input type="number" id="current_weight" name="current_weight" class="form-input" step="0.1" min="0">
                    </div>
                    <div class="form-group">
                        <label for="activity_level" class="form-label">Activity Level</label>
                        <select id="activity_level" name="activity_level" class="form-select">
                            <option value="low">Low</option>
                            <option value="moderate" selected>Moderate</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" name="is_neutered" value="1" class="form-checkbox">
                        Spayed/Neutered
                    </label>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn--secondary" data-action="close-modal">Cancel</button>
                    <button type="submit" class="btn btn--primary">Add Pet</button>
                </div>
            </form>
        `;
    }

    renderPetDetails(pet) {
        const age = this.calculateAge(pet.date_of_birth);
        const ageText = age ? `${age} years old` : 'Age unknown';
        
        return `
            <div class="pet-details">
                <div class="pet-details__header">
                    <div class="pet-details__image">
                        ${pet.photo_url ? 
                            `<img src="${pet.photo_url}" alt="${pet.name}" class="pet-details__photo">` :
                            `<div class="pet-details__placeholder">${pet.name.charAt(0)}</div>`
                        }
                        <button class="btn btn--small btn--secondary pet-details__photo-btn" data-action="upload-photo" data-pet-id="${pet.id}">
                            ${pet.photo_url ? 'Change Photo' : 'Add Photo'}
                        </button>
                    </div>
                    <div class="pet-details__info">
                        <h3 class="pet-details__name">${pet.name}</h3>
                        <p class="pet-details__breed">${pet.breed || pet.species}</p>
                        <p class="pet-details__age">${ageText}</p>
                        ${pet.microchip_id ? `<p class="pet-details__microchip">Microchip: ${pet.microchip_id}</p>` : ''}
                    </div>
                </div>

                <div class="pet-details__tabs">
                    <button class="pet-tab pet-tab--active" data-tab="overview">Overview</button>
                    <button class="pet-tab" data-tab="health">Health</button>
                    <button class="pet-tab" data-tab="nutrition">Nutrition</button>
                </div>

                <div class="pet-details__content">
                    <div class="pet-tab-content pet-tab-content--active" data-tab-content="overview">
                        <div class="pet-details__stats">
                            <div class="pet-stat">
                                <span class="pet-stat__label">Species</span>
                                <span class="pet-stat__value">${pet.species}</span>
                            </div>
                            <div class="pet-stat">
                                <span class="pet-stat__label">Breed</span>
                                <span class="pet-stat__value">${pet.breed || 'Mixed/Unknown'}</span>
                            </div>
                            <div class="pet-stat">
                                <span class="pet-stat__label">Gender</span>
                                <span class="pet-stat__value">${pet.gender || 'Unknown'}</span>
                            </div>
                            <div class="pet-stat">
                                <span class="pet-stat__label">Current Weight</span>
                                <span class="pet-stat__value">${pet.current_weight ? pet.current_weight + 'kg' : 'Not recorded'}</span>
                            </div>
                            <div class="pet-stat">
                                <span class="pet-stat__label">Ideal Weight</span>
                                <span class="pet-stat__value">${pet.ideal_weight ? pet.ideal_weight + 'kg' : 'Not set'}</span>
                            </div>
                            <div class="pet-stat">
                                <span class="pet-stat__label">Activity Level</span>
                                <span class="pet-stat__value">${pet.activity_level || 'Moderate'}</span>
                            </div>
                            <div class="pet-stat">
                                <span class="pet-stat__label">Spayed/Neutered</span>
                                <span class="pet-stat__value">${pet.is_neutered ? 'Yes' : 'No'}</span>
                            </div>
                            <div class="pet-stat">
                                <span class="pet-stat__label">Body Condition</span>
                                <span class="pet-stat__value">${pet.body_condition_score ? pet.body_condition_score + '/9' : 'Not assessed'}</span>
                            </div>
                        </div>

                        ${pet.personality_traits && Object.keys(pet.personality_traits).length > 0 ? `
                            <div class="pet-details__section">
                                <h4>Personality Traits</h4>
                                <div class="pet-traits">
                                    ${Object.entries(pet.personality_traits).map(([trait, value]) => `
                                        <span class="pet-trait">${trait}: ${value}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <div class="pet-tab-content" data-tab-content="health">
                        <div class="health-overview">
                            <div class="health-section">
                                <h4>Health Conditions</h4>
                                ${pet.health_conditions && pet.health_conditions.length > 0 ? `
                                    <ul class="pet-details__list">
                                        ${pet.health_conditions.map(condition => `<li>${condition}</li>`).join('')}
                                    </ul>
                                ` : '<p class="empty-text">No health conditions recorded</p>'}
                                <button class="btn btn--small btn--secondary" data-action="manage-health-conditions" data-pet-id="${pet.id}">
                                    Manage Conditions
                                </button>
                            </div>

                            <div class="health-section">
                                <h4>Allergies</h4>
                                ${pet.allergies && pet.allergies.length > 0 ? `
                                    <ul class="pet-details__list">
                                        ${pet.allergies.map(allergy => `<li>${allergy}</li>`).join('')}
                                    </ul>
                                ` : '<p class="empty-text">No allergies recorded</p>'}
                                <button class="btn btn--small btn--secondary" data-action="manage-allergies" data-pet-id="${pet.id}">
                                    Manage Allergies
                                </button>
                            </div>

                            <div class="health-section">
                                <h4>Current Medications</h4>
                                ${pet.medications && pet.medications.length > 0 ? `
                                    <ul class="pet-details__list">
                                        ${pet.medications.map(med => `<li>${med}</li>`).join('')}
                                    </ul>
                                ` : '<p class="empty-text">No medications recorded</p>'}
                                <button class="btn btn--small btn--secondary" data-action="manage-medications" data-pet-id="${pet.id}">
                                    Manage Medications
                                </button>
                            </div>

                            <div class="health-actions">
                                <button class="btn btn--primary" data-action="log-weight" data-pet-id="${pet.id}">
                                    Log Weight
                                </button>
                                <button class="btn btn--secondary" data-action="health-checkup" data-pet-id="${pet.id}">
                                    Record Health Check
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="pet-tab-content" data-tab-content="nutrition">
                        <div class="nutrition-overview">
                            <div class="nutrition-status">
                                ${pet.has_nutrition_plan ? `
                                    <div class="status-badge status-badge--success">
                                        <span class="status-icon">✓</span>
                                        Active Nutrition Plan
                                    </div>
                                ` : `
                                    <div class="status-badge status-badge--warning">
                                        <span class="status-icon">!</span>
                                        No Nutrition Plan
                                    </div>
                                `}
                            </div>
                            
                            <div class="nutrition-actions">
                                <button class="btn btn--primary" data-action="generate-nutrition-plan" data-pet-id="${pet.id}">
                                    ${pet.has_nutrition_plan ? 'Update' : 'Generate'} Nutrition Plan
                                </button>
                                <button class="btn btn--secondary" data-action="view-nutrition-history" data-pet-id="${pet.id}">
                                    View History
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="pet-details__actions">
                    <button class="btn btn--primary" data-action="edit-pet" data-pet-id="${pet.id}">
                        Edit Pet Information
                    </button>
                    <button class="btn btn--secondary" data-action="delete-pet" data-pet-id="${pet.id}">
                        Delete Pet
                    </button>
                </div>
            </div>
        `;
    }

    renderNutritionPlan(plan) {
        if (!plan) {
            return '<p>No nutrition plan available.</p>';
        }

        return `
            <div class="nutrition-plan">
                <div class="nutrition-plan__summary">
                    <h3>Daily Nutritional Requirements</h3>
                    <div class="nutrition-stats">
                        <div class="nutrition-stat">
                            <span class="nutrition-stat__label">Calories</span>
                            <span class="nutrition-stat__value">${plan.daily_calories} kcal</span>
                        </div>
                        <div class="nutrition-stat">
                            <span class="nutrition-stat__label">Protein</span>
                            <span class="nutrition-stat__value">${plan.daily_protein_grams || 'N/A'}g</span>
                        </div>
                        <div class="nutrition-stat">
                            <span class="nutrition-stat__label">Fat</span>
                            <span class="nutrition-stat__value">${plan.daily_fat_grams || 'N/A'}g</span>
                        </div>
                        <div class="nutrition-stat">
                            <span class="nutrition-stat__label">Meals/Day</span>
                            <span class="nutrition-stat__value">${plan.meals_per_day || 2}</span>
                        </div>
                    </div>
                </div>

                ${plan.food_recommendations ? `
                    <div class="nutrition-plan__recommendations">
                        <h3>Food Recommendations</h3>
                        <div class="food-recommendations">
                            ${JSON.parse(plan.food_recommendations).map(food => `
                                <div class="food-recommendation">
                                    <h4>${food.name}</h4>
                                    <p>Portion: ${food.portion || 'As recommended'}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${plan.special_instructions ? `
                    <div class="nutrition-plan__instructions">
                        <h3>Special Instructions</h3>
                        <p>${plan.special_instructions}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Utility methods
    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return null;
        
        const birth = new Date(dateOfBirth);
        const today = new Date();
        const ageInMs = today - birth;
        const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
        
        return Math.floor(ageInYears * 10) / 10;
    }
}

// Export for module use
window.UIManager = UIManager;    rende
rUserProfile(user) {
        if (!user) return '<p>No user data available.</p>';
        
        return `
            <div class="user-profile">
                <div class="user-profile__header">
                    <div class="user-profile__avatar">
                        ${user.first_name.charAt(0)}${user.last_name.charAt(0)}
                    </div>
                    <div class="user-profile__info">
                        <h3 class="user-profile__name">${user.first_name} ${user.last_name}</h3>
                        <p class="user-profile__email">${user.email}</p>
                        <p class="user-profile__role">${user.role || 'Pet Owner'}</p>
                    </div>
                </div>

                <div class="user-profile__details">
                    <div class="form-group">
                        <label class="form-label">First Name</label>
                        <input type="text" class="form-input" value="${user.first_name}" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Last Name</label>
                        <input type="text" class="form-input" value="${user.last_name}" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" value="${user.email}" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Member Since</label>
                        <input type="text" class="form-input" value="${new Date(user.created_at).toLocaleDateString()}" readonly>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn--primary" data-action="edit-profile">Edit Profile</button>
                    <button class="btn btn--secondary" data-action="change-password">Change Password</button>
                </div>
            </div>
        `;
    }

    renderSettings() {
        return `
            <div class="settings">
                <div class="settings-section">
                    <h3 class="settings-section__title">Notifications</h3>
                    <div class="settings-section__content">
                        <div class="form-group">
                            <label class="form-checkbox">
                                <input type="checkbox" class="form-checkbox-input" checked>
                                <span class="form-checkbox-label">Email notifications for health alerts</span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="form-checkbox">
                                <input type="checkbox" class="form-checkbox-input" checked>
                                <span class="form-checkbox-label">Feeding reminders</span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="form-checkbox">
                                <input type="checkbox" class="form-checkbox-input">
                                <span class="form-checkbox-label">Weekly health reports</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3 class="settings-section__title">Privacy</h3>
                    <div class="settings-section__content">
                        <div class="form-group">
                            <label class="form-checkbox">
                                <input type="checkbox" class="form-checkbox-input">
                                <span class="form-checkbox-label">Share data with veterinarians</span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="form-checkbox">
                                <input type="checkbox" class="form-checkbox-input">
                                <span class="form-checkbox-label">Allow anonymous data for research</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3 class="settings-section__title">Units</h3>
                    <div class="settings-section__content">
                        <div class="form-group">
                            <label class="form-label">Weight Unit</label>
                            <select class="form-select">
                                <option value="kg" selected>Kilograms (kg)</option>
                                <option value="lbs">Pounds (lbs)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Temperature Unit</label>
                            <select class="form-select">
                                <option value="celsius" selected>Celsius (°C)</option>
                                <option value="fahrenheit">Fahrenheit (°F)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn--primary">Save Settings</button>
                    <button class="btn btn--secondary" data-action="close-modal">Cancel</button>
                </div>
            </div>
        `;
    }

    renderLogWeightForm(petId) {
        const today = new Date().toISOString().split('T')[0];
        
        return `
            <form class="form" data-action="log-weight" data-pet-id="${petId}">
                <div class="form-group">
                    <label for="weight" class="form-label">Weight (kg)</label>
                    <input type="number" id="weight" name="weight" class="form-input" 
                           step="0.1" min="0" max="200" required>
                </div>
                
                <div class="form-group">
                    <label for="date" class="form-label">Date</label>
                    <input type="date" id="date" name="date" class="form-input" 
                           value="${today}" required>
                </div>
                
                <div class="form-group">
                    <label for="notes" class="form-label">Notes (Optional)</label>
                    <textarea id="notes" name="notes" class="form-textarea" 
                              placeholder="Any observations about your pet's condition..."></textarea>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn--secondary" data-action="close-modal">Cancel</button>
                    <button type="submit" class="btn btn--primary">Log Weight</button>
                </div>
            </form>
        `;
    }

    renderScheduleFeedingForm(petId) {
        return `
            <form class="form" data-action="schedule-feeding" data-pet-id="${petId}">
                <div class="form-group">
                    <label for="meal_time" class="form-label">Meal Time</label>
                    <input type="time" id="meal_time" name="meal_time" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label for="food_type" class="form-label">Food Type</label>
                    <select id="food_type" name="food_type" class="form-select" required>
                        <option value="">Select food type</option>
                        <option value="dry_kibble">Dry Kibble</option>
                        <option value="wet_food">Wet Food</option>
                        <option value="raw_food">Raw Food</option>
                        <option value="treats">Treats</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="portion_size" class="form-label">Portion Size (grams)</label>
                    <input type="number" id="portion_size" name="portion_size" class="form-input" 
                           min="1" max="1000" required>
                </div>
                
                <div class="form-group">
                    <label for="repeat_days" class="form-label">Repeat Days</label>
                    <div class="checkbox-group">
                        <label class="form-checkbox">
                            <input type="checkbox" name="repeat_days[]" value="monday" class="form-checkbox-input">
                            <span class="form-checkbox-label">Monday</span>
                        </label>
                        <label class="form-checkbox">
                            <input type="checkbox" name="repeat_days[]" value="tuesday" class="form-checkbox-input">
                            <span class="form-checkbox-label">Tuesday</span>
                        </label>
                        <label class="form-checkbox">
                            <input type="checkbox" name="repeat_days[]" value="wednesday" class="form-checkbox-input">
                            <span class="form-checkbox-label">Wednesday</span>
                        </label>
                        <label class="form-checkbox">
                            <input type="checkbox" name="repeat_days[]" value="thursday" class="form-checkbox-input">
                            <span class="form-checkbox-label">Thursday</span>
                        </label>
                        <label class="form-checkbox">
                            <input type="checkbox" name="repeat_days[]" value="friday" class="form-checkbox-input">
                            <span class="form-checkbox-label">Friday</span>
                        </label>
                        <label class="form-checkbox">
                            <input type="checkbox" name="repeat_days[]" value="saturday" class="form-checkbox-input">
                            <span class="form-checkbox-label">Saturday</span>
                        </label>
                        <label class="form-checkbox">
                            <input type="checkbox" name="repeat_days[]" value="sunday" class="form-checkbox-input">
                            <span class="form-checkbox-label">Sunday</span>
                        </label>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn--secondary" data-action="close-modal">Cancel</button>
                    <button type="submit" class="btn btn--primary">Schedule Feeding</button>
                </div>
            </form>
        `;
    }

    renderHealthCheckupForm(petId) {
        const today = new Date().toISOString().split('T')[0];
        
        return `
            <form class="form" data-action="health-checkup" data-pet-id="${petId}">
                <div class="form-group">
                    <label for="checkup_date" class="form-label">Checkup Date</label>
                    <input type="date" id="checkup_date" name="checkup_date" class="form-input" 
                           value="${today}" required>
                </div>
                
                <div class="form-group">
                    <label for="body_condition" class="form-label">Body Condition Score (1-9)</label>
                    <select id="body_condition" name="body_condition" class="form-select">
                        <option value="">Select condition</option>
                        <option value="1">1 - Severely underweight</option>
                        <option value="2">2 - Very underweight</option>
                        <option value="3">3 - Underweight</option>
                        <option value="4">4 - Slightly underweight</option>
                        <option value="5">5 - Ideal weight</option>
                        <option value="6">6 - Slightly overweight</option>
                        <option value="7">7 - Overweight</option>
                        <option value="8">8 - Very overweight</option>
                        <option value="9">9 - Severely overweight</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="activity_level" class="form-label">Activity Level</label>
                    <select id="activity_level" name="activity_level" class="form-select">
                        <option value="low">Low</option>
                        <option value="moderate" selected>Moderate</option>
                        <option value="high">High</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="appetite" class="form-label">Appetite</label>
                    <select id="appetite" name="appetite" class="form-select">
                        <option value="poor">Poor</option>
                        <option value="normal" selected>Normal</option>
                        <option value="increased">Increased</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="observations" class="form-label">Health Observations</label>
                    <textarea id="observations" name="observations" class="form-textarea" 
                              placeholder="Any health concerns, behavioral changes, or observations..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="next_checkup" class="form-label">Next Checkup Date</label>
                    <input type="date" id="next_checkup" name="next_checkup" class="form-input">
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn--secondary" data-action="close-modal">Cancel</button>
                    <button type="submit" class="btn btn--primary">Save Checkup</button>
                </div>
            </form>
        `;
    }

    // Add missing showInfo method
    showInfo(message, duration = 5000) {
        return this.showNotification(message, 'info', duration);
    }

    // Utility methods
    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return null;
        
        const birth = new Date(dateOfBirth);
        const today = new Date();
        const ageInMs = today - birth;
        const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
        
        return Math.floor(ageInYears * 10) / 10;
    }
}

// Export for module use
window.UIManager = UIManager;    
renderEditPetForm(pet) {
        return `
            <form class="form" data-action="edit-pet" data-pet-id="${pet.id}">
                <div class="form-group">
                    <label for="name" class="form-label">Pet Name</label>
                    <input type="text" id="name" name="name" class="form-input" value="${pet.name}" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="species" class="form-label">Species</label>
                        <select id="species" name="species" class="form-select" required>
                            <option value="">Select species</option>
                            <option value="dog" ${pet.species === 'dog' ? 'selected' : ''}>Dog</option>
                            <option value="cat" ${pet.species === 'cat' ? 'selected' : ''}>Cat</option>
                            <option value="rabbit" ${pet.species === 'rabbit' ? 'selected' : ''}>Rabbit</option>
                            <option value="bird" ${pet.species === 'bird' ? 'selected' : ''}>Bird</option>
                            <option value="other" ${pet.species === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="breed" class="form-label">Breed (Optional)</label>
                        <input type="text" id="breed" name="breed" class="form-input" value="${pet.breed || ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="date_of_birth" class="form-label">Date of Birth</label>
                        <input type="date" id="date_of_birth" name="date_of_birth" class="form-input" value="${pet.date_of_birth || ''}">
                    </div>
                    <div class="form-group">
                        <label for="gender" class="form-label">Gender</label>
                        <select id="gender" name="gender" class="form-select">
                            <option value="unknown" ${pet.gender === 'unknown' ? 'selected' : ''}>Unknown</option>
                            <option value="male" ${pet.gender === 'male' ? 'selected' : ''}>Male</option>
                            <option value="female" ${pet.gender === 'female' ? 'selected' : ''}>Female</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="current_weight" class="form-label">Current Weight (kg)</label>
                        <input type="number" id="current_weight" name="current_weight" class="form-input" step="0.1" min="0" value="${pet.current_weight || ''}">
                    </div>
                    <div class="form-group">
                        <label for="ideal_weight" class="form-label">Ideal Weight (kg)</label>
                        <input type="number" id="ideal_weight" name="ideal_weight" class="form-input" step="0.1" min="0" value="${pet.ideal_weight || ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="activity_level" class="form-label">Activity Level</label>
                        <select id="activity_level" name="activity_level" class="form-select">
                            <option value="low" ${pet.activity_level === 'low' ? 'selected' : ''}>Low</option>
                            <option value="moderate" ${pet.activity_level === 'moderate' ? 'selected' : ''}>Moderate</option>
                            <option value="high" ${pet.activity_level === 'high' ? 'selected' : ''}>High</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="body_condition_score" class="form-label">Body Condition Score (1-9)</label>
                        <select id="body_condition_score" name="body_condition_score" class="form-select">
                            <option value="">Not assessed</option>
                            ${[1,2,3,4,5,6,7,8,9].map(score => 
                                `<option value="${score}" ${pet.body_condition_score == score ? 'selected' : ''}>${score}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="microchip_id" class="form-label">Microchip ID (Optional)</label>
                    <input type="text" id="microchip_id" name="microchip_id" class="form-input" value="${pet.microchip_id || ''}">
                </div>

                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" name="is_neutered" value="1" class="form-checkbox" ${pet.is_neutered ? 'checked' : ''}>
                        Spayed/Neutered
                    </label>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn--secondary" data-action="close-modal">Cancel</button>
                    <button type="submit" class="btn btn--primary">Update Pet</button>
                </div>
            </form>
        `;
    }

    renderLogWeightForm(petId) {
        const today = new Date().toISOString().split('T')[0];
        return `
            <form class="form" data-action="log-weight" data-pet-id="${petId}">
                <div class="form-group">
                    <label for="weight" class="form-label">Weight (kg)</label>
                    <input type="number" id="weight" name="weight" class="form-input" step="0.1" min="0" required>
                </div>
                
                <div class="form-group">
                    <label for="recorded_date" class="form-label">Date</label>
                    <input type="date" id="recorded_date" name="recorded_date" class="form-input" value="${today}" required>
                </div>

                <div class="form-group">
                    <label for="notes" class="form-label">Notes (Optional)</label>
                    <textarea id="notes" name="notes" class="form-textarea" rows="3" placeholder="Any observations about your pet's condition..."></textarea>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn--secondary" data-action="close-modal">Cancel</button>
                    <button type="submit" class="btn btn--primary">Log Weight</button>
                </div>
            </form>
        `;
    }

    renderScheduleFeedingForm(petId) {
        return `
            <form class="form" data-action="schedule-feeding" data-pet-id="${petId}">
                <div class="form-group">
                    <label for="meal_time" class="form-label">Meal Time</label>
                    <input type="time" id="meal_time" name="meal_time" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label for="food_type" class="form-label">Food Type</label>
                    <input type="text" id="food_type" name="food_type" class="form-input" placeholder="e.g., Dry kibble, Wet food" required>
                </div>

                <div class="form-group">
                    <label for="portion_size" class="form-label">Portion Size</label>
                    <input type="text" id="portion_size" name="portion_size" class="form-input" placeholder="e.g., 1 cup, 200g" required>
                </div>

                <div class="form-group">
                    <label for="feeding_notes" class="form-label">Feeding Notes (Optional)</label>
                    <textarea id="feeding_notes" name="feeding_notes" class="form-textarea" rows="3" placeholder="Special instructions or observations..."></textarea>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn--secondary" data-action="close-modal">Cancel</button>
                    <button type="submit" class="btn btn--primary">Schedule Feeding</button>
                </div>
            </form>
        `;
    }

    renderHealthCheckupForm(petId) {
        const today = new Date().toISOString().split('T')[0];
        return `
            <form class="form" data-action="health-checkup" data-pet-id="${petId}">
                <div class="form-group">
                    <label for="checkup_date" class="form-label">Checkup Date</label>
                    <input type="date" id="checkup_date" name="checkup_date" class="form-input" value="${today}" required>
                </div>
                
                <div class="form-group">
                    <label for="checkup_type" class="form-label">Type of Checkup</label>
                    <select id="checkup_type" name="checkup_type" class="form-select" required>
                        <option value="">Select type</option>
                        <option value="routine">Routine Checkup</option>
                        <option value="vaccination">Vaccination</option>
                        <option value="illness">Illness/Concern</option>
                        <option value="emergency">Emergency Visit</option>
                        <option value="follow_up">Follow-up Visit</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="veterinarian" class="form-label">Veterinarian/Clinic</label>
                    <input type="text" id="veterinarian" name="veterinarian" class="form-input" placeholder="Dr. Smith / ABC Veterinary Clinic">
                </div>

                <div class="form-group">
                    <label for="health_observations" class="form-label">Health Observations</label>
                    <textarea id="health_observations" name="health_observations" class="form-textarea" rows="4" placeholder="Record any health observations, symptoms, or concerns..."></textarea>
                </div>

                <div class="form-group">
                    <label for="treatment_notes" class="form-label">Treatment/Recommendations</label>
                    <textarea id="treatment_notes" name="treatment_notes" class="form-textarea" rows="3" placeholder="Any treatments given or recommendations from the vet..."></textarea>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn--secondary" data-action="close-modal">Cancel</button>
                    <button type="submit" class="btn btn--primary">Record Checkup</button>
                </div>
            </form>
        `;
    }

    renderUserProfile(user) {
        return `
            <div class="user-profile">
                <div class="user-profile__header">
                    <div class="user-profile__avatar">
                        ${user.first_name.charAt(0)}${user.last_name.charAt(0)}
                    </div>
                    <div class="user-profile__info">
                        <h3 class="user-profile__name">${user.first_name} ${user.last_name}</h3>
                        <p class="user-profile__email">${user.email}</p>
                        <p class="user-profile__role">${user.role.replace('_', ' ')}</p>
                    </div>
                </div>

                <div class="user-profile__details">
                    <div class="form-group">
                        <label class="form-label">First Name</label>
                        <input type="text" class="form-input" value="${user.first_name}" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Last Name</label>
                        <input type="text" class="form-input" value="${user.last_name}" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" value="${user.email}" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Account Type</label>
                        <input type="text" class="form-input" value="${user.role.replace('_', ' ')}" readonly>
                    </div>
                    ${user.location ? `
                        <div class="form-group">
                            <label class="form-label">Location</label>
                            <input type="text" class="form-input" value="${user.location}" readonly>
                        </div>
                    ` : ''}
                </div>

                <div class="user-profile__actions">
                    <button class="btn btn--primary" data-action="edit-profile">Edit Profile</button>
                    <button class="btn btn--secondary" data-action="change-password">Change Password</button>
                </div>
            </div>
        `;
    }

    renderSettings() {
        return `
            <div class="settings">
                <div class="settings-section">
                    <h3 class="settings-section__title">Account Settings</h3>
                    <div class="settings-section__content">
                        <button class="btn btn--secondary btn--full" data-action="edit-profile">
                            Edit Profile Information
                        </button>
                        <button class="btn btn--secondary btn--full" data-action="change-password">
                            Change Password
                        </button>
                        <button class="btn btn--secondary btn--full" data-action="setup-2fa">
                            Two-Factor Authentication
                        </button>
                    </div>
                </div>

                <div class="settings-section">
                    <h3 class="settings-section__title">Notification Preferences</h3>
                    <div class="settings-section__content">
                        <div class="form-group">
                            <label class="form-checkbox">
                                <input type="checkbox" class="form-checkbox-input" checked>
                                <span class="form-checkbox-label">Email notifications for health reminders</span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="form-checkbox">
                                <input type="checkbox" class="form-checkbox-input" checked>
                                <span class="form-checkbox-label">Weekly nutrition plan updates</span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="form-checkbox">
                                <input type="checkbox" class="form-checkbox-input">
                                <span class="form-checkbox-label">SMS alerts for urgent health concerns</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3 class="settings-section__title">Privacy & Data</h3>
                    <div class="settings-section__content">
                        <button class="btn btn--secondary btn--full" data-action="export-data">
                            Export My Data
                        </button>
                        <button class="btn btn--secondary btn--full" data-action="privacy-settings">
                            Privacy Settings
                        </button>
                        <button class="btn btn--error btn--full" data-action="delete-account">
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Utility method to show info notifications
    showInfo(message, duration = 5000) {
        return this.showNotification(message, 'info', duration);
    }

    // Health Tracking Interface Methods
    renderHealthAnalyticsDashboard(pet, healthData = {}) {
        const healthComponents = new HealthTrackingComponents();
        return healthComponents.renderHealthAnalyticsDashboard(pet, healthData);
    }

    renderAdvancedWeightForm(petId) {
        const healthComponents = new HealthTrackingComponents();
        return healthComponents.renderAdvancedWeightForm(petId);
    }

    renderMedicationTrackingForm(petId) {
        const healthComponents = new HealthTrackingComponents();
        return healthComponents.renderMedicationTrackingForm(petId);
    }

    renderHealthTimeline(healthRecords) {
        const healthComponents = new HealthTrackingComponents();
        return healthComponents.renderHealthTimeline(healthRecords);
    }

    // Utility methods
    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return null;
        
        const birth = new Date(dateOfBirth);
        const today = new Date();
        const ageInMs = today - birth;
        const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
        
        return Math.floor(ageInYears * 10) / 10;
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}    /
/ Nutrition Planning Interface Components
    renderNutritionPlanWizard(pet) {
        return `
            <div class="nutrition-wizard">
                <div class="wizard-progress">
                    <div class="wizard-step wizard-step--active" data-step="1">
                        <span class="wizard-step__number">1</span>
                        <span class="wizard-step__label">Pet Info</span>
                    </div>
                    <div class="wizard-step" data-step="2">
                        <span class="wizard-step__number">2</span>
                        <span class="wizard-step__label">Goals</span>
                    </div>
                    <div class="wizard-step" data-step="3">
                        <span class="wizard-step__number">3</span>
                        <span class="wizard-step__label">Preferences</span>
                    </div>
                    <div class="wizard-step" data-step="4">
                        <span class="wizard-step__number">4</span>
                        <span class="wizard-step__label">Review</span>
                    </div>
                </div>

                <form class="wizard-form" data-action="generate-nutrition-plan" data-pet-id="${pet.id}">
                    <!-- Step 1: Pet Information Review -->
                    <div class="wizard-content wizard-content--active" data-step-content="1">
                        <h3>Pet Information Review</h3>
                        <p class="wizard-description">Let's review ${pet.name}'s information to create the perfect nutrition plan.</p>
                        
                        <div class="pet-info-review">
                            <div class="info-card">
                                <h4>${pet.name}</h4>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="info-label">Species:</span>
                                        <span class="info-value">${pet.species}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Age:</span>
                                        <span class="info-value">${this.calculateAge(pet.date_of_birth) || 'Unknown'} years</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Weight:</span>
                                        <span class="info-value">${pet.current_weight || 'Not recorded'} kg</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Activity Level:</span>
                                        <span class="info-value">${pet.activity_level || 'Moderate'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            ${!pet.current_weight ? `
                                <div class="wizard-alert wizard-alert--warning">
                                    <strong>Missing Weight Information</strong>
                                    <p>For accurate nutrition calculations, please update ${pet.name}'s current weight.</p>
                                    <button type="button" class="btn btn--small btn--secondary" data-action="update-weight">
                                        Update Weight
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Step 2: Nutrition Goals -->
                    <div class="wizard-content" data-step-content="2">
                        <h3>Nutrition Goals</h3>
                        <p class="wizard-description">What are your main goals for ${pet.name}'s nutrition?</p>
                        
                        <div class="form-group">
                            <label class="form-label">Primary Goal</label>
                            <div class="radio-group">
                                <label class="radio-option">
                                    <input type="radio" name="primary_goal" value="maintain_weight" checked>
                                    <span class="radio-label">Maintain Current Weight</span>
                                    <span class="radio-description">Keep ${pet.name} at their current healthy weight</span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="primary_goal" value="lose_weight">
                                    <span class="radio-label">Weight Loss</span>
                                    <span class="radio-description">Help ${pet.name} lose weight safely</span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="primary_goal" value="gain_weight">
                                    <span class="radio-label">Weight Gain</span>
                                    <span class="radio-description">Help ${pet.name} gain healthy weight</span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="primary_goal" value="muscle_building">
                                    <span class="radio-label">Muscle Building</span>
                                    <span class="radio-description">Support muscle development and strength</span>
                                </label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="target_weight" class="form-label">Target Weight (kg)</label>
                            <input type="number" id="target_weight" name="target_weight" class="form-input" 
                                   step="0.1" min="0" value="${pet.ideal_weight || pet.current_weight || ''}">
                            <div class="form-help">Leave blank to maintain current weight</div>
                        </div>

                        <div class="form-group">
                            <label for="timeline" class="form-label">Timeline</label>
                            <select id="timeline" name="timeline" class="form-select">
                                <option value="1_month">1 Month</option>
                                <option value="3_months" selected>3 Months</option>
                                <option value="6_months">6 Months</option>
                                <option value="1_year">1 Year</option>
                                <option value="ongoing">Ongoing Maintenance</option>
                            </select>
                        </div>
                    </div>

                    <!-- Step 3: Food Preferences -->
                    <div class="wizard-content" data-step-content="3">
                        <h3>Food Preferences & Restrictions</h3>
                        <p class="wizard-description">Tell us about ${pet.name}'s food preferences and any restrictions.</p>
                        
                        <div class="form-group">
                            <label class="form-label">Food Type Preferences</label>
                            <div class="checkbox-group">
                                <label class="form-checkbox">
                                    <input type="checkbox" name="food_types" value="dry_kibble" checked>
                                    <span class="form-checkbox-label">Dry Kibble</span>
                                </label>
                                <label class="form-checkbox">
                                    <input type="checkbox" name="food_types" value="wet_food">
                                    <span class="form-checkbox-label">Wet Food</span>
                                </label>
                                <label class="form-checkbox">
                                    <input type="checkbox" name="food_types" value="raw_food">
                                    <span class="form-checkbox-label">Raw Food</span>
                                </label>
                                <label class="form-checkbox">
                                    <input type="checkbox" name="food_types" value="homemade">
                                    <span class="form-checkbox-label">Homemade Food</span>
                                </label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="meals_per_day" class="form-label">Preferred Meals Per Day</label>
                            <select id="meals_per_day" name="meals_per_day" class="form-select">
                                <option value="1">1 Meal</option>
                                <option value="2" selected>2 Meals</option>
                                <option value="3">3 Meals</option>
                                <option value="4">4 Meals</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Dietary Restrictions</label>
                            <div class="checkbox-group">
                                <label class="form-checkbox">
                                    <input type="checkbox" name="restrictions" value="grain_free">
                                    <span class="form-checkbox-label">Grain-Free</span>
                                </label>
                                <label class="form-checkbox">
                                    <input type="checkbox" name="restrictions" value="limited_ingredient">
                                    <span class="form-checkbox-label">Limited Ingredient</span>
                                </label>
                                <label class="form-checkbox">
                                    <input type="checkbox" name="restrictions" value="organic">
                                    <span class="form-checkbox-label">Organic Only</span>
                                </label>
                                <label class="form-checkbox">
                                    <input type="checkbox" name="restrictions" value="prescription">
                                    <span class="form-checkbox-label">Prescription Diet</span>
                                </label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="budget_range" class="form-label">Monthly Budget Range</label>
                            <select id="budget_range" name="budget_range" class="form-select">
                                <option value="budget">Budget-Friendly ($20-50)</option>
                                <option value="moderate" selected>Moderate ($50-100)</option>
                                <option value="premium">Premium ($100-200)</option>
                                <option value="luxury">Luxury ($200+)</option>
                                <option value="no_limit">No Budget Limit</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="special_notes" class="form-label">Special Notes</label>
                            <textarea id="special_notes" name="special_notes" class="form-textarea" rows="3" 
                                      placeholder="Any additional information about ${pet.name}'s eating habits, preferences, or health considerations..."></textarea>
                        </div>
                    </div>

                    <!-- Step 4: Review & Generate -->
                    <div class="wizard-content" data-step-content="4">
                        <h3>Review & Generate Plan</h3>
                        <p class="wizard-description">Review your selections and generate ${pet.name}'s personalized nutrition plan.</p>
                        
                        <div class="plan-preview">
                            <div class="preview-section">
                                <h4>Pet Information</h4>
                                <div class="preview-grid">
                                    <div class="preview-item">
                                        <span class="preview-label">Name:</span>
                                        <span class="preview-value">${pet.name}</span>
                                    </div>
                                    <div class="preview-item">
                                        <span class="preview-label">Species:</span>
                                        <span class="preview-value">${pet.species}</span>
                                    </div>
                                    <div class="preview-item">
                                        <span class="preview-label">Current Weight:</span>
                                        <span class="preview-value">${pet.current_weight || 'Not set'} kg</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="preview-section">
                                <h4>Goals & Preferences</h4>
                                <div id="goals-preview">
                                    <!-- Will be populated by JavaScript -->
                                </div>
                            </div>
                            
                            <div class="estimated-calories">
                                <h4>Estimated Daily Calories</h4>
                                <div class="calorie-estimate">
                                    <span class="calorie-number" id="estimated-calories">Calculating...</span>
                                    <span class="calorie-label">kcal/day</span>
                                </div>
                                <p class="calorie-note">This is an estimate. The final plan will include detailed nutritional breakdown.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Wizard Navigation -->
                    <div class="wizard-navigation">
                        <button type="button" class="btn btn--secondary wizard-btn-prev" disabled>
                            Previous
                        </button>
                        <button type="button" class="btn btn--primary wizard-btn-next">
                            Next
                        </button>
                        <button type="submit" class="btn btn--primary wizard-btn-generate" style="display: none;">
                            Generate Nutrition Plan
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    renderMealPlanningCalendar(nutritionPlan, pet) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const mealsPerDay = nutritionPlan.meals_per_day || 2;
        const mealTimes = this.generateMealTimes(mealsPerDay);
        
        return `
            <div class="meal-calendar">
                <div class="calendar-header">
                    <h3>Weekly Meal Schedule for ${pet.name}</h3>
                    <div class="calendar-controls">
                        <button class="btn btn--small btn--secondary" data-action="previous-week">
                            ← Previous Week
                        </button>
                        <span class="current-week">Week of ${this.getCurrentWeekStart()}</span>
                        <button class="btn btn--small btn--secondary" data-action="next-week">
                            Next Week →
                        </button>
                    </div>
                </div>

                <div class="calendar-grid">
                    <div class="calendar-times">
                        <div class="time-header">Time</div>
                        ${mealTimes.map(time => `
                            <div class="time-slot">${time}</div>
                        `).join('')}
                    </div>
                    
                    ${days.map(day => `
                        <div class="calendar-day">
                            <div class="day-header">${day}</div>
                            ${mealTimes.map((time, timeIndex) => `
                                <div class="meal-slot" 
                                     data-day="${day.toLowerCase()}" 
                                     data-time="${time}"
                                     data-meal-index="${timeIndex}">
                                    <div class="meal-content">
                                        <div class="meal-food">
                                            <select class="meal-food-select" name="meal_${day.toLowerCase()}_${timeIndex}">
                                                <option value="">Select Food</option>
                                                ${this.renderFoodOptions(nutritionPlan)}
                                            </select>
                                        </div>
                                        <div class="meal-portion">
                                            <input type="text" class="meal-portion-input" 
                                                   placeholder="Portion" 
                                                   name="portion_${day.toLowerCase()}_${timeIndex}">
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>

                <div class="calendar-summary">
                    <div class="daily-totals">
                        <h4>Daily Nutritional Targets</h4>
                        <div class="nutrition-targets">
                            <div class="target-item">
                                <span class="target-label">Calories:</span>
                                <span class="target-value">${nutritionPlan.daily_calories} kcal</span>
                            </div>
                            <div class="target-item">
                                <span class="target-label">Protein:</span>
                                <span class="target-value">${nutritionPlan.daily_protein_grams || 'N/A'}g</span>
                            </div>
                            <div class="target-item">
                                <span class="target-label">Fat:</span>
                                <span class="target-value">${nutritionPlan.daily_fat_grams || 'N/A'}g</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="calendar-actions">
                        <button class="btn btn--secondary" data-action="save-schedule">
                            Save Schedule
                        </button>
                        <button class="btn btn--primary" data-action="generate-shopping-list">
                            Generate Shopping List
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderPortionCalculator(pet, foodItem = null) {
        return `
            <div class="portion-calculator">
                <div class="calculator-header">
                    <h3>Portion Calculator for ${pet.name}</h3>
                    <p>Calculate the right portion sizes based on nutritional needs</p>
                </div>

                <div class="calculator-content">
                    <div class="calculator-inputs">
                        <div class="form-group">
                            <label for="food-search" class="form-label">Search Food</label>
                            <input type="text" id="food-search" class="form-input" 
                                   placeholder="Search for food items..." 
                                   value="${foodItem?.name || ''}">
                            <div class="food-suggestions" id="food-suggestions"></div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="target-calories" class="form-label">Target Calories</label>
                                <input type="number" id="target-calories" class="form-input" 
                                       placeholder="Daily calories" min="0">
                            </div>
                            <div class="form-group">
                                <label for="meals-per-day" class="form-label">Meals Per Day</label>
                                <select id="meals-per-day" class="form-select">
                                    <option value="1">1 Meal</option>
                                    <option value="2" selected>2 Meals</option>
                                    <option value="3">3 Meals</option>
                                    <option value="4">4 Meals</option>
                                </select>
                            </div>
                        </div>

                        ${foodItem ? `
                            <div class="selected-food">
                                <h4>${foodItem.name}</h4>
                                <div class="food-nutrition">
                                    <span>Calories: ${foodItem.calories_per_100g} kcal/100g</span>
                                    <span>Protein: ${foodItem.protein_percentage}%</span>
                                    <span>Fat: ${foodItem.fat_percentage}%</span>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <div class="calculator-results">
                        <div class="portion-display">
                            <div class="portion-visual">
                                <div class="bowl-illustration">
                                    <div class="bowl"></div>
                                    <div class="food-amount" id="food-visual"></div>
                                </div>
                            </div>
                            
                            <div class="portion-measurements">
                                <div class="measurement-item">
                                    <span class="measurement-label">Per Meal:</span>
                                    <span class="measurement-value" id="per-meal-amount">-</span>
                                </div>
                                <div class="measurement-item">
                                    <span class="measurement-label">Daily Total:</span>
                                    <span class="measurement-value" id="daily-total-amount">-</span>
                                </div>
                                <div class="measurement-item">
                                    <span class="measurement-label">Weekly Amount:</span>
                                    <span class="measurement-value" id="weekly-amount">-</span>
                                </div>
                            </div>
                        </div>

                        <div class="conversion-table">
                            <h4>Measurement Conversions</h4>
                            <table class="conversion-table-grid">
                                <thead>
                                    <tr>
                                        <th>Grams</th>
                                        <th>Cups</th>
                                        <th>Ounces</th>
                                    </tr>
                                </thead>
                                <tbody id="conversion-rows">
                                    <tr><td>-</td><td>-</td><td>-</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="calculator-actions">
                    <button class="btn btn--secondary" data-action="reset-calculator">
                        Reset
                    </button>
                    <button class="btn btn--primary" data-action="save-portion">
                        Save to Meal Plan
                    </button>
                </div>
            </div>
        `;
    }

    renderFoodRecommendationSystem(pet, filters = {}) {
        return `
            <div class="food-recommendations">
                <div class="recommendations-header">
                    <h3>Food Recommendations for ${pet.name}</h3>
                    <p>Personalized food suggestions based on ${pet.name}'s profile and nutritional needs</p>
                </div>

                <div class="recommendations-filters">
                    <div class="filter-row">
                        <div class="form-group">
                            <label for="food-category" class="form-label">Category</label>
                            <select id="food-category" class="form-select" name="category">
                                <option value="">All Categories</option>
                                <option value="dry_kibble">Dry Kibble</option>
                                <option value="wet_food">Wet Food</option>
                                <option value="raw_food">Raw Food</option>
                                <option value="treats">Treats</option>
                                <option value="supplements">Supplements</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="life-stage" class="form-label">Life Stage</label>
                            <select id="life-stage" class="form-select" name="life_stage">
                                <option value="">All Life Stages</option>
                                <option value="puppy">Puppy/Kitten</option>
                                <option value="adult" selected>Adult</option>
                                <option value="senior">Senior</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="price-range" class="form-label">Price Range</label>
                            <select id="price-range" class="form-select" name="price_range">
                                <option value="">Any Price</option>
                                <option value="budget">Budget ($)</option>
                                <option value="moderate">Moderate ($$)</option>
                                <option value="premium">Premium ($$$)</option>
                                <option value="luxury">Luxury ($$$$)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <button class="btn btn--primary" data-action="apply-filters">
                                Apply Filters
                            </button>
                        </div>
                    </div>

                    <div class="filter-tags">
                        <label class="filter-tag">
                            <input type="checkbox" name="features" value="grain_free">
                            <span>Grain-Free</span>
                        </label>
                        <label class="filter-tag">
                            <input type="checkbox" name="features" value="organic">
                            <span>Organic</span>
                        </label>
                        <label class="filter-tag">
                            <input type="checkbox" name="features" value="limited_ingredient">
                            <span>Limited Ingredient</span>
                        </label>
                        <label class="filter-tag">
                            <input type="checkbox" name="features" value="aafco_approved">
                            <span>AAFCO Approved</span>
                        </label>
                    </div>
                </div>

                <div class="recommendations-list" id="food-recommendations-list">
                    ${this.renderFoodRecommendationCards(this.getMockFoodRecommendations(pet))}
                </div>

                <div class="recommendations-actions">
                    <button class="btn btn--secondary" data-action="compare-selected">
                        Compare Selected
                    </button>
                    <button class="btn btn--primary" data-action="add-to-meal-plan">
                        Add to Meal Plan
                    </button>
                </div>
            </div>
        `;
    }

    // Helper methods for nutrition planning
    generateMealTimes(mealsPerDay) {
        const schedules = {
            1: ['12:00'],
            2: ['08:00', '18:00'],
            3: ['08:00', '13:00', '18:00'],
            4: ['07:00', '12:00', '17:00', '21:00']
        };
        return schedules[mealsPerDay] || schedules[2];
    }

    getCurrentWeekStart() {
        const today = new Date();
        const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        return monday.toLocaleDateString();
    }

    renderFoodOptions(nutritionPlan) {
        // This would normally come from the backend
        const mockFoods = [
            'Premium Adult Dog Food',
            'Chicken & Rice Formula',
            'Salmon & Sweet Potato',
            'Grain-Free Turkey',
            'Limited Ingredient Duck'
        ];
        
        return mockFoods.map(food => 
            `<option value="${food}">${food}</option>`
        ).join('');
    }

    getMockFoodRecommendations(pet) {
        // Mock data - would come from backend
        return [
            {
                id: 1,
                name: 'Premium Adult Dog Food',
                brand: 'NutriPet',
                category: 'dry_kibble',
                rating: 4.8,
                price: 45.99,
                calories_per_100g: 350,
                protein_percentage: 28,
                fat_percentage: 15,
                features: ['grain_free', 'aafco_approved'],
                match_score: 95
            },
            {
                id: 2,
                name: 'Chicken & Rice Formula',
                brand: 'HealthyPaws',
                category: 'dry_kibble',
                rating: 4.6,
                price: 38.99,
                calories_per_100g: 340,
                protein_percentage: 25,
                fat_percentage: 12,
                features: ['aafco_approved'],
                match_score: 88
            }
        ];
    }

    renderFoodRecommendationCards(recommendations) {
        return recommendations.map(food => `
            <div class="food-card" data-food-id="${food.id}">
                <div class="food-card__header">
                    <div class="food-card__info">
                        <h4 class="food-card__name">${food.name}</h4>
                        <p class="food-card__brand">${food.brand}</p>
                        <div class="food-card__rating">
                            <span class="rating-stars">${'★'.repeat(Math.floor(food.rating))}${'☆'.repeat(5-Math.floor(food.rating))}</span>
                            <span class="rating-score">${food.rating}</span>
                        </div>
                    </div>
                    <div class="food-card__match">
                        <div class="match-score">${food.match_score}%</div>
                        <div class="match-label">Match</div>
                    </div>
                </div>

                <div class="food-card__nutrition">
                    <div class="nutrition-item">
                        <span class="nutrition-label">Calories:</span>
                        <span class="nutrition-value">${food.calories_per_100g} kcal/100g</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="nutrition-label">Protein:</span>
                        <span class="nutrition-value">${food.protein_percentage}%</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="nutrition-label">Fat:</span>
                        <span class="nutrition-value">${food.fat_percentage}%</span>
                    </div>
                </div>

                <div class="food-card__features">
                    ${food.features.map(feature => `
                        <span class="feature-tag">${feature.replace('_', ' ')}</span>
                    `).join('')}
                </div>

                <div class="food-card__actions">
                    <div class="food-card__price">$${food.price}</div>
                    <div class="food-card__buttons">
                        <button class="btn btn--small btn--secondary" data-action="view-details" data-food-id="${food.id}">
                            Details
                        </button>
                        <button class="btn btn--small btn--primary" data-action="select-food" data-food-id="${food.id}">
                            Select
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }