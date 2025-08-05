// Form Validation System
class FormValidator {
    constructor() {
        this.rules = new Map();
        this.messages = new Map();
        this.setupDefaultRules();
    }

    setupDefaultRules() {
        // Required field validation
        this.addRule('required', (value) => {
            return value !== null && value !== undefined && String(value).trim() !== '';
        }, 'This field is required');

        // Email validation
        this.addRule('email', (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return !value || emailRegex.test(value);
        }, 'Please enter a valid email address');

        // Minimum length validation
        this.addRule('minLength', (value, min) => {
            return !value || String(value).length >= min;
        }, 'Must be at least {0} characters long');

        // Maximum length validation
        this.addRule('maxLength', (value, max) => {
            return !value || String(value).length <= max;
        }, 'Must be no more than {0} characters long');

        // Number validation
        this.addRule('number', (value) => {
            return !value || !isNaN(Number(value));
        }, 'Must be a valid number');

        // Positive number validation
        this.addRule('positive', (value) => {
            return !value || (Number(value) > 0);
        }, 'Must be a positive number');

        // Date validation
        this.addRule('date', (value) => {
            return !value || !isNaN(Date.parse(value));
        }, 'Must be a valid date');

        // Past date validation
        this.addRule('pastDate', (value) => {
            return !value || new Date(value) <= new Date();
        }, 'Date cannot be in the future');

        // Phone validation
        this.addRule('phone', (value) => {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            return !value || phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
        }, 'Please enter a valid phone number');

        // Password strength validation
        this.addRule('password', (value) => {
            return !value || (value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value));
        }, 'Password must be at least 8 characters with uppercase, lowercase, and number');

        // Confirm password validation
        this.addRule('confirmPassword', (value, originalValue) => {
            return !value || value === originalValue;
        }, 'Passwords do not match');
    }

    addRule(name, validator, message) {
        this.rules.set(name, validator);
        this.messages.set(name, message);
    }

    validateField(value, rules) {
        const errors = [];

        for (const rule of rules) {
            let ruleName, ruleParams;
            
            if (typeof rule === 'string') {
                ruleName = rule;
                ruleParams = [];
            } else if (typeof rule === 'object') {
                ruleName = rule.rule;
                ruleParams = rule.params || [];
            }

            const validator = this.rules.get(ruleName);
            if (!validator) continue;

            const isValid = validator(value, ...ruleParams);
            if (!isValid) {
                let message = this.messages.get(ruleName);
                // Replace placeholders in message
                ruleParams.forEach((param, index) => {
                    message = message.replace(`{${index}}`, param);
                });
                errors.push(message);
            }
        }

        return errors;
    }

    validateForm(formData, validationRules) {
        const errors = {};
        let isValid = true;

        for (const [fieldName, rules] of Object.entries(validationRules)) {
            const fieldValue = formData[fieldName];
            const fieldErrors = this.validateField(fieldValue, rules);
            
            if (fieldErrors.length > 0) {
                errors[fieldName] = fieldErrors;
                isValid = false;
            }
        }

        return { isValid, errors };
    }

    setupRealTimeValidation(form, validationRules) {
        const fields = form.querySelectorAll('[name]');
        
        fields.forEach(field => {
            const fieldName = field.name;
            const rules = validationRules[fieldName];
            
            if (!rules) return;

            // Validate on blur
            field.addEventListener('blur', () => {
                this.validateAndShowFieldErrors(field, rules);
            });

            // Clear errors on input
            field.addEventListener('input', () => {
                this.clearFieldErrors(field);
            });
        });

        // Validate on form submit
        form.addEventListener('submit', (e) => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const validation = this.validateForm(data, validationRules);

            if (!validation.isValid) {
                e.preventDefault();
                this.showFormErrors(form, validation.errors);
            }
        });
    }

    validateAndShowFieldErrors(field, rules) {
        const errors = this.validateField(field.value, rules);
        
        if (errors.length > 0) {
            this.showFieldError(field, errors[0]);
            return false;
        } else {
            this.clearFieldErrors(field);
            return true;
        }
    }

    showFieldError(field, message) {
        this.clearFieldErrors(field);
        
        field.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        
        field.parentNode.appendChild(errorElement);
    }

    clearFieldErrors(field) {
        field.classList.remove('error');
        
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    showFormErrors(form, errors) {
        // Clear existing errors
        form.querySelectorAll('.field-error').forEach(error => error.remove());
        form.querySelectorAll('.error').forEach(field => field.classList.remove('error'));

        // Show new errors
        for (const [fieldName, fieldErrors] of Object.entries(errors)) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field && fieldErrors.length > 0) {
                this.showFieldError(field, fieldErrors[0]);
            }
        }

        // Focus first error field
        const firstErrorField = form.querySelector('.error');
        if (firstErrorField) {
            firstErrorField.focus();
        }
    }

    clearFormErrors(form) {
        form.querySelectorAll('.field-error').forEach(error => error.remove());
        form.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
    }
}

// Export for module use
window.FormValidator = FormValidator;