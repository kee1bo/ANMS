/**
 * Photo Gallery Quick Access Component
 * Provides quick access to pet photo galleries from the dashboard
 */
class PhotoGalleryQuickAccess {
    constructor(apiClient = null) {
        this.apiClient = apiClient || this.createDefaultApiClient();
        this.recentPhotos = [];
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadRecentPhotos();
    }
    
    /**
     * Create default API client
     */
    createDefaultApiClient() {
        return {
            get: async (url) => {
                const response = await fetch(url, {
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return response.json();
            }
        };
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for photo-related events
        document.addEventListener('photoUploaded', () => this.loadRecentPhotos());
        document.addEventListener('photoDeleted', () => this.loadRecentPhotos());
        document.addEventListener('photoPrimaryChanged', () => this.loadRecentPhotos());
        
        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadRecentPhotos();
            }
        });
    }
    
    /**
     * Load recent photos from all pets
     */
    async loadRecentPhotos() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        try {
            // First get all pets
            const petsResponse = await this.apiClient.get('/api/pets.php');
            
            if (!petsResponse.success || !petsResponse.pets) {
                this.recentPhotos = [];
                this.renderPhotoGallery();
                return;
            }
            
            // Get photos for each pet
            const allPhotos = [];
            for (const pet of petsResponse.pets) {
                try {
                    const photosResponse = await this.apiClient.get(`/api/photos.php/pets/${pet.id}`);
                    
                    if (photosResponse.success && photosResponse.photos) {
                        // Add pet name to each photo
                        const petPhotos = photosResponse.photos.map(photo => ({
                            ...photo,
                            pet_name: pet.name,
                            pet_species: pet.species
                        }));
                        allPhotos.push(...petPhotos);
                    }
                } catch (error) {
                    console.warn(`Failed to load photos for pet ${pet.id}:`, error);
                }
            }
            
            // Sort by upload date and take the most recent
            this.recentPhotos = allPhotos
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 6); // Show last 6 photos
            
            this.renderPhotoGallery();
            
        } catch (error) {
            console.error('Error loading recent photos:', error);
            this.recentPhotos = [];
            this.renderPhotoGallery();
        } finally {
            this.isLoading = false;
        }
    }
    
    /**
     * Render photo gallery quick access
     */
    renderPhotoGallery() {
        const container = document.getElementById('photo-gallery-quick-access');
        if (!container) return;
        
        if (this.isLoading) {
            container.innerHTML = `
                <div class="photo-gallery-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading photos...</span>
                </div>
            `;
            return;
        }
        
        if (this.recentPhotos.length === 0) {
            container.innerHTML = `
                <div class="photo-gallery-empty">
                    <div class="empty-icon">
                        <i class="fas fa-camera"></i>
                    </div>
                    <div class="empty-text">
                        <h4>No Photos Yet</h4>
                        <p>Upload photos of your pets to see them here</p>
                    </div>
                    <div class="empty-actions">
                        <button class="btn btn-primary btn-sm" onclick="photoGalleryQuickAccess.showUploadModal()">
                            <i class="fas fa-plus"></i> Upload First Photo
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="photo-gallery-header">
                <h4><i class="fas fa-images"></i> Recent Photos</h4>
                <button class="btn btn-outline btn-sm" onclick="photoGalleryQuickAccess.showAllPhotos()">
                    <i class="fas fa-th"></i> View All
                </button>
            </div>
            
            <div class="photo-gallery-grid">
                ${this.recentPhotos.map(photo => this.renderPhotoItem(photo)).join('')}
            </div>
            
            <div class="photo-gallery-footer">
                <button class="btn btn-ghost btn-sm" onclick="photoGalleryQuickAccess.showUploadModal()">
                    <i class="fas fa-plus"></i> Upload More Photos
                </button>
            </div>
        `;
    }
    
    /**
     * Render a single photo item
     */
    renderPhotoItem(photo) {
        const thumbnailUrl = `/uploads/pets/thumbnails/${photo.filename}`;
        const fullUrl = `/uploads/pets/${photo.filename}`;
        
        return `
            <div class="photo-gallery-item" onclick="photoGalleryQuickAccess.showPhotoModal('${fullUrl}', '${photo.pet_name}', ${photo.pet_id})">
                <div class="photo-item-image">
                    <img src="${thumbnailUrl}" alt="${photo.pet_name} photo" onerror="this.src='${fullUrl}'" loading="lazy">
                    ${photo.is_primary ? '<div class="primary-badge"><i class="fas fa-star"></i></div>' : ''}
                </div>
                <div class="photo-item-info">
                    <div class="photo-pet-name">${this.escapeHtml(photo.pet_name)}</div>
                    <div class="photo-upload-date">${this.formatDate(photo.created_at)}</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Show photo modal
     */
    showPhotoModal(photoUrl, petName, petId) {
        const modal = document.createElement('div');
        modal.className = 'photo-modal-overlay';
        modal.innerHTML = `
            <div class="photo-modal-content">
                <div class="photo-modal-header">
                    <h4><i class="fas fa-camera"></i> ${this.escapeHtml(petName)} Photo</h4>
                    <button class="photo-modal-close" onclick="this.closest('.photo-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="photo-modal-body">
                    <img src="${photoUrl}" alt="${this.escapeHtml(petName)} photo" class="photo-modal-image">
                </div>
                <div class="photo-modal-actions">
                    <button class="btn btn-outline" onclick="photoGalleryQuickAccess.viewPetGallery(${petId}); this.closest('.photo-modal-overlay').remove()">
                        <i class="fas fa-images"></i> View Pet Gallery
                    </button>
                    <button class="btn btn-outline" onclick="window.open('${photoUrl}', '_blank')">
                        <i class="fas fa-external-link-alt"></i> Open Full Size
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.photo-modal-overlay').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Close modal with Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        document.body.appendChild(modal);
    }
    
    /**
     * Show upload modal
     */
    showUploadModal() {
        // This would typically open the photo upload component
        if (typeof showPhotoUpload === 'function') {
            showPhotoUpload();
        } else {
            alert('Photo upload functionality will be available soon!');
        }
    }
    
    /**
     * Show all photos
     */
    showAllPhotos() {
        // This would typically open a full photo gallery view
        if (typeof showFullPhotoGallery === 'function') {
            showFullPhotoGallery();
        } else {
            alert('Full photo gallery view will be available soon!');
        }
    }
    
    /**
     * View specific pet gallery
     */
    viewPetGallery(petId) {
        // This would typically open the pet's photo gallery
        if (typeof showPetPhotoGallery === 'function') {
            showPetPhotoGallery(petId);
        } else if (typeof openPetDashboard === 'function') {
            openPetDashboard(petId);
        } else {
            alert(`Pet gallery for pet ${petId} will be available soon!`);
        }
    }
    
    /**
     * Helper methods
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Refresh photos
     */
    refresh() {
        return this.loadRecentPhotos();
    }
    
    /**
     * Destroy component
     */
    destroy() {
        this.recentPhotos = [];
    }
}

// Initialize photo gallery quick access when DOM is ready
let photoGalleryQuickAccess = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('photo-gallery-quick-access')) {
            photoGalleryQuickAccess = new PhotoGalleryQuickAccess();
            window.photoGalleryQuickAccess = photoGalleryQuickAccess;
        }
    });
} else {
    if (document.getElementById('photo-gallery-quick-access')) {
        photoGalleryQuickAccess = new PhotoGalleryQuickAccess();
        window.photoGalleryQuickAccess = photoGalleryQuickAccess;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhotoGalleryQuickAccess;
}