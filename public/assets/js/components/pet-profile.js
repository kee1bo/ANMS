/**
 * Pet Profile Display Component
 * Handles displaying comprehensive pet information with tabbed interface
 */
class PetProfileComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.petId = null;
        this.pet = null;
        this.currentTab = 'overview';
        this.editMode = false;
        
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="pet-profile-container">
                <!-- Loading state -->
                <div class="loading-state" id="profile-loading">
                    <div class="spinner"></div>
                    <p>Loading pet profile...</p>
                </div>

                <!-- Error state -->
                <div class="error-state" id="profile-error" style="display: none;">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Error Loading Profile</h3>
                    <p id="error-message">Failed to load pet profile.</p>
                    <button class="btn btn-primary" onclick="petProfile.retry()">
                        <i class="fas fa-refresh"></i> Try Again
                    </button>
                </div>

                <!-- Pet profile content -->
                <div class="pet-profile-content" id="profile-content" style="display: none;">
                    <!-- Header with photo and basic info -->
                    <div class="pet-profile-header">
                        <div class="pet-photo-section">
                            <div class="pet-main-photo" id="main-photo">
                                <img src="/assets/images/default-pet.png" alt="Pet photo" id="main-photo-img">
                                <div class="photo-overlay">
                                    <button class="btn btn-sm btn-primary" onclick="petProfile.showPhotoGallery()">
                                        <i class="fas fa-images"></i> View Photos
                                    </button>
                                </div>
                            </div>
                            <div class="pet-photo-thumbnails" id="photo-thumbnails"></div>
                        </div>
                        
                        <div class="pet-basic-info">
                            <div class="pet-name-section">
                                <h1 class="pet-name" id="pet-name">Pet Name</h1>
                                <span class="pet-species-badge" id="pet-species">Species</span>
                            </div>
                            
                            <div class="pet-quick-stats">
                                <div class="stat-item">
                                    <i class="fas fa-birthday-cake"></i>
                                    <div>
                                        <span class="stat-label">Age</span>
                                        <span class="stat-value" id="pet-age">Unknown</span>
                                    </div>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-weight"></i>
                                    <div>
                                        <span class="stat-label">Weight</span>
                                        <span class="stat-value" id="pet-weight">0 kg</span>
                                    </div>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-running"></i>
                                    <div>
                                        <span class="stat-label">Activity</span>
                                        <span class="stat-value" id="pet-activity">Medium</span>
                                    </div>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-heart"></i>
                                    <div>
                                        <span class="stat-label">Health</span>
                                        <span class="stat-value" id="pet-health">Healthy</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="pet-actions">
                                <button class="btn btn-primary" id="edit-pet-btn">
                                    <i class="fas fa-edit"></i> Edit Profile
                                </button>
                                <button class="btn btn-secondary" onclick="petProfile.uploadPhoto()">
                                    <i class="fas fa-camera"></i> Add Photo
                                </button>
                                <div class="dropdown">
                                    <button class="btn btn-outline dropdown-toggle">
                                        <i class="fas fa-ellipsis-v"></i> More
                                    </button>
                                    <div class="dropdown-menu">
                                        <a href="#" onclick="petProfile.exportProfile()">Export Profile</a>
                                        <a href="#" onclick="petProfile.shareProfile()">Share Profile</a>
                                        <a href="#" onclick="petProfile.deletePet()" class="text-danger">Delete Pet</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Navigation tabs -->
                    <div class="pet-profile-tabs">
                        <button class="tab-btn active" data-tab="overview">
                            <i class="fas fa-info-circle"></i> Overview
                        </button>
                        <button class="tab-btn" data-tab="health">
                            <i class="fas fa-heartbeat"></i> Health
                        </button>
                        <button class="tab-btn" data-tab="photos">
                            <i class="fas fa-images"></i> Photos
                        </button>
                        <button class="tab-btn" data-tab="records">
                            <i class="fas fa-clipboard-list"></i> Records
                        </button>
                    </div>

                    <!-- Tab content -->
                    <div class="pet-profile-tab-content">
                        <!-- Overview Tab -->
                        <div class="tab-content active" id="overview-tab">
                            <div class="overview-grid">
                                <div class="info-card">
                                    <h3><i class="fas fa-paw"></i> Basic Information</h3>
                                    <div class="info-grid">
                                        <div class="info-item">
                                            <label>Full Name</label>
                                            <span id="overview-name">-</span>
                                        </div>
                                        <div class="info-item">
                                            <label>Species</label>
                                            <span id="overview-species">-</span>
                                        </div>
                                        <div class="info-item">
                                            <label>Breed</label>
                                            <span id="overview-breed">-</span>
                                        </div>
                                        <div class="info-item">
                                            <label>Gender</label>
                                            <span id="overview-gender">-</span>
                                        </div>
                                        <div class="info-item">
                                            <label>Birth Date</label>
                                            <span id="overview-birth-date">-</span>
                                        </div>
                                        <div class="info-item">
                                            <label>Age</label>
                                            <span id="overview-age">-</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="info-card">
                                    <h3><i class="fas fa-weight"></i> Physical Stats</h3>
                                    <div class="info-grid">
                                        <div class="info-item">
                                            <label>Current Weight</label>
                                            <span id="overview-weight">-</span>
                                        </div>
                                        <div class="info-item">
                                            <label>Ideal Weight</label>
                                            <span id="overview-ideal-weight">-</span>
                                        </div>
                                        <div class="info-item">
                                            <label>Weight Status</label>
                                            <span id="overview-weight-status" class="status-badge">-</span>
                                        </div>
                                        <div class="info-item">
                                            <label>Body Condition Score</label>
                                            <span id="overview-body-score">-</span>
                                        </div>
                                        <div class="info-item">
                                            <label>Activity Level</label>
                                            <span id="overview-activity">-</span>
                                        </div>
                                        <div class="info-item">
                                            <label>Spay/Neuter Status</label>
                                            <span id="overview-spay-neuter">-</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="info-card full-width">
                                    <h3><i class="fas fa-heart"></i> Personality & Notes</h3>
                                    <div class="personality-section">
                                        <p id="overview-personality">No personality description available.</p>
                                    </div>
                                </div>
                                
                                <div class="info-card">
                                    <h3><i class="fas fa-phone"></i> Emergency Contact</h3>
                                    <div class="emergency-contact">
                                        <p id="overview-emergency-contact">No emergency contact information.</p>
                                    </div>
                                </div>
                                
                                <div class="info-card">
                                    <h3><i class="fas fa-microchip"></i> Identification</h3>
                                    <div class="info-grid">
                                        <div class="info-item">
                                            <label>Microchip ID</label>
                                            <span id="overview-microchip">-</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Health Tab -->
                        <div class="tab-content" id="health-tab">
                            <div class="health-overview">
                                <div class="health-status-card">
                                    <h3>Health Status</h3>
                                    <div class="health-status" id="health-status-display">
                                        <span class="status-indicator healthy"></span>
                                        <span>Healthy</span>
                                    </div>
                                </div>
                                
                                <div class="health-stats">
                                    <div class="health-stat">
                                        <span class="stat-number" id="health-conditions-count">0</span>
                                        <span class="stat-label">Active Conditions</span>
                                    </div>
                                    <div class="health-stat">
                                        <span class="stat-number" id="allergies-count">0</span>
                                        <span class="stat-label">Known Allergies</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="health-sections">
                                <div class="health-section">
                                    <div class="section-header">
                                        <h4><i class="fas fa-stethoscope"></i> Health Conditions</h4>
                                        <button class="btn btn-sm btn-primary" onclick="petProfile.addHealthCondition()">
                                            <i class="fas fa-plus"></i> Add Condition
                                        </button>
                                    </div>
                                    <div class="health-conditions-list" id="health-conditions-list">
                                        <p class="empty-message">No health conditions recorded.</p>
                                    </div>
                                </div>
                                
                                <div class="health-section">
                                    <div class="section-header">
                                        <h4><i class="fas fa-exclamation-triangle"></i> Allergies</h4>
                                        <button class="btn btn-sm btn-primary" onclick="petProfile.addAllergy()">
                                            <i class="fas fa-plus"></i> Add Allergy
                                        </button>
                                    </div>
                                    <div class="allergies-list" id="allergies-list">
                                        <p class="empty-message">No allergies recorded.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Photos Tab -->
                        <div class="tab-content" id="photos-tab">
                            <div class="photos-header">
                                <h3>Photo Gallery</h3>
                                <button class="btn btn-primary" onclick="petProfile.uploadPhoto()">
                                    <i class="fas fa-upload"></i> Upload Photos
                                </button>
                            </div>
                            <div class="photos-grid" id="photos-grid">
                                <p class="empty-message">No photos uploaded yet.</p>
                            </div>
                        </div>

                        <!-- Records Tab -->
                        <div class="tab-content" id="records-tab">
                            <div class="records-section">
                                <h3>Activity Log</h3>
                                <div class="activity-log" id="activity-log">
                                    <p class="empty-message">No activity recorded yet.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Edit button
        document.getElementById('edit-pet-btn').addEventListener('click', () => {
            this.toggleEditMode();
        });

        // Dropdown toggles
        document.querySelectorAll('.dropdown-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = btn.nextElementSibling;
                dropdown.classList.toggle('show');
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        });

        // Photo thumbnail clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('photo-thumbnail')) {
                this.setMainPhoto(e.target.dataset.photoUrl);
            }
        });
    }

    async loadPet(petId) {
        try {
            this.petId = petId;
            this.showLoading();
            
            const response = await fetch(`/api/pets.php?id=${petId}`, {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success && data.pet) {
                this.pet = data.pet;
                this.displayPet();
            } else {
                throw new Error(data.error || 'Pet not found');
            }
        } catch (error) {
            console.error('Error loading pet:', error);
            this.showError(error.message);
        }
    }

    displayPet() {
        if (!this.pet) return;

        // Update header information
        document.getElementById('pet-name').textContent = this.pet.name;
        document.getElementById('pet-species').textContent = this.pet.species;
        
        // Update quick stats
        document.getElementById('pet-age').textContent = this.pet.age ? `${this.pet.age} years old` : 'Age unknown';
        document.getElementById('pet-weight').textContent = `${this.pet.weight} kg`;
        document.getElementById('pet-activity').textContent = this.pet.activity_level;
        
        // Update health status
        const healthSummary = this.pet.health_summary || {};
        const healthStatus = healthSummary.active_conditions > 0 ? 'Has conditions' : 'Healthy';
        document.getElementById('pet-health').textContent = healthStatus;

        // Update main photo
        if (this.pet.primary_photo) {
            document.getElementById('main-photo-img').src = this.pet.primary_photo.url;
            document.getElementById('main-photo-img').alt = `${this.pet.name} photo`;
        }

        // Update overview tab
        this.updateOverviewTab();
        
        // Update health tab
        this.updateHealthTab();
        
        // Update photos tab
        this.updatePhotosTab();
        
        // Update records tab
        this.updateRecordsTab();

        // Show content
        document.getElementById('profile-loading').style.display = 'none';
        document.getElementById('profile-error').style.display = 'none';
        document.getElementById('profile-content').style.display = 'block';
    }

    updateOverviewTab() {
        const pet = this.pet;
        
        // Basic information
        document.getElementById('overview-name').textContent = pet.name || '-';
        document.getElementById('overview-species').textContent = pet.species || '-';
        document.getElementById('overview-breed').textContent = pet.breed || 'Mixed breed';
        document.getElementById('overview-gender').textContent = pet.gender || '-';
        document.getElementById('overview-birth-date').textContent = pet.birth_date || '-';
        document.getElementById('overview-age').textContent = pet.age ? `${pet.age} years old` : '-';
        
        // Physical stats
        document.getElementById('overview-weight').textContent = pet.weight ? `${pet.weight} kg` : '-';
        document.getElementById('overview-ideal-weight').textContent = pet.ideal_weight ? `${pet.ideal_weight} kg` : '-';
        
        const weightStatusEl = document.getElementById('overview-weight-status');
        weightStatusEl.textContent = pet.weight_status || '-';
        weightStatusEl.className = `status-badge ${pet.weight_status ? 'status-' + pet.weight_status : ''}`;
        
        document.getElementById('overview-body-score').textContent = pet.body_condition_score || '-';
        document.getElementById('overview-activity').textContent = pet.activity_level || '-';
        document.getElementById('overview-spay-neuter').textContent = pet.spay_neuter_status || '-';
        
        // Personality
        document.getElementById('overview-personality').textContent = pet.personality || 'No personality description available.';
        
        // Emergency contact
        document.getElementById('overview-emergency-contact').textContent = pet.emergency_contact || 'No emergency contact information.';
        
        // Microchip
        document.getElementById('overview-microchip').textContent = pet.microchip_id || '-';
    }

    updateHealthTab() {
        const healthSummary = this.pet.health_summary || {};
        
        // Health status
        const statusEl = document.getElementById('health-status-display');
        const isHealthy = healthSummary.active_conditions === 0;
        statusEl.innerHTML = `
            <span class="status-indicator ${isHealthy ? 'healthy' : 'warning'}"></span>
            <span>${isHealthy ? 'Healthy' : 'Has Health Conditions'}</span>
        `;
        
        // Health stats
        document.getElementById('health-conditions-count').textContent = healthSummary.active_conditions || 0;
        document.getElementById('allergies-count').textContent = healthSummary.allergies_count || 0;
        
        // Health conditions list
        this.renderHealthConditions();
        
        // Allergies list
        this.renderAllergies();
    }

    renderHealthConditions() {
        const container = document.getElementById('health-conditions-list');
        const conditions = this.pet.health_conditions || [];
        
        if (conditions.length === 0) {
            container.innerHTML = '<p class="empty-message">No health conditions recorded.</p>';
            return;
        }
        
        container.innerHTML = conditions.map(condition => `
            <div class="health-condition-item">
                <div class="condition-header">
                    <h5>${condition.condition_name}</h5>
                    <span class="severity-badge severity-${condition.severity}">${condition.severity}</span>
                </div>
                <p class="condition-notes">${condition.notes || 'No additional notes.'}</p>
                <div class="condition-meta">
                    <span>Diagnosed: ${condition.diagnosis_date || 'Unknown'}</span>
                    <span class="status-${condition.status}">${condition.status}</span>
                </div>
            </div>
        `).join('');
    }

    renderAllergies() {
        const container = document.getElementById('allergies-list');
        const allergies = this.pet.allergies || [];
        
        if (allergies.length === 0) {
            container.innerHTML = '<p class="empty-message">No allergies recorded.</p>';
            return;
        }
        
        container.innerHTML = allergies.map(allergy => `
            <div class="allergy-item">
                <div class="allergy-header">
                    <h5>${allergy.allergen}</h5>
                    <span class="severity-badge severity-${allergy.severity}">${allergy.severity}</span>
                </div>
                <p class="allergy-reaction">${allergy.reaction_type || 'No reaction details.'}</p>
            </div>
        `).join('');
    }

    updatePhotosTab() {
        const container = document.getElementById('photos-grid');
        const photos = this.pet.photos || [];
        
        if (photos.length === 0) {
            container.innerHTML = '<p class="empty-message">No photos uploaded yet.</p>';
            return;
        }
        
        container.innerHTML = photos.map(photo => `
            <div class="photo-item">
                <img src="${photo.thumbnail_url}" alt="Pet photo" onclick="petProfile.viewPhoto('${photo.url}')">
                <div class="photo-actions">
                    ${!photo.is_primary ? `<button class="btn btn-sm btn-primary" onclick="petProfile.setPrimaryPhoto(${photo.id})">Set Primary</button>` : '<span class="primary-badge">Primary</span>'}
                    <button class="btn btn-sm btn-danger" onclick="petProfile.deletePhoto(${photo.id})">Delete</button>
                </div>
            </div>
        `).join('');
        
        // Update thumbnails in header
        this.updatePhotoThumbnails(photos);
    }

    updatePhotoThumbnails(photos) {
        const container = document.getElementById('photo-thumbnails');
        const thumbnails = photos.slice(0, 4); // Show max 4 thumbnails
        
        container.innerHTML = thumbnails.map(photo => `
            <img src="${photo.thumbnail_url}" alt="Pet photo" class="photo-thumbnail" data-photo-url="${photo.url}">
        `).join('');
    }

    updateRecordsTab() {
        const container = document.getElementById('activity-log');
        const records = this.pet.activity_log || [];
        
        if (records.length === 0) {
            container.innerHTML = '<p class="empty-message">No activity recorded yet.</p>';
            return;
        }
        
        container.innerHTML = records.map(record => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${this.getActivityIcon(record.action)}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-description">${record.description}</p>
                    <span class="activity-date">${record.created_at}</span>
                </div>
            </div>
        `).join('');
    }

    getActivityIcon(action) {
        const icons = {
            'created': 'plus',
            'updated': 'edit',
            'photo_added': 'camera',
            'health_updated': 'heartbeat',
            'weight_updated': 'weight'
        };
        return icons[action] || 'info';
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
        
        this.currentTab = tabName;
    }

    toggleEditMode() {
        this.editMode = !this.editMode;
        const btn = document.getElementById('edit-pet-btn');
        
        if (this.editMode) {
            btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            btn.classList.add('btn-success');
            btn.classList.remove('btn-primary');
            // Enable editing functionality
            this.enableEditing();
        } else {
            btn.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
            btn.classList.add('btn-primary');
            btn.classList.remove('btn-success');
            // Disable editing functionality
            this.disableEditing();
        }
    }

    enableEditing() {
        // Convert text elements to input fields
        // This would be implemented based on specific editing requirements
        console.log('Edit mode enabled');
    }

    disableEditing() {
        // Convert input fields back to text and save changes
        console.log('Edit mode disabled');
    }

    setMainPhoto(photoUrl) {
        document.getElementById('main-photo-img').src = photoUrl;
    }

    showLoading() {
        document.getElementById('profile-loading').style.display = 'block';
        document.getElementById('profile-error').style.display = 'none';
        document.getElementById('profile-content').style.display = 'none';
    }

    showError(message) {
        document.getElementById('error-message').textContent = message;
        document.getElementById('profile-loading').style.display = 'none';
        document.getElementById('profile-error').style.display = 'block';
        document.getElementById('profile-content').style.display = 'none';
    }

    retry() {
        if (this.petId) {
            this.loadPet(this.petId);
        }
    }

    // Action methods (to be implemented)
    showPhotoGallery() {
        console.log('Show photo gallery');
        // Will be implemented with photo gallery modal
    }

    uploadPhoto() {
        console.log('Upload photo');
        // Will be implemented with photo upload component
    }

    viewPhoto(photoUrl) {
        console.log('View photo:', photoUrl);
        // Will be implemented with photo viewer modal
    }

    setPrimaryPhoto(photoId) {
        console.log('Set primary photo:', photoId);
        // Will be implemented with API call
    }

    deletePhoto(photoId) {
        if (confirm('Are you sure you want to delete this photo?')) {
            console.log('Delete photo:', photoId);
            // Will be implemented with API call
        }
    }

    addHealthCondition() {
        console.log('Add health condition');
        // Will be implemented with health condition form
    }

    addAllergy() {
        console.log('Add allergy');
        // Will be implemented with allergy form
    }

    exportProfile() {
        console.log('Export profile');
        // Will be implemented with export functionality
    }

    shareProfile() {
        console.log('Share profile');
        // Will be implemented with sharing functionality
    }

    deletePet() {
        if (confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
            console.log('Delete pet');
            // Will be implemented with delete functionality
        }
    }
}

// Initialize global pet profile instance
let petProfile;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('pet-profile-container')) {
        petProfile = new PetProfileComponent('pet-profile-container');
        
        // Load pet from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const petId = urlParams.get('id');
        if (petId) {
            petProfile.loadPet(petId);
        }
    }
});