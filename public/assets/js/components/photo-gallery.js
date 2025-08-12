/**
 * Photo Gallery Management Component
 * Comprehensive photo management with gallery view, metadata, and accessibility
 */
class PhotoGalleryComponent {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.petId = options.petId || null;
        this.photos = [];
        this.currentView = options.defaultView || 'grid'; // 'grid' or 'list'
        this.selectedPhotos = new Set();
        this.currentPhotoIndex = 0;
        this.isLightboxOpen = false;
        this.sortBy = options.sortBy || 'upload_date';
        this.sortOrder = options.sortOrder || 'desc';
        
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        if (this.petId) {
            this.loadPhotos();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="photo-gallery-container">
                <!-- Gallery Header -->
                <div class="gallery-header">
                    <div class="gallery-title">
                        <h3><i class="fas fa-images"></i> Photo Gallery</h3>
                        <span class="photo-count" id="photo-count">0 photos</span>
                    </div>
                    <div class="gallery-controls">
                        <div class="view-controls">
                            <button class="view-btn ${this.currentView === 'grid' ? 'active' : ''}" 
                                    data-view="grid" title="Grid View">
                                <i class="fas fa-th"></i>
                            </button>
                            <button class="view-btn ${this.currentView === 'list' ? 'active' : ''}" 
                                    data-view="list" title="List View">
                                <i class="fas fa-list"></i>
                            </button>
                        </div>
                        <div class="sort-controls">
                            <select id="sort-select" class="sort-select">
                                <option value="upload_date-desc">Newest First</option>
                                <option value="upload_date-asc">Oldest First</option>
                                <option value="file_name-asc">Name (A-Z)</option>
                                <option value="file_name-desc">Name (Z-A)</option>
                                <option value="file_size-desc">Largest First</option>
                                <option value="file_size-asc">Smallest First</option>
                            </select>
                        </div>
                        <div class="action-controls">
                            <button class="btn btn-sm btn-primary" id="upload-photos-btn">
                                <i class="fas fa-upload"></i> Upload
                            </button>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline dropdown-toggle" id="bulk-actions-btn">
                                    <i class="fas fa-ellipsis-v"></i> Actions
                                </button>
                                <div class="dropdown-menu">
                                    <a href="#" onclick="photoGallery.selectAll()">Select All</a>
                                    <a href="#" onclick="photoGallery.deselectAll()">Deselect All</a>
                                    <div class="dropdown-divider"></div>
                                    <a href="#" onclick="photoGallery.downloadSelected()">Download Selected</a>
                                    <a href="#" onclick="photoGallery.deleteSelected()" class="text-danger">Delete Selected</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Selection Info -->
                <div class="selection-info" id="selection-info" style="display: none;">
                    <div class="selection-text">
                        <span id="selection-count">0</span> photos selected
                    </div>
                    <div class="selection-actions">
                        <button class="btn btn-sm btn-secondary" onclick="photoGallery.deselectAll()">
                            Clear Selection
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="photoGallery.setPrimaryFromSelection()">
                            Set as Primary
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="photoGallery.deleteSelected()">
                            Delete Selected
                        </button>
                    </div>
                </div>

                <!-- Loading State -->
                <div class="loading-state" id="gallery-loading">
                    <div class="spinner"></div>
                    <p>Loading photos...</p>
                </div>

                <!-- Empty State -->
                <div class="empty-state" id="gallery-empty" style="display: none;">
                    <div class="empty-icon">
                        <i class="fas fa-images"></i>
                    </div>
                    <h4>No Photos Yet</h4>
                    <p>Upload some photos to get started!</p>
                    <button class="btn btn-primary" onclick="photoGallery.showUploadModal()">
                        <i class="fas fa-upload"></i> Upload Photos
                    </button>
                </div>

                <!-- Photo Grid/List -->
                <div class="photo-gallery-content" id="gallery-content" style="display: none;">
                    <div class="photos-container ${this.currentView}-view" id="photos-container">
                        <!-- Photos will be rendered here -->
                    </div>
                </div>

                <!-- Error State -->
                <div class="error-state" id="gallery-error" style="display: none;">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h4>Error Loading Photos</h4>
                    <p id="error-message">Failed to load photos.</p>
                    <button class="btn btn-primary" onclick="photoGallery.retry()">
                        <i class="fas fa-refresh"></i> Try Again
                    </button>
                </div>
            </div>

            <!-- Lightbox Modal -->
            <div class="lightbox-modal" id="lightbox-modal" style="display: none;">
                <div class="lightbox-overlay" onclick="photoGallery.closeLightbox()"></div>
                <div class="lightbox-content">
                    <div class="lightbox-header">
                        <div class="lightbox-info">
                            <h4 id="lightbox-title">Photo</h4>
                            <span id="lightbox-counter">1 of 1</span>
                        </div>
                        <div class="lightbox-actions">
                            <button class="lightbox-btn" onclick="photoGallery.downloadCurrentPhoto()" title="Download">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="lightbox-btn" onclick="photoGallery.setPrimaryPhoto()" title="Set as Primary">
                                <i class="fas fa-star"></i>
                            </button>
                            <button class="lightbox-btn" onclick="photoGallery.deleteCurrentPhoto()" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                            <button class="lightbox-btn" onclick="photoGallery.closeLightbox()" title="Close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="lightbox-image-container">
                        <button class="lightbox-nav lightbox-prev" onclick="photoGallery.previousPhoto()" title="Previous">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <img id="lightbox-image" src="" alt="Photo">
                        <button class="lightbox-nav lightbox-next" onclick="photoGallery.nextPhoto()" title="Next">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="lightbox-metadata">
                        <div class="metadata-item">
                            <label>File Name:</label>
                            <span id="meta-filename">-</span>
                        </div>
                        <div class="metadata-item">
                            <label>File Size:</label>
                            <span id="meta-filesize">-</span>
                        </div>
                        <div class="metadata-item">
                            <label>Upload Date:</label>
                            <span id="meta-upload-date">-</span>
                        </div>
                        <div class="metadata-item">
                            <label>Dimensions:</label>
                            <span id="meta-dimensions">-</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Photo Upload Modal -->
            <div class="upload-modal" id="upload-modal" style="display: none;">
                <div class="upload-modal-content">
                    <div class="upload-modal-header">
                        <h4>Upload Photos</h4>
                        <button class="close-btn" onclick="photoGallery.closeUploadModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="upload-modal-body">
                        <div id="photo-upload-container-modal"></div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.setView(view);
            });
        });

        // Sort change
        document.getElementById('sort-select').addEventListener('change', (e) => {
            const [field, order] = e.target.value.split('-');
            this.sortBy = field;
            this.sortOrder = order;
            this.sortPhotos();
            this.renderPhotos();
        });

        // Upload button
        document.getElementById('upload-photos-btn').addEventListener('click', () => {
            this.showUploadModal();
        });

        // Dropdown toggle
        document.getElementById('bulk-actions-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = e.currentTarget.nextElementSibling;
            dropdown.classList.toggle('show');
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        });

        // Keyboard navigation for lightbox
        document.addEventListener('keydown', (e) => {
            if (this.isLightboxOpen) {
                switch (e.key) {
                    case 'Escape':
                        this.closeLightbox();
                        break;
                    case 'ArrowLeft':
                        this.previousPhoto();
                        break;
                    case 'ArrowRight':
                        this.nextPhoto();
                        break;
                    case 'Delete':
                        this.deleteCurrentPhoto();
                        break;
                }
            }
        });
    }

    async loadPhotos() {
        try {
            this.showLoading();
            
            const url = this.petId ? `/api/photos.php?pet_id=${this.petId}` : '/api/photos.php';
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.photos = data.photos || [];
                this.sortPhotos();
                this.displayPhotos();
            } else {
                throw new Error(data.error || 'Failed to load photos');
            }
        } catch (error) {
            console.error('Error loading photos:', error);
            this.showError(error.message);
        }
    }

    sortPhotos() {
        this.photos.sort((a, b) => {
            let aVal = a[this.sortBy];
            let bVal = b[this.sortBy];
            
            // Handle null values
            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';
            
            // Convert to appropriate types for comparison
            if (this.sortBy === 'file_size') {
                aVal = parseInt(aVal) || 0;
                bVal = parseInt(bVal) || 0;
            } else if (this.sortBy === 'upload_date') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else {
                aVal = aVal.toString().toLowerCase();
                bVal = bVal.toString().toLowerCase();
            }
            
            let comparison = 0;
            if (aVal < bVal) comparison = -1;
            if (aVal > bVal) comparison = 1;
            
            return this.sortOrder === 'desc' ? -comparison : comparison;
        });
    }

    displayPhotos() {
        this.hideAllStates();
        
        if (this.photos.length === 0) {
            document.getElementById('gallery-empty').style.display = 'block';
            return;
        }
        
        document.getElementById('gallery-content').style.display = 'block';
        this.updatePhotoCount();
        this.renderPhotos();
    }

    renderPhotos() {
        const container = document.getElementById('photos-container');
        container.className = `photos-container ${this.currentView}-view`;
        
        container.innerHTML = this.photos.map((photo, index) => {
            const isSelected = this.selectedPhotos.has(photo.id);
            const isPrimary = photo.is_primary;
            
            if (this.currentView === 'grid') {
                return this.renderGridPhoto(photo, index, isSelected, isPrimary);
            } else {
                return this.renderListPhoto(photo, index, isSelected, isPrimary);
            }
        }).join('');
        
        this.attachPhotoEventListeners();
    }

    renderGridPhoto(photo, index, isSelected, isPrimary) {
        return `
            <div class="photo-item grid-item ${isSelected ? 'selected' : ''}" data-photo-id="${photo.id}">
                <div class="photo-thumbnail">
                    <img src="${photo.thumbnail_url}" alt="${photo.file_name}" 
                         onclick="photoGallery.openLightbox(${index})" loading="lazy">
                    <div class="photo-overlay">
                        <div class="photo-actions">
                            <button class="photo-action-btn" onclick="photoGallery.openLightbox(${index})" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="photo-action-btn" onclick="photoGallery.downloadPhoto(${photo.id})" title="Download">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="photo-action-btn" onclick="photoGallery.deletePhoto(${photo.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="photo-indicators">
                        ${isPrimary ? '<div class="primary-indicator" title="Primary Photo"><i class="fas fa-star"></i></div>' : ''}
                        <div class="selection-checkbox">
                            <input type="checkbox" ${isSelected ? 'checked' : ''} 
                                   onchange="photoGallery.togglePhotoSelection(${photo.id})">
                        </div>
                    </div>
                </div>
                <div class="photo-info">
                    <div class="photo-name" title="${photo.file_name}">${this.truncateFileName(photo.file_name)}</div>
                    <div class="photo-meta">
                        <span class="photo-size">${this.formatFileSize(photo.file_size)}</span>
                        <span class="photo-date">${this.formatDate(photo.upload_date)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderListPhoto(photo, index, isSelected, isPrimary) {
        return `
            <div class="photo-item list-item ${isSelected ? 'selected' : ''}" data-photo-id="${photo.id}">
                <div class="photo-thumbnail-small">
                    <img src="${photo.thumbnail_url}" alt="${photo.file_name}" 
                         onclick="photoGallery.openLightbox(${index})" loading="lazy">
                    ${isPrimary ? '<div class="primary-indicator" title="Primary Photo"><i class="fas fa-star"></i></div>' : ''}
                </div>
                <div class="photo-details">
                    <div class="photo-name">${photo.file_name}</div>
                    <div class="photo-metadata">
                        <span class="meta-item">Size: ${this.formatFileSize(photo.file_size)}</span>
                        <span class="meta-item">Uploaded: ${this.formatDate(photo.upload_date)}</span>
                        ${photo.dimensions ? `<span class="meta-item">Dimensions: ${photo.dimensions}</span>` : ''}
                    </div>
                </div>
                <div class="photo-actions-list">
                    <div class="selection-checkbox">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} 
                               onchange="photoGallery.togglePhotoSelection(${photo.id})">
                    </div>
                    <button class="btn btn-sm btn-outline" onclick="photoGallery.openLightbox(${index})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${!isPrimary ? `<button class="btn btn-sm btn-primary" onclick="photoGallery.setPrimaryPhoto(${photo.id})">
                        <i class="fas fa-star"></i> Set Primary
                    </button>` : ''}
                    <button class="btn btn-sm btn-secondary" onclick="photoGallery.downloadPhoto(${photo.id})">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="photoGallery.deletePhoto(${photo.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    attachPhotoEventListeners() {
        // Photo selection checkboxes are handled by inline onchange events
        // Photo actions are handled by inline onclick events
    }

    setView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        this.renderPhotos();
    }

    togglePhotoSelection(photoId) {
        if (this.selectedPhotos.has(photoId)) {
            this.selectedPhotos.delete(photoId);
        } else {
            this.selectedPhotos.add(photoId);
        }
        
        this.updateSelectionInfo();
        this.renderPhotos();
    }

    selectAll() {
        this.photos.forEach(photo => {
            this.selectedPhotos.add(photo.id);
        });
        this.updateSelectionInfo();
        this.renderPhotos();
    }

    deselectAll() {
        this.selectedPhotos.clear();
        this.updateSelectionInfo();
        this.renderPhotos();
    }

    updateSelectionInfo() {
        const selectionInfo = document.getElementById('selection-info');
        const selectionCount = document.getElementById('selection-count');
        
        if (this.selectedPhotos.size > 0) {
            selectionInfo.style.display = 'flex';
            selectionCount.textContent = this.selectedPhotos.size;
        } else {
            selectionInfo.style.display = 'none';
        }
    }

    updatePhotoCount() {
        const countEl = document.getElementById('photo-count');
        const count = this.photos.length;
        countEl.textContent = `${count} photo${count !== 1 ? 's' : ''}`;
    }

    openLightbox(index) {
        this.currentPhotoIndex = index;
        this.isLightboxOpen = true;
        
        const modal = document.getElementById('lightbox-modal');
        modal.style.display = 'flex';
        
        this.updateLightboxContent();
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
        this.isLightboxOpen = false;
        document.getElementById('lightbox-modal').style.display = 'none';
        document.body.style.overflow = '';
    }

    previousPhoto() {
        if (this.currentPhotoIndex > 0) {
            this.currentPhotoIndex--;
            this.updateLightboxContent();
        }
    }

    nextPhoto() {
        if (this.currentPhotoIndex < this.photos.length - 1) {
            this.currentPhotoIndex++;
            this.updateLightboxContent();
        }
    }

    updateLightboxContent() {
        const photo = this.photos[this.currentPhotoIndex];
        if (!photo) return;
        
        // Update image
        document.getElementById('lightbox-image').src = photo.url;
        
        // Update title and counter
        document.getElementById('lightbox-title').textContent = photo.file_name;
        document.getElementById('lightbox-counter').textContent = 
            `${this.currentPhotoIndex + 1} of ${this.photos.length}`;
        
        // Update metadata
        document.getElementById('meta-filename').textContent = photo.file_name;
        document.getElementById('meta-filesize').textContent = this.formatFileSize(photo.file_size);
        document.getElementById('meta-upload-date').textContent = this.formatDate(photo.upload_date);
        document.getElementById('meta-dimensions').textContent = photo.dimensions || 'Unknown';
        
        // Update navigation buttons
        const prevBtn = document.querySelector('.lightbox-prev');
        const nextBtn = document.querySelector('.lightbox-next');
        
        prevBtn.style.display = this.currentPhotoIndex > 0 ? 'block' : 'none';
        nextBtn.style.display = this.currentPhotoIndex < this.photos.length - 1 ? 'block' : 'none';
    }

    async setPrimaryPhoto(photoId = null) {
        const id = photoId || this.photos[this.currentPhotoIndex]?.id;
        if (!id) return;
        
        try {
            const response = await fetch(`/api/photos.php`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    photo_id: id,
                    action: 'set_primary'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Update local data
                this.photos.forEach(photo => {
                    photo.is_primary = photo.id === id;
                });
                
                this.renderPhotos();
                this.showMessage('Primary photo updated successfully!', 'success');
            } else {
                throw new Error(result.error || 'Failed to set primary photo');
            }
        } catch (error) {
            console.error('Error setting primary photo:', error);
            this.showMessage('Failed to set primary photo', 'error');
        }
    }

    setPrimaryFromSelection() {
        if (this.selectedPhotos.size !== 1) {
            this.showMessage('Please select exactly one photo to set as primary', 'warning');
            return;
        }
        
        const photoId = Array.from(this.selectedPhotos)[0];
        this.setPrimaryPhoto(photoId);
    }

    async deletePhoto(photoId) {
        if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/photos.php`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ photo_id: photoId })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Remove from local data
                this.photos = this.photos.filter(photo => photo.id !== photoId);
                this.selectedPhotos.delete(photoId);
                
                this.displayPhotos();
                this.updateSelectionInfo();
                this.showMessage('Photo deleted successfully!', 'success');
                
                // Close lightbox if current photo was deleted
                if (this.isLightboxOpen && this.photos.length === 0) {
                    this.closeLightbox();
                } else if (this.isLightboxOpen && this.currentPhotoIndex >= this.photos.length) {
                    this.currentPhotoIndex = this.photos.length - 1;
                    this.updateLightboxContent();
                }
            } else {
                throw new Error(result.error || 'Failed to delete photo');
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
            this.showMessage('Failed to delete photo', 'error');
        }
    }

    deleteCurrentPhoto() {
        const photo = this.photos[this.currentPhotoIndex];
        if (photo) {
            this.deletePhoto(photo.id);
        }
    }

    async deleteSelected() {
        if (this.selectedPhotos.size === 0) {
            this.showMessage('No photos selected', 'warning');
            return;
        }
        
        const count = this.selectedPhotos.size;
        if (!confirm(`Are you sure you want to delete ${count} photo${count !== 1 ? 's' : ''}? This action cannot be undone.`)) {
            return;
        }
        
        const photoIds = Array.from(this.selectedPhotos);
        let successCount = 0;
        let errorCount = 0;
        
        for (const photoId of photoIds) {
            try {
                const response = await fetch(`/api/photos.php`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({ photo_id: photoId })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                errorCount++;
            }
        }
        
        // Update local data
        this.photos = this.photos.filter(photo => !this.selectedPhotos.has(photo.id));
        this.selectedPhotos.clear();
        
        this.displayPhotos();
        this.updateSelectionInfo();
        
        if (errorCount === 0) {
            this.showMessage(`${successCount} photo${successCount !== 1 ? 's' : ''} deleted successfully!`, 'success');
        } else {
            this.showMessage(`${successCount} deleted, ${errorCount} failed`, 'warning');
        }
    }

    downloadPhoto(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) return;
        
        const link = document.createElement('a');
        link.href = photo.url;
        link.download = photo.file_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    downloadCurrentPhoto() {
        const photo = this.photos[this.currentPhotoIndex];
        if (photo) {
            this.downloadPhoto(photo.id);
        }
    }

    downloadSelected() {
        if (this.selectedPhotos.size === 0) {
            this.showMessage('No photos selected', 'warning');
            return;
        }
        
        this.selectedPhotos.forEach(photoId => {
            this.downloadPhoto(photoId);
        });
    }

    showUploadModal() {
        const modal = document.getElementById('upload-modal');
        modal.style.display = 'flex';
        
        // Initialize photo upload component in modal if not already done
        if (!this.uploadComponent) {
            this.uploadComponent = new PhotoUploadComponent('photo-upload-container-modal', {
                petId: this.petId,
                onUploadComplete: () => {
                    this.closeUploadModal();
                    this.loadPhotos(); // Refresh gallery
                }
            });
        }
    }

    closeUploadModal() {
        document.getElementById('upload-modal').style.display = 'none';
    }

    // State management methods
    showLoading() {
        this.hideAllStates();
        document.getElementById('gallery-loading').style.display = 'block';
    }

    showError(message) {
        this.hideAllStates();
        document.getElementById('error-message').textContent = message;
        document.getElementById('gallery-error').style.display = 'block';
    }

    hideAllStates() {
        document.getElementById('gallery-loading').style.display = 'none';
        document.getElementById('gallery-empty').style.display = 'none';
        document.getElementById('gallery-content').style.display = 'none';
        document.getElementById('gallery-error').style.display = 'none';
    }

    showMessage(message, type = 'info') {
        // Simple message display - in a real app you might use a toast library
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';
        
        const messageEl = document.createElement('div');
        messageEl.className = `alert ${alertClass}`;
        messageEl.textContent = message;
        messageEl.style.position = 'fixed';
        messageEl.style.top = '20px';
        messageEl.style.right = '20px';
        messageEl.style.zIndex = '9999';
        messageEl.style.padding = '10px 15px';
        messageEl.style.borderRadius = '4px';
        messageEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }

    // Utility methods
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    truncateFileName(name, maxLength = 20) {
        if (name.length <= maxLength) return name;
        const ext = name.split('.').pop();
        const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
        const truncated = nameWithoutExt.substring(0, maxLength - ext.length - 4) + '...';
        return truncated + '.' + ext;
    }

    // Public methods
    refresh() {
        return this.loadPhotos();
    }

    retry() {
        this.loadPhotos();
    }

    setPetId(petId) {
        this.petId = petId;
        this.loadPhotos();
    }
}

// Initialize global photo gallery instance
let photoGallery;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('photo-gallery-container')) {
        photoGallery = new PhotoGalleryComponent('photo-gallery-container');
    }
});