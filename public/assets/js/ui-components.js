/**
 * UI Components for PetNutri Application
 * Handles modals, notifications, forms, and other UI elements
 */
class UIComponents {
    constructor() {
        this.activeModals = new Set();
        this.notifications = new Map();
        this.notificationId = 0;
        
        // Initialize notification container
        this.initializeNotificationContainer();
        
        // Bind methods to maintain context
        this.showNotification = this.showNotification.bind(this);
        this.hideNotification = this.hideNotification.bind(this);
        this.createModal = this.createModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
    }

    /**
     * Initialize notification container
     */
    initializeNotificationContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
    }

    // ============================================================
    // Notification Methods
    // ============================================================

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {number} duration - Auto-hide duration in ms (0 = no auto-hide)
     * @returns {number} Notification ID
     */
    showNotification(message, type = 'info', duration = 5000) {
        const id = ++this.notificationId;
        const notification = this.createNotificationElement(id, message, type);
        
        const container = document.getElementById('notification-container');
        container.appendChild(notification);
        
        // Trigger animation
        requestAnimationFrame(() => {
            notification.classList.add('notification--show');
        });
        
        // Store notification
        this.notifications.set(id, {
            element: notification,
            type,
            message,
            timestamp: Date.now()
        });
        
        // Auto-hide if duration is set
        if (duration > 0) {
            setTimeout(() => {
                this.hideNotification(id);
            }, duration);
        }
        
        return id;
    }

    /**
     * Show success notification
     * @param {string} message - Success message
     * @param {number} duration - Auto-hide duration
     * @returns {number} Notification ID
     */
    showSuccess(message, duration = 4000) {
        return this.showNotification(message, 'success', duration);
    }

    /**
     * Show error notification
     * @param {string} message - Error message
     * @param {number} duration - Auto-hide duration
     * @returns {number} Notification ID
     */
    showError(message, duration = 8000) {
        return this.showNotification(message, 'error', duration);
    }

    /**
     * Show warning notification
     * @param {string} message - Warning message
     * @param {number} duration - Auto-hide duration
     * @returns {number} Notification ID
     */
    showWarning(message, duration = 6000) {
        return this.showNotification(message, 'warning', duration);
    }

    /**
     * Show info notification
     * @param {string} message - Info message
     * @param {number} duration - Auto-hide duration
     * @returns {number} Notification ID
     */
    showInfo(message, duration = 5000) {
        return this.showNotification(message, 'info', duration);
    }

    /**
     * Hide notification
     * @param {number} id - Notification ID
     */
    hideNotification(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        notification.element.classList.remove('notification--show');
        
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.delete(id);
        }, 300);
    }

    /**
     * Clear all notifications
     */
    clearAllNotifications() {
        this.notifications.forEach((notification, id) => {
            this.hideNotification(id);
        });
    }

    /**
     * Create notification element
     * @param {number} id - Notification ID
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     * @returns {HTMLElement} Notification element
     */
    createNotificationElement(id, message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.dataset.id = id;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        notification.innerHTML = `
            <div class="notification__content">
                <div class="notification__icon">${icons[type] || icons.info}</div>
                <div class="notification__message">${this.escapeHtml(message)}</div>
                <button class="notification__close" data-action="close-notification" data-id="${id}">
                    ✕
                </button>
            </div>
        `;
        
        // Add click handler for close button
        notification.querySelector('.notification__close').addEventListener('click', () => {
            this.hideNotification(id);
        });
        
        return notification;
    }

    // ============================================================
    // Modal Methods
    // ============================================================

    /**
     * Create modal
     * @param {string} title - Modal title
     * @param {string} content - Modal content HTML
     * @param {string} size - Modal size (small, medium, large, fullscreen)
     * @param {Object} options - Modal options
     * @returns {HTMLElement} Modal element
     */
    createModal(title, content, size = 'medium', options = {}) {
        const modal = document.createElement('div');
        modal.className = `modal modal--${size}`;
        modal.dataset.size = size;
        
        const defaultOptions = {
            closable: true,
            backdrop: true,
            keyboard: true,
            ...options
        };
        
        modal.innerHTML = `
            <div class="modal__backdrop"></div>
            <div class="modal__container">
                <div class="modal__header">
                    <h2 class="modal__title">${this.escapeHtml(title)}</h2>
                    ${defaultOptions.closable ? '<button class="modal__close" data-action="close-modal">✕</button>' : ''}
                </div>
                <div class="modal__body">
                    ${content}
                </div>
            </div>
        `;
        
        // Add to container
        const container = document.getElementById('modal-container') || document.body;
        container.appendChild(modal);
        
        // Store reference
        this.activeModals.add(modal);
        
        // Event listeners
        this.setupModalEventListeners(modal, defaultOptions);
        
        // Trigger animation
        requestAnimationFrame(() => {
            modal.classList.add('modal--show');
            document.body.classList.add('modal-open');
        });
        
        return modal;
    }

    /**
     * Setup modal event listeners
     * @param {HTMLElement} modal - Modal element
     * @param {Object} options - Modal options
     */
    setupModalEventListeners(modal, options) {
        // Close button
        const closeBtn = modal.querySelector('.modal__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal(modal));
        }
        
        // Backdrop click
        if (options.backdrop) {
            const backdrop = modal.querySelector('.modal__backdrop');
            backdrop.addEventListener('click', () => this.closeModal(modal));
        }
        
        // Keyboard events
        if (options.keyboard) {
            const keyHandler = (e) => {
                if (e.key === 'Escape') {
                    this.closeModal(modal);
                }
            };
            
            document.addEventListener('keydown', keyHandler);
            modal._keyHandler = keyHandler; // Store for cleanup
        }
        
        // Prevent modal container clicks from closing modal
        const container = modal.querySelector('.modal__container');
        container.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    /**
     * Close modal
     * @param {HTMLElement} modal - Modal element to close
     */
    closeModal(modal = null) {
        // If no modal specified, close the most recent one
        if (!modal && this.activeModals.size > 0) {
            modal = Array.from(this.activeModals).pop();
        }
        
        if (!modal) return;
        
        modal.classList.remove('modal--show');
        
        // Cleanup event listeners
        if (modal._keyHandler) {
            document.removeEventListener('keydown', modal._keyHandler);
            delete modal._keyHandler;
        }
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            this.activeModals.delete(modal);
            
            // Remove body class if no modals are open
            if (this.activeModals.size === 0) {
                document.body.classList.remove('modal-open');
            }
        }, 300);
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        Array.from(this.activeModals).forEach(modal => {
            this.closeModal(modal);
        });
    }

    // ============================================================
    // Form Components
    // ============================================================

    /**
     * Create login form
     * @returns {string} Login form HTML
     */
    createLoginForm() {
        return `
            <form class="form auth-form" data-action="login" id="login-form">
                <div class="form-group">
                    <label for="login-email" class="form-label">
                        Email Address
                        <span class="required-indicator">*</span>
                    </label>
                    <input 
                        type="email" 
                        id="login-email" 
                        name="email" 
                        class="form-input"
                        placeholder="Enter your email address"
                        required
                        autocomplete="email"
                        data-validate="true"
                        aria-describedby="login-email-error"
                    >
                    <div class="form-error" id="login-email-error" role="alert"></div>
                </div>
                
                <div class="form-group">
                    <label for="login-password" class="form-label">
                        Password
                        <span class="required-indicator">*</span>
                    </label>
                    <div class="form-input-group">
                        <input 
                            type="password" 
                            id="login-password" 
                            name="password" 
                            class="form-input"
                            placeholder="Enter your password"
                            required
                            autocomplete="current-password"
                            data-validate="true"
                            aria-describedby="login-password-error"
                        >
                        <button type="button" class="input-addon" data-action="toggle-password" data-target="login-password" aria-label="Toggle password visibility">
                            <span class="password-toggle-icon">👁️</span>
                        </button>
                    </div>
                    <div class="form-error" id="login-password-error" role="alert"></div>
                </div>
                
                <div class="form-group">
                    <div class="form-options">
                        <label class="checkbox-label">
                            <input type="checkbox" name="remember" class="checkbox">
                            <span class="checkbox-text">Remember me for 30 days</span>
                        </label>
                        <a href="#" class="form-link" data-action="forgot-password">Forgot password?</a>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn--primary btn--full" id="login-submit-btn">
                        <span class="btn-text">Sign In</span>
                        <span class="btn-loading" style="display: none;">
                            <span class="loading-spinner"></span>
                            Signing in...
                        </span>
                    </button>
                </div>
                
                <div class="form-footer">
                    <p class="form-text">
                        Don't have an account? 
                        <a href="#" class="form-link" data-action="show-register">Create one here</a>
                    </p>
                </div>
            </form>
        `;
    }

    /**
     * Create registration form
     * @returns {string} Registration form HTML
     */
    createRegistrationForm() {
        return `
            <form class="form auth-form" data-action="register" id="register-form">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="register-first-name" class="form-label">
                            First Name
                            <span class="required-indicator">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="register-first-name" 
                            name="first_name" 
                            class="form-input"
                            placeholder="Enter your first name"
                            required
                            autocomplete="given-name"
                            data-validate="true"
                            aria-describedby="register-first-name-error"
                        >
                        <div class="form-error" id="register-first-name-error" role="alert"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="register-last-name" class="form-label">
                            Last Name
                            <span class="required-indicator">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="register-last-name" 
                            name="last_name" 
                            class="form-input"
                            placeholder="Enter your last name"
                            required
                            autocomplete="family-name"
                            data-validate="true"
                            aria-describedby="register-last-name-error"
                        >
                        <div class="form-error" id="register-last-name-error" role="alert"></div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="register-email" class="form-label">
                        Email Address
                        <span class="required-indicator">*</span>
                    </label>
                    <input 
                        type="email" 
                        id="register-email" 
                        name="email" 
                        class="form-input"
                        placeholder="Enter your email address"
                        required
                        autocomplete="email"
                        data-validate="true"
                        aria-describedby="register-email-error"
                    >
                    <div class="form-error" id="register-email-error" role="alert"></div>
                </div>
                
                <div class="form-group">
                    <label for="register-password" class="form-label">
                        Password
                        <span class="required-indicator">*</span>
                    </label>
                    <div class="form-input-group">
                        <input 
                            type="password" 
                            id="register-password" 
                            name="password" 
                            class="form-input"
                            placeholder="Create a secure password"
                            required
                            autocomplete="new-password"
                            minlength="8"
                            data-validate="true"
                            aria-describedby="register-password-error register-password-help"
                        >
                        <button type="button" class="input-addon" data-action="toggle-password" data-target="register-password" aria-label="Toggle password visibility">
                            <span class="password-toggle-icon">👁️</span>
                        </button>
                    </div>
                    <div class="form-help" id="register-password-help">
                        Password should include uppercase, lowercase, numbers, and special characters
                    </div>
                    <div class="form-error" id="register-password-error" role="alert"></div>
                </div>
                
                <div class="form-group">
                    <label for="register-password-confirm" class="form-label">
                        Confirm Password
                        <span class="required-indicator">*</span>
                    </label>
                    <div class="form-input-group">
                        <input 
                            type="password" 
                            id="register-password-confirm" 
                            name="password_confirmation" 
                            class="form-input"
                            placeholder="Confirm your password"
                            required
                            autocomplete="new-password"
                            data-validate="true"
                            aria-describedby="register-password-confirm-error"
                        >
                        <button type="button" class="input-addon" data-action="toggle-password" data-target="register-password-confirm" aria-label="Toggle password visibility">
                            <span class="password-toggle-icon">👁️</span>
                        </button>
                    </div>
                    <div class="form-error" id="register-password-confirm-error" role="alert"></div>
                </div>
                
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" name="terms" class="checkbox" required>
                        <span class="checkbox-text">
                            I agree to the <a href="/terms" class="form-link" target="_blank">Terms of Service</a> 
                            and <a href="/privacy" class="form-link" target="_blank">Privacy Policy</a>
                        </span>
                    </label>
                    <div class="form-error" id="register-terms-error" role="alert"></div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn--primary btn--full" id="register-submit-btn">
                        <span class="btn-text">Create Account</span>
                        <span class="btn-loading" style="display: none;">
                            <span class="loading-spinner"></span>
                            Creating account...
                        </span>
                    </button>
                </div>
                
                <div class="form-footer">
                    <p class="form-text">
                        Already have an account? 
                        <a href="#" class="form-link" data-action="show-login">Sign in here</a>
                    </p>
                </div>
            </form>
        `;
    }

    /**
     * Create add pet form
     * @returns {string} Add pet form HTML
     */
    createAddPetForm() {
        return `
            <form class="form" data-action="add-pet" id="add-pet-form">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="pet-name" class="form-label">Pet Name *</label>
                        <input 
                            type="text" 
                            id="pet-name" 
                            name="name" 
                            class="form-input"
                            placeholder="What's your pet's name?"
                            required
                        >
                        <div class="form-error" id="pet-name-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="pet-species" class="form-label">Species *</label>
                        <select id="pet-species" name="species" class="form-select" required>
                            <option value="">Choose pet type</option>
                            <option value="dog">Dog 🐕</option>
                            <option value="cat">Cat 🐱</option>
                            <option value="rabbit">Rabbit 🐰</option>
                            <option value="bird">Bird 🐦</option>
                            <option value="other">Other</option>
                        </select>
                        <div class="form-error" id="pet-species-error"></div>
                    </div>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label for="pet-breed" class="form-label">Breed</label>
                        <input 
                            type="text" 
                            id="pet-breed" 
                            name="breed" 
                            class="form-input"
                            placeholder="e.g., Golden Retriever, Persian Cat"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="pet-gender" class="form-label">Gender</label>
                        <select id="pet-gender" name="gender" class="form-select">
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="neutered_male">Neutered Male</option>
                            <option value="spayed_female">Spayed Female</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label for="pet-birth-date" class="form-label">Birth Date</label>
                        <input 
                            type="date" 
                            id="pet-birth-date" 
                            name="birth_date" 
                            class="form-input"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="pet-weight" class="form-label">Current Weight (kg) *</label>
                        <input 
                            type="number" 
                            id="pet-weight" 
                            name="current_weight" 
                            class="form-input"
                            placeholder="Current weight"
                            step="0.1"
                            min="0.1"
                            required
                        >
                        <div class="form-error" id="pet-weight-error"></div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="pet-activity" class="form-label">Activity Level *</label>
                    <select id="pet-activity" name="activity_level" class="form-select" required>
                        <option value="">How active is your pet?</option>
                        <option value="low">Low - Mostly indoors, minimal exercise</option>
                        <option value="moderate">Moderate - Regular walks, some playtime</option>
                        <option value="high">High - Very active, lots of exercise</option>
                    </select>
                    <div class="form-error" id="pet-activity-error"></div>
                </div>
                
                <div class="form-group">
                    <label for="pet-notes" class="form-label">Notes & Health Information</label>
                    <textarea 
                        id="pet-notes" 
                        name="notes" 
                        class="form-textarea"
                        rows="3"
                        placeholder="Any health conditions, allergies, or special notes about your pet..."
                    ></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn--secondary" data-action="close-modal">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn--primary">
                        Add Pet
                    </button>
                </div>
            </form>
        `;
    }

    // ============================================================
    // Form Validation
    // ============================================================

    /**
     * Validate form
     * @param {HTMLFormElement} form - Form element
     * @returns {boolean} Validation result
     */
    validateForm(form) {
        let isValid = true;
        const fields = form.querySelectorAll('[required]');
        
        // Clear previous errors
        form.querySelectorAll('.form-error').forEach(error => {
            error.textContent = '';
        });
        form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(field => {
            field.classList.remove('form-input--error');
        });
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        // Additional validation for password confirmation
        const password = form.querySelector('input[name="password"]');
        const passwordConfirm = form.querySelector('input[name="password_confirmation"]');
        
        if (password && passwordConfirm && password.value !== passwordConfirm.value) {
            this.showFieldError(passwordConfirm, 'Passwords do not match');
            isValid = false;
        }
        
        return isValid;
    }

    /**
     * Validate individual field
     * @param {HTMLElement} field - Field element
     * @returns {boolean} Validation result
     */
    validateField(field) {
        let isValid = true;
        const value = field.value.trim();
        const type = field.type;
        const name = field.name;
        
        // Required field validation
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, 'This field is required');
            return false;
        }
        
        // Email validation
        if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showFieldError(field, 'Please enter a valid email address');
                isValid = false;
            }
        }
        
        // Password validation
        if (name === 'password' && value) {
            if (value.length < 8) {
                this.showFieldError(field, 'Password must be at least 8 characters long');
                isValid = false;
            }
        }
        
        // Number validation
        if (type === 'number' && value) {
            const num = parseFloat(value);
            const min = parseFloat(field.getAttribute('min'));
            const max = parseFloat(field.getAttribute('max'));
            
            if (isNaN(num)) {
                this.showFieldError(field, 'Please enter a valid number');
                isValid = false;
            } else if (min !== null && num < min) {
                this.showFieldError(field, `Value must be at least ${min}`);
                isValid = false;
            } else if (max !== null && num > max) {
                this.showFieldError(field, `Value must be no more than ${max}`);
                isValid = false;
            }
        }
        
        return isValid;
    }

    /**
     * Show field error
     * @param {HTMLElement} field - Field element
     * @param {string} message - Error message
     */
    showFieldError(field, message) {
        field.classList.add('form-input--error');
        
        const errorElement = document.getElementById(`${field.id}-error`) || 
                           field.parentNode.querySelector('.form-error');
        
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    // ============================================================
    // Utility Methods
    // ============================================================

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show loading state
     * @param {boolean} show - Whether to show loading
     * @param {string} message - Loading message
     */
    showLoading(show = true, message = 'Loading...') {
        let loadingScreen = document.getElementById('loading-screen');
        
        if (show) {
            if (!loadingScreen) {
                loadingScreen = document.createElement('div');
                loadingScreen.id = 'loading-screen';
                loadingScreen.className = 'loading-screen';
                loadingScreen.innerHTML = `
                    <div class="loading-content">
                        <div class="loading-logo">
                            <div class="paw-icon">🐾</div>
                            <h2>PetNutri</h2>
                        </div>
                        <div class="loading-spinner"></div>
                        <p>${this.escapeHtml(message)}</p>
                    </div>
                `;
                document.body.appendChild(loadingScreen);
            } else {
                loadingScreen.querySelector('p').textContent = message;
                loadingScreen.classList.remove('hidden');
            }
        } else if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                if (loadingScreen.parentNode) {
                    loadingScreen.parentNode.removeChild(loadingScreen);
                }
            }, 500);
        }
    }

    /**
     * Create forgot password form
     * @returns {string} Forgot password form HTML
     */
    createForgotPasswordForm() {
        return `
            <form class="form auth-form" data-action="forgot-password" id="forgot-password-form">
                <div class="form-group">
                    <label for="forgot-email" class="form-label">
                        Email Address
                        <span class="required-indicator">*</span>
                    </label>
                    <input 
                        type="email" 
                        id="forgot-email" 
                        name="email" 
                        class="form-input"
                        placeholder="Enter your email address"
                        required
                        autocomplete="email"
                        data-validate="true"
                        aria-describedby="forgot-email-error forgot-email-help"
                    >
                    <div class="form-help" id="forgot-email-help">
                        We'll send you a link to reset your password
                    </div>
                    <div class="form-error" id="forgot-email-error" role="alert"></div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn--primary btn--full" id="forgot-submit-btn">
                        <span class="btn-text">Send Reset Link</span>
                        <span class="btn-loading" style="display: none;">
                            <span class="loading-spinner"></span>
                            Sending...
                        </span>
                    </button>
                </div>
                
                <div class="form-footer">
                    <p class="form-text">
                        Remember your password? 
                        <a href="#" class="form-link" data-action="show-login">Back to sign in</a>
                    </p>
                </div>
            </form>
        `;
    }

    /**
     * Toggle password visibility
     * @param {string} targetId - Input field ID
     */
    togglePasswordVisibility(targetId) {
        const field = document.getElementById(targetId);
        const button = document.querySelector(`[data-target="${targetId}"]`);
        const icon = button?.querySelector('.password-toggle-icon');
        
        if (field && button && icon) {
            if (field.type === 'password') {
                field.type = 'text';
                icon.textContent = '🙈';
                button.setAttribute('aria-label', 'Hide password');
            } else {
                field.type = 'password';
                icon.textContent = '👁️';
                button.setAttribute('aria-label', 'Show password');
            }
        }
    };
                button.textContent = '👁️';
            }
        }
    }

    /**
     * Format date for display
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date
     */
    formatDate(date) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Format time for display
     * @param {string|Date} time - Time to format
     * @returns {string} Formatted time
     */
    formatTime(time) {
        if (!time) return '';
        
        const t = new Date(time);
        if (isNaN(t.getTime())) return '';
        
        return t.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
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
}

// Export for use in other modules
window.UIComponents = UIComponents;