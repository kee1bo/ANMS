// Enhanced Pet Profile Form Component
class PetFormEnhanced extends EventEmitter {
    constructor(container, options = {}) {
        super();
        this.container = container;
        this.options = {
            mode: options.mode || 'create', // 'create' or 'edit'
            petData: options.petData || {},
            showAdvanced: options.showAdvanced || false,
            realTimeValidation: options.realTimeValidation !== false,
            ...options
        };

        this.validator = new PetProfileValidator();
        this.formBuilder = new FormBuilder({
            className: 'pet-profile-form',
            autoValidate: false
        });

        this.currentStep = 1;
        this.totalSteps = 4;
        this.validationResults = {};
        this.isDirty = false;

        this.init();
    }

    init() {
        this.createFormStructure();
        this.setupEventListeners();
        this.setupRealTimeValidation();
        
        if (this.options.petData && Object.keys(this.options.petData).length > 0) {
            this.populateForm(this.options.petData);
        }
    }

    createFormStructure() {
        this.container.innerHTML = `
            <div class="pet-form-container">
                <div class="pet-form-header">
                    <h2>${this.options.mode === 'create' ? 'Add New Pet' : 'Edit Pet Profile'}</h2>
                    <div class="form-progress">
                        <div class="progress-steps">
                            <div class="step ${this.currentStep >= 1 ? 'active' : ''}" data-step="1">
                                <span class="step-number">1</span>
                                <span class="step-label">Basic Info</span>
                            </div>
                            <div class="step ${this.currentStep >= 2 ? 'active' : ''}" data-step="2">
                                <span class="step-number">2</span>
                                <span class="step-label">Physical</span>
                            </div>
                            <div class="step ${this.currentStep >= 3 ? 'active' : ''}" data-step="3">
                                <span class="step-number">3</span>
                                <span class="step-label">Health</span>
                            </div>
                            <div class="step ${this.currentStep >= 4 ? 'active' : ''}" data-step="4">
                                <span class="step-number">4</span>
                                <span class="step-label">Review</span>
                            </div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(this.currentStep / this.totalSteps) * 100}%"></div>
                        </div>
                    </div>
                </div>

                <div class="pet-form-content">
                    <div class="form-step" data-step="1" ${this.currentStep !== 1 ? 'style="display: none;"' : ''}>
                        <h3>Basic Information</h3>
                        <div class="form-grid">
                            <div id="name-field"></div>
                            <div id="species-field"></div>
                            <div id="breed-field"></div>
                            <div id="gender-field"></div>
                            <div id="date-of-birth-field"></div>
                            <div id="neutered-field"></div>
                        </div>
                    </div>

                    <div class="form-step" data-step="2" ${this.currentStep !== 2 ? 'style="display: none;"' : ''}>
                        <h3>Physical Characteristics</h3>
                        <div class="form-grid">
                            <div id="current-weight-field"></div>
                            <div id="ideal-weight-field"></div>
                            <div id="activity-level-field"></div>
                            <div id="body-condition-score-field"></div>
                            <div id="microchip-field"></div>
                        </div>
                        <div class="weight-visualization" id="weight-chart"></div>
                    </div>

                    <div class="form-step" data-step="3" ${this.currentStep !== 3 ? 'style="display: none;"' : ''}>
                        <h3>Health Information</h3>
                        <div class="form-grid">
                            <div id="health-conditions-field"></div>
                            <div id="allergies-field"></div>
                            <div id="medications-field"></div>
                            <div id="personality-traits-field"></div>
                            <div id="veterinarian-field"></div>
                        </div>
                    </div>

                    <div class="form-step" data-step="4" ${this.currentStep !== 4 ? 'style="display: none;"' : ''}>
                        <h3>Review & Confirm</h3>
                        <div class="form-review" id="form-review"></div>
                        <div class="validation-summary" id="validation-summary"></div>
                    </div>
                </div>

                <div class="pet-form-actions">
                    <button type="button" class="btn btn-secondary" id="prev-step" ${this.currentStep === 1 ? 'style="display: none;"' : ''}>
                        Previous
                    </button>
                    <button type="button" class="btn btn-primary" id="next-step" ${this.currentStep === this.totalSteps ? 'style="display: none;"' : ''}>
                        Next
                    </button>
                    <button type="submit" class="btn btn-success" id="submit-form" ${this.currentStep !== this.totalSteps ? 'style="display: none;"' : ''}>
                        ${this.options.mode === 'create' ? 'Create Pet' : 'Update Pet'}
                    </button>
                    <button type="button" class="btn btn-outline" id="cancel-form">
                        Cancel
                    </button>
                </div>

                <div class="form-loading" id="form-loading" style="display: none;">
                    <div class="loading-spinner"></div>
                    <p>Saving pet profile...</p>
                </div>
            </div>
        `;

        this.createFormFields();
    }

    createFormFields() {
        const form = this.formBuilder.create();
        this.container.querySelector('.pet-form-content').appendChild(form);

        // Step 1: Basic Information
        this.addField('name', {
            type: 'text',
            label: 'Pet Name',
            placeholder: 'Enter your pet\'s name',
            required: true,
            container: '#name-field'
        });

        this.addField('species', {
            type: 'select',
            label: 'Species',
            placeholder: 'Select species',
            required: true,
            options: [
                { value: 'dog', label: 'Dog' },
                { value: 'cat', label: 'Cat' },
                { value: 'rabbit', label: 'Rabbit' },
                { value: 'bird', label: 'Bird' },
                { value: 'other', label: 'Other' }
            ],
            container: '#species-field'
        });

        this.addField('breed', {
            type: 'select',
            label: 'Breed',
            placeholder: 'Select breed',
            options: [],
            container: '#breed-field'
        });

        this.addField('gender', {
            type: 'radio',
            label: 'Gender',
            options: [
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'unknown', label: 'Unknown' }
            ],
            container: '#gender-field'
        });

        this.addField('date_of_birth', {
            type: 'date',
            label: 'Date of Birth',
            helpText: 'Leave blank if unknown',
            container: '#date-of-birth-field'
        });

        this.addField('is_neutered', {
            type: 'checkbox',
            label: 'Spayed/Neutered',
            options: [{ value: 'true', label: 'Yes, my pet is spayed/neutered' }],
            container: '#neutered-field'
        });

        // Step 2: Physical Characteristics
        this.addField('current_weight', {
            type: 'number',
            label: 'Current Weight (kg)',
            placeholder: '0.0',
            min: 0.01,
            max: 200,
            step: 0.1,
            helpText: 'Enter weight in kilograms',
            container: '#current-weight-field'
        });

        this.addField('ideal_weight', {
            type: 'number',
            label: 'Ideal Weight (kg)',
            placeholder: '0.0',
            min: 0.01,
            max: 200,
            step: 0.1,
            helpText: 'Target weight for optimal health',
            container: '#ideal-weight-field'
        });

        this.addField('activity_level', {
            type: 'radio',
            label: 'Activity Level',
            options: [
                { value: 'low', label: 'Low - Mostly sedentary' },
                { value: 'moderate', label: 'Moderate - Regular exercise' },
                { value: 'high', label: 'High - Very active' }
            ],
            container: '#activity-level-field'
        });

        this.addField('body_condition_score', {
            type: 'select',
            label: 'Body Condition Score',
            placeholder: 'Select BCS',
            helpText: 'Scale varies by species (1-5 or 1-9)',
            options: [],
            container: '#body-condition-score-field'
        });

        this.addField('microchip_id', {
            type: 'text',
            label: 'Microchip ID',
            placeholder: '15-digit alphanumeric code',
            helpText: 'Optional - if your pet has a microchip',
            container: '#microchip-field'
        });

        // Step 3: Health Information
        this.addField('health_conditions', {
            type: 'checkbox',
            label: 'Health Conditions',
            options: [],
            helpText: 'Select any current health conditions',
            container: '#health-conditions-field'
        });

        this.addField('allergies', {
            type: 'checkbox',
            label: 'Known Allergies',
            options: [],
            helpText: 'Select any known allergies',
            container: '#allergies-field'
        });

        this.addField('medications', {
            type: 'textarea',
            label: 'Current Medications',
            placeholder: 'List any medications your pet is currently taking...',
            rows: 3,
            helpText: 'Include dosage and frequency if known',
            container: '#medications-field'
        });

        this.addField('personality_traits', {
            type: 'checkbox',
            label: 'Personality Traits',
            options: [
                { value: 'friendly', label: 'Friendly' },
                { value: 'energetic', label: 'Energetic' },
                { value: 'calm', label: 'Calm' },
                { value: 'playful', label: 'Playful' },
                { value: 'shy', label: 'Shy' },
                { value: 'aggressive', label: 'Aggressive' },
                { value: 'anxious', label: 'Anxious' },
                { value: 'independent', label: 'Independent' }
            ],
            container: '#personality-traits-field'
        });

        this.addField('veterinarian_id', {
            type: 'select',
            label: 'Primary Veterinarian',
            placeholder: 'Select veterinarian',
            options: [
                { value: '', label: 'No veterinarian assigned' }
            ],
            helpText: 'Optional - assign a primary veterinarian',
            container: '#veterinarian-field'
        });
    }

    addField(name, options) {
        const field = this.formBuilder.addField(name, options);
        
        if (options.container) {
            const container = this.container.querySelector(options.container);
            if (container) {
                container.appendChild(field.create());
            }
        }

        return field;
    }

    setupEventListeners() {
        // Navigation buttons
        this.container.querySelector('#next-step').addEventListener('click', () => {
            this.nextStep();
        });

        this.container.querySelector('#prev-step').addEventListener('click', () => {
            this.previousStep();
        });

        this.container.querySelector('#submit-form').addEventListener('click', () => {
            this.submitForm();
        });

        this.container.querySelector('#cancel-form').addEventListener('click', () => {
            this.cancelForm();
        });

        // Species change handler
        const speciesField = this.formBuilder.getField('species');
        if (speciesField) {
            const speciesInput = speciesField.getInputElement();
            speciesInput.addEventListener('change', (e) => {
                this.handleSpeciesChange(e.target.value);
            });
        }

        // Weight change handlers for visualization
        const currentWeightField = this.formBuilder.getField('current_weight');
        const idealWeightField = this.formBuilder.getField('ideal_weight');
        
        if (currentWeightField) {
            currentWeightField.getInputElement().addEventListener('input', () => {
                this.updateWeightVisualization();
            });
        }
        
        if (idealWeightField) {
            idealWeightField.getInputElement().addEventListener('input', () => {
                this.updateWeightVisualization();
            });
        }

        // Form change tracking
        this.container.addEventListener('input', () => {
            this.isDirty = true;
            this.emit('formChanged');
        });
    }

    setupRealTimeValidation() {
        if (!this.options.realTimeValidation) return;

        this.formBuilder.fields.forEach((field, fieldName) => {
            const input = field.getInputElement();
            if (!input) return;

            input.addEventListener('blur', () => {
                this.validateField(fieldName);
            });

            input.addEventListener('input', () => {
                // Clear errors on input
                field.clearErrors();
            });
        });
    }

    handleSpeciesChange(species) {
        if (!species) return;

        // Update breed options
        const breedField = this.formBuilder.getField('breed');
        if (breedField) {
            const breeds = this.validator.getBreedsForSpecies(species);
            const breedOptions = breeds.map(breed => ({ value: breed, label: breed }));
            this.updateFieldOptions('breed', breedOptions);
        }

        // Update body condition score options
        const bcsField = this.formBuilder.getField('body_condition_score');
        if (bcsField) {
            const bcsRange = this.validator.getBCSRangeForSpecies(species);
            const bcsOptions = [];
            for (let i = bcsRange.min; i <= bcsRange.max; i++) {
                bcsOptions.push({ value: i.toString(), label: `${i} - ${this.getBCSDescription(i, species)}` });
            }
            this.updateFieldOptions('body_condition_score', bcsOptions);
        }

        // Update health conditions
        const healthField = this.formBuilder.getField('health_conditions');
        if (healthField) {
            const conditions = this.validator.getHealthConditionsForSpecies(species);
            const conditionOptions = conditions.map(condition => ({ value: condition, label: condition }));
            this.updateFieldOptions('health_conditions', conditionOptions);
        }

        // Update allergies
        const allergiesField = this.formBuilder.getField('allergies');
        if (allergiesField) {
            const allergies = this.validator.getAllergiesForSpecies(species);
            const allergyOptions = allergies.map(allergy => ({ value: allergy, label: allergy }));
            this.updateFieldOptions('allergies', allergyOptions);
        }

        // Update weight range hints
        this.updateWeightRangeHints(species);
    }

    updateFieldOptions(fieldName, options) {
        const field = this.formBuilder.getField(fieldName);
        if (!field) return;

        field.options.options = options;
        
        // Recreate the field with new options
        const container = field.element.parentNode;
        field.element.remove();
        const newField = this.formBuilder.addField(fieldName, field.options);
        container.appendChild(newField.create());
    }

    updateWeightRangeHints(species) {
        const weightRange = this.validator.getWeightRangeForSpecies(species);
        
        const currentWeightField = this.formBuilder.getField('current_weight');
        const idealWeightField = this.formBuilder.getField('ideal_weight');
        
        if (currentWeightField) {
            const helpText = `Normal range: ${weightRange.min} - ${weightRange.max} kg`;
            this.updateFieldHelpText('current_weight', helpText);
        }
        
        if (idealWeightField) {
            const helpText = `Normal range: ${weightRange.min} - ${weightRange.max} kg`;
            this.updateFieldHelpText('ideal_weight', helpText);
        }
    }

    updateFieldHelpText(fieldName, helpText) {
        const field = this.formBuilder.getField(fieldName);
        if (!field || !field.element) return;

        const helpElement = field.element.querySelector('.form-help');
        if (helpElement) {
            helpElement.textContent = helpText;
        }
    }

    getBCSDescription(score, species) {
        const descriptions = {
            dog: {
                1: 'Emaciated', 2: 'Very thin', 3: 'Thin', 4: 'Underweight',
                5: 'Ideal', 6: 'Overweight', 7: 'Heavy', 8: 'Obese', 9: 'Severely obese'
            },
            cat: {
                1: 'Emaciated', 2: 'Very thin', 3: 'Thin', 4: 'Underweight',
                5: 'Ideal', 6: 'Overweight', 7: 'Heavy', 8: 'Obese', 9: 'Severely obese'
            },
            rabbit: {
                1: 'Emaciated', 2: 'Thin', 3: 'Ideal', 4: 'Overweight', 5: 'Obese'
            },
            bird: {
                1: 'Emaciated', 2: 'Thin', 3: 'Ideal', 4: 'Overweight', 5: 'Obese'
            }
        };

        return descriptions[species]?.[score] || 'Unknown';
    }

    updateWeightVisualization() {
        const currentWeight = this.formBuilder.getField('current_weight')?.getValue();
        const idealWeight = this.formBuilder.getField('ideal_weight')?.getValue();
        
        if (!currentWeight || !idealWeight) return;

        const chartContainer = this.container.querySelector('#weight-chart');
        if (!chartContainer) return;

        const current = parseFloat(currentWeight);
        const ideal = parseFloat(idealWeight);
        const difference = current - ideal;
        const percentDiff = (difference / ideal) * 100;

        let status = 'ideal';
        let statusText = 'Ideal Weight';
        let statusColor = '#28a745';

        if (percentDiff > 10) {
            status = 'overweight';
            statusText = 'Overweight';
            statusColor = '#ffc107';
        } else if (percentDiff > 20) {
            status = 'obese';
            statusText = 'Obese';
            statusColor = '#dc3545';
        } else if (percentDiff < -10) {
            status = 'underweight';
            statusText = 'Underweight';
            statusColor = '#17a2b8';
        }

        chartContainer.innerHTML = `
            <div class="weight-status">
                <h4>Weight Status</h4>
                <div class="weight-indicator" style="background-color: ${statusColor}">
                    <span class="status-text">${statusText}</span>
                    <span class="weight-diff">${difference > 0 ? '+' : ''}${difference.toFixed(1)} kg</span>
                </div>
                <div class="weight-details">
                    <div class="weight-item">
                        <label>Current:</label>
                        <span>${current.toFixed(1)} kg</span>
                    </div>
                    <div class="weight-item">
                        <label>Ideal:</label>
                        <span>${ideal.toFixed(1)} kg</span>
                    </div>
                </div>
            </div>
        `;
    }

    validateField(fieldName) {
        const field = this.formBuilder.getField(fieldName);
        if (!field) return true;

        const value = field.getValue();
        const formData = this.formBuilder.getData();
        
        const result = this.validator.validateField(fieldName, value, formData);
        
        if (!result.isValid) {
            field.showErrors();
            const errorContainer = field.element.querySelector('.form-error');
            if (errorContainer && result.errors.length > 0) {
                errorContainer.textContent = result.errors[0];
                errorContainer.style.display = 'block';
            }
            return false;
        } else {
            field.clearErrors();
            return true;
        }
    }

    validateCurrentStep() {
        const stepFields = this.getFieldsForStep(this.currentStep);
        let isValid = true;

        stepFields.forEach(fieldName => {
            if (!this.validateField(fieldName)) {
                isValid = false;
            }
        });

        return isValid;
    }

    getFieldsForStep(step) {
        const stepFields = {
            1: ['name', 'species', 'breed', 'gender', 'date_of_birth', 'is_neutered'],
            2: ['current_weight', 'ideal_weight', 'activity_level', 'body_condition_score', 'microchip_id'],
            3: ['health_conditions', 'allergies', 'medications', 'personality_traits', 'veterinarian_id'],
            4: [] // Review step
        };

        return stepFields[step] || [];
    }

    nextStep() {
        if (!this.validateCurrentStep()) {
            this.showNotification('Please fix the errors before continuing', 'error');
            return;
        }

        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStepDisplay();
            
            if (this.currentStep === this.totalSteps) {
                this.generateReview();
            }
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    updateStepDisplay() {
        // Update step indicators
        this.container.querySelectorAll('.step').forEach((step, index) => {
            if (index + 1 <= this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        // Update progress bar
        const progressFill = this.container.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${(this.currentStep / this.totalSteps) * 100}%`;
        }

        // Show/hide form steps
        this.container.querySelectorAll('.form-step').forEach((step, index) => {
            if (index + 1 === this.currentStep) {
                step.style.display = 'block';
            } else {
                step.style.display = 'none';
            }
        });

        // Update navigation buttons
        const prevBtn = this.container.querySelector('#prev-step');
        const nextBtn = this.container.querySelector('#next-step');
        const submitBtn = this.container.querySelector('#submit-form');

        if (prevBtn) {
            prevBtn.style.display = this.currentStep === 1 ? 'none' : 'inline-block';
        }

        if (nextBtn) {
            nextBtn.style.display = this.currentStep === this.totalSteps ? 'none' : 'inline-block';
        }

        if (submitBtn) {
            submitBtn.style.display = this.currentStep === this.totalSteps ? 'inline-block' : 'none';
        }
    }

    generateReview() {
        const formData = this.formBuilder.getData();
        const reviewContainer = this.container.querySelector('#form-review');
        const validationContainer = this.container.querySelector('#validation-summary');

        if (!reviewContainer) return;

        // Generate form review
        let reviewHTML = '<div class="review-sections">';

        // Basic Information
        reviewHTML += '<div class="review-section">';
        reviewHTML += '<h4>Basic Information</h4>';
        reviewHTML += '<div class="review-items">';
        reviewHTML += `<div class="review-item"><label>Name:</label><span>${formData.name || 'Not specified'}</span></div>`;
        reviewHTML += `<div class="review-item"><label>Species:</label><span>${formData.species || 'Not specified'}</span></div>`;
        reviewHTML += `<div class="review-item"><label>Breed:</label><span>${formData.breed || 'Not specified'}</span></div>`;
        reviewHTML += `<div class="review-item"><label>Gender:</label><span>${formData.gender || 'Not specified'}</span></div>`;
        reviewHTML += `<div class="review-item"><label>Date of Birth:</label><span>${formData.date_of_birth || 'Not specified'}</span></div>`;
        reviewHTML += `<div class="review-item"><label>Spayed/Neutered:</label><span>${formData.is_neutered ? 'Yes' : 'No'}</span></div>`;
        reviewHTML += '</div></div>';

        // Physical Characteristics
        reviewHTML += '<div class="review-section">';
        reviewHTML += '<h4>Physical Characteristics</h4>';
        reviewHTML += '<div class="review-items">';
        reviewHTML += `<div class="review-item"><label>Current Weight:</label><span>${formData.current_weight ? formData.current_weight + ' kg' : 'Not specified'}</span></div>`;
        reviewHTML += `<div class="review-item"><label>Ideal Weight:</label><span>${formData.ideal_weight ? formData.ideal_weight + ' kg' : 'Not specified'}</span></div>`;
        reviewHTML += `<div class="review-item"><label>Activity Level:</label><span>${formData.activity_level || 'Not specified'}</span></div>`;
        reviewHTML += `<div class="review-item"><label>Body Condition Score:</label><span>${formData.body_condition_score || 'Not specified'}</span></div>`;
        reviewHTML += `<div class="review-item"><label>Microchip ID:</label><span>${formData.microchip_id || 'Not specified'}</span></div>`;
        reviewHTML += '</div></div>';

        // Health Information
        reviewHTML += '<div class="review-section">';
        reviewHTML += '<h4>Health Information</h4>';
        reviewHTML += '<div class="review-items">';
        reviewHTML += `<div class="review-item"><label>Health Conditions:</label><span>${Array.isArray(formData.health_conditions) && formData.health_conditions.length > 0 ? formData.health_conditions.join(', ') : 'None specified'}</span></div>`;
        reviewHTML += `<div class="review-item"><label>Allergies:</label><span>${Array.isArray(formData.allergies) && formData.allergies.length > 0 ? formData.allergies.join(', ') : 'None specified'}</span></div>`;
        reviewHTML += `<div class="review-item"><label>Medications:</label><span>${formData.medications || 'None specified'}</span></div>`;
        reviewHTML += `<div class="review-item"><label>Personality:</label><span>${Array.isArray(formData.personality_traits) && formData.personality_traits.length > 0 ? formData.personality_traits.join(', ') : 'Not specified'}</span></div>`;
        reviewHTML += '</div></div>';

        reviewHTML += '</div>';
        reviewContainer.innerHTML = reviewHTML;

        // Generate validation summary
        const validation = this.validator.validatePetProfile(formData);
        const summary = this.validator.generateValidationSummary(validation);

        let validationHTML = '<div class="validation-summary-content">';
        validationHTML += `<h4>Validation Summary</h4>`;
        
        if (validation.isValid) {
            validationHTML += '<div class="validation-success"><i class="icon-check"></i> All information is valid and ready to submit!</div>';
        } else {
            validationHTML += '<div class="validation-errors">';
            validationHTML += `<div class="error-count">${summary.errors.length} error(s) found:</div>`;
            validationHTML += '<ul>';
            summary.errors.forEach(error => {
                validationHTML += `<li><strong>${error.field}:</strong> ${error.message}</li>`;
            });
            validationHTML += '</ul>';
            validationHTML += '</div>';
        }

        validationHTML += '</div>';
        validationContainer.innerHTML = validationHTML;

        this.validationResults = validation;
    }

    async submitForm() {
        const formData = this.formBuilder.getData();
        
        // Final validation
        const validation = this.validator.validatePetProfile(formData);
        if (!validation.isValid) {
            this.showNotification('Please fix all validation errors before submitting', 'error');
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        try {
            // Process form data
            const processedData = this.processFormData(formData);
            
            // Emit submit event
            this.emit('submit', {
                data: processedData,
                mode: this.options.mode,
                originalData: this.options.petData
            });

            this.showNotification('Pet profile saved successfully!', 'success');
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showNotification('Failed to save pet profile. Please try again.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    processFormData(formData) {
        const processed = { ...formData };

        // Convert checkbox arrays to proper format
        if (Array.isArray(processed.health_conditions)) {
            processed.health_conditions = processed.health_conditions.filter(Boolean);
        }

        if (Array.isArray(processed.allergies)) {
            processed.allergies = processed.allergies.filter(Boolean);
        }

        if (Array.isArray(processed.personality_traits)) {
            processed.personality_traits = processed.personality_traits.filter(Boolean);
        }

        // Convert is_neutered checkbox to boolean
        processed.is_neutered = Array.isArray(processed.is_neutered) && processed.is_neutered.includes('true');

        // Convert numeric fields
        if (processed.current_weight) {
            processed.current_weight = parseFloat(processed.current_weight);
        }

        if (processed.ideal_weight) {
            processed.ideal_weight = parseFloat(processed.ideal_weight);
        }

        if (processed.body_condition_score) {
            processed.body_condition_score = parseInt(processed.body_condition_score);
        }

        if (processed.veterinarian_id) {
            processed.veterinarian_id = parseInt(processed.veterinarian_id);
        }

        return processed;
    }

    populateForm(petData) {
        // Convert data format for form population
        const formData = { ...petData };

        // Convert boolean to checkbox format
        if (formData.is_neutered) {
            formData.is_neutered = ['true'];
        }

        // Ensure arrays are properly formatted
        ['health_conditions', 'allergies', 'personality_traits'].forEach(field => {
            if (formData[field] && !Array.isArray(formData[field])) {
                formData[field] = [];
            }
        });

        this.formBuilder.setData(formData);

        // Trigger species change to update dependent fields
        if (formData.species) {
            this.handleSpeciesChange(formData.species);
        }
    }

    cancelForm() {
        if (this.isDirty) {
            if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                this.emit('cancel');
            }
        } else {
            this.emit('cancel');
        }
    }

    setLoadingState(loading) {
        const loadingElement = this.container.querySelector('#form-loading');
        const formActions = this.container.querySelector('.pet-form-actions');
        
        if (loadingElement) {
            loadingElement.style.display = loading ? 'flex' : 'none';
        }
        
        if (formActions) {
            formActions.style.display = loading ? 'none' : 'flex';
        }
    }

    showNotification(message, type = 'info') {
        // This would integrate with your notification system
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // You can emit an event for external notification handling
        this.emit('notification', { message, type });
    }

    destroy() {
        // Clean up event listeners and DOM
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for module use
window.PetFormEnhanced = PetFormEnhanced;