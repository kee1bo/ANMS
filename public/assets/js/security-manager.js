/**
 * Security Manager
 * Handles client-side security features including rate limiting, CSRF protection, and input sanitization
 */
class SecurityManager {
    constructor() {
        this.rateLimits = new Map();
        this.csrfToken = null;
        this.failedAttempts = new Map();
        this.blockedIPs = new Set();
        
        // Security configuration
        this.config = {
            maxLoginAttempts: 5,
            lockoutDuration: 15 * 60 * 1000, // 15 minutes
            rateLimitWindow: 60 * 1000, // 1 minute
            maxRequestsPerWindow: 10,
            captchaThreshold: 3,
            passwordMinLength: 8,
            sessionTimeout: 30 * 60 * 1000 // 30 minutes
        };

        this.init();
    }

    init() {
        this.setupCSRFProtection();
        this.setupSecurityHeaders();
        this.setupInputSanitization();
        this.loadFailedAttempts();
    }

    /**
     * Setup CSRF protection
     */
    async setupCSRFProtection() {
        try {
            // Get CSRF token from server
            const response = await fetch('/api.php?action=get_csrf_token', {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.csrfToken = data.csrf_token;
                
                // Add CSRF token to all forms
                this.addCSRFTokenToForms();
                
                // Set up automatic CSRF token refresh
                this.setupCSRFRefresh();
            }
        } catch (error) {
            console.error('Failed to setup CSRF protection:', error);
        }
    }

    /**
     * Add CSRF token to all forms
     */
    addCSRFTokenToForms() {
        if (!this.csrfToken) return;

        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            this.addCSRFTokenToForm(form);
        });

        // Watch for dynamically added forms
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'FORM') {
                            this.addCSRFTokenToForm(node);
                        } else {
                            const forms = node.querySelectorAll('form');
                            forms.forEach(form => this.addCSRFTokenToForm(form));
                        }
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Add CSRF token to a specific form
     */
    addCSRFTokenToForm(form) {
        if (!this.csrfToken || form.querySelector('input[name="csrf_token"]')) return;

        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrf_token';
        csrfInput.value = this.csrfToken;
        form.appendChild(csrfInput);
    }

    /**
     * Setup CSRF token refresh
     */
    setupCSRFRefresh() {
        // Refresh CSRF token every 30 minutes
        setInterval(() => {
            this.refreshCSRFToken();
        }, 30 * 60 * 1000);
    }

    /**
     * Refresh CSRF token
     */
    async refreshCSRFToken() {
        try {
            const response = await fetch('/api.php?action=refresh_csrf_token', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ current_token: this.csrfToken })
            });

            if (response.ok) {
                const data = await response.json();
                this.csrfToken = data.csrf_token;
                
                // Update all forms with new token
                const csrfInputs = document.querySelectorAll('input[name="csrf_token"]');
                csrfInputs.forEach(input => {
                    input.value = this.csrfToken;
                });
            }
        } catch (error) {
            console.error('Failed to refresh CSRF token:', error);
        }
    }

    /**
     * Setup security headers for requests
     */
    setupSecurityHeaders() {
        // Override fetch to add security headers
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            const secureOptions = {
                ...options,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-Content-Type-Options': 'nosniff',
                    'X-Frame-Options': 'DENY',
                    'X-XSS-Protection': '1; mode=block',
                    ...options.headers
                }
            };

            // Add CSRF token to POST requests
            if (options.method === 'POST' && this.csrfToken) {
                if (options.body instanceof FormData) {
                    options.body.append('csrf_token', this.csrfToken);
                } else if (typeof options.body === 'string') {
                    try {
                        const bodyData = JSON.parse(options.body);
                        bodyData.csrf_token = this.csrfToken;
                        secureOptions.body = JSON.stringify(bodyData);
                    } catch (e) {
                        // If body is not JSON, append CSRF token as form data
                        const formData = new FormData();
                        formData.append('csrf_token', this.csrfToken);
                        if (options.body) {
                            formData.append('data', options.body);
                        }
                        secureOptions.body = formData;
                    }
                }
            }

            return originalFetch(url, secureOptions);
        };
    }

    /**
     * Setup input sanitization
     */
    setupInputSanitization() {
        // Add input event listeners for real-time sanitization
        document.addEventListener('input', (e) => {
            if (e.target.matches('input[type="text"], input[type="email"], textarea')) {
                this.sanitizeInput(e.target);
            }
        });
    }

    /**
     * Sanitize input value
     */
    sanitizeInput(input) {
        const originalValue = input.value;
        let sanitizedValue = originalValue;

        // Remove potentially dangerous characters
        sanitizedValue = sanitizedValue.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitizedValue = sanitizedValue.replace(/javascript:/gi, '');
        sanitizedValue = sanitizedValue.replace(/on\w+\s*=/gi, '');
        
        // Limit length to prevent buffer overflow attacks
        const maxLength = input.getAttribute('maxlength') || 1000;
        if (sanitizedValue.length > maxLength) {
            sanitizedValue = sanitizedValue.substring(0, maxLength);
        }

        if (sanitizedValue !== originalValue) {
            input.value = sanitizedValue;
            this.showSecurityWarning('Potentially dangerous content was removed from your input.');
        }
    }

    /**
     * Check rate limiting for requests
     */
    checkRateLimit(identifier, action = 'default') {
        const key = `${identifier}_${action}`;
        const now = Date.now();
        
        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, { count: 1, windowStart: now });
            return true;
        }

        const limit = this.rateLimits.get(key);
        
        // Reset window if expired
        if (now - limit.windowStart > this.config.rateLimitWindow) {
            limit.count = 1;
            limit.windowStart = now;
            return true;
        }

        // Check if limit exceeded
        if (limit.count >= this.config.maxRequestsPerWindow) {
            return false;
        }

        limit.count++;
        return true;
    }

    /**
     * Track failed login attempts
     */
    trackFailedAttempt(identifier) {
        const now = Date.now();
        
        if (!this.failedAttempts.has(identifier)) {
            this.failedAttempts.set(identifier, { count: 1, lastAttempt: now, lockedUntil: null });
        } else {
            const attempts = this.failedAttempts.get(identifier);
            attempts.count++;
            attempts.lastAttempt = now;

            // Lock account if too many attempts
            if (attempts.count >= this.config.maxLoginAttempts) {
                attempts.lockedUntil = now + this.config.lockoutDuration;
                this.showSecurityWarning(`Account temporarily locked due to too many failed login attempts. Try again in ${Math.ceil(this.config.lockoutDuration / 60000)} minutes.`);
            }
        }

        // Save to localStorage for persistence
        this.saveFailedAttempts();
        
        return this.failedAttempts.get(identifier);
    }

    /**
     * Check if account is locked
     */
    isAccountLocked(identifier) {
        if (!this.failedAttempts.has(identifier)) return false;

        const attempts = this.failedAttempts.get(identifier);
        if (!attempts.lockedUntil) return false;

        const now = Date.now();
        if (now > attempts.lockedUntil) {
            // Lock expired, reset attempts
            attempts.count = 0;
            attempts.lockedUntil = null;
            this.saveFailedAttempts();
            return false;
        }

        return true;
    }

    /**
     * Reset failed attempts for successful login
     */
    resetFailedAttempts(identifier) {
        this.failedAttempts.delete(identifier);
        this.saveFailedAttempts();
    }

    /**
     * Save failed attempts to localStorage
     */
    saveFailedAttempts() {
        try {
            const attemptsData = {};
            this.failedAttempts.forEach((value, key) => {
                attemptsData[key] = value;
            });
            localStorage.setItem('petnutri_failed_attempts', JSON.stringify(attemptsData));
        } catch (error) {
            console.error('Failed to save failed attempts:', error);
        }
    }

    /**
     * Load failed attempts from localStorage
     */
    loadFailedAttempts() {
        try {
            const stored = localStorage.getItem('petnutri_failed_attempts');
            if (stored) {
                const attemptsData = JSON.parse(stored);
                Object.entries(attemptsData).forEach(([key, value]) => {
                    this.failedAttempts.set(key, value);
                });
            }
        } catch (error) {
            console.error('Failed to load failed attempts:', error);
        }
    }

    /**
     * Check if CAPTCHA is required
     */
    isCaptchaRequired(identifier) {
        if (!this.failedAttempts.has(identifier)) return false;
        
        const attempts = this.failedAttempts.get(identifier);
        return attempts.count >= this.config.captchaThreshold;
    }

    /**
     * Validate password strength
     */
    validatePasswordStrength(password) {
        const requirements = {
            minLength: password.length >= this.config.passwordMinLength,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumbers: /\d/.test(password),
            hasSpecialChars: /[^A-Za-z0-9]/.test(password),
            noCommonPatterns: !this.hasCommonPatterns(password)
        };

        const score = Object.values(requirements).filter(Boolean).length;
        
        return {
            isValid: score >= 4,
            score: score,
            requirements: requirements,
            strength: this.getPasswordStrengthLabel(score)
        };
    }

    /**
     * Check for common password patterns
     */
    hasCommonPatterns(password) {
        const commonPatterns = [
            /123456/,
            /password/i,
            /qwerty/i,
            /admin/i,
            /letmein/i,
            /welcome/i,
            /monkey/i,
            /dragon/i
        ];

        return commonPatterns.some(pattern => pattern.test(password));
    }

    /**
     * Get password strength label
     */
    getPasswordStrengthLabel(score) {
        const labels = {
            0: 'Very Weak',
            1: 'Weak',
            2: 'Fair',
            3: 'Good',
            4: 'Strong',
            5: 'Very Strong',
            6: 'Excellent'
        };

        return labels[score] || 'Very Weak';
    }

    /**
     * Show security warning
     */
    showSecurityWarning(message) {
        if (window.petNutriApp && window.petNutriApp.ui) {
            window.petNutriApp.ui.showWarning(message);
        } else {
            console.warn('Security Warning:', message);
        }
    }

    /**
     * Show CAPTCHA challenge
     */
    async showCaptchaChallenge() {
        return new Promise((resolve) => {
            // Create simple math CAPTCHA
            const num1 = Math.floor(Math.random() * 10) + 1;
            const num2 = Math.floor(Math.random() * 10) + 1;
            const answer = num1 + num2;

            const captchaModal = this.createCaptchaModal(num1, num2, (userAnswer) => {
                const isCorrect = parseInt(userAnswer) === answer;
                resolve(isCorrect);
            });

            document.body.appendChild(captchaModal);
        });
    }

    /**
     * Create CAPTCHA modal
     */
    createCaptchaModal(num1, num2, callback) {
        const modal = document.createElement('div');
        modal.className = 'captcha-modal';
        modal.innerHTML = `
            <div class="captcha-backdrop"></div>
            <div class="captcha-container">
                <div class="captcha-header">
                    <h3>Security Verification</h3>
                </div>
                <div class="captcha-body">
                    <p>Please solve this simple math problem to continue:</p>
                    <div class="captcha-challenge">
                        <span class="captcha-question">${num1} + ${num2} = ?</span>
                        <input type="number" class="captcha-input" placeholder="Enter answer" required>
                    </div>
                </div>
                <div class="captcha-actions">
                    <button type="button" class="btn btn--secondary captcha-cancel">Cancel</button>
                    <button type="button" class="btn btn--primary captcha-submit">Verify</button>
                </div>
            </div>
        `;

        const input = modal.querySelector('.captcha-input');
        const submitBtn = modal.querySelector('.captcha-submit');
        const cancelBtn = modal.querySelector('.captcha-cancel');

        const handleSubmit = () => {
            const answer = input.value.trim();
            callback(answer);
            this.closeCaptchaModal(modal);
        };

        const handleCancel = () => {
            callback(null);
            this.closeCaptchaModal(modal);
        };

        submitBtn.addEventListener('click', handleSubmit);
        cancelBtn.addEventListener('click', handleCancel);
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSubmit();
            }
        });

        // Focus input after modal is added
        setTimeout(() => input.focus(), 100);

        return modal;
    }

    /**
     * Close CAPTCHA modal
     */
    closeCaptchaModal(modal) {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }

    /**
     * Validate request before sending
     */
    async validateRequest(url, options = {}) {
        const identifier = this.getClientIdentifier();
        
        // Check rate limiting
        if (!this.checkRateLimit(identifier, options.action || 'request')) {
            throw new Error('Too many requests. Please wait before trying again.');
        }

        // Check if CAPTCHA is required for login attempts
        if (options.action === 'login' && this.isCaptchaRequired(identifier)) {
            const captchaValid = await this.showCaptchaChallenge();
            if (!captchaValid) {
                throw new Error('CAPTCHA verification failed.');
            }
        }

        // Check if account is locked
        if (options.action === 'login' && this.isAccountLocked(identifier)) {
            const attempts = this.failedAttempts.get(identifier);
            const remainingTime = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
            throw new Error(`Account is temporarily locked. Try again in ${remainingTime} minutes.`);
        }

        return true;
    }

    /**
     * Get client identifier for rate limiting
     */
    getClientIdentifier() {
        // Use a combination of factors to identify the client
        const factors = [
            navigator.userAgent,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            navigator.language
        ];

        // Create a simple hash
        let hash = 0;
        const str = factors.join('|');
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return Math.abs(hash).toString();
    }

    /**
     * Handle successful login
     */
    handleSuccessfulLogin(identifier) {
        this.resetFailedAttempts(identifier);
    }

    /**
     * Handle failed login
     */
    handleFailedLogin(identifier) {
        return this.trackFailedAttempt(identifier);
    }

    /**
     * Get security status
     */
    getSecurityStatus() {
        const identifier = this.getClientIdentifier();
        const attempts = this.failedAttempts.get(identifier);
        
        return {
            hasCSRFToken: !!this.csrfToken,
            isAccountLocked: this.isAccountLocked(identifier),
            failedAttempts: attempts ? attempts.count : 0,
            captchaRequired: this.isCaptchaRequired(identifier),
            rateLimitStatus: this.getRateLimitStatus(identifier)
        };
    }

    /**
     * Get rate limit status
     */
    getRateLimitStatus(identifier) {
        const key = `${identifier}_default`;
        const limit = this.rateLimits.get(key);
        
        if (!limit) return { remaining: this.config.maxRequestsPerWindow, resetTime: null };
        
        const now = Date.now();
        const windowExpired = now - limit.windowStart > this.config.rateLimitWindow;
        
        if (windowExpired) {
            return { remaining: this.config.maxRequestsPerWindow, resetTime: null };
        }
        
        return {
            remaining: Math.max(0, this.config.maxRequestsPerWindow - limit.count),
            resetTime: limit.windowStart + this.config.rateLimitWindow
        };
    }
}

// Export for use in other modules
window.SecurityManager = SecurityManager;