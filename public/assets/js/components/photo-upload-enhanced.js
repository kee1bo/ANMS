// Enhanced Photo Upload Component with Drag & Drop
class PhotoUploadEnhanced extends EventEmitter {
    constructor(container, options = {}) {
        super();
        this.container = container;
        this.options = {
            maxFileSize: options.maxFileSize || 5 * 1024 * 1024, // 5MB
            allowedTypes: options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            maxFiles: options.maxFiles || 5,
            enableCrop: options.enableCrop !== false,
            enableResize: options.enableResize !== false,
            thumbnailSize: options.thumbnailSize || 150,
            compressionQuality: options.compressionQuality || 0.8,
            ...options
        };

        this.files = [];
        this.uploadedPhotos = [];
        this.currentPhotoIndex = 0;
        this.isDragging = false;

        this.init();
    }

    init() {
        this.createUploadInterface();
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    createUploadInterface() {
        this.container.innerHTML = `
            <div class="photo-upload-container">
                <div class="photo-upload-header">
                    <h3>Pet Photos</h3>
                    <p>Upload up to ${this.options.maxFiles} photos of your pet</p>
                </div>

                <div class="photo-upload-zone" id="upload-zone">
                    <div class="upload-zone-content">
                        <div class="upload-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21,15 16,10 5,21"/>
                            </svg>
                        </div>
                        <div class="upload-text">
                            <p class="upload-primary">Drag & drop photos here</p>
                            <p class="upload-secondary">or <button type="button" class="upload-browse-btn">browse files</button></p>
                        </div>
                        <div class="upload-requirements">
                            <p>Supported formats: JPEG, PNG, GIF, WebP</p>
                            <p>Maximum file size: ${this.formatFileSize(this.options.maxFileSize)}</p>
                        </div>
                    </div>
                    <input type="file" id="file-input" multiple accept="${this.options.allowedTypes.join(',')}" style="display: none;">
                </div>

                <div class="photo-preview-section" id="preview-section" style="display: none;">
                    <div class="photo-preview-header">
                        <h4>Selected Photos</h4>
                        <button type="button" class="btn-clear-all" id="clear-all-btn">Clear All</button>
                    </div>
                    <div class="photo-preview-grid" id="preview-grid"></div>
                </div>

                <div class="photo-gallery-section" id="gallery-section" style="display: none;">
                    <div class="photo-gallery-header">
                        <h4>Uploaded Photos</h4>
                        <div class="gallery-controls">
                            <button type="button" class="btn-gallery-view" id="grid-view-btn" data-view="grid">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="3" y="3" width="7" height="7"/>
                                    <rect x="14" y="3" width="7" height="7"/>
                                    <rect x="3" y="14" width="7" height="7"/>
                                    <rect x="14" y="14" width="7" height="7"/>
                                </svg>
                            </button>
                            <button type="button" class="btn-gallery-view" id="list-view-btn" data-view="list">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <line x1="8" y1="6" x2="21" y2="6"/>
                                    <line x1="8" y1="12" x2="21" y2="12"/>
                                    <line x1="8" y1="18" x2="21" y2="18"/>
                                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="photo-gallery-grid" id="gallery-grid"></div>
                </div>

                <div class="photo-upload-actions" id="upload-actions" style="display: none;">
                    <button type="button" class="btn btn-primary" id="upload-btn">
                        <span class="btn-text">Upload Photos</span>
                        <span class="btn-loading" style="display: none;">
                            <svg class="spinner" width="16" height="16" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                                    <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                                </circle>
                            </svg>
                            Uploading...
                        </span>
                    </button>
                    <button type="button" class="btn btn-secondary" id="cancel-upload-btn">Cancel</button>
                </div>
            </div>

            <!-- Photo Editor Modal -->
            <div class="photo-editor-modal" id="photo-editor" style="display: none;">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Edit Photo</h3>
                        <button type="button" class="modal-close" id="editor-close-btn">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="photo-editor-container">
                            <canvas id="photo-canvas"></canvas>
                        </div>
                        <div class="photo-editor-controls">
                            <div class="editor-section">
                                <h4>Crop</h4>
                                <div class="crop-controls">
                                    <button type="button" class="btn-crop" data-ratio="1:1">Square</button>
                                    <button type="button" class="btn-crop" data-ratio="4:3">4:3</button>
                                    <button type="button" class="btn-crop" data-ratio="16:9">16:9</button>
                                    <button type="button" class="btn-crop" data-ratio="free">Free</button>
                                </div>
                            </div>
                            <div class="editor-section">
                                <h4>Resize</h4>
                                <div class="resize-controls">
                                    <label>Width: <input type="number" id="resize-width" min="100" max="2000" step="10"></label>
                                    <label>Height: <input type="number" id="resize-height" min="100" max="2000" step="10"></label>
                                    <button type="button" id="maintain-aspect">🔗</button>
                                </div>
                            </div>
                            <div class="editor-section">
                                <h4>Quality</h4>
                                <div class="quality-controls">
                                    <label>Compression: <input type="range" id="quality-slider" min="0.1" max="1" step="0.1" value="0.8"></label>
                                    <span id="quality-value">80%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="apply-edits-btn">Apply Changes</button>
                        <button type="button" class="btn btn-secondary" id="cancel-edits-btn">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- Photo Viewer Modal -->
            <div class="photo-viewer-modal" id="photo-viewer" style="display: none;">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="viewer-title">Photo</h3>
                        <button type="button" class="modal-close" id="viewer-close-btn">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="photo-viewer-container">
                            <img id="viewer-image" alt="Pet photo">
                            <div class="viewer-navigation">
                                <button type="button" class="nav-btn" id="prev-photo-btn">‹</button>
                                <button type="button" class="nav-btn" id="next-photo-btn">›</button>
                            </div>
                        </div>
                        <div class="photo-viewer-info">
                            <div class="photo-details" id="photo-details"></div>
                            <div class="photo-actions">
                                <button type="button" class="btn btn-sm" id="download-photo-btn">Download</button>
                                <button type="button" class="btn btn-sm" id="edit-photo-btn">Edit</button>
                                <button type="button" class="btn btn-sm btn-danger" id="delete-photo-btn">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // File input
        const fileInput = this.container.querySelector('#file-input');
        const browseBtn = this.container.querySelector('.upload-browse-btn');
        
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));

        // Upload actions
        const uploadBtn = this.container.querySelector('#upload-btn');
        const cancelBtn = this.container.querySelector('#cancel-upload-btn');
        const clearAllBtn = this.container.querySelector('#clear-all-btn');

        uploadBtn.addEventListener('click', () => this.uploadFiles());
        cancelBtn.addEventListener('click', () => this.cancelUpload());
        clearAllBtn.addEventListener('click', () => this.clearAllFiles());

        // Gallery view controls
        const gridViewBtn = this.container.querySelector('#grid-view-btn');
        const listViewBtn = this.container.querySelector('#list-view-btn');

        gridViewBtn.addEventListener('click', () => this.setGalleryView('grid'));
        listViewBtn.addEventListener('click', () => this.setGalleryView('list'));

        // Photo editor
        this.setupPhotoEditor();

        // Photo viewer
        this.setupPhotoViewer();
    }

    setupDragAndDrop() {
        const uploadZone = this.container.querySelector('#upload-zone');

        uploadZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            this.handleDragEnter();
        });

        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.handleDragOver();
        });

        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.handleDragLeave(e);
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDrop(e);
        });
    }

    setupPhotoEditor() {
        const modal = this.container.querySelector('#photo-editor');
        const closeBtn = modal.querySelector('#editor-close-btn');
        const applyBtn = modal.querySelector('#apply-edits-btn');
        const cancelBtn = modal.querySelector('#cancel-edits-btn');

        closeBtn.addEventListener('click', () => this.closePhotoEditor());
        applyBtn.addEventListener('click', () => this.applyPhotoEdits());
        cancelBtn.addEventListener('click', () => this.closePhotoEditor());

        // Crop controls
        modal.querySelectorAll('.btn-crop').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ratio = e.target.dataset.ratio;
                this.setCropRatio(ratio);
            });
        });

        // Resize controls
        const widthInput = modal.querySelector('#resize-width');
        const heightInput = modal.querySelector('#resize-height');
        const aspectBtn = modal.querySelector('#maintain-aspect');

        let maintainAspect = true;
        aspectBtn.addEventListener('click', () => {
            maintainAspect = !maintainAspect;
            aspectBtn.textContent = maintainAspect ? '🔗' : '🔓';
        });

        widthInput.addEventListener('input', (e) => {
            if (maintainAspect && this.currentImage) {
                const ratio = this.currentImage.naturalHeight / this.currentImage.naturalWidth;
                heightInput.value = Math.round(e.target.value * ratio);
            }
        });

        heightInput.addEventListener('input', (e) => {
            if (maintainAspect && this.currentImage) {
                const ratio = this.currentImage.naturalWidth / this.currentImage.naturalHeight;
                widthInput.value = Math.round(e.target.value * ratio);
            }
        });

        // Quality control
        const qualitySlider = modal.querySelector('#quality-slider');
        const qualityValue = modal.querySelector('#quality-value');

        qualitySlider.addEventListener('input', (e) => {
            const value = Math.round(e.target.value * 100);
            qualityValue.textContent = `${value}%`;
        });
    }

    setupPhotoViewer() {
        const modal = this.container.querySelector('#photo-viewer');
        const closeBtn = modal.querySelector('#viewer-close-btn');
        const prevBtn = modal.querySelector('#prev-photo-btn');
        const nextBtn = modal.querySelector('#next-photo-btn');
        const downloadBtn = modal.querySelector('#download-photo-btn');
        const editBtn = modal.querySelector('#edit-photo-btn');
        const deleteBtn = modal.querySelector('#delete-photo-btn');

        closeBtn.addEventListener('click', () => this.closePhotoViewer());
        prevBtn.addEventListener('click', () => this.showPreviousPhoto());
        nextBtn.addEventListener('click', () => this.showNextPhoto());
        downloadBtn.addEventListener('click', () => this.downloadCurrentPhoto());
        editBtn.addEventListener('click', () => this.editCurrentPhoto());
        deleteBtn.addEventListener('click', () => this.deleteCurrentPhoto());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (modal.style.display !== 'none') {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.showPreviousPhoto();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.showNextPhoto();
                        break;
                    case 'Escape':
                        e.preventDefault();
                        this.closePhotoViewer();
                        break;
                }
            }
        });
    }

    handleDragEnter() {
        this.isDragging = true;
        const uploadZone = this.container.querySelector('#upload-zone');
        uploadZone.classList.add('drag-over');
    }

    handleDragOver() {
        // Keep drag state active
    }

    handleDragLeave(e) {
        // Only remove drag state if leaving the upload zone entirely
        if (!e.currentTarget.contains(e.relatedTarget)) {
            this.isDragging = false;
            const uploadZone = this.container.querySelector('#upload-zone');
            uploadZone.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        this.isDragging = false;
        const uploadZone = this.container.querySelector('#upload-zone');
        uploadZone.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        this.handleFileSelect(files);
    }

    handleFileSelect(files) {
        const validFiles = [];
        const errors = [];

        Array.from(files).forEach(file => {
            const validation = this.validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        });

        if (errors.length > 0) {
            this.showErrors(errors);
        }

        if (validFiles.length > 0) {
            this.addFiles(validFiles);
        }
    }

    validateFile(file) {
        // Check file type
        if (!this.options.allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'Invalid file type. Please use JPEG, PNG, GIF, or WebP.'
            };
        }

        // Check file size
        if (file.size > this.options.maxFileSize) {
            return {
                valid: false,
                error: `File too large. Maximum size is ${this.formatFileSize(this.options.maxFileSize)}.`
            };
        }

        // Check total file count
        if (this.files.length >= this.options.maxFiles) {
            return {
                valid: false,
                error: `Maximum ${this.options.maxFiles} files allowed.`
            };
        }

        return { valid: true };
    }

    async addFiles(files) {
        for (const file of files) {
            if (this.files.length >= this.options.maxFiles) break;

            const fileData = {
                id: Date.now() + Math.random(),
                file: file,
                name: file.name,
                size: file.size,
                type: file.type,
                preview: null,
                thumbnail: null,
                status: 'pending'
            };

            // Generate preview
            try {
                fileData.preview = await this.generatePreview(file);
                fileData.thumbnail = await this.generateThumbnail(file);
            } catch (error) {
                console.error('Error generating preview:', error);
            }

            this.files.push(fileData);
        }

        this.updatePreviewSection();
        this.updateUploadActions();
    }

    async generatePreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async generateThumbnail(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const size = this.options.thumbnailSize;
                canvas.width = size;
                canvas.height = size;

                // Calculate crop dimensions for square thumbnail
                const minDim = Math.min(img.width, img.height);
                const x = (img.width - minDim) / 2;
                const y = (img.height - minDim) / 2;

                ctx.drawImage(img, x, y, minDim, minDim, 0, 0, size, size);
                resolve(canvas.toDataURL('image/jpeg', this.options.compressionQuality));
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    updatePreviewSection() {
        const previewSection = this.container.querySelector('#preview-section');
        const previewGrid = this.container.querySelector('#preview-grid');

        if (this.files.length === 0) {
            previewSection.style.display = 'none';
            return;
        }

        previewSection.style.display = 'block';
        previewGrid.innerHTML = '';

        this.files.forEach((fileData, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'photo-preview-item';
            previewItem.innerHTML = `
                <div class="preview-image">
                    <img src="${fileData.thumbnail || fileData.preview}" alt="${fileData.name}">
                    <div class="preview-overlay">
                        <button type="button" class="btn-preview-action" data-action="edit" data-index="${index}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button type="button" class="btn-preview-action" data-action="remove" data-index="${index}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="preview-info">
                    <div class="preview-name">${fileData.name}</div>
                    <div class="preview-size">${this.formatFileSize(fileData.size)}</div>
                    <div class="preview-status status-${fileData.status}">${fileData.status}</div>
                </div>
            `;

            // Add event listeners
            const editBtn = previewItem.querySelector('[data-action="edit"]');
            const removeBtn = previewItem.querySelector('[data-action="remove"]');

            editBtn.addEventListener('click', () => this.editFile(index));
            removeBtn.addEventListener('click', () => this.removeFile(index));

            previewGrid.appendChild(previewItem);
        });
    }

    updateUploadActions() {
        const uploadActions = this.container.querySelector('#upload-actions');
        uploadActions.style.display = this.files.length > 0 ? 'flex' : 'none';
    }

    editFile(index) {
        const fileData = this.files[index];
        this.openPhotoEditor(fileData, index);
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.updatePreviewSection();
        this.updateUploadActions();
        this.emit('fileRemoved', { index });
    }

    clearAllFiles() {
        this.files = [];
        this.updatePreviewSection();
        this.updateUploadActions();
        this.emit('filesCleared');
    }

    async uploadFiles() {
        if (this.files.length === 0) return;

        const uploadBtn = this.container.querySelector('#upload-btn');
        const btnText = uploadBtn.querySelector('.btn-text');
        const btnLoading = uploadBtn.querySelector('.btn-loading');

        // Show loading state
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        uploadBtn.disabled = true;

        try {
            const uploadPromises = this.files.map((fileData, index) => 
                this.uploadSingleFile(fileData, index)
            );

            const results = await Promise.allSettled(uploadPromises);
            
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            this.emit('uploadComplete', {
                successful,
                failed,
                total: this.files.length,
                results
            });

            if (successful > 0) {
                this.showSuccess(`${successful} photo(s) uploaded successfully!`);
                this.files = []; // Clear uploaded files
                this.updatePreviewSection();
                this.updateUploadActions();
            }

            if (failed > 0) {
                this.showError(`${failed} photo(s) failed to upload.`);
            }

        } catch (error) {
            console.error('Upload error:', error);
            this.showError('Upload failed. Please try again.');
        } finally {
            // Reset button state
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            uploadBtn.disabled = false;
        }
    }

    async uploadSingleFile(fileData, index) {
        // Update status
        fileData.status = 'uploading';
        this.updateFileStatus(index, 'uploading');

        try {
            // Create FormData
            const formData = new FormData();
            formData.append('photo', fileData.file);
            formData.append('name', fileData.name);

            // Emit upload start event
            this.emit('uploadStart', { fileData, index });

            // Simulate upload progress (replace with actual upload logic)
            const response = await this.performUpload(formData, (progress) => {
                this.updateFileProgress(index, progress);
            });

            fileData.status = 'completed';
            fileData.uploadedUrl = response.url;
            this.updateFileStatus(index, 'completed');

            return response;

        } catch (error) {
            fileData.status = 'failed';
            fileData.error = error.message;
            this.updateFileStatus(index, 'failed');
            throw error;
        }
    }

    async performUpload(formData, progressCallback) {
        // This is a mock implementation - replace with actual API call
        return new Promise((resolve, reject) => {
            // Simulate upload progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    
                    // Simulate successful response
                    setTimeout(() => {
                        resolve({
                            url: `https://example.com/uploads/photo_${Date.now()}.jpg`,
                            id: Date.now(),
                            success: true
                        });
                    }, 200);
                }
                progressCallback(progress);
            }, 100);
        });
    }

    updateFileStatus(index, status) {
        const previewItem = this.container.querySelectorAll('.photo-preview-item')[index];
        if (previewItem) {
            const statusElement = previewItem.querySelector('.preview-status');
            statusElement.textContent = status;
            statusElement.className = `preview-status status-${status}`;
        }
    }

    updateFileProgress(index, progress) {
        // Add progress bar if needed
        const previewItem = this.container.querySelectorAll('.photo-preview-item')[index];
        if (previewItem) {
            let progressBar = previewItem.querySelector('.progress-bar');
            if (!progressBar) {
                progressBar = document.createElement('div');
                progressBar.className = 'progress-bar';
                progressBar.innerHTML = '<div class="progress-fill"></div>';
                previewItem.appendChild(progressBar);
            }
            
            const progressFill = progressBar.querySelector('.progress-fill');
            progressFill.style.width = `${progress}%`;
        }
    }

    cancelUpload() {
        // Cancel any ongoing uploads
        this.files.forEach(fileData => {
            if (fileData.status === 'uploading') {
                fileData.status = 'cancelled';
            }
        });

        this.clearAllFiles();
        this.emit('uploadCancelled');
    }

    openPhotoEditor(fileData, index) {
        const modal = this.container.querySelector('#photo-editor');
        const canvas = modal.querySelector('#photo-canvas');
        const ctx = canvas.getContext('2d');

        this.currentEditingFile = { fileData, index };

        // Load image into canvas
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Update resize controls
            modal.querySelector('#resize-width').value = img.width;
            modal.querySelector('#resize-height').value = img.height;

            this.currentImage = img;
        };
        img.src = fileData.preview;

        modal.style.display = 'block';
    }

    closePhotoEditor() {
        const modal = this.container.querySelector('#photo-editor');
        modal.style.display = 'none';
        this.currentEditingFile = null;
        this.currentImage = null;
    }

    applyPhotoEdits() {
        if (!this.currentEditingFile) return;

        const modal = this.container.querySelector('#photo-editor');
        const canvas = modal.querySelector('#photo-canvas');
        const quality = parseFloat(modal.querySelector('#quality-slider').value);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
            // Create new file from edited image
            const editedFile = new File([blob], this.currentEditingFile.fileData.name, {
                type: 'image/jpeg'
            });

            // Update file data
            this.currentEditingFile.fileData.file = editedFile;
            this.currentEditingFile.fileData.size = editedFile.size;
            this.currentEditingFile.fileData.preview = canvas.toDataURL('image/jpeg', quality);

            // Regenerate thumbnail
            this.generateThumbnail(editedFile).then(thumbnail => {
                this.currentEditingFile.fileData.thumbnail = thumbnail;
                this.updatePreviewSection();
            });

            this.closePhotoEditor();
            this.emit('photoEdited', this.currentEditingFile);

        }, 'image/jpeg', quality);
    }

    // Gallery management methods
    loadUploadedPhotos(photos) {
        this.uploadedPhotos = photos;
        this.updateGallerySection();
    }

    updateGallerySection() {
        const gallerySection = this.container.querySelector('#gallery-section');
        const galleryGrid = this.container.querySelector('#gallery-grid');

        if (this.uploadedPhotos.length === 0) {
            gallerySection.style.display = 'none';
            return;
        }

        gallerySection.style.display = 'block';
        galleryGrid.innerHTML = '';

        this.uploadedPhotos.forEach((photo, index) => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'photo-gallery-item';
            galleryItem.innerHTML = `
                <div class="gallery-image">
                    <img src="${photo.thumbnail || photo.url}" alt="${photo.name || 'Pet photo'}">
                    <div class="gallery-overlay">
                        <button type="button" class="btn-gallery-action" data-action="view" data-index="${index}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </button>
                        <button type="button" class="btn-gallery-action" data-action="edit" data-index="${index}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button type="button" class="btn-gallery-action" data-action="delete" data-index="${index}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="gallery-info">
                    <div class="gallery-name">${photo.name || 'Untitled'}</div>
                    <div class="gallery-date">${this.formatDate(photo.uploadedAt)}</div>
                </div>
            `;

            // Add event listeners
            const viewBtn = galleryItem.querySelector('[data-action="view"]');
            const editBtn = galleryItem.querySelector('[data-action="edit"]');
            const deleteBtn = galleryItem.querySelector('[data-action="delete"]');

            viewBtn.addEventListener('click', () => this.viewPhoto(index));
            editBtn.addEventListener('click', () => this.editUploadedPhoto(index));
            deleteBtn.addEventListener('click', () => this.deleteUploadedPhoto(index));

            galleryGrid.appendChild(galleryItem);
        });
    }

    viewPhoto(index) {
        this.currentPhotoIndex = index;
        this.openPhotoViewer();
    }

    openPhotoViewer() {
        const modal = this.container.querySelector('#photo-viewer');
        const image = modal.querySelector('#viewer-image');
        const title = modal.querySelector('#viewer-title');
        const details = modal.querySelector('#photo-details');

        const photo = this.uploadedPhotos[this.currentPhotoIndex];
        if (!photo) return;

        image.src = photo.url;
        title.textContent = photo.name || `Photo ${this.currentPhotoIndex + 1}`;
        
        details.innerHTML = `
            <div class="detail-item"><label>Size:</label><span>${this.formatFileSize(photo.size || 0)}</span></div>
            <div class="detail-item"><label>Uploaded:</label><span>${this.formatDate(photo.uploadedAt)}</span></div>
            <div class="detail-item"><label>Dimensions:</label><span>${photo.width || '?'} × ${photo.height || '?'}</span></div>
        `;

        modal.style.display = 'block';
        this.updateViewerNavigation();
    }

    closePhotoViewer() {
        const modal = this.container.querySelector('#photo-viewer');
        modal.style.display = 'none';
    }

    showPreviousPhoto() {
        if (this.currentPhotoIndex > 0) {
            this.currentPhotoIndex--;
            this.openPhotoViewer();
        }
    }

    showNextPhoto() {
        if (this.currentPhotoIndex < this.uploadedPhotos.length - 1) {
            this.currentPhotoIndex++;
            this.openPhotoViewer();
        }
    }

    updateViewerNavigation() {
        const prevBtn = this.container.querySelector('#prev-photo-btn');
        const nextBtn = this.container.querySelector('#next-photo-btn');

        prevBtn.disabled = this.currentPhotoIndex === 0;
        nextBtn.disabled = this.currentPhotoIndex === this.uploadedPhotos.length - 1;
    }

    downloadCurrentPhoto() {
        const photo = this.uploadedPhotos[this.currentPhotoIndex];
        if (!photo) return;

        const link = document.createElement('a');
        link.href = photo.url;
        link.download = photo.name || `pet-photo-${this.currentPhotoIndex + 1}.jpg`;
        link.click();
    }

    editCurrentPhoto() {
        // This would open the photo editor for uploaded photos
        this.emit('editUploadedPhoto', {
            photo: this.uploadedPhotos[this.currentPhotoIndex],
            index: this.currentPhotoIndex
        });
    }

    deleteCurrentPhoto() {
        if (confirm('Are you sure you want to delete this photo?')) {
            this.deleteUploadedPhoto(this.currentPhotoIndex);
            this.closePhotoViewer();
        }
    }

    deleteUploadedPhoto(index) {
        const photo = this.uploadedPhotos[index];
        this.emit('deletePhoto', { photo, index });
        
        // Remove from local array (will be updated from parent component)
        this.uploadedPhotos.splice(index, 1);
        this.updateGallerySection();
    }

    setGalleryView(view) {
        const galleryGrid = this.container.querySelector('#gallery-grid');
        const gridBtn = this.container.querySelector('#grid-view-btn');
        const listBtn = this.container.querySelector('#list-view-btn');

        galleryGrid.className = `photo-gallery-grid view-${view}`;
        
        gridBtn.classList.toggle('active', view === 'grid');
        listBtn.classList.toggle('active', view === 'list');
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
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    showError(message) {
        this.emit('error', { message });
    }

    showSuccess(message) {
        this.emit('success', { message });
    }

    showErrors(errors) {
        this.emit('errors', { errors });
    }

    // Public API methods
    getFiles() {
        return this.files;
    }

    getUploadedPhotos() {
        return this.uploadedPhotos;
    }

    reset() {
        this.files = [];
        this.uploadedPhotos = [];
        this.updatePreviewSection();
        this.updateGallerySection();
        this.updateUploadActions();
    }

    destroy() {
        // Clean up event listeners and DOM
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for module use
window.PhotoUploadEnhanced = PhotoUploadEnhanced;