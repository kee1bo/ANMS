// Form Components with Validation and Accessibility
class FormField {
    constructor(options = {}) {
        this.options = {
            type: options.type || 'text',
            name: options.name || '',
            label: options.label || '',
            placeholder: options.placeholder || '',
            required: options.required || false,
            disabled: options.disabled || false,
            readonly: options.readonly || false,
            value: options.value || '',
            options: options.options || [], // for select/radio/checkbox
            validation: options.validation || [],
            helpText: options.helpText || '',
            className: options.className || '',
            ...options
        };
        
        this.element = null;
        this.validator = new FormValidator();
        this.errors = [];
    }

    create() {
        if (this.element) return this.element;

        const fieldId = `field-${this.options.name}-${Date.now()}`;
        const wrapper = document.createElement('div');
        wrapper.className = `form-group ${this.options.className}`;

        // Label
        if (this.options.label) {
            const label = document.createElement('label');
            label.className = 'form-label';
            label.setAttribute('for', fieldId);
            label.textContent = this.options.label;
            if (this.options.required) {
                label.innerHTML += ' <span class="form-required">*</span>';
            }
            wrapper.appendChild(label);
        }

        // Input element
        const input = this.createInput(fieldId);
        wrapper.appendChild(input);

        // Help text
        if (this.options.helpText) {
            const helpText = document.createElement('div');
            helpText.className = 'form-help';
            helpText.textContent = this.options.helpText;
            wrapper.appendChild(helpText);
        }

        // Error container
        const errorContainer = document.createElement('div');
        errorContainer.className = 'form-error';
        errorContainer.setAttribute('role', 'alert');
        wrapper.appendChild(errorContainer);

        this.element = wrapper;
        this.setupValidation();
        
        return this.element;
    }

    createInput(fieldId) {
        let input;

        switch (this.options.type) {
            case 'select':
                input = this.createSelect(fieldId);
                break;
            case 'textarea':
                input = this.createTextarea(fieldId);
                break;
            case 'radio':
                return this.createRadioGroup(fieldId);
            case 'checkbox':
                return this.createCheckboxGroup(fieldId);
            default:
                input = this.createTextInput(fieldId);
        }

        return input;
    }

    createTextInput(fieldId) {
        const input = document.createElement('input');
        input.type = this.options.type;
        input.id = fieldId;
        input.name = this.options.name;
        input.className = 'form-input';
        input.placeholder = this.options.placeholder;
        input.value = this.options.value;
        input.required = this.options.required;
        input.disabled = this.options.disabled;
        input.readOnly = this.options.readonly;

        // Additional attributes based on type
        if (this.options.type === 'email') {
            input.setAttribute('autocomplete', 'email');
        } else if (this.options.type === 'password') {
            input.setAttribute('autocomplete', 'current-password');
        } else if (this.options.type === 'number') {
            if (this.options.min !== undefined) input.min = this.options.min;
            if (this.options.max !== undefined) input.max = this.options.max;
            if (this.options.step !== undefined) input.step = this.options.step;
        }

        return input;
    }

    createSelect(fieldId) {
        const select = document.createElement('select');
        select.id = fieldId;
        select.name = this.options.name;
        select.className = 'form-select';
        select.required = this.options.required;
        select.disabled = this.options.disabled;

        // Default option
        if (this.options.placeholder) {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = this.options.placeholder;
            defaultOption.disabled = true;
            defaultOption.selected = !this.options.value;
            select.appendChild(defaultOption);
        }

        // Options
        this.options.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            optionElement.selected = option.value === this.options.value;
            select.appendChild(optionElement);
        });

        return select;
    }

    createTextarea(fieldId) {
        const textarea = document.createElement('textarea');
        textarea.id = fieldId;
        textarea.name = this.options.name;
        textarea.className = 'form-textarea';
        textarea.placeholder = this.options.placeholder;
        textarea.value = this.options.value;
        textarea.required = this.options.required;
        textarea.disabled = this.options.disabled;
        textarea.readOnly = this.options.readonly;
        
        if (this.options.rows) textarea.rows = this.options.rows;
        if (this.options.cols) textarea.cols = this.options.cols;

        return textarea;
    }

    createRadioGroup(fieldId) {
        const fieldset = document.createElement('fieldset');
        fieldset.className = 'form-fieldset';

        if (this.options.label) {
            const legend = document.createElement('legend');
            legend.className = 'form-legend';
            legend.textContent = this.options.label;
            fieldset.appendChild(legend);
        }

        this.options.options.forEach((option, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'form-radio';

            const input = document.createElement('input');
            input.type = 'radio';
            input.id = `${fieldId}-${index}`;
            input.name = this.options.name;
            input.value = option.value;
            input.className = 'form-radio-input';
            input.checked = option.value === this.options.value;
            input.required = this.options.required;
            input.disabled = this.options.disabled;

            const label = document.createElement('label');
            label.className = 'form-radio-label';
            label.setAttribute('for', input.id);
            label.textContent = option.label;

            wrapper.appendChild(input);
            wrapper.appendChild(label);
            fieldset.appendChild(wrapper);
        });

        return fieldset;
    }

    createCheckboxGroup(fieldId) {
        const fieldset = document.createElement('fieldset');
        fieldset.className = 'form-fieldset';

        if (this.options.label) {
            const legend = document.createElement('legend');
            legend.className = 'form-legend';
            legend.textContent = this.options.label;
            fieldset.appendChild(legend);
        }

        this.options.options.forEach((option, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'form-checkbox';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = `${fieldId}-${index}`;
            input.name = this.options.name;
            input.value = option.value;
            input.className = 'form-checkbox-input';
            input.checked = Array.isArray(this.options.value) ? 
                this.options.value.includes(option.value) : 
                option.value === this.options.value;
            input.disabled = this.options.disabled;

            const label = document.createElement('label');
            label.className = 'form-checkbox-label';
            label.setAttribute('for', input.id);
            label.textContent = option.label;

            wrapper.appendChild(input);
            wrapper.appendChild(label);
            fieldset.appendChild(wrapper);
        });

        return fieldset;
    }

    setupValidation() {
        if (!this.element || !this.options.validation.length) return;

        const input = this.getInputElement();
        if (!input) return;

        // Real-time validation on blur
        input.addEventListener('blur', () => {
            this.validate();
        });

        // Clear errors on input
        input.addEventListener('input', () => {
            this.clearErrors();
        });
    }

    getInputElement() {
        if (!this.element) return null;
        
        return this.element.querySelector('input, select, textarea');
    }

    getValue() {
        const input = this.getInputElement();
        if (!input) return null;

        if (input.type === 'checkbox') {
            const checkboxes = this.element.querySelectorAll('input[type="checkbox"]:checked');
            return Array.from(checkboxes).map(cb => cb.value);
        } else if (input.type === 'radio') {
            const checked = this.element.querySelector('input[type="radio"]:checked');
            return checked ? checked.value : null;
        }

        return input.value;
    }

    setValue(value) {
        const input = this.getInputElement();
        if (!input) return;

        if (input.type === 'checkbox') {
            const checkboxes = this.element.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                cb.checked = Array.isArray(value) ? value.includes(cb.value) : cb.value === value;
            });
        } else if (input.type === 'radio') {
            const radios = this.element.querySelectorAll('input[type="radio"]');
            radios.forEach(radio => {
                radio.checked = radio.value === value;
            });
        } else {
            input.value = value;
        }
    }

    validate() {
        if (!this.options.validation.length) return true;

        const value = this.getValue();
        this.errors = this.validator.validateField(value, this.options.validation);
        
        if (this.errors.length > 0) {
            this.showErrors();
            return false;
        } else {
            this.clearErrors();
            return true;
        }
    }

    showErrors() {
        if (!this.element) return;

        const input = this.getInputElement();
        const errorContainer = this.element.querySelector('.form-error');
        
        if (input) {
            input.classList.add('error');
            input.setAttribute('aria-invalid', 'true');
        }

        if (errorContainer && this.errors.length > 0) {
            errorContainer.textContent = this.errors[0];
            errorContainer.style.display = 'block';
        }
    }

    clearErrors() {
        if (!this.element) return;

        const input = this.getInputElement();
        const errorContainer = this.element.querySelector('.form-error');
        
        if (input) {
            input.classList.remove('error');
            input.removeAttribute('aria-invalid');
        }

        if (errorContainer) {
            errorContainer.textContent = '';
            errorContainer.style.display = 'none';
        }

        this.errors = [];
    }

    disable() {
        const input = this.getInputElement();
        if (input) {
            input.disabled = true;
        }
    }

    enable() {
        const input = this.getInputElement();
        if (input) {
            input.disabled = false;
        }
    }
}

// Form Builder Class
class FormBuilder {
    constructor(options = {}) {
        this.options = {
            action: options.action || '',
            method: options.method || 'POST',
            className: options.className || '',
            autoValidate: options.autoValidate !== false,
            ...options
        };
        
        this.fields = new Map();
        this.element = null;
    }

    create() {
        if (this.element) return this.element;

        this.element = document.createElement('form');
        this.element.className = `form ${this.options.className}`;
        this.element.action = this.options.action;
        this.element.method = this.options.method;
        this.element.noValidate = true; // We handle validation ourselves

        if (this.options.autoValidate) {
            this.element.addEventListener('submit', (e) => {
                if (!this.validate()) {
                    e.preventDefault();
                }
            });
        }

        return this.element;
    }

    addField(name, options) {
        const field = new FormField({ name, ...options });
        this.fields.set(name, field);
        
        if (this.element) {
            this.element.appendChild(field.create());
        }
        
        return field;
    }

    removeField(name) {
        const field = this.fields.get(name);
        if (field && field.element) {
            field.element.remove();
        }
        this.fields.delete(name);
    }

    getField(name) {
        return this.fields.get(name);
    }

    getData() {
        const data = {};
        this.fields.forEach((field, name) => {
            data[name] = field.getValue();
        });
        return data;
    }

    setData(data) {
        Object.entries(data).forEach(([name, value]) => {
            const field = this.fields.get(name);
            if (field) {
                field.setValue(value);
            }
        });
    }

    validate() {
        let isValid = true;
        this.fields.forEach(field => {
            if (!field.validate()) {
                isValid = false;
            }
        });
        return isValid;
    }

    clearErrors() {
        this.fields.forEach(field => {
            field.clearErrors();
        });
    }

    disable() {
        this.fields.forEach(field => {
            field.disable();
        });
    }

    enable() {
        this.fields.forEach(field => {
            field.enable();
        });
    }
}

// Export for module use
window.FormField = FormField;
window.FormBuilder = FormBuilder;