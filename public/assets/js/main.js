// ANMS Main Application - Modern JavaScript Architecture
class ANMSApp {
    constructor() {
        this.stateManager = new StateManager();
        this.apiClient = new APIClient();
        this.auth = new AuthManager(this.apiClient);
        this.ui = new UIManager();
        this.petManager = new PetManager(this.apiClient, this.stateManager);
        this.nutritionManager = new NutritionManager(this.apiClient, this.stateManager);
        this.healthTracking = new HealthTrackingManager(this.apiClient, this.stateManager);
        this.formValidator = new FormValidator();
        
        this.init();
    }

    async init() {
        // Initialize the application
        await this.auth.checkAuthStatus();
        this.setupEventListeners();
        this.ui.showLoadingState(false);
        
        // Route to appropriate page
        this.handleRouting();
    }

    setupEventListeners() {
        // Global event listeners
        document.addEventListener('click', this.handleGlobalClick.bind(this));
        document.addEventListener('submit', this.handleGlobalSubmit.bind(this));
        
        // Auth events
        this.auth.on('login', this.handleLogin.bind(this));
        this.auth.on('logout', this.handleLogout.bind(this));
        
        // Pet events
        this.petManager.on('petAdded', this.handlePetAdded.bind(this));
        this.petManager.on('petUpdated', this.handlePetUpdated.bind(this));
    }

    handleGlobalClick(event) {
        const target = event.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const data = target.dataset;

        switch (action) {
            case 'login':
                this.showLoginModal();
                break;
            case 'register':
                this.showRegisterModal();
                break;
            case 'show-login':
                this.ui.closeModal();
                this.showLoginModal();
                break;
            case 'show-register':
                this.ui.closeModal();
                this.showRegisterModal();
                break;
            case 'logout':
                this.auth.logout();
                break;
            case 'add-pet':
                this.showAddPetModal();
                break;
            case 'view-pet':
                this.viewPet(data.petId);
                break;
            case 'generate-nutrition-plan':
                this.generateNutritionPlan(data.petId);
                break;
            case 'close-modal':
                this.ui.closeModal();
                break;
            case 'close-notification':
                this.ui.removeNotification(parseInt(data.id));
                break;
            case 'toggle-user-menu':
                // Handled by setupDashboardListeners
                break;
            case 'view-profile':
                this.showUserProfile();
                break;
            case 'settings':
                this.showSettings();
                break;
            case 'view-all-pets':
                this.showAllPets();
                break;
            case 'log-weight':
                this.showLogWeightModal(data.petId);
                break;
            case 'schedule-feeding':
                this.showScheduleFeedingModal(data.petId);
                break;
            case 'health-checkup':
                this.showHealthCheckupModal(data.petId);
                break;
            case 'edit-pet':
                this.showEditPetModal(data.petId);
                break;
            case 'delete-pet':
                this.confirmDeletePet(data.petId);
                break;
            case 'upload-photo':
                this.showUploadPhotoModal(data.petId);
                break;
            case 'manage-health-conditions':
                this.showManageHealthConditionsModal(data.petId);
                break;
            case 'manage-allergies':
                this.showManageAllergiesModal(data.petId);
                break;
            case 'manage-medications':
                this.showManageMedicationsModal(data.petId);
                break;
            case 'view-nutrition-history':
                this.showNutritionHistoryModal(data.petId);
                break;
            case 'log-vitals':
                this.showLogVitalsModal(data.petId);
                break;
            case 'log-activity':
                this.showLogActivityModal(data.petId);
                break;
            case 'add-medication':
                this.showAddMedicationModal(data.petId);
                break;
            case 'edit-medication':
                this.showEditMedicationModal(data.petId, data.medicationId);
                break;
            case 'log-administration':
                this.logMedicationAdministration(data.petId, data.medicationId);
                break;
            case 'add-health-record':
                this.showAddHealthRecordModal(data.petId);
                break;
            case 'view-record':
                this.viewHealthRecord(data.recordId);
                break;
            case 'view-attachments':
                this.viewRecordAttachments(data.recordId);
                break;
            case 'dismiss-alert':
                this.dismissHealthAlert(data.petId, data.alertId);
                break;
            case 'export-health-data':
                this.exportHealthData(data.petId);
                break;
            case 'filter-records':
                this.filterHealthRecords(data.petId);
                break;
            case 'set-weight-goal':
                this.showSetWeightGoalModal(data.petId);
                break;
            case 'health-dashboard':
                this.showHealthDashboard(data.petId);
                break;
            case 'edit-profile':
                this.showEditProfileModal();
                break;
            case 'change-password':
                this.showChangePasswordModal();
                break;
            case 'setup-2fa':
                this.showSetup2FAModal();
                break;
        }
    }

    async handleGlobalSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const action = form.dataset.action;

        switch (action) {
            case 'login':
                await this.handleLoginSubmit(form);
                break;
            case 'register':
                await this.handleRegisterSubmit(form);
                break;
            case 'add-pet':
                await this.handleAddPetSubmit(form);
                break;
            case 'edit-pet':
                await this.handleEditPetSubmit(form);
                break;
            case 'log-weight':
                await this.handleLogWeightSubmit(form);
                break;
            case 'schedule-feeding':
                await this.handleScheduleFeedingSubmit(form);
                break;
            case 'health-checkup':
                await this.handleHealthCheckupSubmit(form);
                break;
            case 'upload-photo':
                await this.handleUploadPhotoSubmit(form);
                break;
            case 'log-vitals':
                await this.handleLogVitalsSubmit(form);
                break;
            case 'log-activity':
                await this.handleLogActivitySubmit(form);
                break;
            case 'add-medication':
                await this.handleAddMedicationSubmit(form);
                break;
            case 'add-health-record':
                await this.handleAddHealthRecordSubmit(form);
                break;
        }
    }

    handleRouting() {
        const path = window.location.pathname;
        const isAuthenticated = this.auth.isAuthenticated();

        if (!isAuthenticated && path !== '/') {
            this.showLandingPage();
        } else if (isAuthenticated) {
            this.showDashboard();
        } else {
            this.showLandingPage();
        }
    }

    showLandingPage() {
        document.body.innerHTML = this.ui.renderLandingPage();
    }

    async showDashboard() {
        try {
            this.ui.showLoadingState(true);
            const pets = await this.petManager.getUserPets();
            const user = this.auth.getCurrentUser();
            const dashboardHTML = this.ui.renderDashboard(pets, user);
            document.getElementById('app').innerHTML = dashboardHTML;
            
            // Setup dashboard-specific event listeners
            this.setupDashboardListeners();
        } catch (error) {
            this.ui.showError('Failed to load dashboard');
        } finally {
            this.ui.showLoadingState(false);
        }
    }

    setupDashboardListeners() {
        // Dropdown functionality
        const dropdownTriggers = document.querySelectorAll('.dropdown__trigger');
        dropdownTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = trigger.closest('.dropdown');
                dropdown.classList.toggle('dropdown--open');
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown--open').forEach(dropdown => {
                dropdown.classList.remove('dropdown--open');
            });
        });
    }

    showLoginModal() {
        const modal = this.ui.createModal('Login', this.ui.renderLoginForm());
        document.body.appendChild(modal);
    }

    showRegisterModal() {
        const modal = this.ui.createModal('Create Account', this.ui.renderRegisterForm());
        document.body.appendChild(modal);
    }

    showAddPetModal() {
        const modal = this.ui.createModal('Add New Pet', this.ui.renderAddPetForm());
        document.body.appendChild(modal);
    }

    async handleLoginSubmit(form) {
        try {
            const formData = new FormData(form);
            const credentials = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            await this.auth.login(credentials);
        } catch (error) {
            this.ui.showError(error.message);
        }
    }

    async handleRegisterSubmit(form) {
        try {
            const formData = new FormData(form);
            const userData = {
                first_name: formData.get('first_name'),
                last_name: formData.get('last_name'),
                email: formData.get('email'),
                password: formData.get('password'),
                password_confirmation: formData.get('password_confirmation')
            };

            // Validate passwords match
            if (userData.password !== userData.password_confirmation) {
                throw new Error('Passwords do not match');
            }

            await this.auth.register(userData);
            this.ui.closeModal();
            this.ui.showSuccess('Account created successfully! Please log in.');
            this.showLoginModal();
        } catch (error) {
            this.ui.showError(error.message);
        }
    }

    async handleAddPetSubmit(form) {
        try {
            const formData = new FormData(form);
            const petData = Object.fromEntries(formData.entries());
            
            await this.petManager.addPet(petData);
            this.ui.closeModal();
            this.ui.showSuccess('Pet added successfully!');
        } catch (error) {
            this.ui.showError(error.message);
        }
    }

    async handleEditPetSubmit(form) {
        try {
            const formData = new FormData(form);
            const petId = form.dataset.petId;
            const petData = Object.fromEntries(formData.entries());
            
            await this.petManager.updatePet(petId, petData);
            this.ui.closeModal();
            this.ui.showSuccess('Pet updated successfully!');
            this.showDashboard(); // Refresh dashboard
        } catch (error) {
            this.ui.showError(error.message);
        }
    }

    async handleLogWeightSubmit(form) {
        try {
            const formData = new FormData(form);
            const petId = form.dataset.petId;
            const weightData = {
                weight: parseFloat(formData.get('weight')),
                recorded_date: formData.get('recorded_date'),
                notes: formData.get('notes')
            };
            
            await this.petManager.logWeight(petId, weightData);
            this.ui.closeModal();
            this.ui.showSuccess('Weight logged successfully!');
        } catch (error) {
            this.ui.showError(error.message);
        }
    }

    async handleScheduleFeedingSubmit(form) {
        try {
            const formData = new FormData(form);
            const petId = form.dataset.petId;
            const feedingData = {
                meal_time: formData.get('meal_time'),
                food_type: formData.get('food_type'),
                portion_size: formData.get('portion_size'),
                feeding_notes: formData.get('feeding_notes')
            };
            
            await this.petManager.scheduleFeed(petId, feedingData);
            this.ui.closeModal();
            this.ui.showSuccess('Feeding scheduled successfully!');
        } catch (error) {
            this.ui.showError(error.message);
        }
    }

    async handleHealthCheckupSubmit(form) {
        try {
            const formData = new FormData(form);
            const petId = form.dataset.petId;
            const checkupData = {
                checkup_date: formData.get('checkup_date'),
                checkup_type: formData.get('checkup_type'),
                veterinarian: formData.get('veterinarian'),
                health_observations: formData.get('health_observations'),
                treatment_notes: formData.get('treatment_notes')
            };
            
            await this.petManager.recordHealthCheckup(petId, checkupData);
            this.ui.closeModal();
            this.ui.showSuccess('Health checkup recorded successfully!');
        } catch (error) {
            this.ui.showError(error.message);
        }
    }

    async handleUploadPhotoSubmit(form) {
        try {
            const formData = new FormData(form);
            const petId = form.dataset.petId;
            
            await this.petManager.uploadPhoto(petId, formData);
            this.ui.closeModal();
            this.ui.showSuccess('Photo uploaded successfully!');
            this.showDashboard(); // Refresh dashboard
        } catch (error) {
            this.ui.showError(error.message);
        }
    }

    handleLogin() {
        this.ui.closeModal();
        this.showDashboard();
        this.ui.showSuccess('Welcome back!');
    }

    handleLogout() {
        this.showLandingPage();
        this.ui.showSuccess('Logged out successfully');
    }

    handlePetAdded(pet) {
        this.showDashboard(); // Refresh dashboard
    }

    handlePetUpdated(pet) {
        this.showDashboard(); // Refresh dashboard
    }

    async viewPet(petId) {
        try {
            this.ui.showLoadingState(true);
            const pet = await this.petManager.getPet(petId);
            this.showPetDetails(pet);
        } catch (error) {
            this.ui.showError('Failed to load pet details');
        } finally {
            this.ui.showLoadingState(false);
        }
    }

    showPetDetails(pet) {
        const modal = this.ui.createModal(
            `${pet.name} - Pet Details`,
            this.ui.renderPetDetails(pet),
            'large'
        );
        document.body.appendChild(modal);
        
        // Setup tab functionality
        this.setupPetDetailsTabs(modal);
    }

    setupPetDetailsTabs(modal) {
        const tabs = modal.querySelectorAll('.pet-tab');
        const tabContents = modal.querySelectorAll('.pet-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('pet-tab--active'));
                tabContents.forEach(content => content.classList.remove('pet-tab-content--active'));
                
                // Add active class to clicked tab and corresponding content
                tab.classList.add('pet-tab--active');
                const targetContent = modal.querySelector(`[data-tab-content="${targetTab}"]`);
                if (targetContent) {
                    targetContent.classList.add('pet-tab-content--active');
                }
            });
        });
    }

    async generateNutritionPlan(petId) {
        try {
            this.ui.showLoadingState(true);
            const pet = await this.petManager.getPet(petId);
            this.showNutritionPlanWizard(pet);
        } catch (error) {
            this.ui.showError('Failed to load pet information for nutrition planning');
        } finally {
            this.ui.showLoadingState(false);
        }
    }

    showNutritionPlanWizard(pet) {
        const modal = this.ui.createModal(
            `Nutrition Plan for ${pet.name}`,
            this.ui.renderNutritionPlanWizard(pet),
            'large'
        );
        document.body.appendChild(modal);
        
        // Setup wizard functionality
        this.setupNutritionWizard(modal, pet);
    }

    showNutritionPlan(plan) {
        const modal = this.ui.createModal(
            'Nutrition Plan', 
            this.ui.renderNutritionPlan(plan),
            'large'
        );
        document.body.appendChild(modal);
    }

    // Additional dashboard methods
    showUserProfile() {
        const user = this.auth.getCurrentUser();
        const modal = this.ui.createModal(
            'User Profile',
            this.ui.renderUserProfile(user),
            'medium'
        );
        document.body.appendChild(modal);
    }

    showSettings() {
        const modal = this.ui.createModal(
            'Settings',
            this.ui.renderSettings(),
            'medium'
        );
        document.body.appendChild(modal);
    }

    showAllPets() {
        // This would navigate to a dedicated pets page
        this.ui.showInfo('All pets view - would navigate to dedicated pets page');
    }

    showLogWeightModal(petId) {
        const modal = this.ui.createModal(
            'Log Weight',
            this.ui.renderLogWeightForm(petId),
            'small'
        );
        document.body.appendChild(modal);
    }

    showScheduleFeedingModal(petId) {
        const modal = this.ui.createModal(
            'Schedule Feeding',
            this.ui.renderScheduleFeedingForm(petId),
            'medium'
        );
        document.body.appendChild(modal);
    }

    showHealthCheckupModal(petId) {
        const modal = this.ui.createModal(
            'Health Checkup',
            this.ui.renderHealthCheckupForm(petId),
            'medium'
        );
        document.body.appendChild(modal);
    }

    async showEditPetModal(petId) {
        try {
            this.ui.showLoadingState(true);
            const pet = await this.petManager.getPet(petId);
            const modal = this.ui.createModal(
                `Edit ${pet.name}`,
                this.ui.renderEditPetForm(pet),
                'large'
            );
            document.body.appendChild(modal);
        } catch (error) {
            this.ui.showError('Failed to load pet details for editing');
        } finally {
            this.ui.showLoadingState(false);
        }
    }

    confirmDeletePet(petId) {
        if (confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
            this.deletePet(petId);
        }
    }

    async deletePet(petId) {
        try {
            await this.petManager.deletePet(petId);
            this.ui.closeModal();
            this.ui.showSuccess('Pet deleted successfully');
            this.showDashboard(); // Refresh dashboard
        } catch (error) {
            this.ui.showError('Failed to delete pet');
        }
    }

    showUploadPhotoModal(petId) {
        const modal = this.ui.createModal(
            'Upload Pet Photo',
            this.renderUploadPhotoForm(petId),
            'medium'
        );
        document.body.appendChild(modal);
    }

    renderUploadPhotoForm(petId) {
        return `
            <form class="form" data-action="upload-photo" data-pet-id="${petId}">
                <div class="form-group">
                    <label for="photo" class="form-label">Select Photo</label>
                    <input type="file" id="photo" name="photo" class="form-input" accept="image/*" required>
                </div>
                
                <div class="form-group">
                    <div class="photo-preview" id="photo-preview" style="display: none;">
                        <img id="preview-image" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn--secondary" data-action="close-modal">Cancel</button>
                    <button type="submit" class="btn btn--primary">Upload Photo</button>
                </div>
            </form>
            <script>
                document.getElementById('photo').addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            document.getElementById('preview-image').src = e.target.result;
                            document.getElementById('photo-preview').style.display = 'block';
                        };
                        reader.readAsDataURL(file);
                    }
                });
            </script>
        `;
    }

    showManageHealthConditionsModal(petId) {
        this.ui.showInfo('Health conditions management - Feature coming soon!');
    }

    showManageAllergiesModal(petId) {
        this.ui.showInfo('Allergy management - Feature coming soon!');
    }

    showManageMedicationsModal(petId) {
        this.ui.showInfo('Medication management - Feature coming soon!');
    }

    showNutritionHistoryModal(petId) {
        this.ui.showInfo('Nutrition history - Feature coming soon!');
    }

    // Health Tracking Modal Methods
    showLogVitalsModal(petId) {
        const modal = this.ui.createModal(
            'Log Vital Signs',
            this.ui.renderLogVitalsForm(petId),
            'medium'
        );
        document.body.appendChild(modal);
    }

    showLogActivityModal(petId) {
        const modal = this.ui.createModal(
            'Log Activity',
            this.ui.renderLogActivityForm(petId),
            'medium'
        );
        document.body.appendChild(modal);
    }

    showAddMedicationModal(petId) {
        const modal = this.ui.createModal(
            'Add Medication',
            this.ui.renderAddMedicationForm(petId),
            'medium'
        );
        document.body.appendChild(modal);
    }

    async showEditMedicationModal(petId, medicationId) {
        try {
            this.ui.showLoadingState(true);
            const medication = await this.healthTracking.getMedication(petId, medicationId);
            const modal = this.ui.createModal(
                'Edit Medication',
                this.ui.renderEditMedicationForm(petId, medication),
                'medium'
            );
            document.body.appendChild(modal);
        } catch (error) {
            this.ui.showError('Failed to load medication details');
        } finally {
            this.ui.showLoadingState(false);
        }
    }

    async logMedicationAdministration(petId, medicationId) {
        try {
            const administrationData = {
                administered_at: new Date().toISOString(),
                administered_by: this.auth.getCurrentUser().id
            };
            
            await this.healthTracking.logMedicationAdministration(petId, medicationId, administrationData);
            this.ui.showSuccess('Medication administration logged successfully!');
            
            // Refresh health data if health dashboard is open
            this.refreshHealthDashboard();
        } catch (error) {
            this.ui.showError('Failed to log medication administration');
        }
    }

    showAddHealthRecordModal(petId) {
        const modal = this.ui.createModal(
            'Add Health Record',
            this.ui.renderAddHealthRecordForm(petId),
            'large'
        );
        document.body.appendChild(modal);
    }

    async viewHealthRecord(recordId) {
        try {
            this.ui.showLoadingState(true);
            const record = await this.healthTracking.getHealthRecord(recordId);
            const modal = this.ui.createModal(
                'Health Record Details',
                this.ui.renderHealthRecordDetails(record),
                'large'
            );
            document.body.appendChild(modal);
        } catch (error) {
            this.ui.showError('Failed to load health record details');
        } finally {
            this.ui.showLoadingState(false);
        }
    }

    async viewRecordAttachments(recordId) {
        try {
            this.ui.showLoadingState(true);
            const attachments = await this.healthTracking.getRecordAttachments(recordId);
            const modal = this.ui.createModal(
                'Record Attachments',
                this.ui.renderRecordAttachments(attachments),
                'medium'
            );
            document.body.appendChild(modal);
        } catch (error) {
            this.ui.showError('Failed to load record attachments');
        } finally {
            this.ui.showLoadingState(false);
        }
    }

    async dismissHealthAlert(petId, alertId) {
        try {
            await this.healthTracking.dismissHealthAlert(petId, alertId);
            
            // Remove alert from UI
            const alertElement = document.querySelector(`[data-alert-id="${alertId}"]`);
            if (alertElement) {
                alertElement.style.opacity = '0';
                alertElement.style.transform = 'translateX(100%)';
                setTimeout(() => alertElement.remove(), 300);
            }
            
            this.ui.showSuccess('Health alert dismissed');
        } catch (error) {
            this.ui.showError('Failed to dismiss health alert');
        }
    }

    async exportHealthData(petId) {
        try {
            this.ui.showLoadingState(true);
            await this.healthTracking.exportHealthData(petId, 'pdf');
            this.ui.showSuccess('Health data export started. You\'ll receive an email when ready.');
        } catch (error) {
            this.ui.showError('Failed to export health data');
        } finally {
            this.ui.showLoadingState(false);
        }
    }

    filterHealthRecords(petId) {
        const recordType = document.getElementById('record-type')?.value;
        const dateRange = document.getElementById('date-range')?.value;
        
        const recordItems = document.querySelectorAll('.record-item');
        
        recordItems.forEach(item => {
            let show = true;
            
            // Filter by type
            if (recordType && recordType !== 'all') {
                const recordTypeElement = item.querySelector('.record-type');
                if (recordTypeElement && !recordTypeElement.classList.contains(`record-type--${recordType}`)) {
                    show = false;
                }
            }
            
            item.style.display = show ? 'flex' : 'none';
        });
        
        this.ui.showSuccess('Records filtered successfully');
    }

    showSetWeightGoalModal(petId) {
        const modal = this.ui.createModal(
            'Set Weight Goal',
            this.ui.renderSetWeightGoalForm(petId),
            'small'
        );
        document.body.appendChild(modal);
    }

    // Health Dashboard Management
    async showHealthDashboard(petId) {
        try {
            this.ui.showLoadingState(true);
            const pet = await this.petManager.getPet(petId);
            const healthData = await this.healthTracking.getHealthData(petId);
            
            const modal = this.ui.createModal(
                `${pet.name} - Health Dashboard`,
                this.ui.renderHealthDashboard(pet, healthData),
                'fullscreen'
            );
            document.body.appendChild(modal);
            
            // Initialize health dashboard functionality
            this.initializeHealthDashboard(modal);
        } catch (error) {
            this.ui.showError('Failed to load health dashboard');
        } finally {
            this.ui.showLoadingState(false);
        }
    }

    initializeHealthDashboard(modal) {
        // Initialize tab functionality
        const healthTabs = modal.querySelectorAll('.health-tab');
        const healthTabContents = modal.querySelectorAll('.health-tab-content');

        healthTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                
                // Remove active class from all tabs and contents
                healthTabs.forEach(t => t.classList.remove('health-tab--active'));
                healthTabContents.forEach(content => {
                    content.classList.remove('health-tab-content--active');
                });
                
                // Add active class to clicked tab and corresponding content
                e.target.classList.add('health-tab--active');
                const targetContent = modal.querySelector(`[data-tab-content="${targetTab}"]`);
                if (targetContent) {
                    targetContent.classList.add('health-tab-content--active');
                }
                
                // Initialize tab-specific functionality
                this.initializeHealthTabContent(modal, targetTab);
            });
        });

        // Initialize default tab content
        this.initializeHealthTabContent(modal, 'overview');
    }

    initializeHealthTabContent(modal, tabName) {
        switch(tabName) {
            case 'weight':
                this.initializeWeightChart(modal);
                break;
            case 'vitals':
                this.initializeVitalsChart(modal);
                break;
            case 'medications':
                this.initializeMedicationCalendar(modal);
                break;
            case 'records':
                this.initializeRecordsFilters(modal);
                break;
        }
    }

    initializeWeightChart(modal) {
        const canvas = modal.querySelector('#weight-chart-canvas');
        if (!canvas) return;

        // Generate mock weight data for demonstration
        const weightData = this.generateMockWeightData();
        this.renderWeightChart(canvas, weightData);
    }

    initializeVitalsChart(modal) {
        const canvas = modal.querySelector('#vitals-chart-canvas');
        const selector = modal.querySelector('#vitals-metric-selector');
        
        if (!canvas || !selector) return;

        const updateChart = () => {
            const metric = selector.value;
            const vitalsData = this.generateMockVitalsData(metric);
            this.renderVitalsChart(canvas, vitalsData, metric);
        };

        selector.addEventListener('change', updateChart);
        updateChart(); // Initial render
    }

    initializeMedicationCalendar(modal) {
        const medDoses = modal.querySelectorAll('.med-dose');
        
        medDoses.forEach(dose => {
            dose.addEventListener('click', (e) => {
                e.target.classList.toggle('med-dose--taken');
                this.ui.showSuccess('Medication dose updated');
            });
        });
    }

    initializeRecordsFilters(modal) {
        const filterButton = modal.querySelector('[data-action="filter-records"]');
        if (!filterButton) return;

        filterButton.addEventListener('click', () => {
            this.filterHealthRecords();
        });
    }

    refreshHealthDashboard() {
        // Refresh health dashboard if it's currently open
        const healthDashboard = document.querySelector('.health-dashboard');
        if (healthDashboard) {
            // In a real app, this would refresh the data
            console.log('Refreshing health dashboard...');
        }
    }

    // Mock data generators for development
    generateMockWeightData() {
        const data = [];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        
        let currentWeight = 25.5;
        for (let i = 0; i < 26; i++) { // 6 months of weekly data
            const date = new Date(startDate);
            date.setDate(date.getDate() + (i * 7));
            
            // Add some realistic weight variation
            currentWeight += (Math.random() - 0.5) * 0.5;
            currentWeight = Math.max(20, Math.min(30, currentWeight)); // Keep within reasonable bounds
            
            data.push({
                date: date.toISOString().split('T')[0],
                weight: Math.round(currentWeight * 10) / 10
            });
        }
        
        return data;
    }

    generateMockVitalsData(metric) {
        const data = [];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        
        let baseValue;
        let variation;
        
        switch(metric) {
            case 'temperature':
                baseValue = 38.5;
                variation = 0.5;
                break;
            case 'heart_rate':
                baseValue = 80;
                variation = 10;
                break;
            case 'respiratory_rate':
                baseValue = 20;
                variation = 3;
                break;
        }
        
        for (let i = 0; i < 12; i++) { // 3 months of weekly data
            const date = new Date(startDate);
            date.setDate(date.getDate() + (i * 7));
            
            const value = baseValue + (Math.random() - 0.5) * variation * 2;
            
            data.push({
                date: date.toISOString().split('T')[0],
                value: Math.round(value * 10) / 10
            });
        }
        
        return data;
    }

    renderWeightChart(canvas, data) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Chart dimensions
        const padding = 40;
        const chartWidth = canvas.width - (padding * 2);
        const chartHeight = canvas.height - (padding * 2);

        // Data processing
        const weights = data.map(d => d.weight);
        const minWeight = Math.min(...weights) - 1;
        const maxWeight = Math.max(...weights) + 1;
        const weightRange = maxWeight - minWeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + chartWidth, y);
            ctx.stroke();
        }

        // Draw weight line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((point, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = padding + chartHeight - ((point.weight - minWeight) / weightRange) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();

        // Draw data points
        ctx.fillStyle = '#3b82f6';
        data.forEach((point, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = padding + chartHeight - ((point.weight - minWeight) / weightRange) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Draw labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';

        // Y-axis labels (weight)
        for (let i = 0; i <= 5; i++) {
            const weight = minWeight + (weightRange / 5) * (5 - i);
            const y = padding + (chartHeight / 5) * i;
            ctx.textAlign = 'right';
            ctx.fillText(weight.toFixed(1) + ' kg', padding - 10, y + 4);
        }

        // X-axis labels (dates)
        ctx.textAlign = 'center';
        for (let i = 0; i < data.length; i += Math.ceil(data.length / 6)) {
            const x = padding + (chartWidth / (data.length - 1)) * i;
            const date = new Date(data[i].date);
            const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            ctx.fillText(label, x, canvas.height - 10);
        }
    }

    renderVitalsChart(canvas, data, metric) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Chart dimensions
        const padding = 40;
        const chartWidth = canvas.width - (padding * 2);
        const chartHeight = canvas.height - (padding * 2);

        // Data processing
        const values = data.map(d => d.value);
        const minValue = Math.min(...values) - (Math.max(...values) - Math.min(...values)) * 0.1;
        const maxValue = Math.max(...values) + (Math.max(...values) - Math.min(...values)) * 0.1;
        const valueRange = maxValue - minValue;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        // Draw vitals line
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((point, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();

        // Draw data points
        ctx.fillStyle = '#10b981';
        data.forEach((point, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    showEditProfileModal() {
        this.ui.showInfo('Profile editing - Feature coming soon!');
    }

    showChangePasswordModal() {
        this.ui.showInfo('Password change - Feature coming soon!');
    }

    showSetup2FAModal() {
        this.ui.showInfo('Two-factor authentication setup - Feature coming soon!');
    }

    setupNutritionWizard(modal, pet) {
        let currentStep = 1;
        const totalSteps = 4;
        
        const steps = modal.querySelectorAll('.wizard-step');
        const contents = modal.querySelectorAll('.wizard-content');
        const prevBtn = modal.querySelector('.wizard-btn-prev');
        const nextBtn = modal.querySelector('.wizard-btn-next');
        const generateBtn = modal.querySelector('.wizard-btn-generate');
        const form = modal.querySelector('.wizard-form');

        // Navigation functions
        const updateStep = (step) => {
            // Update progress indicators
            steps.forEach((s, index) => {
                s.classList.remove('wizard-step--active', 'wizard-step--completed');
                if (index + 1 === step) {
                    s.classList.add('wizard-step--active');
                } else if (index + 1 < step) {
                    s.classList.add('wizard-step--completed');
                }
            });

            // Update content visibility
            contents.forEach((content, index) => {
                content.classList.remove('wizard-content--active');
                if (index + 1 === step) {
                    content.classList.add('wizard-content--active');
                }
            });

            // Update button states
            prevBtn.disabled = step === 1;
            nextBtn.style.display = step === totalSteps ? 'none' : 'inline-flex';
            generateBtn.style.display = step === totalSteps ? 'inline-flex' : 'none';

            currentStep = step;

            // Update preview on final step
            if (step === totalSteps) {
                this.updateNutritionPreview(modal, pet);
            }
        };

        // Event listeners
        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                updateStep(currentStep - 1);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (this.validateWizardStep(modal, currentStep)) {
                if (currentStep < totalSteps) {
                    updateStep(currentStep + 1);
                }
            }
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleNutritionPlanGeneration(form, pet);
        });

        // Initialize first step
        updateStep(1);
    }

    validateWizardStep(modal, step) {
        const currentContent = modal.querySelector(`[data-step-content="${step}"]`);
        const requiredFields = currentContent.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });

        if (!isValid) {
            this.ui.showError('Please fill in all required fields');
        }

        return isValid;
    }

    updateNutritionPreview(modal, pet) {
        const form = modal.querySelector('.wizard-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Update goals preview
        const goalsPreview = modal.querySelector('#goals-preview');
        if (goalsPreview) {
            goalsPreview.innerHTML = `
                <div class="preview-grid">
                    <div class="preview-item">
                        <span class="preview-label">Primary Goal:</span>
                        <span class="preview-value">${data.primary_goal?.replace('_', ' ') || 'Not set'}</span>
                    </div>
                    <div class="preview-item">
                        <span class="preview-label">Target Weight:</span>
                        <span class="preview-value">${data.target_weight ? data.target_weight + ' kg' : 'Current weight'}</span>
                    </div>
                    <div class="preview-item">
                        <span class="preview-label">Timeline:</span>
                        <span class="preview-value">${data.timeline?.replace('_', ' ') || 'Not set'}</span>
                    </div>
                    <div class="preview-item">
                        <span class="preview-label">Meals per Day:</span>
                        <span class="preview-value">${data.meals_per_day || '2'}</span>
                    </div>
                </div>
            `;
        }

        // Calculate estimated calories
        const estimatedCalories = this.calculateEstimatedCalories(pet, data);
        const caloriesElement = modal.querySelector('#estimated-calories');
        if (caloriesElement) {
            caloriesElement.textContent = estimatedCalories;
        }
    }

    calculateEstimatedCalories(pet, preferences) {
        if (!pet.current_weight) return 'N/A';

        const weight = parseFloat(pet.current_weight);
        let baseCalories;

        // Basic metabolic rate calculation
        switch (pet.species) {
            case 'dog':
                baseCalories = 70 * Math.pow(weight, 0.75);
                break;
            case 'cat':
                baseCalories = 70 * Math.pow(weight, 0.67);
                break;
            default:
                baseCalories = 70 * Math.pow(weight, 0.75);
        }

        // Activity level multiplier
        const activityMultipliers = {
            low: 1.2,
            moderate: 1.6,
            high: 2.0
        };

        const multiplier = activityMultipliers[pet.activity_level] || 1.6;
        let calories = Math.round(baseCalories * multiplier);

        // Adjust for goals
        if (preferences.primary_goal === 'lose_weight') {
            calories *= 0.8; // Reduce by 20%
        } else if (preferences.primary_goal === 'gain_weight') {
            calories *= 1.2; // Increase by 20%
        }

        return Math.round(calories);
    }

    async handleNutritionPlanGeneration(form, pet) {
        try {
            this.ui.showLoadingState(true);
            
            const formData = new FormData(form);
            const preferences = Object.fromEntries(formData.entries());
            
            // Get selected food types and restrictions as arrays
            preferences.food_types = formData.getAll('food_types');
            preferences.restrictions = formData.getAll('restrictions');
            
            const plan = await this.nutritionManager.generateNutritionPlan(pet.id, preferences);
            
            this.ui.closeModal();
            this.showGeneratedNutritionPlan(plan, pet);
            this.ui.showSuccess('Nutrition plan generated successfully!');
            
        } catch (error) {
            this.ui.showError('Failed to generate nutrition plan: ' + error.message);
        } finally {
            this.ui.showLoadingState(false);
        }
    }

    showGeneratedNutritionPlan(plan, pet) {
        const modal = this.ui.createModal(
            `${pet.name}'s Nutrition Plan`,
            this.renderGeneratedNutritionPlan(plan, pet),
            'large'
        );
        document.body.appendChild(modal);
        
        // Setup plan management functionality
        this.setupNutritionPlanManagement(modal, plan, pet);
    }

    renderGeneratedNutritionPlan(plan, pet) {
        return `
            <div class="generated-nutrition-plan">
                <div class="plan-header">
                    <div class="plan-summary">
                        <h3>Personalized Nutrition Plan</h3>
                        <p>Generated for ${pet.name} based on their specific needs and your preferences</p>
                    </div>
                    <div class="plan-actions">
                        <button class="btn btn--secondary" data-action="edit-plan">Edit Plan</button>
                        <button class="btn btn--primary" data-action="save-plan">Save Plan</button>
                    </div>
                </div>

                <div class="plan-content">
                    <div class="nutrition-overview">
                        <h4>Daily Nutritional Requirements</h4>
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

                    <div class="feeding-schedule">
                        <h4>Recommended Feeding Schedule</h4>
                        <div class="schedule-grid">
                            ${this.renderFeedingSchedule(plan)}
                        </div>
                    </div>

                    ${plan.food_recommendations ? `
                        <div class="food-recommendations-section">
                            <h4>Recommended Foods</h4>
                            <div class="recommended-foods">
                                ${this.renderRecommendedFoods(plan.food_recommendations)}
                            </div>
                        </div>
                    ` : ''}

                    ${plan.special_instructions ? `
                        <div class="special-instructions">
                            <h4>Special Instructions</h4>
                            <div class="instructions-content">
                                <p>${plan.special_instructions}</p>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="plan-footer">
                    <div class="plan-tools">
                        <button class="btn btn--secondary" data-action="meal-calendar">
                            📅 Meal Calendar
                        </button>
                        <button class="btn btn--secondary" data-action="portion-calculator">
                            🧮 Portion Calculator
                        </button>
                        <button class="btn btn--secondary" data-action="shopping-list">
                            🛒 Shopping List
                        </button>
                        <button class="btn btn--secondary" data-action="share-plan">
                            📤 Share Plan
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderFeedingSchedule(plan) {
        const mealsPerDay = plan.meals_per_day || 2;
        const mealTimes = this.ui.generateMealTimes(mealsPerDay);
        const caloriesPerMeal = Math.round(plan.daily_calories / mealsPerDay);

        return mealTimes.map(time => `
            <div class="schedule-item">
                <div class="schedule-time">${time}</div>
                <div class="schedule-details">
                    <div class="schedule-calories">${caloriesPerMeal} kcal</div>
                    <div class="schedule-portion">Portion as recommended</div>
                </div>
            </div>
        `).join('');
    }

    renderRecommendedFoods(foodRecommendations) {
        try {
            const foods = typeof foodRecommendations === 'string' 
                ? JSON.parse(foodRecommendations) 
                : foodRecommendations;
            
            return foods.map(food => `
                <div class="recommended-food">
                    <h5>${food.name}</h5>
                    <p>Portion: ${food.portion || 'As recommended'}</p>
                    ${food.notes ? `<p class="food-notes">${food.notes}</p>` : ''}
                </div>
            `).join('');
        } catch (error) {
            return '<p>Food recommendations will be displayed here</p>';
        }
    }

    setupNutritionPlanManagement(modal, plan, pet) {
        // Add event listeners for plan management actions
        modal.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            
            switch (action) {
                case 'save-plan':
                    this.savePlan(plan, pet);
                    break;
                case 'edit-plan':
                    this.editPlan(plan, pet);
                    break;
                case 'meal-calendar':
                    this.showMealCalendar(plan, pet);
                    break;
                case 'portion-calculator':
                    this.showPortionCalculator(pet);
                    break;
                case 'shopping-list':
                    this.generateShoppingList(plan, pet);
                    break;
                case 'share-plan':
                    this.sharePlan(plan, pet);
                    break;
            }
        });
    }

    async savePlan(plan, pet) {
        try {
            await this.nutritionManager.savePlan(pet.id, plan);
            this.ui.showSuccess('Nutrition plan saved successfully!');
            this.ui.closeModal();
            this.showDashboard(); // Refresh to show updated plan status
        } catch (error) {
            this.ui.showError('Failed to save nutrition plan');
        }
    }

    editPlan(plan, pet) {
        this.ui.closeModal();
        this.showNutritionPlanWizard(pet);
    }

    showMealCalendar(plan, pet) {
        const modal = this.ui.createModal(
            `Meal Calendar - ${pet.name}`,
            this.ui.renderMealPlanningCalendar(plan, pet),
            'large'
        );
        document.body.appendChild(modal);
    }

    showPortionCalculator(pet) {
        const modal = this.ui.createModal(
            `Portion Calculator - ${pet.name}`,
            this.ui.renderPortionCalculator(pet),
            'large'
        );
        document.body.appendChild(modal);
    }

    generateShoppingList(plan, pet) {
        this.ui.showInfo('Shopping list generation - Feature coming soon!');
    }

    sharePlan(plan, pet) {
        this.ui.showInfo('Plan sharing - Feature coming soon!');
    }
}

// API Client for handling HTTP requests
class APIClient {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint);
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// Event Emitter for component communication
class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }

    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.anmsApp = new ANMSApp();
});    // Hea
lth Form Submission Handlers
    async handleLogVitalsSubmit(form) {
        try {
            const formData = new FormData(form);
            const petId = form.dataset.petId;
            const vitalsData = {
                recorded_date: formData.get('recorded_date'),
                temperature: formData.get('temperature') ? parseFloat(formData.get('temperature')) : null,
                heart_rate: formData.get('heart_rate') ? parseInt(formData.get('heart_rate')) : null,
                respiratory_rate: formData.get('respiratory_rate') ? parseInt(formData.get('respiratory_rate')) : null,
                notes: formData.get('notes')
            };
            
            await this.healthTracking.logVitals(petId, vitalsData);
            this.ui.closeModal();
            this.ui.showSuccess('Vital signs logged successfully!');
            this.refreshHealthDashboard();
        } catch (error) {
            this.ui.showError(error.message || 'Failed to log vital signs');
        }
    }

    async handleLogActivitySubmit(form) {
        try {
            const formData = new FormData(form);
            const petId = form.dataset.petId;
            const activityData = {
                activity_date: formData.get('activity_date'),
                activity_time: formData.get('activity_time'),
                activity_type: formData.get('activity_type'),
                duration: parseInt(formData.get('duration')),
                intensity: formData.get('intensity'),
                notes: formData.get('activity_notes')
            };
            
            await this.healthTracking.logActivity(petId, activityData);
            this.ui.closeModal();
            this.ui.showSuccess('Activity logged successfully!');
            this.refreshHealthDashboard();
        } catch (error) {
            this.ui.showError(error.message || 'Failed to log activity');
        }
    }

    async handleAddMedicationSubmit(form) {
        try {
            const formData = new FormData(form);
            const petId = form.dataset.petId;
            
            // Handle reminder types
            const reminderTypes = [];
            const reminderCheckboxes = form.querySelectorAll('input[name="reminder_types"]:checked');
            reminderCheckboxes.forEach(checkbox => {
                reminderTypes.push(checkbox.value);
            });
            
            const medicationData = {
                medication_name: formData.get('medication_name'),
                dosage: formData.get('dosage'),
                frequency: formData.get('frequency'),
                start_date: formData.get('start_date'),
                end_date: formData.get('end_date') || null,
                instructions: formData.get('instructions'),
                reminder_types: reminderTypes
            };
            
            await this.healthTracking.addMedication(petId, medicationData);
            this.ui.closeModal();
            this.ui.showSuccess('Medication added successfully!');
            this.refreshHealthDashboard();
        } catch (error) {
            this.ui.showError(error.message || 'Failed to add medication');
        }
    }

    async handleAddHealthRecordSubmit(form) {
        try {
            const formData = new FormData(form);
            const petId = form.dataset.petId;
            
            const recordData = {
                record_title: formData.get('record_title'),
                record_type: formData.get('record_type'),
                record_date: formData.get('record_date'),
                provider: formData.get('provider'),
                description: formData.get('description'),
                follow_up: formData.get('follow_up') ? true : false,
                follow_up_date: formData.get('follow_up_date') || null,
                follow_up_notes: formData.get('follow_up_notes') || null
            };
            
            // Handle file attachments
            const attachments = formData.get('attachments');
            if (attachments && attachments.size > 0) {
                recordData.attachments = attachments;
            }
            
            await this.healthTracking.addHealthRecord(petId, recordData);
            this.ui.closeModal();
            this.ui.showSuccess('Health record saved successfully!');
            this.refreshHealthDashboard();
        } catch (error) {
            this.ui.showError(error.message || 'Failed to save health record');
        }
    }

    refreshHealthDashboard() {
        // Refresh health dashboard if it's currently open
        const healthDashboard = document.querySelector('.health-dashboard');
        if (healthDashboard) {
            // In a real app, this would refresh the data
            console.log('Refreshing health dashboard...');
            
            // Update charts if they're visible
            const activeTab = document.querySelector('.health-tab--active');
            if (activeTab) {
                const tabName = activeTab.dataset.tab;
                this.initializeHealthTabContent(healthDashboard.closest('.modal'), tabName);
            }
        }
    }

    // Additional profile and settings methods
    showEditProfileModal() {
        const user = this.auth.getCurrentUser();
        const modal = this.ui.createModal(
            'Edit Profile',
            this.ui.renderEditProfileForm(user),
            'medium'
        );
        document.body.appendChild(modal);
    }

    showChangePasswordModal() {
        const modal = this.ui.createModal(
            'Change Password',
            this.ui.renderChangePasswordForm(),
            'small'
        );
        document.body.appendChild(modal);
    }

    showSetup2FAModal() {
        const modal = this.ui.createModal(
            'Setup Two-Factor Authentication',
            this.ui.renderSetup2FAForm(),
            'medium'
        );
        document.body.appendChild(modal);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.anmsApp = new ANMSApp();
});