/**
 * Enhanced Authentication Form Validator
 * Provides real-time validation, password strength indicators, and improved UX
 */
class AuthFormValidator {
    constructor() {
        this.validationRules = {
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            password: {
                required: true,
                minLength: 8,
                patterns: {
                    lowercase: /[a-z]/,
                    uppercase: /[A-Z]/,
                    numbers: /\d/,
                    special: /[^A-Za-z0-9]/
                }
            },
            firstName: {
                required: true,
                minLength: 2,
                maxLength: 50,
                pattern: /^[a-zA-Z\s'-]+$/,
                message: 'First name should only contain letters, spaces, hyphens, and apostrophes'
            },
            lastName: {
                required: true,
                minLength: 2,
                maxLength: 50,
                pattern: /^[a-zA-Z\s'-]+$/,
                message: 'Last name should only contain letters, spaces, hyphens, and apostrophes'
            }
        };

        this.passwordStrengthLevels = {
            0: { label: 'Very Weak', class: 'very-weak', color: '#ff4444' },
            1: { label: 'Weak', class: 'weak', color: '#ff8800' },
            2: { label: 'Fair', class: 'fair', color: '#ffaa00' },
            3: { label: 'Good', class: 'good', color: '#88cc00' },
            4: { label: 'Strong', class: 'strong', color: '#00cc44' },
            5: { label: 'Very Strong', class: 'very-strong', color: '#00aa44' }
        };

        this.debounceTimers = new Map();
        this.validationStates = new Map();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.injectStyles();
    }

    setupEventListeners() {
        // Use event delegation for dynamic forms
        document.addEventListener('input', (e) => {
            if (e.target.matches('.form-input[data-validate]')) {
                this.handleFieldInput(e.target);
            }
        });

        document.addEventListener('blur', (e) => {
            if (e.target.matches('.form-input[data-validate]')) {
                this.validateField(e.target, true);
            }
        });

        document.addEventListener('focus', (e) => {
            if (e.target.matches('.form-input[data-validate]')) {
                this.clearFieldError(e.target);
            }
        });

        // Form submission validation
        document.addEventListener('submit', (e) => {
            if (e.target.matches('.auth-form')) {
                if (!this.validateForm(e.target)) {
                    e.preventDefault();
                }
            }
        });
    }

    handleFieldInput(field) {
        const fieldName = field.name;
        
        // Clear existing timer
        if (this.debounceTimers.has(fieldName)) {
            clearTimeout(this.debounceTimers.get(fieldName));
        }

        // Set new timer for debounced validation
        const timer = setTimeout(() => {
            this.validateField(field, false);
            
            // Special handling for password fields
            if (fieldName === 'password') {
                this.updatePasswordStrength(field);
            }
            
            // Real-time password confirmation validation
            if (fieldName === 'password_confirmation') {
                this.validatePasswordConfirmation(field);
            }
        }, 300);

        this.debounceTimers.set(fieldName, timer);
    }

    validateField(field, showErrors = true) {
        const fieldName = field.name;
        const value = field.value.trim();
        const rules = this.getValidationRules(fieldName);
        
        if (!rules) return true;

        const errors = [];

        // Required validation
        if (rules.required && !value) {
            errors.push('This field is required');
        }

        if (value) {
            // Length validation
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`Must be at least ${rules.minLength} characters long`);
            }

            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`Must be no more than ${rules.maxLength} characters long`);
            }

            // Pattern validation
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(rules.message || 'Invalid format');
            }

            // Special password validation
            if (fieldName === 'password') {
                const passwordErrors = this.validatePasswordStrength(value);
                errors.push(...passwordErrors);
            }
        }

        const isValid = errors.length === 0;
        this.validationStates.set(fieldName, isValid);

        if (showErrors) {
            if (isValid) {
                this.showFieldSuccess(field);
            } else {
                this.showFieldError(field, errors[0]);
            }
        }

        return isValid;
    }

    validatePasswordStrength(password) {
        const errors = [];
        const rules = this.validationRules.password;

        if (password.length < rules.minLength) {
            errors.push(`Password must be at least ${rules.minLength} characters long`);
        }

        const missingPatterns = [];
        if (!rules.patterns.lowercase.test(password)) {
            missingPatterns.push('lowercase letter');
        }
        if (!rules.patterns.uppercase.test(password)) {
            missingPatterns.push('uppercase letter');
        }
        if (!rules.patterns.numbers.test(password)) {
            missingPatterns.push('number');
        }
        if (!rules.patterns.special.test(password)) {
            missingPatterns.push('special character');
        }

        if (missingPatterns.length > 0) {
            errors.push(`Password should include: ${missingPatterns.join(', ')}`);
        }

        return errors;
    }

    validatePasswordConfirmation(field) {
        const form = field.closest('form');
        const passwordField = form.querySelector('input[name="password"]');
        
        if (!passwordField) return true;

        const password = passwordField.value;
        const confirmation = field.value;

        if (confirmation && password !== confirmation) {
            this.showFieldError(field, 'Passwords do not match');
            this.validationStates.set('password_confirmation', false);
            return false;
        } else if (confirmation) {
            this.showFieldSuccess(field);
            this.validationStates.set('password_confirmation', true);
            return true;
        }

        return true;
    }

    updatePasswordStrength(field) {
        const password = field.value;
        const strength = this.calculatePasswordStrength(password);
        const strengthInfo = this.passwordStrengthLevels[strength];

        let strengthIndicator = field.parentNode.querySelector('.password-strength');
        
        if (!strengthIndicator) {
            strengthIndicator = this.createPasswordStrengthIndicator();
            field.parentNode.appendChild(strengthIndicator);
        }

        this.updateStrengthIndicator(strengthIndicator, strength, strengthInfo);
    }

    calculatePasswordStrength(password) {
        if (!password) return 0;

        let score = 0;
        const rules = this.validationRules.password;

        // Length scoring
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;

        // Pattern scoring
        if (rules.patterns.lowercase.test(password)) score++;
        if (rules.patterns.uppercase.test(password)) score++;
        if (rules.patterns.numbers.test(password)) score++;
        if (rules.patterns.special.test(password)) score++;

        // Bonus for variety
        const uniqueChars = new Set(password).size;
        if (uniqueChars >= password.length * 0.7) score++;

        return Math.min(score, 5);
    }

    createPasswordStrengthIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'password-strength';
        indicator.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill"></div>
            </div>
            <div class="strength-text">
                <span class="strength-label"></span>
                <span class="strength-requirements"></span>
            </div>
        `;
        return indicator;
    }

    updateStrengthIndicator(indicator, strength, strengthInfo) {
        const fill = indicator.querySelector('.strength-fill');
        const label = indicator.querySelector('.strength-label');
        const requirements = indicator.querySelector('.strength-requirements');

        // Update bar
        fill.style.width = `${(strength / 5) * 100}%`;
        fill.style.backgroundColor = strengthInfo.color;
        fill.className = `strength-fill strength-${strengthInfo.class}`;

        // Update label
        label.textContent = strengthInfo.label;
        label.style.color = strengthInfo.color;

        // Update requirements
        if (strength < 3) {
            const missing = this.getMissingRequirements();
            requirements.textContent = missing.length > 0 ? `Missing: ${missing.join(', ')}` : '';
            requirements.style.display = missing.length > 0 ? 'block' : 'none';
        } else {
            requirements.style.display = 'none';
        }
    }

    getMissingRequirements() {
        // This would be called with the current password to show what's missing
        return [];
    }

    validateForm(form) {
        const fields = form.querySelectorAll('.form-input[data-validate]');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field, true)) {
                isValid = false;
            }
        });

        // Focus first invalid field
        if (!isValid) {
            const firstInvalid = form.querySelector('.form-input--error');
            if (firstInvalid) {
                firstInvalid.focus();
            }
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.remove('form-input--success');
        field.classList.add('form-input--error');

        const errorElement = this.getOrCreateErrorElement(field);
        errorElement.textContent = message;
        errorElement.classList.add('form-error--show');

        // Add shake animation
        field.classList.add('shake');
        setTimeout(() => field.classList.remove('shake'), 500);
    }

    showFieldSuccess(field) {
        field.classList.remove('form-input--error');
        field.classList.add('form-input--success');

        const errorElement = this.getOrCreateErrorElement(field);
        errorElement.classList.remove('form-error--show');
    }

    clearFieldError(field) {
        field.classList.remove('form-input--error');
        
        const errorElement = this.getOrCreateErrorElement(field);
        errorElement.classList.remove('form-error--show');
    }

    getOrCreateErrorElement(field) {
        const fieldId = field.id;
        let errorElement = document.getElementById(`${fieldId}-error`);
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = `${fieldId}-error`;
            errorElement.className = 'form-error';
            field.parentNode.appendChild(errorElement);
        }

        return errorElement;
    }

    getValidationRules(fieldName) {
        const ruleMap = {
            email: this.validationRules.email,
            password: this.validationRules.password,
            first_name: this.validationRules.firstName,
            last_name: this.validationRules.lastName
        };

        return ruleMap[fieldName];
    }

    injectStyles() {
        if (document.getElementById('auth-validator-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'auth-validator-styles';
        styles.textContent = `
            .form-input--error {
                border-color: #ff4444 !important;
                box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.1) !important;
            }

            .form-input--success {
                border-color: #00cc44 !important;
                box-shadow: 0 0 0 2px rgba(0, 204, 68, 0.1) !important;
            }

            .form-error {
                color: #ff4444;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s ease;
            }

            .form-error--show {
                opacity: 1;
                transform: translateY(0);
            }

            .password-strength {
                margin-top: 0.5rem;
            }

            .strength-bar {
                height: 4px;
                background-color: #e5e7eb;
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 0.25rem;
            }

            .strength-fill {
                height: 100%;
                transition: all 0.3s ease;
                border-radius: 2px;
            }

            .strength-text {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.75rem;
            }

            .strength-label {
                font-weight: 600;
            }

            .strength-requirements {
                color: #6b7280;
                font-size: 0.7rem;
            }

            .shake {
                animation: shake 0.5s ease-in-out;
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }

            .form-input:focus {
                outline: none;
                border-color: var(--primary-500, #3b82f6);
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
            }

            .loading-input {
                position: relative;
            }

            .loading-input::after {
                content: '';
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                width: 16px;
                height: 16px;
                border: 2px solid #e5e7eb;
                border-top: 2px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: translateY(-50%) rotate(0deg); }
                100% { transform: translateY(-50%) rotate(360deg); }
            }
        `;

        document.head.appendChild(styles);
    }

    // Public methods for external use
    validateEmail(email) {
        return this.validationRules.email.pattern.test(email);
    }

    getPasswordStrength(password) {
        return this.calculatePasswordStrength(password);
    }

    isFormValid(form) {
        return this.validateForm(form);
    }
}

// Initialize validator when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.authFormValidator = new AuthFormValidator();
    });
} else {
    window.authFormValidator = new AuthFormValidator();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthFormValidator;
}