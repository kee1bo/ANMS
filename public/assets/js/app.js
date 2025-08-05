// Main Application JavaScript
class ANMSApp {
    constructor() {
        this.currentUser = null;
        this.pets = [];
        this.init();
    }

    init() {
        // Initialize event listeners
        this.setupEventListeners();
        
        // Load initial data if user is logged in
        if (document.querySelector('.dashboard-container')) {
            this.loadDashboardData();
        }
    }

    setupEventListeners() {
        // Tab switching for new sidebar navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.target.closest('.nav-link').dataset.tab;
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });

        // Legacy tab switching for old navigation (fallback)
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal-overlay');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    // Tab Management
    switchTab(tabName) {
        // Update active navigation link (new sidebar)
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = document.getElementById(`${tabName}-tab`);
        if (activeContent) {
            activeContent.classList.add('active');
        }

        // Update page title and subtitle
        this.updatePageTitle(tabName);

        // Load tab-specific data
        this.loadTabData(tabName);
    }

    updatePageTitle(tabName) {
        const pageTitle = document.getElementById('page-title');
        const pageSubtitle = document.getElementById('page-subtitle');
        
        if (!pageTitle || !pageSubtitle) return;

        const titles = {
            dashboard: {
                title: 'Dashboard',
                subtitle: 'Welcome back! Here\'s what\'s happening with your pets.'
            },
            pets: {
                title: 'My Pets',
                subtitle: 'Manage your pet profiles and information.'
            },
            nutrition: {
                title: 'Nutrition Plans',
                subtitle: 'Create and manage custom nutrition plans for your pets.'
            },
            health: {
                title: 'Health Records',
                subtitle: 'Track your pets\' health data and medical records.'
            },
            reports: {
                title: 'Reports',
                subtitle: 'View detailed analytics and insights about your pets.'
            },
            settings: {
                title: 'Settings',
                subtitle: 'Manage your account and application preferences.'
            }
        };

        const titleData = titles[tabName] || titles.dashboard;
        pageTitle.textContent = titleData.title;
        pageSubtitle.textContent = titleData.subtitle;
    }

    loadTabData(tabName) {
        switch(tabName) {
            case 'pets':
                this.loadPets();
                break;
            case 'nutrition':
                this.loadNutritionPlans();
                break;
            case 'health':
                this.loadHealthRecords();
                break;
            case 'dashboard':
                this.loadDashboardData();
                break;
        }
    }

    // Dashboard Data Loading
    async loadDashboardData() {
        try {
            await this.loadPets();
            this.updateDashboardStats();
            this.loadRecentActivity();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadPets() {
        try {
            const response = await fetch('/api-bridge.php?action=get_pets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.pets = data.pets || [];
                this.renderPets();
                this.updateDashboardStats();
            } else {
                // Use mock data if API fails
                this.pets = this.getMockPets();
                this.renderPets();
                this.updateDashboardStats();
            }
        } catch (error) {
            console.error('Error loading pets:', error);
            // Fallback to mock data
            this.pets = this.getMockPets();
            this.renderPets();
            this.updateDashboardStats();
        }
    }

    getMockPets() {
        return [
            {
                id: 1,
                name: 'Buddy',
                species: 'Dog',
                breed: 'Golden Retriever',
                age: 3,
                weight: 25.5,
                ideal_weight: 24.0,
                activity_level: 'Medium',
                health_status: 'Healthy'
            },
            {
                id: 2,
                name: 'Whiskers',
                species: 'Cat',
                breed: 'Persian',
                age: 2,
                weight: 4.2,
                ideal_weight: 4.0,
                activity_level: 'Low',
                health_status: 'Healthy'
            }
        ];
    }

    renderPets() {
        const petsContainer = document.getElementById('pets-container');
        if (!petsContainer) return;

        if (this.pets.length === 0) {
            petsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-paw" style="font-size: 48px; color: #cbd5e1; margin-bottom: 16px;"></i>
                    <h3>No pets added yet</h3>
                    <p>Add your first pet to get started with nutrition tracking</p>
                    <button class="btn btn-primary" onclick="app.showAddPet()">
                        <i class="fas fa-plus"></i> Add Your First Pet
                    </button>
                </div>
            `;
            return;
        }

        const petsHTML = this.pets.map(pet => `
            <div class="pet-card">
                <div class="pet-header">
                    <div class="pet-avatar">
                        ${pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐱' : '🐾'}
                    </div>
                    <div class="pet-actions">
                        <button class="btn btn-sm btn-outline" onclick="app.editPet(${pet.id})" title="Edit Pet">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="app.deletePet(${pet.id})" title="Delete Pet">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="pet-info">
                    <h3 class="pet-name">${pet.name}</h3>
                    <p class="pet-breed">${pet.breed || pet.species}</p>
                    <div class="pet-details">
                        <div class="pet-detail">
                            <span class="detail-label">Age</span>
                            <span class="detail-value">${pet.age} years</span>
                        </div>
                        <div class="pet-detail">
                            <span class="detail-label">Weight</span>
                            <span class="detail-value">${pet.weight || pet.current_weight} kg</span>
                        </div>
                        <div class="pet-detail">
                            <span class="detail-label">Activity</span>
                            <span class="detail-value">${pet.activity_level}</span>
                        </div>
                    </div>
                </div>
                <div class="pet-status">
                    <span class="status-badge status-${(pet.health_status || 'healthy').toLowerCase()}">
                        ${pet.health_status || 'Healthy'}
                    </span>
                </div>
            </div>
        `).join('');

        petsContainer.innerHTML = petsHTML;
    }

    updateDashboardStats() {
        const totalPetsEl = document.getElementById('total-pets');
        const mealsToday = document.getElementById('meals-today');
        const petsCountBadge = document.getElementById('pets-count');
        
        if (totalPetsEl) totalPetsEl.textContent = this.pets.length;
        if (mealsToday) mealsToday.textContent = this.pets.length * 2; // 2 meals per pet
        if (petsCountBadge) petsCountBadge.textContent = this.pets.length;
    }

    loadRecentActivity() {
        const activityEl = document.getElementById('recent-activity');
        if (!activityEl) return;

        const activities = [
            { icon: 'fas fa-utensils', text: 'Fed Buddy breakfast', time: '2 hours ago' },
            { icon: 'fas fa-weight', text: 'Recorded Whiskers weight', time: '1 day ago' },
            { icon: 'fas fa-plus', text: 'Added new pet profile', time: '3 days ago' }
        ];

        const activitiesHTML = activities.map(activity => `
            <div class="activity-item">
                <i class="${activity.icon}"></i>
                <div class="activity-content">
                    <span class="activity-text">${activity.text}</span>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');

        activityEl.innerHTML = activitiesHTML;
    }

    // Authentication
    showLogin() {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h2>Sign In</h2>
            <form onsubmit="app.handleLogin(event)">
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" name="email" value="test@example.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-input" name="password" value="password" required>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Sign In</button>
                </div>
                <p style="text-align: center; margin-top: 16px;">
                    Don't have an account? <a href="#" onclick="app.showRegister()">Sign up</a>
                </p>
            </form>
        `;
        this.showModal();
    }

    showRegister() {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h2>Create Account</h2>
            <form onsubmit="app.handleRegister(event)">
                <div class="form-group">
                    <label class="form-label">First Name</label>
                    <input type="text" class="form-input" name="first_name" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Last Name</label>
                    <input type="text" class="form-input" name="last_name" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" name="email" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-input" name="password" required>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Create Account</button>
                </div>
                <p style="text-align: center; margin-top: 16px;">
                    Already have an account? <a href="#" onclick="app.showLogin()">Sign in</a>
                </p>
            </form>
        `;
        this.showModal();
    }

    async handleLogin(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        try {
            const response = await fetch('/api-bridge.php?action=auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'login',
                    email: formData.get('email'),
                    password: formData.get('password')
                })
            });

            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('auth_token', data.token);
                window.location.reload();
            } else {
                alert('Login failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        try {
            const response = await fetch('/api-bridge.php?action=auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'register',
                    first_name: formData.get('first_name'),
                    last_name: formData.get('last_name'),
                    email: formData.get('email'),
                    password: formData.get('password')
                })
            });

            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('auth_token', data.token);
                window.location.reload();
            } else {
                alert('Registration failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed. Please try again.');
        }
    }

    async logout() {
        try {
            // Call logout API to clear server session
            const response = await fetch('/api-bridge.php?action=auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    action: 'logout'
                })
            });

            const data = await response.json();
            
            // Clear client-side data regardless of API response
            localStorage.removeItem('auth_token');
            sessionStorage.clear();
            
            // Redirect to landing page
            window.location.href = '/';
            
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear client data and redirect on error
            localStorage.removeItem('auth_token');
            sessionStorage.clear();
            window.location.href = '/';
        }
    }

    getAuthToken() {
        return localStorage.getItem('auth_token');
    }

    // Pet Management
    showAddPet() {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h2>Add New Pet</h2>
            <form onsubmit="app.handleAddPet(event)" class="pet-form">
                <div class="form-section">
                    <h3>Basic Information</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Pet Name *</label>
                            <input type="text" class="form-input" name="name" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Gender</label>
                            <select class="form-select" name="gender">
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Species *</label>
                            <select class="form-select" name="species" required>
                                <option value="">Select Species</option>
                                <option value="dog">Dog</option>
                                <option value="cat">Cat</option>
                                <option value="rabbit">Rabbit</option>
                                <option value="bird">Bird</option>
                                <option value="fish">Fish</option>
                                <option value="reptile">Reptile</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Breed</label>
                            <input type="text" class="form-input" name="breed" placeholder="e.g., Golden Retriever">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>Physical Information</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Age (years) *</label>
                            <input type="number" class="form-input" name="age" min="0" max="30" step="0.1" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Current Weight (kg) *</label>
                            <input type="number" class="form-input" name="weight" step="0.1" min="0" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Ideal Weight (kg)</label>
                            <input type="number" class="form-input" name="ideal_weight" step="0.1" min="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Body Condition Score (1-9)</label>
                            <select class="form-select" name="body_condition_score">
                                <option value="">Select Score</option>
                                <option value="1">1 - Emaciated</option>
                                <option value="2">2 - Very Thin</option>
                                <option value="3">3 - Thin</option>
                                <option value="4">4 - Underweight</option>
                                <option value="5">5 - Ideal</option>
                                <option value="6">6 - Slightly Overweight</option>
                                <option value="7">7 - Overweight</option>
                                <option value="8">8 - Obese</option>
                                <option value="9">9 - Severely Obese</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>Activity & Health</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Activity Level *</label>
                            <select class="form-select" name="activity_level" required>
                                <option value="">Select Activity Level</option>
                                <option value="low">Low - Sedentary, minimal exercise</option>
                                <option value="medium">Medium - Regular walks/play</option>
                                <option value="high">High - Very active, lots of exercise</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Spayed/Neutered</label>
                            <select class="form-select" name="spayed_neutered">
                                <option value="">Select Status</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                                <option value="unknown">Unknown</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Medical Conditions</label>
                        <textarea class="form-textarea" name="medical_conditions" rows="2" placeholder="List any known medical conditions, allergies, or health concerns"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Current Medications</label>
                        <textarea class="form-textarea" name="medications" rows="2" placeholder="List current medications and dosages"></textarea>
                    </div>
                </div>

                <div class="form-section">
                    <h3>Additional Notes</h3>
                    <div class="form-group">
                        <label class="form-label">Personality & Behavior</label>
                        <textarea class="form-textarea" name="personality" rows="2" placeholder="Describe your pet's personality, behavior, and preferences"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Special Dietary Needs</label>
                        <textarea class="form-textarea" name="dietary_notes" rows="2" placeholder="Any special dietary requirements, food allergies, or feeding preferences"></textarea>
                    </div>
                </div>

                <div class="form-group">
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Add Pet</button>
                </div>
            </form>
        `;
        this.showModal();
    }

    async handleAddPet(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const petData = {
            name: formData.get('name'),
            species: formData.get('species'),
            breed: formData.get('breed'),
            age: parseInt(formData.get('age')),
            weight: parseFloat(formData.get('weight')),
            activity_level: formData.get('activity_level')
        };

        try {
            const response = await fetch('/api-bridge.php?action=add_pet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(petData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.closeModal();
                await this.loadPets();
                alert('Pet added successfully!');
            } else {
                alert('Failed to add pet: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Add pet error:', error);
            alert('Failed to add pet. Please try again.');
        }
    }

    // Modal Management
    showModal() {
        const modal = document.getElementById('modal-overlay');
        modal.classList.add('show');
        modal.style.display = 'flex';
    }

    closeModal() {
        const modal = document.getElementById('modal-overlay');
        modal.classList.remove('show');
        modal.style.display = 'none';
    }

    // Nutrition and Health (placeholder functions)
    loadNutritionPlans() {
        const nutritionContent = document.getElementById('nutrition-content');
        if (nutritionContent) {
            nutritionContent.innerHTML = '<p>Nutrition plans feature coming soon...</p>';
        }
    }

    async loadHealthRecords() {
        const healthContent = document.getElementById('health-content');
        if (!healthContent) return;

        // Get current user's pets for health tracking
        await this.loadPets();
        
        if (this.pets.length === 0) {
            healthContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heartbeat" style="font-size: 48px; color: #cbd5e1; margin-bottom: 16px;"></i>
                    <h3>No pets to track</h3>
                    <p>Add a pet first to start tracking their health</p>
                    <button class="btn btn-primary" onclick="app.showAddPet()">
                        <i class="fas fa-plus"></i> Add Your First Pet
                    </button>
                </div>
            `;
            return;
        }

        healthContent.innerHTML = `
            <div class="health-dashboard">
                <div class="health-header">
                    <div class="health-actions">
                        <select class="form-select" id="health-pet-selector" onchange="app.switchHealthPet(this.value)">
                            <option value="">Select a pet to track</option>
                            ${this.pets.map(pet => `<option value="${pet.id}">${pet.name}</option>`).join('')}
                        </select>
                        <button class="btn btn-primary" onclick="app.showAddHealthRecord()">
                            <i class="fas fa-plus"></i> Add Health Record
                        </button>
                    </div>
                </div>
                
                <div id="health-pet-content" class="health-pet-content">
                    <div class="health-placeholder">
                        <i class="fas fa-arrow-up"></i>
                        <p>Select a pet above to view their health records</p>
                    </div>
                </div>
            </div>
        `;
    }

    async switchHealthPet(petId) {
        if (!petId) {
            document.getElementById('health-pet-content').innerHTML = `
                <div class="health-placeholder">
                    <i class="fas fa-arrow-up"></i>
                    <p>Select a pet above to view their health records</p>
                </div>
            `;
            return;
        }

        const pet = this.pets.find(p => p.id == petId);
        if (!pet) return;

        const healthContent = document.getElementById('health-pet-content');
        healthContent.innerHTML = `
            <div class="health-overview">
                <div class="pet-health-header">
                    <div class="pet-info">
                        <h3>${pet.name}'s Health Dashboard</h3>
                        <p>${pet.species} • ${pet.breed} • ${pet.age} years old</p>
                    </div>
                    <div class="current-stats">
                        <div class="stat-item">
                            <span class="stat-label">Current Weight</span>
                            <span class="stat-value">${pet.weight} kg</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Ideal Weight</span>
                            <span class="stat-value">${pet.ideal_weight || 'Not set'} kg</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Body Condition</span>
                            <span class="stat-value">${pet.body_condition_score ? pet.body_condition_score + '/9' : 'Not assessed'}</span>
                        </div>
                    </div>
                </div>

                <div class="health-tabs">
                    <button class="health-tab active" onclick="app.switchHealthTab('weight', ${petId})">Weight Tracking</button>
                    <button class="health-tab" onclick="app.switchHealthTab('records', ${petId})">Health Records</button>
                    <button class="health-tab" onclick="app.switchHealthTab('medications', ${petId})">Medications</button>
                    <button class="health-tab" onclick="app.switchHealthTab('activity', ${petId})">Activity Log</button>
                </div>

                <div id="health-tab-content" class="health-tab-content">
                    ${this.renderWeightTracking(pet)}
                </div>
            </div>
        `;
    }

    renderWeightTracking(pet) {
        const weightHistory = pet.weight_history || [];
        
        return `
            <div class="weight-tracking">
                <div class="weight-actions">
                    <button class="btn btn-primary" onclick="app.showAddWeightRecord(${pet.id})">
                        <i class="fas fa-plus"></i> Log Weight
                    </button>
                    <button class="btn btn-outline" onclick="app.showWeightGoals(${pet.id})">
                        <i class="fas fa-target"></i> Set Goals
                    </button>
                </div>

                <div class="weight-chart-container">
                    <div class="chart-header">
                        <h4>Weight Trend</h4>
                        <div class="chart-controls">
                            <select class="form-select" onchange="app.updateWeightChart(${pet.id}, this.value)">
                                <option value="30">Last 30 days</option>
                                <option value="90">Last 3 months</option>
                                <option value="365">Last year</option>
                                <option value="all">All time</option>
                            </select>
                        </div>
                    </div>
                    <div class="weight-chart" id="weight-chart-${pet.id}">
                        ${this.renderWeightChart(weightHistory)}
                    </div>
                </div>

                <div class="weight-history">
                    <h4>Weight History</h4>
                    <div class="weight-records">
                        ${weightHistory.length > 0 ? 
                            weightHistory.slice(-10).reverse().map(record => `
                                <div class="weight-record">
                                    <div class="record-date">${this.formatDate(record.date)}</div>
                                    <div class="record-weight">${record.weight} kg</div>
                                    <div class="record-bcs">${record.body_condition_score ? 'BCS: ' + record.body_condition_score : ''}</div>
                                    <div class="record-notes">${record.notes || ''}</div>
                                </div>
                            `).join('') :
                            '<div class="empty-records">No weight records yet. Add the first one above!</div>'
                        }
                    </div>
                </div>
            </div>
        `;
    }

    renderWeightChart(weightHistory) {
        if (weightHistory.length < 2) {
            return `
                <div class="chart-placeholder">
                    <i class="fas fa-chart-line"></i>
                    <p>Add more weight records to see trends</p>
                </div>
            `;
        }

        // Simple ASCII-style chart for now (can be enhanced with Chart.js later)
        const weights = weightHistory.map(r => r.weight);
        const minWeight = Math.min(...weights);
        const maxWeight = Math.max(...weights);
        const range = maxWeight - minWeight;

        return `
            <div class="simple-chart">
                <div class="chart-info">
                    <div class="chart-stat">
                        <span class="label">Current:</span>
                        <span class="value">${weights[weights.length - 1]} kg</span>
                    </div>
                    <div class="chart-stat">
                        <span class="label">Change:</span>
                        <span class="value ${weights[weights.length - 1] > weights[0] ? 'positive' : 'negative'}">
                            ${weights.length > 1 ? (weights[weights.length - 1] - weights[0] > 0 ? '+' : '') + (weights[weights.length - 1] - weights[0]).toFixed(1) + ' kg' : '0 kg'}
                        </span>
                    </div>
                    <div class="chart-stat">
                        <span class="label">Records:</span>
                        <span class="value">${weightHistory.length}</span>
                    </div>
                </div>
                <div class="chart-visual">
                    ${weightHistory.map((record, index) => {
                        const height = range > 0 ? ((record.weight - minWeight) / range) * 100 : 50;
                        return `
                            <div class="chart-bar" style="height: ${height}%" title="${record.date}: ${record.weight}kg">
                                <div class="bar-value">${record.weight}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    switchHealthTab(tab, petId) {
        // Update active tab
        document.querySelectorAll('.health-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');

        const pet = this.pets.find(p => p.id == petId);
        const content = document.getElementById('health-tab-content');

        switch(tab) {
            case 'weight':
                content.innerHTML = this.renderWeightTracking(pet);
                break;
            case 'records':
                content.innerHTML = this.renderHealthRecords(pet);
                break;
            case 'medications':
                content.innerHTML = this.renderMedications(pet);
                break;
            case 'activity':
                content.innerHTML = this.renderActivityLog(pet);
                break;
        }
    }

    renderHealthRecords(pet) {
        const healthRecords = pet.health_records || [];
        
        return `
            <div class="health-records">
                <div class="records-actions">
                    <button class="btn btn-primary" onclick="app.showAddHealthRecord(${pet.id})">
                        <i class="fas fa-plus"></i> Add Health Record
                    </button>
                    <button class="btn btn-outline" onclick="app.exportHealthRecords(${pet.id})">
                        <i class="fas fa-download"></i> Export for Vet
                    </button>
                </div>

                <div class="records-list">
                    ${healthRecords.length > 0 ? 
                        healthRecords.reverse().map(record => `
                            <div class="health-record-card">
                                <div class="record-header">
                                    <div class="record-type">
                                        <i class="fas fa-${this.getHealthRecordIcon(record.type)}"></i>
                                        ${record.type.replace('_', ' ').toUpperCase()}
                                    </div>
                                    <div class="record-date">${this.formatDate(record.date)}</div>
                                </div>
                                <div class="record-content">
                                    <h5>${record.title}</h5>
                                    <p>${record.notes}</p>
                                    ${record.vet_name ? `<div class="vet-info">Vet: ${record.vet_name}</div>` : ''}
                                </div>
                            </div>
                        `).join('') :
                        '<div class="empty-records">No health records yet. Add the first one above!</div>'
                    }
                </div>
            </div>
        `;
    }

    renderMedications(pet) {
        const medications = pet.medications_list || [];
        
        return `
            <div class="medications">
                <div class="medications-actions">
                    <button class="btn btn-primary" onclick="app.showAddMedication(${pet.id})">
                        <i class="fas fa-plus"></i> Add Medication
                    </button>
                </div>

                <div class="medications-list">
                    ${medications.length > 0 ? 
                        medications.map(med => `
                            <div class="medication-card">
                                <div class="med-header">
                                    <h5>${med.name}</h5>
                                    <span class="med-status ${med.active ? 'active' : 'inactive'}">
                                        ${med.active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div class="med-details">
                                    <div class="med-dosage">Dosage: ${med.dosage}</div>
                                    <div class="med-frequency">Frequency: ${med.frequency}</div>
                                    <div class="med-duration">Duration: ${med.start_date} - ${med.end_date || 'Ongoing'}</div>
                                </div>
                                <div class="med-notes">${med.notes}</div>
                            </div>
                        `).join('') :
                        '<div class="empty-records">No medications recorded. Add medications above!</div>'
                    }
                </div>
            </div>
        `;
    }

    renderActivityLog(pet) {
        const activityLog = pet.activity_log || [];
        
        return `
            <div class="activity-log">
                <div class="activity-actions">
                    <button class="btn btn-primary" onclick="app.showAddActivity(${pet.id})">
                        <i class="fas fa-plus"></i> Log Activity
                    </button>
                </div>

                <div class="activity-list">
                    ${activityLog.length > 0 ? 
                        activityLog.slice(-20).reverse().map(activity => `
                            <div class="activity-record">
                                <div class="activity-header">
                                    <div class="activity-type">
                                        <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                                        ${activity.type.replace('_', ' ').toUpperCase()}
                                    </div>
                                    <div class="activity-date">${this.formatDate(activity.date)}</div>
                                </div>
                                <div class="activity-details">
                                    <div class="activity-duration">Duration: ${activity.duration} minutes</div>
                                    <div class="activity-intensity">Intensity: ${activity.intensity}</div>
                                    <div class="activity-notes">${activity.notes}</div>
                                </div>
                            </div>
                        `).join('') :
                        '<div class="empty-records">No activity logged yet. Start tracking above!</div>'
                    }
                </div>
            </div>
        `;
    }

    getHealthRecordIcon(type) {
        const icons = {
            'vet_visit': 'stethoscope',
            'vaccination': 'syringe',
            'medication': 'pills',
            'injury': 'band-aid',
            'illness': 'thermometer',
            'surgery': 'cut',
            'dental': 'tooth',
            'other': 'notes-medical'
        };
        return icons[type] || 'notes-medical';
    }

    getActivityIcon(type) {
        const icons = {
            'walk': 'walking',
            'run': 'running',
            'play': 'futbol',
            'swim': 'swimmer',
            'training': 'graduation-cap',
            'other': 'paw'
        };
        return icons[type] || 'paw';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    generateNutritionPlan() {
        alert('Nutrition plan generation feature coming soon!');
    }

    showAddWeightRecord(petId) {
        const pet = this.pets.find(p => p.id == petId);
        if (!pet) return;

        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h2>Log Weight for ${pet.name}</h2>
            <form onsubmit="app.handleAddWeightRecord(event, ${petId})" class="weight-form">
                <div class="form-group">
                    <label class="form-label">Date *</label>
                    <input type="date" class="form-input" name="date" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Weight (kg) *</label>
                        <input type="number" class="form-input" name="weight" step="0.1" min="0" value="${pet.weight}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Body Condition Score (1-9)</label>
                        <select class="form-select" name="body_condition_score">
                            <option value="">Select Score</option>
                            <option value="1">1 - Emaciated</option>
                            <option value="2">2 - Very Thin</option>
                            <option value="3">3 - Thin</option>
                            <option value="4">4 - Underweight</option>
                            <option value="5" ${pet.body_condition_score == 5 ? 'selected' : ''}>5 - Ideal</option>
                            <option value="6">6 - Slightly Overweight</option>
                            <option value="7">7 - Overweight</option>
                            <option value="8">8 - Obese</option>
                            <option value="9">9 - Severely Obese</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea class="form-textarea" name="notes" rows="3" placeholder="Any observations about weight change, diet, or health..."></textarea>
                </div>
                
                <div class="form-group">
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Log Weight</button>
                </div>
            </form>
        `;
        this.showModal();
    }

    async handleAddWeightRecord(event, petId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const weightData = {
            pet_id: petId,
            date: formData.get('date'),
            weight: parseFloat(formData.get('weight')),
            body_condition_score: formData.get('body_condition_score') ? parseInt(formData.get('body_condition_score')) : null,
            notes: formData.get('notes')
        };

        try {
            const response = await fetch('/api-bridge.php?action=add_weight_record', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(weightData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.closeModal();
                await this.loadPets(); // Refresh pet data
                // Refresh the health tab if it's currently showing
                const healthPetSelector = document.getElementById('health-pet-selector');
                if (healthPetSelector && healthPetSelector.value == petId) {
                    this.switchHealthPet(petId);
                }
                alert('Weight record added successfully!');
            } else {
                alert('Failed to add weight record: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Add weight record error:', error);
            alert('Failed to add weight record. Please try again.');
        }
    }

    showAddHealthRecord(petId = null) {
        const selectedPetId = petId || document.getElementById('health-pet-selector')?.value;
        if (!selectedPetId) {
            alert('Please select a pet first');
            return;
        }

        const pet = this.pets.find(p => p.id == selectedPetId);
        if (!pet) return;

        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h2>Add Health Record for ${pet.name}</h2>
            <form onsubmit="app.handleAddHealthRecord(event, ${selectedPetId})" class="health-record-form">
                <div class="form-group">
                    <label class="form-label">Record Type *</label>
                    <select class="form-select" name="type" required>
                        <option value="">Select Type</option>
                        <option value="vet_visit">Vet Visit</option>
                        <option value="vaccination">Vaccination</option>
                        <option value="medication">Medication</option>
                        <option value="injury">Injury</option>
                        <option value="illness">Illness</option>
                        <option value="surgery">Surgery</option>
                        <option value="dental">Dental Care</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Date *</label>
                        <input type="date" class="form-input" name="date" value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Veterinarian</label>
                        <input type="text" class="form-input" name="vet_name" placeholder="Dr. Smith">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Title/Summary *</label>
                    <input type="text" class="form-input" name="title" placeholder="e.g., Annual checkup, Rabies vaccination" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea class="form-textarea" name="notes" rows="4" placeholder="Detailed notes about the visit, treatment, or observations..."></textarea>
                </div>
                
                <div class="form-group">
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Add Health Record</button>
                </div>
            </form>
        `;
        this.showModal();
    }

    async handleAddHealthRecord(event, petId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const recordData = {
            pet_id: petId,
            type: formData.get('type'),
            date: formData.get('date'),
            title: formData.get('title'),
            notes: formData.get('notes'),
            vet_name: formData.get('vet_name')
        };

        try {
            const response = await fetch('/api-bridge.php?action=add_health_record', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(recordData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.closeModal();
                await this.loadPets(); // Refresh pet data
                // Refresh the health tab if it's currently showing
                const healthPetSelector = document.getElementById('health-pet-selector');
                if (healthPetSelector && healthPetSelector.value == petId) {
                    this.switchHealthPet(petId);
                }
                alert('Health record added successfully!');
            } else {
                alert('Failed to add health record: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Add health record error:', error);
            alert('Failed to add health record. Please try again.');
        }
    }

    async editPet(petId) {
        try {
            // Get pet data first
            const response = await fetch(`/api-bridge.php?action=get_pets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ pet_id: petId })
            });

            const data = await response.json();
            
            if (data.success && data.pet) {
                this.showEditPetForm(data.pet);
            } else {
                alert('Failed to load pet data');
            }
        } catch (error) {
            console.error('Error loading pet:', error);
            alert('Failed to load pet data');
        }
    }

    showEditPetForm(pet) {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h2>Edit Pet: ${pet.name}</h2>
            <form onsubmit="app.handleUpdatePet(event, ${pet.id})" class="pet-form">
                <div class="form-section">
                    <h3>Basic Information</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Pet Name *</label>
                            <input type="text" class="form-input" name="name" value="${pet.name}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Gender</label>
                            <select class="form-select" name="gender">
                                <option value="">Select Gender</option>
                                <option value="male" ${pet.gender === 'male' ? 'selected' : ''}>Male</option>
                                <option value="female" ${pet.gender === 'female' ? 'selected' : ''}>Female</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Species *</label>
                            <select class="form-select" name="species" required>
                                <option value="dog" ${pet.species === 'dog' ? 'selected' : ''}>Dog</option>
                                <option value="cat" ${pet.species === 'cat' ? 'selected' : ''}>Cat</option>
                                <option value="rabbit" ${pet.species === 'rabbit' ? 'selected' : ''}>Rabbit</option>
                                <option value="bird" ${pet.species === 'bird' ? 'selected' : ''}>Bird</option>
                                <option value="fish" ${pet.species === 'fish' ? 'selected' : ''}>Fish</option>
                                <option value="reptile" ${pet.species === 'reptile' ? 'selected' : ''}>Reptile</option>
                                <option value="other" ${pet.species === 'other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Breed</label>
                            <input type="text" class="form-input" name="breed" value="${pet.breed || ''}" placeholder="e.g., Golden Retriever">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>Physical Information</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Age (years) *</label>
                            <input type="number" class="form-input" name="age" min="0" max="30" step="0.1" value="${pet.age}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Current Weight (kg) *</label>
                            <input type="number" class="form-input" name="weight" step="0.1" min="0" value="${pet.weight}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Ideal Weight (kg)</label>
                            <input type="number" class="form-input" name="ideal_weight" step="0.1" min="0" value="${pet.ideal_weight || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Body Condition Score (1-9)</label>
                            <select class="form-select" name="body_condition_score">
                                <option value="">Select Score</option>
                                ${[1,2,3,4,5,6,7,8,9].map(score => 
                                    `<option value="${score}" ${pet.body_condition_score == score ? 'selected' : ''}>${score} - ${this.getBodyConditionLabel(score)}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>Activity & Health</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Activity Level *</label>
                            <select class="form-select" name="activity_level" required>
                                <option value="low" ${pet.activity_level === 'low' ? 'selected' : ''}>Low - Sedentary, minimal exercise</option>
                                <option value="medium" ${pet.activity_level === 'medium' ? 'selected' : ''}>Medium - Regular walks/play</option>
                                <option value="high" ${pet.activity_level === 'high' ? 'selected' : ''}>High - Very active, lots of exercise</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Spayed/Neutered</label>
                            <select class="form-select" name="spayed_neutered">
                                <option value="">Select Status</option>
                                <option value="yes" ${pet.spayed_neutered === 'yes' ? 'selected' : ''}>Yes</option>
                                <option value="no" ${pet.spayed_neutered === 'no' ? 'selected' : ''}>No</option>
                                <option value="unknown" ${pet.spayed_neutered === 'unknown' ? 'selected' : ''}>Unknown</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Medical Conditions</label>
                        <textarea class="form-textarea" name="medical_conditions" rows="2" placeholder="List any known medical conditions, allergies, or health concerns">${pet.medical_conditions || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Current Medications</label>
                        <textarea class="form-textarea" name="medications" rows="2" placeholder="List current medications and dosages">${pet.medications || ''}</textarea>
                    </div>
                </div>

                <div class="form-section">
                    <h3>Additional Notes</h3>
                    <div class="form-group">
                        <label class="form-label">Personality & Behavior</label>
                        <textarea class="form-textarea" name="personality" rows="2" placeholder="Describe your pet's personality, behavior, and preferences">${pet.personality || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Special Dietary Needs</label>
                        <textarea class="form-textarea" name="dietary_notes" rows="2" placeholder="Any special dietary requirements, food allergies, or feeding preferences">${pet.dietary_notes || ''}</textarea>
                    </div>
                </div>

                <div class="form-group">
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Update Pet</button>
                </div>
            </form>
        `;
        this.showModal();
    }

    getBodyConditionLabel(score) {
        const labels = {
            1: 'Emaciated', 2: 'Very Thin', 3: 'Thin', 4: 'Underweight', 5: 'Ideal',
            6: 'Slightly Overweight', 7: 'Overweight', 8: 'Obese', 9: 'Severely Obese'
        };
        return labels[score] || '';
    }

    async handleUpdatePet(event, petId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const petData = {
            pet_id: petId,
            name: formData.get('name'),
            species: formData.get('species'),
            breed: formData.get('breed'),
            gender: formData.get('gender'),
            age: parseFloat(formData.get('age')),
            weight: parseFloat(formData.get('weight')),
            ideal_weight: formData.get('ideal_weight') ? parseFloat(formData.get('ideal_weight')) : null,
            body_condition_score: formData.get('body_condition_score') ? parseInt(formData.get('body_condition_score')) : null,
            activity_level: formData.get('activity_level'),
            spayed_neutered: formData.get('spayed_neutered'),
            medical_conditions: formData.get('medical_conditions'),
            medications: formData.get('medications'),
            personality: formData.get('personality'),
            dietary_notes: formData.get('dietary_notes')
        };

        try {
            const response = await fetch('/api-bridge.php?action=update_pet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(petData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.closeModal();
                await this.loadPets();
                alert('Pet updated successfully!');
            } else {
                alert('Failed to update pet: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Update pet error:', error);
            alert('Failed to update pet. Please try again.');
        }
    }

    async deletePet(petId) {
        if (!confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/api-bridge.php?action=delete_pet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ pet_id: petId })
            });

            const data = await response.json();
            
            if (data.success) {
                await this.loadPets();
                alert('Pet deleted successfully');
            } else {
                alert('Failed to delete pet: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Delete pet error:', error);
            alert('Failed to delete pet. Please try again.');
        }
    }

    showDemo() {
        alert('Demo feature coming soon!');
    }

    // User Menu Management
    toggleUserMenu() {
        const userMenu = document.getElementById('user-menu');
        if (userMenu) {
            userMenu.classList.toggle('show');
        }
    }

    // User Profile Management
    showUserProfile() {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h2>User Profile</h2>
            <form onsubmit="app.handleUpdateProfile(event)">
                <div class="form-group">
                    <label class="form-label">First Name</label>
                    <input type="text" class="form-input" name="first_name" value="${this.currentUser?.first_name || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Last Name</label>
                    <input type="text" class="form-input" name="last_name" value="${this.currentUser?.last_name || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" name="email" value="${this.currentUser?.email || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">New Password (leave blank to keep current)</label>
                    <input type="password" class="form-input" name="password" placeholder="Enter new password">
                </div>
                <div class="form-group">
                    <label class="form-label">Confirm New Password</label>
                    <input type="password" class="form-input" name="confirm_password" placeholder="Confirm new password">
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Update Profile</button>
                </div>
            </form>
        `;
        this.showModal();
    }

    async handleUpdateProfile(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        // Validate password confirmation
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm_password');
        
        if (password && password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        const profileData = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email')
        };
        
        // Only include password if provided
        if (password) {
            profileData.password = password;
        }

        try {
            const response = await fetch('/api-bridge.php?action=update_profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.closeModal();
                alert('Profile updated successfully!');
                // Refresh the page to show updated user info
                window.location.reload();
            } else {
                alert('Failed to update profile: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Profile update error:', error);
            alert('Failed to update profile. Please try again.');
        }
    }

    // Reports
    generateReport() {
        alert('Report generation feature coming soon!');
    }
}

// Global functions for onclick handlers
function showLogin() { app.showLogin(); }
function showRegister() { app.showRegister(); }
function showDemo() { app.showDemo(); }
function closeModal() { app.closeModal(); }
function logout() { app.logout(); }
function showAddPet() { app.showAddPet(); }
function showUserProfile() { app.showUserProfile(); }
function showAddHealthRecord() { app.showAddHealthRecord(); }
function switchTab(tab) { app.switchTab(tab); }
function generateNutritionPlan() { app.generateNutritionPlan(); }
function showAddHealthRecord() { app.showAddHealthRecord(); }
function toggleUserMenu() { app.toggleUserMenu(); }
function generateReport() { app.generateReport(); }

// Contact form handler
function handleContactForm(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Simulate form submission
    alert(`Thank you ${formData.get('name')}! Your message has been sent. We'll get back to you soon.`);
    event.target.reset();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new ANMSApp();
});