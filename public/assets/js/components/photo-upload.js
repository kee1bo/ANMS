/**
 * Photo Upload Component
 * Drag-and-drop photo upload with preview, crop, and progress tracking
 */
class PhotoUploadComponent {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.petId = options.petId || null;
        this.maxFiles = options.maxFiles || 10;
        this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
        this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.uploadUrl = options.uploadUrl || '/api/photos.php';
        
        this.files = [];
        this.uploadQueue = [];
        this.isUploading = false;
        this.uploadProgress = {};
        
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="photo-upload-container">
                <!-- Upload Area -->
                <div class="upload-area" id="upload-area">
                    <div class="upload-content">
                        <div class="upload-icon">
                            <i class="fas fa-cloud-upload-alt"></i>
                        </div>
                        <h3>Upload Pet Photos</h3>
                        <p>Drag and drop photos here, or click to select files</p>
                        <div class="upload-info">
                            <span>Supports: JPG, PNG, GIF, WebP</span>
                            <span>Max size: 10MB per file</span>
                            <span>Max files: ${this.maxFiles}</span>
                        </div>
                        <button type="button" class="btn btn-primary" id="select-files-btn">
                            <i class="fas fa-folder-open"></i> Select Files
                        </button>
                    </div>
                    <input type="file" id="file-input" multiple accept="${this.allowedTypes.join(',')}" style="display: none;">
                </div>

                <!-- File Preview Area -->
                <div class="file-preview-area" id="file-preview-area" style="display: none;">
                    <div class="preview-header">
                        <h4>Selected Photos</h4>
                        <div class="preview-actions">
                            <button type="button" class="btn btn-sm btn-outline" id="clear-all-btn">
                                <i class="fas fa-trash"></i> Clear All
                            </button>
                            <button type="button" class="btn btn-sm btn-primary" id="upload-all-btn">
                                <i class="fas fa-upload"></i> Upload All
                            </button>
                        </div>
                    </div>
                    <div class="file-previews" id="file-previews"></div>
                </div>

                <!-- Upload Progress -->
                <div class="upload-progress-area" id="upload-progress-area" style="display: none;">
                    <div class="progress-header">
                        <h4>Uploading Photos</h4>
                        <div class="overall-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" id="overall-progress-fill"></div>
                            </div>
                            <span class="progress-text" id="overall-progress-text">0%</span>
                        </div>
                    </div>
                    <div class="upload-items" id="upload-items"></div>
                </div>

                <!-- Success Area -->
                <div class="upload-success-area" id="upload-success-area" style="display: none;">
                    <div class="success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h4>Photos Uploaded Successfully!</h4>
                    <p id="success-message">All photos have been uploaded and processed.</p>
                    <div class="success-actions">
                        <button type="button" class="btn btn-primary" onclick="photoUpload.viewPhotos()">
                            <i class="fas fa-images"></i> View Photos
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="photoUpload.uploadMore()">
                            <i class="fas fa-plus"></i> Upload More
                        </button>
                    </div>
                </div>

                <!-- Error Area -->
                <div class="upload-error-area" id="upload-error-area" style="display: none;">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h4>Upload Error</h4>
                    <p id="error-message">Some files could not be uploaded.</p>
                    <div class="error-actions">
                        <button type="button" class="btn btn-primary" onclick="photoUpload.retryFailed()">
                            <i class="fas fa-retry"></i> Retry Failed
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="photoUpload.reset()">
                            <i class="fas fa-refresh"></i> Start Over
                        </button>
                    </div>
                </div>
            </div>

            <!-- Image Crop Modal -->
            <div class="crop-modal" id="crop-modal" style="display: none;">
                <div class="crop-modal-content">
                    <div class="crop-header">
                        <h4>Crop Photo</h4>
                        <button type="button" class="close-btn" onclick="photoUpload.closeCropModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="crop-container">
                        <canvas id="crop-canvas"></canvas>
                    </div>
                    <div class="crop-controls">
                        <div class="crop-options">
                            <label>
                                <input type="radio" name="crop-ratio" value="free" checked> Free Crop
                            </label>
                            <label>
                                <input type="radio" name="crop-ratio" value="1:1"> Square (1:1)
                            </label>
                            <label>
                                <input type="radio" name="crop-ratio" value="4:3"> Standard (4:3)
                            </label>
                            <label>
                                <input type="radio" name="crop-ratio" value="16:9"> Wide (16:9)
                            </label>
                        </div>
                        <div class="crop-actions">
                            <button type="button" class="btn btn-secondary" onclick="photoUpload.cancelCrop()">
                                Cancel
                            </button>
                            <button type="button" class="btn btn-primary" onclick="photoUpload.applyCrop()">
                                Apply Crop
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        const selectBtn = document.getElementById('select-files-btn');

        // Drag and drop events
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });

        // Click to select files
        selectBtn.addEventListener('click', () => {
            fileInput.click();
        });

        uploadArea.addEventListener('click', (e) => {
            if (e.target === uploadArea || e.target.closest('.upload-content')) {
                fileInput.click();
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFiles(files);
        });

        // Preview actions
        document.getElementById('clear-all-btn').addEventListener('click', () => {
            this.clearAll();
        });

        document.getElementById('upload-all-btn').addEventListener('click', () => {
            this.uploadAll();
        });

        // Crop ratio change
        document.addEventListener('change', (e) => {
            if (e.target.name === 'crop-ratio') {
                this.updateCropRatio(e.target.value);
            }
        });
    }

    handleFiles(files) {
        const validFiles = [];
        const errors = [];

        files.forEach(file => {
            const validation = this.validateFile(file);
            if (validation.isValid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        });

        // Check total file limit
        if (this.files.length + validFiles.length > this.maxFiles) {
            errors.push(`Maximum ${this.maxFiles} files allowed. Current: ${this.files.length}, Adding: ${validFiles.length}`);
            return;
        }

        // Show errors if any
        if (errors.length > 0) {
            this.showErrors(errors);
            return;
        }

        // Process valid files
        validFiles.forEach(file => {
            this.addFile(file);
        });

        this.updatePreview();
    }

    validateFile(file) {
        // Check file type
        if (!this.allowedTypes.includes(file.type)) {
            return {
                isValid: false,
                error: 'Invalid file type. Allowed: ' + this.allowedTypes.join(', ')
            };
        }

        // Check file size
        if (file.size > this.maxFileSize) {
            return {
                isValid: false,
                error: `File too large. Maximum size: ${this.formatFileSize(this.maxFileSize)}`
            };
        }

        // Check if file already exists
        if (this.files.some(f => f.name === file.name && f.size === file.size)) {
            return {
                isValid: false,
                error: 'File already selected'
            };
        }

        return { isValid: true };
    }

    addFile(file) {
        const fileObj = {
            id: Date.now() + Math.random(),
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            preview: null,
            cropped: false,
            status: 'pending'
        };

        // Create preview
        this.createPreview(fileObj);
        this.files.push(fileObj);
    }

    createPreview(fileObj) {
        const reader = new FileReader();
        reader.onload = (e) => {
            fileObj.preview = e.target.result;
            this.updatePreview();
        };
        reader.readAsDataURL(fileObj.file);
    }

    updatePreview() {
        const previewArea = document.getElementById('file-preview-area');
        const previewsContainer = document.getElementById('file-previews');

        if (this.files.length === 0) {
            previewArea.style.display = 'none';
            return;
        }

        previewArea.style.display = 'block';
        
        previewsContainer.innerHTML = this.files.map(fileObj => `
            <div class="file-preview-item" data-file-id="${fileObj.id}">
                <div class="preview-image">
                    ${fileObj.preview ? `<img src="${fileObj.preview}" alt="${fileObj.name}">` : '<div class="loading-preview">Loading...</div>'}
                    <div class="preview-overlay">
                        <button type="button" class="btn btn-sm btn-primary" onclick="photoUpload.cropImage('${fileObj.id}')" title="Crop">
                            <i class="fas fa-crop"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-danger" onclick="photoUpload.removeFile('${fileObj.id}')" title="Remove">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    ${fileObj.cropped ? '<div class="cropped-indicator"><i class="fas fa-crop"></i></div>' : ''}
                </div>
                <div class="preview-info">
                    <div class="file-name" title="${fileObj.name}">${this.truncateFileName(fileObj.name)}</div>
                    <div class="file-size">${this.formatFileSize(fileObj.size)}</div>
                    <div class="file-status status-${fileObj.status}">${fileObj.status}</div>
                </div>
            </div>
        `).join('');
    }

    removeFile(fileId) {
        this.files = this.files.filter(f => f.id !== fileId);
        this.updatePreview();
    }

    clearAll() {
        this.files = [];
        this.updatePreview();
    }

    cropImage(fileId) {
        const fileObj = this.files.find(f => f.id === fileId);
        if (!fileObj || !fileObj.preview) return;

        this.currentCropFile = fileObj;
        this.showCropModal(fileObj.preview);
    }

    showCropModal(imageSrc) {
        const modal = document.getElementById('crop-modal');
        const canvas = document.getElementById('crop-canvas');
        const ctx = canvas.getContext('2d');

        modal.style.display = 'flex';

        const img = new Image();
        img.onload = () => {
            // Set canvas size
            const maxWidth = 600;
            const maxHeight = 400;
            let { width, height } = img;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Initialize crop selection
            this.initCropSelection(canvas);
        };
        img.src = imageSrc;
    }

    initCropSelection(canvas) {
        // Simple crop selection implementation
        // In a real application, you might want to use a library like Cropper.js
        this.cropSelection = {
            x: canvas.width * 0.1,
            y: canvas.height * 0.1,
            width: canvas.width * 0.8,
            height: canvas.height * 0.8
        };
        this.drawCropSelection(canvas);
    }

    drawCropSelection(canvas) {
        const ctx = canvas.getContext('2d');
        const selection = this.cropSelection;

        // Clear previous selection
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Redraw image (you'd need to store the original image data)
        // For simplicity, we'll just draw the selection rectangle
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);
    }

    updateCropRatio(ratio) {
        if (!this.cropSelection) return;

        const canvas = document.getElementById('crop-canvas');
        const selection = this.cropSelection;

        if (ratio === 'free') {
            // Keep current selection
            return;
        }

        const [widthRatio, heightRatio] = ratio.split(':').map(Number);
        const aspectRatio = widthRatio / heightRatio;

        // Adjust selection to match aspect ratio
        const currentAspectRatio = selection.width / selection.height;
        
        if (currentAspectRatio > aspectRatio) {
            // Too wide, adjust width
            selection.width = selection.height * aspectRatio;
        } else {
            // Too tall, adjust height
            selection.height = selection.width / aspectRatio;
        }

        // Ensure selection stays within canvas bounds
        if (selection.x + selection.width > canvas.width) {
            selection.x = canvas.width - selection.width;
        }
        if (selection.y + selection.height > canvas.height) {
            selection.y = canvas.height - selection.height;
        }

        this.drawCropSelection(canvas);
    }

    applyCrop() {
        if (!this.currentCropFile || !this.cropSelection) return;

        // Create cropped image
        const canvas = document.getElementById('crop-canvas');
        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');
        const selection = this.cropSelection;

        croppedCanvas.width = selection.width;
        croppedCanvas.height = selection.height;

        // Get image data from selection area
        const imageData = canvas.getContext('2d').getImageData(
            selection.x, selection.y, selection.width, selection.height
        );
        croppedCtx.putImageData(imageData, 0, 0);

        // Convert to blob and update file
        croppedCanvas.toBlob((blob) => {
            const croppedFile = new File([blob], this.currentCropFile.name, {
                type: this.currentCropFile.type
            });

            this.currentCropFile.file = croppedFile;
            this.currentCropFile.size = croppedFile.size;
            this.currentCropFile.preview = croppedCanvas.toDataURL();
            this.currentCropFile.cropped = true;

            this.updatePreview();
            this.closeCropModal();
        }, this.currentCropFile.type, 0.9);
    }

    cancelCrop() {
        this.closeCropModal();
    }

    closeCropModal() {
        document.getElementById('crop-modal').style.display = 'none';
        this.currentCropFile = null;
        this.cropSelection = null;
    }

    async uploadAll() {
        if (this.files.length === 0 || this.isUploading) return;

        this.isUploading = true;
        this.uploadQueue = [...this.files];
        this.uploadProgress = {};

        this.showUploadProgress();

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < this.uploadQueue.length; i++) {
            const fileObj = this.uploadQueue[i];
            
            try {
                await this.uploadFile(fileObj, i);
                successCount++;
            } catch (error) {
                console.error('Upload failed:', error);
                errorCount++;
                fileObj.status = 'error';
                fileObj.error = error.message;
            }

            this.updateOverallProgress(i + 1, this.uploadQueue.length);
        }

        this.isUploading = false;

        if (errorCount === 0) {
            this.showSuccess(successCount);
        } else {
            this.showError(`${successCount} uploaded, ${errorCount} failed`);
        }
    }

    async uploadFile(fileObj, index) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('photo', fileObj.file);
            if (this.petId) {
                formData.append('pet_id', this.petId);
            }

            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = (e.loaded / e.total) * 100;
                    this.updateFileProgress(fileObj.id, progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200 || xhr.status === 201) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response.success) {
                            fileObj.status = 'completed';
                            fileObj.uploadedPhoto = response.photo;
                            resolve(response);
                        } else {
                            throw new Error(response.error || 'Upload failed');
                        }
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error'));
            });

            xhr.addEventListener('abort', () => {
                reject(new Error('Upload cancelled'));
            });

            fileObj.status = 'uploading';
            xhr.open('POST', this.uploadUrl);
            xhr.send(formData);
        });
    }

    showUploadProgress() {
        document.getElementById('file-preview-area').style.display = 'none';
        document.getElementById('upload-progress-area').style.display = 'block';

        const container = document.getElementById('upload-items');
        container.innerHTML = this.uploadQueue.map(fileObj => `
            <div class="upload-item" data-file-id="${fileObj.id}">
                <div class="upload-item-info">
                    <div class="file-name">${this.truncateFileName(fileObj.name)}</div>
                    <div class="file-size">${this.formatFileSize(fileObj.size)}</div>
                </div>
                <div class="upload-item-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-${fileObj.id}"></div>
                    </div>
                    <span class="progress-text" id="progress-text-${fileObj.id}">0%</span>
                </div>
                <div class="upload-item-status" id="status-${fileObj.id}">Waiting...</div>
            </div>
        `).join('');
    }

    updateFileProgress(fileId, progress) {
        const progressFill = document.getElementById(`progress-${fileId}`);
        const progressText = document.getElementById(`progress-text-${fileId}`);
        const status = document.getElementById(`status-${fileId}`);

        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}%`;
        }
        if (status) {
            status.textContent = progress === 100 ? 'Processing...' : 'Uploading...';
        }
    }

    updateOverallProgress(completed, total) {
        const progressFill = document.getElementById('overall-progress-fill');
        const progressText = document.getElementById('overall-progress-text');

        const progress = (completed / total) * 100;
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}% (${completed}/${total})`;
        }
    }

    showSuccess(count) {
        document.getElementById('upload-progress-area').style.display = 'none';
        document.getElementById('upload-success-area').style.display = 'block';
        
        const message = document.getElementById('success-message');
        message.textContent = `${count} photo${count !== 1 ? 's' : ''} uploaded successfully!`;
    }

    showError(message) {
        document.getElementById('upload-progress-area').style.display = 'none';
        document.getElementById('upload-error-area').style.display = 'block';
        
        document.getElementById('error-message').textContent = message;
    }

    showErrors(errors) {
        alert('Upload errors:\n' + errors.join('\n'));
    }

    // Utility methods
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    truncateFileName(name, maxLength = 20) {
        if (name.length <= maxLength) return name;
        const ext = name.split('.').pop();
        const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
        const truncated = nameWithoutExt.substring(0, maxLength - ext.length - 4) + '...';
        return truncated + '.' + ext;
    }

    // Public methods for external use
    reset() {
        this.files = [];
        this.uploadQueue = [];
        this.isUploading = false;
        this.uploadProgress = {};
        
        document.getElementById('file-preview-area').style.display = 'none';
        document.getElementById('upload-progress-area').style.display = 'none';
        document.getElementById('upload-success-area').style.display = 'none';
        document.getElementById('upload-error-area').style.display = 'none';
    }

    uploadMore() {
        this.reset();
    }

    viewPhotos() {
        if (this.petId) {
            window.location.href = `/test-pet-profile.html?id=${this.petId}#photos`;
        } else {
            console.log('View photos functionality');
        }
    }

    retryFailed() {
        const failedFiles = this.files.filter(f => f.status === 'error');
        if (failedFiles.length > 0) {
            this.uploadQueue = failedFiles;
            this.uploadAll();
        }
    }

    setPetId(petId) {
        this.petId = petId;
    }
}

// Initialize global photo upload instance
let photoUpload;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('photo-upload-container')) {
        photoUpload = new PhotoUploadComponent('photo-upload-container');
    }
});