/**
 * Pet List Component
 * Handles displaying, filtering, and managing the pet list interface
 */

class PetListComponent {
    constructor() {
        this.pets = [];
        this.filteredPets = [];
        this.currentFilter = 'all';
        this.currentView = 'grid';
        this.searchQuery = '';
        this.sortBy = 'name';
        this.sortOrder = 'asc';
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPets();
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            });
        });

        // View toggle buttons
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.setView(view);
            });
        });

        // Search functionality
        this.setupSearch();
        
        // Sort functionality
        this.setupSort();
    }

    setupSearch() {
        // Create search input if it doesn't exist
        const petsHeader = document.querySelector('.pets-header');
        if (!document.querySelector('.pets-search')) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'pets-search';
            searchContainer.innerHTML = `
                <div class="search-input-container">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" id="pet-search" placeholder="Search pets by name, breed, or species..." class="search-input">
                    <button id="clear-search" class="clear-search-btn" style="display: none;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            petsHeader.appendChild(searchContainer);
        }

        const searchInput = document.getElementById('pet-search');
        const clearBtn = document.getElementById('clear-search');

        // Debounced search
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            searchTimeout = setTimeout(() => {
                this.searchQuery = query;
                this.filterAndRenderPets();
                
                // Show/hide clear button
                clearBtn.style.display = query ? 'block' : 'none';
            }, 300);
        });

        // Clear search
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            this.searchQuery = '';
            this.filterAndRenderPets();
            clearBtn.style.display = 'none';
            searchInput.focus();
        });
    }

    setupSort() {
        // Create sort dropdown if it doesn't exist
        const petsHeader = document.querySelector('.pets-header');
        if (!document.querySelector('.pets-sort')) {
            const sortContainer = document.createElement('div');
            sortContainer.className = 'pets-sort';
            sortContainer.innerHTML = `
                <select id="pet-sort" class="sort-select">
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="species-asc">Species (A-Z)</option>
                    <option value="age-asc">Age (Youngest)</option>
                    <option value="age-desc">Age (Oldest)</option>
                    <option value="weight-asc">Weight (Lightest)</option>
                    <option value="weight-desc">Weight (Heaviest)</option>
                    <option value="updated-desc">Recently Updated</option>
                </select>
            `;
            petsHeader.appendChild(sortContainer);
        }

        document.getElementById('pet-sort').addEventListener('change', (e) => {
            const [sortBy, sortOrder] = e.target.value.split('-');
            this.sortBy = sortBy;
            this.sortOrder = sortOrder;
            this.filterAndRenderPets();
        });
    }

    async loadPets() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();

        try {
            // Create retry-enabled operation
            const operation = async () => {
                const response = await fetch('/api/pets.php', {
                    method: 'GET',
                    credentials: 'same-origin'
                });

                if (!response.ok) {
                    const error = new Error(`HTTP error! status: ${response.status}`);
                    error.status = response.status;
                    throw error;
                }

                const data = await response.json();
                
                if (!data.success) {
                    const error = new Error(data.error || 'Failed to load pets');
                    error.status = 500;
                    throw error;
                }
                
                return data;
            };

            // Execute with retry logic
            const data = await (window.retryManager ? 
                window.retryManager.execute(operation, 'pet-list', {
                    maxRetries: 3,
                    baseDelay: 1000,
                    onRetry: (error, attempt, delay) => {
                        this.showRetryNotification(error, attempt, delay);
                    },
                    onFailure: (error, retryState) => {
                        console.error('All retry attempts failed for pet list:', error);
                    }
                }) : 
                operation()
            );
            
            this.pets = data.pets || [];
            this.filterAndRenderPets();
            this.updatePetCount();
            
        } catch (error) {
            console.error('Error loading pets:', error);
            this.showError('Failed to load pets. Please try again.');
        } finally {
            this.isLoading = false;
        }
    }

    setFilter(filter) {
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        this.currentFilter = filter;
        this.filterAndRenderPets();
    }

    setView(view) {
        // Update active view button
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        this.currentView = view;
        this.renderPets();
    }

    filterAndRenderPets() {
        let filtered = [...this.pets];

        // Apply species filter
        if (this.currentFilter !== 'all') {
            if (this.currentFilter === 'dogs') {
                filtered = filtered.filter(pet => pet.species === 'dog');
            } else if (this.currentFilter === 'cats') {
                filtered = filtered.filter(pet => pet.species === 'cat');
            } else if (this.currentFilter === 'other') {
                filtered = filtered.filter(pet => !['dog', 'cat'].includes(pet.species));
            }
        }

        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(pet => 
                pet.name.toLowerCase().includes(query) ||
                (pet.breed && pet.breed.toLowerCase().includes(query)) ||
                pet.species.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aVal, bVal;
            
            switch (this.sortBy) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'species':
                    aVal = a.species.toLowerCase();
                    bVal = b.species.toLowerCase();
                    break;
                case 'age':
                    aVal = a.age || 0;
                    bVal = b.age || 0;
                    break;
                case 'weight':
                    aVal = a.weight || 0;
                    bVal = b.weight || 0;
                    break;
                case 'updated':
                    aVal = new Date(a.updated_at);
                    bVal = new Date(b.updated_at);
                    break;
                default:
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
            }

            if (this.sortOrder === 'desc') {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            } else {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            }
        });

        this.filteredPets = filtered;
        this.renderPets();
        this.updateFilterCounts();
    }

    renderPets() {
        const container = document.getElementById('pets-container');
        
        if (this.filteredPets.length === 0) {
            this.showEmptyState();
            return;
        }

        // Update container class based on view
        container.className = this.currentView === 'grid' ? 'pets-grid' : 'pets-list';

        const petsHtml = this.filteredPets.map(pet => {
            return this.currentView === 'grid' ? this.renderPetCard(pet) : this.renderPetListItem(pet);
        }).join('');

        container.innerHTML = petsHtml;

        // Add event listeners to pet items
        this.attachPetEventListeners();
    }

    renderPetCard(pet) {
        const primaryPhoto = pet.primary_photo;
        const photoUrl = primaryPhoto ? primaryPhoto.thumbnail_url : '/assets/images/default-pet.png';
        const ageText = pet.age ? `${pet.age} years old` : 'Age unknown';
        const weightText = `${pet.weight}kg`;
        const healthStatus = pet.health_status || 'healthy';
        const weightStatus = pet.weight_status || 'normal';
        const photoCount = pet.photo_count || 0;

        return `
            <div class="pet-card" data-pet-id="${pet.id}">
                <div class="pet-photo-container">
                    <div class="pet-photo" onclick="petList.showPhotoCarousel(${pet.id})">
                        <img src="${photoUrl}" alt="${pet.name}" class="pet-image" loading="lazy">
                        <div class="pet-species-badge">${this.capitalizeFirst(pet.species)}</div>
                        ${weightStatus !== 'normal' ? `<div class="weight-status-badge ${weightStatus}">${weightStatus}</div>` : ''}
                        ${photoCount > 1 ? `<div class="photo-count-badge"><i class="fas fa-images"></i> ${photoCount}</div>` : ''}
                        <div class="photo-overlay">
                            <i class="fas fa-expand"></i>
                        </div>
                    </div>
                    <div class="photo-actions">
                        <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); petList.uploadPhoto(${pet.id})" title="Upload Photo">
                            <i class="fas fa-camera"></i>
                        </button>
                        ${photoCount > 0 ? `
                            <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); petList.showPhotoGallery(${pet.id})" title="View Gallery">
                                <i class="fas fa-images"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="pet-info">
                    <h3 class="pet-name">${this.escapeHtml(pet.name)}</h3>
                    <p class="pet-breed">${pet.breed ? this.escapeHtml(pet.breed) : 'Mixed breed'}</p>
                    <div class="pet-details">
                        <span class="pet-age"><i class="fas fa-birthday-cake"></i> ${ageText}</span>
                        <span class="pet-weight"><i class="fas fa-weight"></i> ${weightText}</span>
                    </div>
                    <div class="pet-activity">
                        <span class="activity-level ${pet.activity_level}">
                            <i class="fas fa-bolt"></i> ${this.capitalizeFirst(pet.activity_level)} activity
                        </span>
                    </div>
                </div>
                <div class="pet-actions">
                    <button class="btn btn-sm btn-primary" onclick="petList.viewPet(${pet.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="petList.editPet(${pet.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        `;
    }

    renderPetListItem(pet) {
        const primaryPhoto = pet.primary_photo;
        const photoUrl = primaryPhoto ? primaryPhoto.thumbnail_url : '/assets/images/default-pet.png';
        const ageText = pet.age ? `${pet.age} years old` : 'Age unknown';
        const healthSummary = pet.health_summary || {};

        return `
            <div class="pet-list-item" data-pet-id="${pet.id}">
                <div class="pet-list-photo">
                    <img src="${photoUrl}" alt="${pet.name}" class="pet-image" loading="lazy">
                </div>
                <div class="pet-list-info">
                    <div class="pet-list-main">
                        <h3 class="pet-name">${this.escapeHtml(pet.name)}</h3>
                        <span class="pet-species">${this.capitalizeFirst(pet.species)}</span>
                        ${pet.breed ? `<span class="pet-breed">${this.escapeHtml(pet.breed)}</span>` : ''}
                    </div>
                    <div class="pet-list-details">
                        <span>${ageText}</span>
                        <span>${pet.weight}kg</span>
                        <span class="activity-${pet.activity_level}">${this.capitalizeFirst(pet.activity_level)} activity</span>
                        ${healthSummary.active_conditions > 0 ? `<span class="health-conditions">${healthSummary.active_conditions} health condition(s)</span>` : ''}
                    </div>
                </div>
                <div class="pet-list-actions">
                    <button class="btn btn-sm btn-primary" onclick="petList.viewPet(${pet.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="petList.editPet(${pet.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <div class="pet-list-menu">
                        <button class="btn btn-sm btn-ghost" onclick="petList.showPetMenu(${pet.id}, event)">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachPetEventListeners() {
        // Add click handlers for pet cards/items
        document.querySelectorAll('.pet-card, .pet-list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking on buttons
                if (e.target.closest('button')) return;
                
                const petId = parseInt(item.dataset.petId);
                this.viewPet(petId);
            });
        });
    }

    showLoading() {
        const container = document.getElementById('pets-container');
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading your pets...</p>
            </div>
        `;
    }

    showError(message) {
        const container = document.getElementById('pets-container');
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Oops! Something went wrong</h3>
                <p>${this.escapeHtml(message)}</p>
                <button class="btn btn-primary" onclick="petList.loadPets()">
                    <i class="fas fa-refresh"></i> Try Again
                </button>
            </div>
        `;
    }

    showEmptyState() {
        const container = document.getElementById('pets-container');
        const isFiltered = this.currentFilter !== 'all' || this.searchQuery;
        
        if (isFiltered) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No pets found</h3>
                    <p>No pets match your current filters. Try adjusting your search or filters.</p>
                    <button class="btn btn-outline" onclick="petList.clearFilters()">
                        <i class="fas fa-times"></i> Clear Filters
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-paw"></i>
                    <h3>No pets yet</h3>
                    <p>Start by adding your first pet to begin tracking their nutrition and health.</p>
                    <button class="btn btn-primary" onclick="showAddPet()">
                        <i class="fas fa-plus"></i> Add Your First Pet
                    </button>
                </div>
            `;
        }
    }

    updatePetCount() {
        // Update pets count in navigation badge
        const badge = document.getElementById('pets-count');
        if (badge) {
            badge.textContent = this.pets.length;
        }
    }

    updateFilterCounts() {
        const dogCount = this.pets.filter(pet => pet.species === 'dog').length;
        const catCount = this.pets.filter(pet => pet.species === 'cat').length;
        const otherCount = this.pets.filter(pet => !['dog', 'cat'].includes(pet.species)).length;

        // Update filter button text with counts
        const buttons = {
            'all': `All Pets (${this.pets.length})`,
            'dogs': `Dogs (${dogCount})`,
            'cats': `Cats (${catCount})`,
            'other': `Other (${otherCount})`
        };

        Object.entries(buttons).forEach(([filter, text]) => {
            const btn = document.querySelector(`[data-filter="${filter}"]`);
            if (btn) {
                btn.textContent = text;
            }
        });
    }

    clearFilters() {
        this.currentFilter = 'all';
        this.searchQuery = '';
        
        // Reset UI
        document.querySelector('[data-filter="all"]').classList.add('active');
        document.querySelectorAll('.filter-btn:not([data-filter="all"])').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const searchInput = document.getElementById('pet-search');
        if (searchInput) {
            searchInput.value = '';
        }
        
        const clearBtn = document.getElementById('clear-search');
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }

        this.filterAndRenderPets();
    }

    // Pet action methods
    viewPet(petId) {
        // Navigate to pet detail view or show modal
        console.log('Viewing pet:', petId);
        // TODO: Implement pet detail view
    }

    editPet(petId) {
        // Show edit pet modal or navigate to edit page
        console.log('Editing pet:', petId);
        // TODO: Implement pet edit functionality
    }

    showPetMenu(petId, event) {
        event.stopPropagation();
        // Show context menu for pet actions
        console.log('Showing menu for pet:', petId);
        // TODO: Implement pet context menu
    }

    // Photo-related methods
    async uploadPhoto(petId) {
        // Create file input for photo upload
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = false;
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const formData = new FormData();
                formData.append('photo', file);
                
                const response = await fetch(`/api/photos.php/pets/${petId}`, {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.showMessage('Photo uploaded successfully!', 'success');
                    this.loadPets(); // Refresh to show new photo
                    
                    // Trigger photo uploaded event
                    document.dispatchEvent(new CustomEvent('photoUploaded', {
                        detail: { petId, photo: data.photo }
                    }));
                } else {
                    throw new Error(data.error || 'Failed to upload photo');
                }
                
            } catch (error) {
                console.error('Error uploading photo:', error);
                this.showMessage('Failed to upload photo: ' + error.message, 'error');
            }
        };
        
        input.click();
    }
    
    async showPhotoCarousel(petId) {
        try {
            const response = await fetch(`/api/photos.php/pets/${petId}`, {
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success && data.photos && data.photos.length > 0) {
                this.createPhotoCarouselModal(petId, data.photos);
            } else {
                this.showMessage('No photos found for this pet', 'info');
            }
            
        } catch (error) {
            console.error('Error loading photos:', error);
            this.showMessage('Failed to load photos', 'error');
        }
    }
    
    createPhotoCarouselModal(petId, photos) {
        const pet = this.pets.find(p => p.id === petId);
        const petName = pet ? pet.name : 'Pet';
        
        const modal = document.createElement('div');
        modal.className = 'photo-carousel-modal-overlay';
        modal.innerHTML = `
            <div class="photo-carousel-modal">
                <div class="carousel-header">
                    <h4><i class="fas fa-images"></i> ${this.escapeHtml(petName)} Photos</h4>
                    <button class="carousel-close" onclick="this.closest('.photo-carousel-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="carousel-container">
                    <div class="carousel-main">
                        <button class="carousel-nav prev" onclick="petList.prevPhoto()" ${photos.length <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        
                        <div class="carousel-image-container">
                            <img id="carousel-main-image" src="${photos[0].url}" alt="${petName} photo" class="carousel-main-image">
                            ${photos[0].is_primary ? '<div class="primary-indicator"><i class="fas fa-star"></i> Primary Photo</div>' : ''}
                        </div>
                        
                        <button class="carousel-nav next" onclick="petList.nextPhoto()" ${photos.length <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    
                    ${photos.length > 1 ? `
                        <div class="carousel-thumbnails">
                            ${photos.map((photo, index) => `
                                <div class="carousel-thumbnail ${index === 0 ? 'active' : ''}" 
                                     onclick="petList.showCarouselPhoto(${index})" 
                                     data-index="${index}">
                                    <img src="${photo.thumbnail_url || photo.url}" alt="${petName} photo ${index + 1}">
                                    ${photo.is_primary ? '<div class="thumbnail-primary"><i class="fas fa-star"></i></div>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="carousel-actions">
                    <button class="btn btn-outline" onclick="petList.uploadPhoto(${petId}); this.closest('.photo-carousel-modal-overlay').remove()">
                        <i class="fas fa-plus"></i> Add Photo
                    </button>
                    <button class="btn btn-outline" onclick="petList.setPrimaryPhoto(${petId})">
                        <i class="fas fa-star"></i> Set as Primary
                    </button>
                    <button class="btn btn-danger" onclick="petList.deleteCurrentPhoto(${petId})">
                        <i class="fas fa-trash"></i> Delete Photo
                    </button>
                </div>
            </div>
        `;
        
        // Store photos data for carousel navigation
        modal.carouselPhotos = photos;
        modal.currentPhotoIndex = 0;
        modal.petId = petId;
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
        this.currentCarouselModal = modal;
    }
    
    showPhotoGallery(petId) {
        // This is the same as showPhotoCarousel for now
        this.showPhotoCarousel(petId);
    }
    
    prevPhoto() {
        if (!this.currentCarouselModal) return;
        
        const photos = this.currentCarouselModal.carouselPhotos;
        let currentIndex = this.currentCarouselModal.currentPhotoIndex;
        
        currentIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
        this.showCarouselPhoto(currentIndex);
    }
    
    nextPhoto() {
        if (!this.currentCarouselModal) return;
        
        const photos = this.currentCarouselModal.carouselPhotos;
        let currentIndex = this.currentCarouselModal.currentPhotoIndex;
        
        currentIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
        this.showCarouselPhoto(currentIndex);
    }
    
    showCarouselPhoto(index) {
        if (!this.currentCarouselModal) return;
        
        const photos = this.currentCarouselModal.carouselPhotos;
        const photo = photos[index];
        
        if (!photo) return;
        
        // Update main image
        const mainImage = this.currentCarouselModal.querySelector('#carousel-main-image');
        mainImage.src = photo.url;
        
        // Update primary indicator
        const primaryIndicator = this.currentCarouselModal.querySelector('.primary-indicator');
        if (primaryIndicator) {
            primaryIndicator.style.display = photo.is_primary ? 'block' : 'none';
        }
        
        // Update active thumbnail
        this.currentCarouselModal.querySelectorAll('.carousel-thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
        
        // Update current index
        this.currentCarouselModal.currentPhotoIndex = index;
    }
    
    async setPrimaryPhoto(petId) {
        if (!this.currentCarouselModal) return;
        
        const photos = this.currentCarouselModal.carouselPhotos;
        const currentIndex = this.currentCarouselModal.currentPhotoIndex;
        const photo = photos[currentIndex];
        
        if (!photo || photo.is_primary) return;
        
        try {
            const response = await fetch(`/api/photos.php/${photo.id}/primary`, {
                method: 'PUT',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showMessage('Primary photo updated!', 'success');
                this.loadPets(); // Refresh to show new primary photo
                this.currentCarouselModal.remove();
            } else {
                throw new Error(data.error || 'Failed to set primary photo');
            }
            
        } catch (error) {
            console.error('Error setting primary photo:', error);
            this.showMessage('Failed to set primary photo: ' + error.message, 'error');
        }
    }
    
    async deleteCurrentPhoto(petId) {
        if (!this.currentCarouselModal) return;
        
        const photos = this.currentCarouselModal.carouselPhotos;
        const currentIndex = this.currentCarouselModal.currentPhotoIndex;
        const photo = photos[currentIndex];
        
        if (!photo) return;
        
        if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/photos.php/${photo.id}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showMessage('Photo deleted successfully!', 'success');
                this.loadPets(); // Refresh to remove deleted photo
                this.currentCarouselModal.remove();
            } else {
                throw new Error(data.error || 'Failed to delete photo');
            }
            
        } catch (error) {
            console.error('Error deleting photo:', error);
            this.showMessage('Failed to delete photo: ' + error.message, 'error');
        }
    }
    
    showMessage(message, type = 'info') {
        // Simple message display - could be enhanced with a toast library
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Utility methods
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Public methods for external access
    refresh() {
        this.loadPets();
    }

    addPet(petData) {
        this.pets.push(petData);
        this.filterAndRenderPets();
        this.updatePetCount();
    }

    updatePet(petId, petData) {
        const index = this.pets.findIndex(pet => pet.id === petId);
        if (index !== -1) {
            this.pets[index] = { ...this.pets[index], ...petData };
            this.filterAndRenderPets();
        }
    }

    removePet(petId) {
        this.pets = this.pets.filter(pet => pet.id !== petId);
        this.filterAndRenderPets();
        this.updatePetCount();
    }
    
    /**
     * Show retry notification
     */
    showRetryNotification(error, attempt, delay) {
        if (window.retryManager) {
            window.retryManager.showRetryNotification(error, attempt, delay, {
                onCancel: () => {
                    window.retryManager.cancel('pet-list');
                }
            });
        }
    }
}

// Initialize pet list component when DOM is ready
let petList;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('pets-container')) {
        petList = new PetListComponent();
        
        // Make it globally accessible
        window.petList = petList;
    }
});