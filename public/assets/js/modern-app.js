/**
 * Modern PetNutri Application
 * Main application class that orchestrates the entire frontend
 */
class PetNutriApp {
    constructor() {
        // Initialize core components
        this.apiClient = new APIClient();
        this.authManager = new AuthManager(this.apiClient);
        this.sessionManager = new SessionManager(this.apiClient, this.authManager);
        this.securityManager = new SecurityManager();
        this.ui = new UIComponents();
        
        // App state
        this.currentPage = 'landing';
        this.pets = [];
        this.selectedPet = null;
        this.isInitialized = false;
        
        // Bind methods to maintain context
        this.handleGlobalClick = this.handleGlobalClick.bind(this);
        this.handleGlobalSubmit = this.handleGlobalSubmit.bind(this);
        this.handleAuthStateChange = this.handleAuthStateChange.bind(this);
        
        // Initialize the application
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Show loading screen
            this.ui.showLoading(true, 'Initializing PetNutri...');
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup auth listeners
            this.authManager.on('auth-change', this.handleAuthStateChange);
            this.authManager.on('login', this.handleLogin.bind(this));
            this.authManager.on('logout', this.handleLogout.bind(this));
            
            // Check authentication status
            const isAuthenticated = await this.authManager.checkAuthStatus();
            
            // Initialize UI based on auth status
            if (isAuthenticated) {
                await this.loadUserData();
                this.showDashboard();
            } else {
                this.showLandingPage();
            }
            
            // Start auto-refresh for tokens
            this.authManager.startAutoRefresh();
            
            // Mark as initialized
            this.isInitialized = true;
            
            // Hide loading screen
            setTimeout(() => {
                this.ui.showLoading(false);
            }, 1000); // Give a moment for smooth transition
            
        } catch (error) {
            console.error('App initialization failed:', error);
            this.ui.showError('Failed to initialize application. Please refresh the page.');
            this.ui.showLoading(false);
        }
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Global click handler
        document.addEventListener('click', this.handleGlobalClick);
        
        // Global form submit handler
        document.addEventListener('submit', this.handleGlobalSubmit);
        
        // Handle browser back/forward
        window.addEventListener('popstate', this.handlePopState.bind(this));
        
        // Handle scroll for navbar effects
        window.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Handle resize for responsive features
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
        
        // Handle visibility change for performance
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    /**
     * Handle global click events
     * @param {Event} event - Click event
     */
    handleGlobalClick(event) {
        const target = event.target.closest('[data-action]');
        if (!target) return;
        
        event.preventDefault();
        
        const action = target.dataset.action;
        const data = target.dataset;
        
        // Handle authentication actions
        switch (action) {
            case 'show-login':
                this.showLoginModal();
                break;
            case 'show-register':
                this.showRegisterModal();
                break;
            case 'forgot-password':
                this.showForgotPasswordModal();
                break;
            case 'logout':
                this.handleLogoutClick();
                break;
                
            // Navigation actions
            case 'nav-dashboard':
                this.showDashboard();
                break;
            case 'nav-pets':
                this.showPetsPage();
                break;
            case 'nav-nutrition':
                this.showNutritionPage();
                break;
            case 'nav-health':
                this.showHealthPage();
                break;
                
            // Pet management actions
            case 'add-pet':
                this.showAddPetModal();
                break;
            case 'view-pet':
                this.viewPet(data.petId);
                break;
            case 'edit-pet':
                this.editPet(data.petId);
                break;
            case 'delete-pet':
                this.confirmDeletePet(data.petId);
                break;
                
            // Modal actions
            case 'close-modal':
                this.ui.closeModal();
                break;
                
            // Notification actions
            case 'close-notification':
                this.ui.hideNotification(parseInt(data.id));
                break;
                
            // UI actions
            case 'toggle-password':
                this.ui.togglePasswordVisibility(data.target);
                break;
            case 'mobile-menu-toggle':
                this.toggleMobileMenu();
                break;
                
            // Demo actions
            case 'watch-demo':
                this.showDemo();
                break;
            case 'show-features':
                this.scrollToFeatures();
                break;
            case 'contact-sales':
                this.showContactModal();
                break;
                
            default:
                console.log('Unhandled action:', action, data);
        }
    }

    /**
     * Handle global form submissions
     * @param {Event} event - Submit event
     */
    async handleGlobalSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const action = form.dataset.action;
        
        if (!action) return;
        
        // Validate form
        if (!this.ui.validateForm(form)) {
            return;
        }
        
        try {
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';
            
            // Handle form submission based on action
            switch (action) {
                case 'login':
                    await this.handleLoginSubmit(form);
                    break;
                case 'register':
                    await this.handleRegisterSubmit(form);
                    break;
                case 'forgot-password':
                    await this.handleForgotPasswordSubmit(form);
                    break;
                case 'add-pet':
                    await this.handleAddPetSubmit(form);
                    break;
                case 'contact':
                    await this.handleContactSubmit(form);
                    break;
                default:
                    console.log('Unhandled form action:', action);
            }
            
            // Restore button state
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            
        } catch (error) {
            console.error('Form submission failed:', error);
            this.ui.showError(error.message || 'Form submission failed');
            
            // Restore button state
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.dataset.originalText || 'Submit';
            }
        }
    }

    // ============================================================
    // Authentication Handlers
    // ============================================================

    /**
     * Handle authentication state changes
     * @param {Object} authState - Authentication state
     */
    handleAuthStateChange(authState) {
        if (authState.isAuthenticated) {
            this.loadUserData();
        } else {
            this.pets = [];
            this.selectedPet = null;
            if (this.currentPage !== 'landing') {
                this.showLandingPage();
            }
        }
    }

    /**
     * Handle successful login
     * @param {Object} user - User object
     */
    handleLogin(user) {
        this.ui.closeAllModals();
        this.ui.showSuccess(`Welcome back, ${user.first_name || user.name}!`);
        this.showDashboard();
    }

    /**
     * Handle logout
     */
    handleLogout() {
        this.ui.showSuccess('You have been logged out successfully');
        this.showLandingPage();
    }

    /**
     * Handle logout click
     */
    async handleLogoutClick() {
        try {
            await this.authManager.logout();
        } catch (error) {
            console.error('Logout failed:', error);
            this.ui.showError('Logout failed');
        }
    }

    /**
     * Handle login form submission
     * @param {HTMLFormElement} form - Login form
     */
    async handleLoginSubmit(form) {
        const identifier = this.securityManager.getClientIdentifier();
        
        try {
            // Validate form using enhanced validator
            if (window.authFormValidator && !window.authFormValidator.isFormValid(form)) {
                return;
            }

            // Security validation
            await this.securityManager.validateRequest('/api.php?action=login', { action: 'login' });

            // Show loading state
            this.setFormLoading(form, true);

            const formData = new FormData(form);
            const email = formData.get('email');
            const password = formData.get('password');
            const remember = formData.get('remember');

            // Validate password strength for additional security
            const passwordValidation = this.securityManager.validatePasswordStrength(password);
            if (!passwordValidation.isValid) {
                throw new Error('Password does not meet security requirements');
            }

            // Attempt login
            const result = await this.authManager.login(email, password);
            
            if (result.success) {
                // Handle successful login
                this.securityManager.handleSuccessfulLogin(identifier);
                
                // Handle remember me functionality
                if (remember) {
                    localStorage.setItem('petnutri_remember_user', 'true');
                }
                
                this.ui.showSuccess(`Welcome back, ${result.user.first_name || result.user.name}!`);
            }

        } catch (error) {
            console.error('Login failed:', error);
            
            // Handle failed login attempt
            this.securityManager.handleFailedLogin(identifier);
            
            // Show specific error messages
            let errorMessage = 'Login failed. Please try again.';
            
            if (error.message.includes('Too many requests')) {
                errorMessage = 'Too many login attempts. Please wait before trying again.';
            } else if (error.message.includes('CAPTCHA')) {
                errorMessage = 'Security verification failed. Please try again.';
            } else if (error.message.includes('Account is temporarily locked')) {
                errorMessage = error.message;
            } else if (error.message.includes('Invalid credentials') || error.message.includes('Invalid email or password')) {
                errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            } else if (error.message.includes('Account locked')) {
                errorMessage = 'Your account has been temporarily locked due to multiple failed login attempts. Please try again later.';
            } else if (error.message.includes('Email not verified')) {
                errorMessage = 'Please verify your email address before logging in. Check your inbox for a verification link.';
            } else if (error.message.includes('Network')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            }
            
            this.ui.showError(errorMessage);
            
            // Focus back to email field for retry
            const emailField = form.querySelector('input[name="email"]');
            if (emailField) {
                emailField.focus();
            }
            
        } finally {
            // Hide loading state
            this.setFormLoading(form, false);
        }
    }

    /**
     * Handle registration form submission
     * @param {HTMLFormElement} form - Registration form
     */
    async handleRegisterSubmit(form) {
        const identifier = this.securityManager.getClientIdentifier();
        
        try {
            // Validate form using enhanced validator
            if (window.authFormValidator && !window.authFormValidator.isFormValid(form)) {
                return;
            }

            // Security validation
            await this.securityManager.validateRequest('/api.php?action=register', { action: 'register' });

            // Show loading state
            this.setFormLoading(form, true);

            const formData = new FormData(form);
            const userData = {
                first_name: formData.get('first_name'),
                last_name: formData.get('last_name'),
                email: formData.get('email'),
                password: formData.get('password'),
                password_confirmation: formData.get('password_confirmation')
            };

            // Enhanced password validation
            const passwordValidation = this.securityManager.validatePasswordStrength(userData.password);
            if (!passwordValidation.isValid) {
                throw new Error(`Password is too weak. ${passwordValidation.requirements.minLength ? '' : 'Must be at least 8 characters. '}${passwordValidation.requirements.hasUppercase ? '' : 'Must include uppercase letters. '}${passwordValidation.requirements.hasLowercase ? '' : 'Must include lowercase letters. '}${passwordValidation.requirements.hasNumbers ? '' : 'Must include numbers. '}${passwordValidation.requirements.hasSpecialChars ? '' : 'Must include special characters.'}`);
            }

            // Attempt registration
            const result = await this.authManager.register(userData);
            
            if (result.success) {
                this.ui.showSuccess('Account created successfully! Welcome to PetNutri!');
                
                // Close modal and show dashboard
                this.ui.closeAllModals();
                setTimeout(() => {
                    this.showDashboard();
                }, 1000);
            }

        } catch (error) {
            console.error('Registration failed:', error);
            
            // Show specific error messages
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error.message.includes('Too many requests')) {
                errorMessage = 'Too many registration attempts. Please wait before trying again.';
            } else if (error.message.includes('Password is too weak')) {
                errorMessage = error.message;
            } else if (error.message.includes('Email already exists') || error.message.includes('already registered')) {
                errorMessage = 'An account with this email already exists. Please try logging in instead.';
            } else if (error.message.includes('Invalid email')) {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.message.includes('Network')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (error.message.includes('validation')) {
                errorMessage = 'Please check your information and try again. Make sure all required fields are filled correctly.';
            }
            
            this.ui.showError(errorMessage);
            
            // Focus back to first name field for retry
            const firstNameField = form.querySelector('input[name="first_name"]');
            if (firstNameField) {
                firstNameField.focus();
            }
            
        } finally {
            // Hide loading state
            this.setFormLoading(form, false);
        }
    }

    /**
     * Handle forgot password form submission
     * @param {HTMLFormElement} form - Forgot password form
     */
    async handleForgotPasswordSubmit(form) {
        try {
            // Validate form using enhanced validator
            if (window.authFormValidator && !window.authFormValidator.isFormValid(form)) {
                return;
            }

            // Show loading state
            this.setFormLoading(form, true);

            const formData = new FormData(form);
            const email = formData.get('email');

            // Attempt password reset request
            const result = await this.authManager.requestPasswordReset(email);
            
            if (result.success) {
                this.ui.showSuccess('Password reset link sent! Please check your email for instructions.');
                
                // Close modal after success
                setTimeout(() => {
                    this.ui.closeAllModals();
                }, 2000);
            }

        } catch (error) {
            console.error('Password reset request failed:', error);
            
            // Show specific error messages
            let errorMessage = 'Failed to send reset link. Please try again.';
            
            if (error.message.includes('Email not found') || error.message.includes('not registered')) {
                errorMessage = 'No account found with this email address. Please check your email or create a new account.';
            } else if (error.message.includes('Rate limit')) {
                errorMessage = 'Too many reset requests. Please wait a few minutes before trying again.';
            } else if (error.message.includes('Invalid email')) {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.message.includes('Network')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            }
            
            this.ui.showError(errorMessage);
            
            // Focus back to email field for retry
            const emailField = form.querySelector('input[name="email"]');
            if (emailField) {
                emailField.focus();
            }
            
        } finally {
            // Hide loading state
            this.setFormLoading(form, false);
        }
    }

    // ============================================================
    // Page Navigation
    // ============================================================

    /**
     * Show landing page
     */
    showLandingPage() {
        this.currentPage = 'landing';
        const app = document.getElementById('app');
        
        // Landing page is already in the DOM, just show it
        const landingPage = app.querySelector('.landing-page');
        if (landingPage) {
            landingPage.style.display = 'block';
        }
        
        // Update URL
        this.updateURL('/');
    }

    /**
     * Show dashboard page
     */
    async showDashboard() {
        try {
            this.currentPage = 'dashboard';
            
            // Load pets if not already loaded
            if (this.pets.length === 0) {
                await this.loadPets();
            }
            
            const user = this.authManager.getCurrentUser();
            const dashboardHTML = this.renderDashboard(user, this.pets);
            
            document.getElementById('app').innerHTML = dashboardHTML;
            
            // Update URL
            this.updateURL('/dashboard');
            
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            this.ui.showError('Failed to load dashboard');
        }
    }

    /**
     * Show pets page
     */
    async showPetsPage() {
        try {
            this.currentPage = 'pets';
            
            await this.loadPets();
            const petsHTML = this.renderPetsPage(this.pets);
            
            document.getElementById('app').innerHTML = petsHTML;
            
            this.updateURL('/pets');
            
        } catch (error) {
            console.error('Failed to load pets page:', error);
            this.ui.showError('Failed to load pets page');
        }
    }

    /**
     * Show nutrition page
     */
    async showNutritionPage() {
        try {
            this.currentPage = 'nutrition';
            
            await this.loadPets();
            const nutritionHTML = this.renderNutritionPage(this.pets, this.selectedPet);
            
            document.getElementById('app').innerHTML = nutritionHTML;
            
            this.updateURL('/nutrition');
            
        } catch (error) {
            console.error('Failed to load nutrition page:', error);
            this.ui.showError('Failed to load nutrition page');
        }
    }

    /**
     * Show health page
     */
    async showHealthPage() {
        try {
            this.currentPage = 'health';
            
            await this.loadPets();
            const healthHTML = this.renderHealthPage(this.pets, this.selectedPet);
            
            document.getElementById('app').innerHTML = healthHTML;
            
            this.updateURL('/health');
            
        } catch (error) {
            console.error('Failed to load health page:', error);
            this.ui.showError('Failed to load health page');
        }
    }

    // ============================================================
    // Data Loading
    // ============================================================

    /**
     * Load user data
     */
    async loadUserData() {
        try {
            await this.loadPets();
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    /**
     * Load pets from API
     */
    async loadPets() {
        try {
            this.pets = await this.apiClient.getPets();
        } catch (error) {
            console.error('Failed to load pets:', error);
            throw error;
        }
    }

    // ============================================================
    // Pet Management
    // ============================================================

    /**
     * Handle add pet form submission
     * @param {HTMLFormElement} form - Add pet form
     */
    async handleAddPetSubmit(form) {
        const formData = new FormData(form);
        const petData = Object.fromEntries(formData.entries());
        
        const result = await this.apiClient.addPet(petData);
        
        if (result.success || result.pet) {
            this.ui.closeModal();
            this.ui.showSuccess(`${petData.name} has been added to your pets!`);
            
            // Reload pets and refresh current page
            await this.loadPets();
            this.refreshCurrentPage();
        }
    }

    /**
     * View pet details
     * @param {string} petId - Pet ID
     */
    async viewPet(petId) {
        try {
            const pet = this.pets.find(p => p.id == petId);
            if (!pet) {
                throw new Error('Pet not found');
            }
            
            this.selectedPet = pet;
            const petDetailsHTML = this.renderPetDetails(pet);
            
            const modal = this.ui.createModal(
                `${pet.name} - Pet Profile`,
                petDetailsHTML,
                'large'
            );
            
        } catch (error) {
            console.error('Failed to view pet:', error);
            this.ui.showError('Failed to load pet details');
        }
    }

    /**
     * Edit pet
     * @param {string} petId - Pet ID
     */
    async editPet(petId) {
        try {
            const pet = this.pets.find(p => p.id == petId);
            if (!pet) {
                throw new Error('Pet not found');
            }
            
            const editFormHTML = this.renderEditPetForm(pet);
            
            const modal = this.ui.createModal(
                `Edit ${pet.name}`,
                editFormHTML,
                'medium'
            );
            
        } catch (error) {
            console.error('Failed to edit pet:', error);
            this.ui.showError('Failed to load pet for editing');
        }
    }

    /**
     * Confirm delete pet
     * @param {string} petId - Pet ID
     */
    confirmDeletePet(petId) {
        const pet = this.pets.find(p => p.id == petId);
        if (!pet) return;
        
        const confirmHTML = `
            <div class="confirm-dialog">
                <div class="confirm-icon">!</div>
                <h3>Delete ${pet.name}?</h3>
                <p>This action cannot be undone. All of ${pet.name}'s data including health records, nutrition plans, and photos will be permanently deleted.</p>
                <div class="confirm-actions">
                    <button class="btn btn--secondary" data-action="close-modal">Cancel</button>
                    <button class="btn btn--danger" onclick="window.petNutriApp.deletePet('${petId}')">Delete Pet</button>
                </div>
            </div>
        `;
        
        this.ui.createModal('Confirm Deletion', confirmHTML, 'small');
    }

    /**
     * Delete pet
     * @param {string} petId - Pet ID
     */
    async deletePet(petId) {
        try {
            const pet = this.pets.find(p => p.id == petId);
            if (!pet) return;
            
            await this.apiClient.deletePet(petId);
            
            this.ui.closeModal();
            this.ui.showSuccess(`${pet.name} has been removed from your pets`);
            
            // Reload pets and refresh current page
            await this.loadPets();
            this.refreshCurrentPage();
            
        } catch (error) {
            console.error('Failed to delete pet:', error);
            this.ui.showError('Failed to delete pet');
        }
    }

    // ============================================================
    // Modal Handlers
    // ============================================================

    /**
     * Show login modal
     */
    showLoginModal() {
        const loginHTML = this.ui.createLoginForm();
        this.ui.createModal('Sign In to PetNutri', loginHTML, 'small');
    }

    /**
     * Show registration modal
     */
    showRegisterModal() {
        const registerHTML = this.ui.createRegistrationForm();
        this.ui.createModal('Create Your PetNutri Account', registerHTML, 'medium');
    }

    /**
     * Show forgot password modal
     */
    showForgotPasswordModal() {
        const forgotPasswordHTML = this.ui.createForgotPasswordForm();
        this.ui.createModal('Reset Your Password', forgotPasswordHTML, 'small');
    }

    /**
     * Show add pet modal
     */
    showAddPetModal() {
        if (!this.authManager.isAuthenticated()) {
            this.showLoginModal();
            return;
        }
        
        const addPetHTML = this.ui.createAddPetForm();
        this.ui.createModal('Add New Pet', addPetHTML, 'medium');
    }

    /**
     * Show demo modal
     */
    showDemo() {
        const demoHTML = `
            <div class="demo-content">
                <div class="demo-video">
                    <div class="video-placeholder">
                        <div class="play-button">PLAY</div>
                        <p>Demo Video</p>
                        <small>See PetNutri in action</small>
                    </div>
                </div>
                <div class="demo-features">
                    <h4>In this demo, you'll see:</h4>
                    <ul>
                        <li>✓ How to create your first pet profile</li>
                        <li>✓ Generating a custom nutrition plan</li>
                        <li>✓ Tracking health and weight progress</li>
                        <li>✓ Collaborating with your veterinarian</li>
                    </ul>
                </div>
            </div>
        `;
        
        this.ui.createModal('PetNutri Demo', demoHTML, 'large');
    }

    /**
     * Show contact modal
     */
    showContactModal() {
        const contactHTML = `
            <form class="form" data-action="contact">
                <div class="form-group">
                    <label for="contact-name" class="form-label">Name</label>
                    <input type="text" id="contact-name" name="name" class="form-input" required>
                </div>
                <div class="form-group">
                    <label for="contact-email" class="form-label">Email</label>
                    <input type="email" id="contact-email" name="email" class="form-input" required>
                </div>
                <div class="form-group">
                    <label for="contact-message" class="form-label">Message</label>
                    <textarea id="contact-message" name="message" class="form-textarea" rows="4" required></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn--secondary" data-action="close-modal">Cancel</button>
                    <button type="submit" class="btn btn--primary">Send Message</button>
                </div>
            </form>
        `;
        
        this.ui.createModal('Contact Sales', contactHTML, 'medium');
    }

    // ============================================================
    // Render Methods
    // ============================================================

    /**
     * Render dashboard
     * @param {Object} user - User object
     * @param {Array} pets - Pets array
     * @returns {string} Dashboard HTML
     */
    renderDashboard(user, pets) {
        return `
            <div class="app-layout">
                ${this.renderHeader('Dashboard', 'Welcome back to your pet care hub')}
                ${this.renderSidebar()}
                <main class="main-content">
                    <div class="dashboard">
                        ${this.renderWelcomeBanner(user, pets)}
                        ${this.renderDashboardStats(pets)}
                        ${this.renderRecentActivity()}
                        ${this.renderQuickActions()}
                    </div>
                </main>
            </div>
        `;
    }

    /**
     * Render pets page
     * @param {Array} pets - Pets array
     * @returns {string} Pets page HTML
     */
    renderPetsPage(pets) {
        return `
            <div class="app-layout">
                ${this.renderHeader('My Pets', 'Manage your beloved companions')}
                ${this.renderSidebar()}
                <main class="main-content">
                    <div class="pets-page">
                        <div class="page-actions">
                            <button class="btn btn--primary" data-action="add-pet">
                                <span>+</span> Add New Pet
                            </button>
                        </div>
                        ${this.renderPetsGrid(pets)}
                    </div>
                </main>
            </div>
        `;
    }

    /**
     * Render sidebar navigation
     * @returns {string} Sidebar HTML
     */
    renderSidebar() {
        const user = this.authManager.getCurrentUser();
        
        return `
            <aside class="sidebar">
                <div class="sidebar-header">
                    <div class="brand-logo">
                        <span class="brand-icon">PetCare</span>
                        <span class="brand-text">Pro</span>
                    </div>
                </div>
                
                <nav class="sidebar-nav">
                    <a href="#" class="nav-item ${this.currentPage === 'dashboard' ? 'nav-item--active' : ''}" data-action="nav-dashboard">
                        <span class="nav-icon">D</span>
                        <span class="nav-text">Dashboard</span>
                    </a>
                    <a href="#" class="nav-item ${this.currentPage === 'pets' ? 'nav-item--active' : ''}" data-action="nav-pets">
                        <span class="nav-icon">P</span>
                        <span class="nav-text">My Pets</span>
                    </a>
                    <a href="#" class="nav-item ${this.currentPage === 'nutrition' ? 'nav-item--active' : ''}" data-action="nav-nutrition">
                        <span class="nav-icon">N</span>
                        <span class="nav-text">Nutrition</span>
                    </a>
                    <a href="#" class="nav-item ${this.currentPage === 'health' ? 'nav-item--active' : ''}" data-action="nav-health">
                        <span class="nav-icon">H</span>
                        <span class="nav-text">Health</span>
                    </a>
                </nav>
                
                <div class="sidebar-footer">
                    <div class="user-info">
                        <div class="user-avatar">${(user?.first_name || user?.name || 'U').charAt(0)}</div>
                        <div class="user-details">
                            <div class="user-name">${user?.first_name || user?.name || 'User'}</div>
                            <div class="user-email">${user?.email || ''}</div>
                        </div>
                    </div>
                    <button class="btn btn--ghost btn--small" data-action="logout">
                        Sign Out
                    </button>
                </div>
            </aside>
        `;
    }

    /**
     * Render header
     * @param {string} title - Page title
     * @param {string} subtitle - Page subtitle
     * @returns {string} Header HTML
     */
    renderHeader(title, subtitle) {
        return `
            <header class="app-header">
                <div class="header-content">
                    <div class="header-text">
                        <h1 class="header-title">${title}</h1>
                        <p class="header-subtitle">${subtitle}</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn--secondary" data-action="add-pet">
                            <span>+</span> Add Pet
                        </button>
                    </div>
                </div>
            </header>
        `;
    }

    /**
     * Render welcome banner
     * @param {Object} user - User object
     * @param {Array} pets - Pets array
     * @returns {string} Welcome banner HTML
     */
    renderWelcomeBanner(user, pets) {
        const userName = user?.first_name || user?.name || 'there';
        
        return `
            <div class="welcome-banner">
                <div class="welcome-content">
                    <h2>Welcome back, ${userName}! 👋</h2>
                    <p>You have ${pets.length} ${pets.length === 1 ? 'pet' : 'pets'} in your care</p>
                </div>
                <div class="welcome-visual">
                    <div class="pet-icons">
                        ${pets.slice(0, 3).map(pet => `<span class="pet-icon">${this.getPetIcon(pet.species)}</span>`).join('')}
                        ${pets.length > 3 ? `<span class="pet-count">+${pets.length - 3}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render dashboard stats
     * @param {Array} pets - Pets array
     * @returns {string} Dashboard stats HTML
     */
    renderDashboardStats(pets) {
        const healthyPets = pets.filter(pet => pet.health_status === 'healthy').length;
        
        return `
            <div class="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-icon">PETS</div>
                    <div class="stat-info">
                        <div class="stat-value">${pets.length}</div>
                        <div class="stat-label">Total Pets</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">HEALTHY</div>
                    <div class="stat-info">
                        <div class="stat-value">${healthyPets}</div>
                        <div class="stat-label">Healthy Pets</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">STREAK</div>
                    <div class="stat-info">
                        <div class="stat-value">7</div>
                        <div class="stat-label">Day Streak</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">GOAL</div>
                    <div class="stat-info">
                        <div class="stat-value">95%</div>
                        <div class="stat-label">Goal Progress</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render recent activity
     * @returns {string} Recent activity HTML
     */
    renderRecentActivity() {
        return `
            <div class="recent-activity">
                <h3>Recent Activity</h3>
                <div class="activity-list">
                    <div class="activity-item">
                        <div class="activity-icon">M</div>
                        <div class="activity-content">
                            <div class="activity-text">Fed Buddy breakfast</div>
                            <div class="activity-time">2 hours ago</div>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon">W</div>
                        <div class="activity-content">
                            <div class="activity-text">Recorded Whiskers' weight</div>
                            <div class="activity-time">Yesterday</div>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon">H</div>
                        <div class="activity-content">
                            <div class="activity-text">Updated Charlie's nutrition plan</div>
                            <div class="activity-time">2 days ago</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render quick actions
     * @returns {string} Quick actions HTML
     */
    renderQuickActions() {
        return `
            <div class="quick-actions">
                <h3>Quick Actions</h3>
                <div class="actions-grid">
                    <button class="action-card" data-action="add-pet">
                        <div class="action-icon">+</div>
                        <div class="action-text">Add Pet</div>
                    </button>
                    <button class="action-card" data-action="log-weight">
                        <div class="action-icon">W</div>
                        <div class="action-text">Log Weight</div>
                    </button>
                    <button class="action-card" data-action="schedule-meal">
                        <div class="action-icon">M</div>
                        <div class="action-text">Schedule Meal</div>
                    </button>
                    <button class="action-card" data-action="health-checkup">
                        <div class="action-icon">H</div>
                        <div class="action-text">Health Checkup</div>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render pets grid
     * @param {Array} pets - Pets array
     * @returns {string} Pets grid HTML
     */
    renderPetsGrid(pets) {
        if (pets.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">PET</div>
                    <h3>No pets yet</h3>
                    <p>Add your first pet to get started with personalized nutrition and health tracking.</p>
                    <button class="btn btn--primary" data-action="add-pet">Add Your First Pet</button>
                </div>
            `;
        }
        
        return `
            <div class="pets-grid">
                ${pets.map(pet => this.renderPetCard(pet)).join('')}
            </div>
        `;
    }

    /**
     * Render pet card
     * @param {Object} pet - Pet object
     * @returns {string} Pet card HTML
     */
    renderPetCard(pet) {
        const petIcon = this.getPetIcon(pet.species);
        const healthStatus = pet.health_status || 'unknown';
        
        return `
            <div class="pet-card" data-pet-id="${pet.id}">
                <div class="pet-header">
                    <div class="pet-avatar">${petIcon}</div>
                    <div class="pet-actions">
                        <button class="btn-icon" data-action="edit-pet" data-pet-id="${pet.id}">Edit</button>
                        <button class="btn-icon" data-action="delete-pet" data-pet-id="${pet.id}">Del</button>
                    </div>
                </div>
                
                <div class="pet-info">
                    <h3 class="pet-name">${pet.name}</h3>
                    <p class="pet-breed">${pet.breed || pet.species}</p>
                    <div class="pet-details">
                        <span class="pet-age">${this.calculateAge(pet.birth_date)} old</span>
                        <span class="pet-weight">${pet.current_weight}kg</span>
                    </div>
                </div>
                
                <div class="pet-status">
                    <span class="health-badge health-badge--${healthStatus}">${healthStatus}</span>
                </div>
                
                <div class="pet-actions-footer">
                    <button class="btn btn--secondary btn--small" data-action="view-pet" data-pet-id="${pet.id}">
                        View Profile
                    </button>
                    <button class="btn btn--primary btn--small" data-action="nutrition-plan" data-pet-id="${pet.id}">
                        Nutrition Plan
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render pet details
     * @param {Object} pet - Pet object
     * @returns {string} Pet details HTML
     */
    renderPetDetails(pet) {
        const petIcon = this.getPetIcon(pet.species);
        
        return `
            <div class="pet-profile">
                <div class="pet-profile-header">
                    <div class="pet-avatar-large">${petIcon}</div>
                    <div class="pet-info-large">
                        <h2>${pet.name}</h2>
                        <p class="pet-breed">${pet.breed || pet.species}</p>
                        <div class="pet-stats">
                            <div class="stat">
                                <span class="stat-label">Age</span>
                                <span class="stat-value">${this.calculateAge(pet.birth_date)}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Weight</span>
                                <span class="stat-value">${pet.current_weight}kg</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Activity</span>
                                <span class="stat-value">${pet.activity_level || 'Medium'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="pet-profile-tabs">
                    <button class="tab-button tab-button--active" data-tab="overview">Overview</button>
                    <button class="tab-button" data-tab="health">Health</button>
                    <button class="tab-button" data-tab="nutrition">Nutrition</button>
                    <button class="tab-button" data-tab="notes">Notes</button>
                </div>
                
                <div class="pet-profile-content">
                    <div class="tab-content tab-content--active" data-tab-content="overview">
                        <div class="overview-grid">
                            <div class="info-card">
                                <h4>Basic Information</h4>
                                <div class="info-list">
                                    <div class="info-item">
                                        <span class="info-label">Species</span>
                                        <span class="info-value">${pet.species}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Breed</span>
                                        <span class="info-value">${pet.breed || 'Mixed'}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Gender</span>
                                        <span class="info-value">${pet.gender || 'Not specified'}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Birth Date</span>
                                        <span class="info-value">${this.ui.formatDate(pet.birth_date)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="info-card">
                                <h4>Health Summary</h4>
                                <div class="health-summary">
                                    <div class="health-status">
                                        <span class="health-badge health-badge--${pet.health_status || 'unknown'}">
                                            ${pet.health_status || 'Unknown'}
                                        </span>
                                    </div>
                                    <p>Last checkup: ${this.ui.formatDate(pet.last_checkup) || 'No recent checkup'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="tab-content" data-tab-content="health">
                        <p>Health tracking coming soon...</p>
                    </div>
                    
                    <div class="tab-content" data-tab-content="nutrition">
                        <p>Nutrition planning coming soon...</p>
                    </div>
                    
                    <div class="tab-content" data-tab-content="notes">
                        <div class="notes-section">
                            <h4>Notes</h4>
                            <p>${pet.notes || 'No notes available'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================================
    // Utility Methods
    // ============================================================

    /**
     * Get pet icon based on species
     * @param {string} species - Pet species
     * @returns {string} Pet icon emoji
     */
    getPetIcon(species) {
        const icons = {
            dog: 'DOG',
            cat: 'CAT',
            rabbit: 'RAB',
            bird: 'BRD',
            fish: 'FSH',
            hamster: 'HAM',
            guinea_pig: 'GP',
            reptile: 'REP',
            other: 'PET'
        };
        
        return icons[species?.toLowerCase()] || icons.other;
    }

    /**
     * Calculate age from birth date
     * @param {string} birthDate - Birth date string
     * @returns {string} Age string
     */
    calculateAge(birthDate) {
        if (!birthDate) return 'Unknown age';
        
        const birth = new Date(birthDate);
        const now = new Date();
        const ageInMs = now - birth;
        const ageInYears = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 365));
        const ageInMonths = Math.floor((ageInMs % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
        
        if (ageInYears > 0) {
            return ageInYears === 1 ? '1 year' : `${ageInYears} years`;
        } else {
            return ageInMonths === 1 ? '1 month' : `${ageInMonths} months`;
        }
    }

    /**
     * Update URL without page reload
     * @param {string} url - New URL
     */
    updateURL(url) {
        if (window.history && window.history.pushState) {
            window.history.pushState(null, null, url);
        }
    }

    /**
     * Refresh current page
     */
    refreshCurrentPage() {
        switch (this.currentPage) {
            case 'dashboard':
                this.showDashboard();
                break;
            case 'pets':
                this.showPetsPage();
                break;
            case 'nutrition':
                this.showNutritionPage();
                break;
            case 'health':
                this.showHealthPage();
                break;
        }
    }

    /**
     * Handle browser back/forward
     * @param {Event} event - Popstate event
     */
    handlePopState(event) {
        const path = window.location.pathname;
        
        if (path === '/' || path === '') {
            if (this.authManager.isAuthenticated()) {
                this.showDashboard();
            } else {
                this.showLandingPage();
            }
        } else if (path === '/dashboard') {
            this.showDashboard();
        } else if (path === '/pets') {
            this.showPetsPage();
        } else if (path === '/nutrition') {
            this.showNutritionPage();
        } else if (path === '/health') {
            this.showHealthPage();
        }
    }

    /**
     * Handle scroll events
     */
    handleScroll() {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    }

    /**
     * Handle resize events
     */
    handleResize() {
        // Handle responsive features
        this.updateMobileMenu();
    }

    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        if (!document.hidden && this.authManager.isAuthenticated()) {
            // Refresh token if needed when page becomes visible
            this.authManager.autoRefreshToken();
        }
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        const navbar = document.getElementById('navbar-menu');
        if (navbar) {
            navbar.classList.toggle('navbar-menu--open');
        }
    }

    /**
     * Update mobile menu state
     */
    updateMobileMenu() {
        const navbar = document.getElementById('navbar-menu');
        if (navbar && window.innerWidth > 1024) {
            navbar.classList.remove('navbar-menu--open');
        }
    }

    /**
     * Debounce function calls
     * @param {function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Handle contact form submission
     * @param {HTMLFormElement} form - Contact form
     */
    async handleContactSubmit(form) {
        const formData = new FormData(form);
        const contactData = Object.fromEntries(formData.entries());
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.ui.closeModal();
        this.ui.showSuccess('Thank you for your message! We will get back to you soon.');
    }

    /**
     * Scroll to features section
     */
    scrollToFeatures() {
        const featuresSection = document.getElementById('features');
        if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Set form loading state
     * @param {HTMLFormElement} form - Form element
     * @param {boolean} loading - Loading state
     */
    setFormLoading(form, loading) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) return;

        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        if (loading) {
            // Disable form inputs
            const inputs = form.querySelectorAll('input, select, textarea, button');
            inputs.forEach(input => {
                input.disabled = true;
            });

            // Show loading state
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'flex';
            
            submitBtn.classList.add('btn--loading');
            form.classList.add('form--loading');

        } else {
            // Enable form inputs
            const inputs = form.querySelectorAll('input, select, textarea, button');
            inputs.forEach(input => {
                input.disabled = false;
            });

            // Hide loading state
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
            
            submitBtn.classList.remove('btn--loading');
            form.classList.remove('form--loading');
        }
    }
}

// Export for global use
window.PetNutriApp = PetNutriApp;