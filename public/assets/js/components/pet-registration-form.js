/**
 * Pet Registration Form Component
 * Multi-step form for registering new pets with progress indicator
 */
class PetRegistrationFormComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentStep = 1;
        this.totalSteps = 3;
        this.validator = new PetFormValidator();
        this.formData = {
            // Basic Information
            name: '',
            species: '',
            breed: '',
            gender: '',
            birth_date: '',
            
            // Physical Characteristics
            weight: '',
            ideal_weight: '',
            activity_level: '',
            body_condition_score: '',
            spay_neuter_status: '',
            
            // Health and Additional Data
            microchip_id: '',
            personality: '',
            emergency_contact: '',
            health_conditions: [],
            allergies: []
        };
        this.isSubmitting = false;
        
        // Breed data for autocomplete
        this.breedData = {
            dog: [
                'Golden Retriever', 'Labrador Retriever', 'German Shepherd', 'Bulldog', 'Poodle',
                'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund', 'Siberian Husky',
                'Boxer', 'Border Collie', 'Australian Shepherd', 'Cocker Spaniel', 'Chihuahua',
                'Shih Tzu', 'Boston Terrier', 'Pomeranian', 'Australian Cattle Dog', 'Mastiff',
                'Mixed Breed'
            ],
            cat: [
                'Persian', 'Maine Coon', 'Ragdoll', 'British Shorthair', 'Abyssinian',
                'Russian Blue', 'Siamese', 'American Shorthair', 'Scottish Fold', 'Sphynx',
                'Bengal', 'Birman', 'Oriental Shorthair', 'Devon Rex', 'Cornish Rex',
                'Norwegian Forest Cat', 'Manx', 'Turkish Angora', 'Exotic Shorthair', 'Burmese',
                'Mixed Breed'
            ],
            bird: [
                'Budgerigar', 'Cockatiel', 'Canary', 'Lovebird', 'Conure', 'Macaw',
                'African Grey', 'Cockatoo', 'Finch', 'Parakeet', 'Other'
            ],
            rabbit: [
                'Holland Lop', 'Netherland Dwarf', 'Mini Rex', 'Lionhead', 'Flemish Giant',
                'English Angora', 'Dutch', 'New Zealand', 'Californian', 'Mixed Breed'
            ],
            other: ['Mixed Breed', 'Unknown', 'Other']
        };
        
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.loadSavedData();
    }

    render() {
        this.container.innerHTML = `
            <div class="pet-registration-container">
                <!-- Header -->
                <div class="registration-header">
                    <h2><i class="fas fa-paw"></i> Add New Pet</h2>
                    <p>Let's get your furry friend registered in the system</p>
                </div>

                <!-- Progress Indicator -->
                <div class="progress-indicator">
                    <div class="progress-steps">
                        <div class="step active" data-step="1">
                            <div class="step-number">1</div>
                            <div class="step-label">Basic Info</div>
                        </div>
                        <div class="step" data-step="2">
                            <div class="step-number">2</div>
                            <div class="step-label">Physical</div>
                        </div>
                        <div class="step" data-step="3">
                            <div class="step-number">3</div>
                            <div class="step-label">Health & Notes</div>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 33.33%"></div>
                    </div>
                </div>

                <!-- Form Container -->
                <div class="form-container">
                    <form id="pet-registration-form" novalidate>
                        <!-- Step 1: Basic Information -->
                        <div class="form-step active" id="step-1">
                            <h3>Basic Information</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="pet-name" class="required">Pet Name</label>
                                    <input type="text" id="pet-name" name="name" required 
                                           placeholder="Enter your pet's name" maxlength="50">
                                    <div class="error-message" id="name-error"></div>
                                </div>

                                <div class="form-group">
                                    <label for="pet-species" class="required">Species</label>
                                    <select id="pet-species" name="species" required>
                                        <option value="">Select species</option>
                                        <option value="dog">Dog</option>
                                        <option value="cat">Cat</option>
                                        <option value="bird">Bird</option>
                                        <option value="rabbit">Rabbit</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <div class="error-message" id="species-error"></div>
                                </div>

                                <div class="form-group">
                                    <label for="pet-breed">Breed</label>
                                    <input type="text" id="pet-breed" name="breed" 
                                           placeholder="Start typing to search breeds..." 
                                           autocomplete="off" list="breed-suggestions">
                                    <datalist id="breed-suggestions"></datalist>
                                    <div class="error-message" id="breed-error"></div>
                                </div>

                                <div class="form-group">
                                    <label for="pet-gender">Gender</label>
                                    <select id="pet-gender" name="gender">
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="unknown">Unknown</option>
                                    </select>
                                    <div class="error-message" id="gender-error"></div>
                                </div>

                                <div class="form-group">
                                    <label for="pet-birth-date">Birth Date</label>
                                    <input type="date" id="pet-birth-date" name="birth_date">
                                    <div class="age-display" id="age-display"></div>
                                    <div class="error-message" id="birth-date-error"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Step 2: Physical Characteristics -->
                        <div class="form-step" id="step-2">
                            <h3>Physical Characteristics</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="pet-weight" class="required">Current Weight (kg)</label>
                                    <input type="number" id="pet-weight" name="weight" 
                                           step="0.1" min="0.1" max="200" required
                                           placeholder="Enter weight in kg">
                                    <div class="error-message" id="weight-error"></div>
                                </div>

                                <div class="form-group">
                                    <label for="pet-ideal-weight">Ideal Weight (kg)</label>
                                    <input type="number" id="pet-ideal-weight" name="ideal_weight" 
                                           step="0.1" min="0.1" max="200"
                                           placeholder="Target weight in kg">
                                    <div class="error-message" id="ideal-weight-error"></div>
                                </div>

                                <div class="form-group">
                                    <label for="pet-activity-level" class="required">Activity Level</label>
                                    <select id="pet-activity-level" name="activity_level" required>
                                        <option value="">Select activity level</option>
                                        <option value="low">Low - Prefers rest, minimal exercise</option>
                                        <option value="medium">Medium - Moderate daily activity</option>
                                        <option value="high">High - Very active, needs lots of exercise</option>
                                    </select>
                                    <div class="error-message" id="activity-level-error"></div>
                                </div>

                                <div class="form-group">
                                    <label for="pet-body-score">Body Condition Score (1-9)</label>
                                    <select id="pet-body-score" name="body_condition_score">
                                        <option value="">Select score</option>
                                        <option value="1">1 - Severely underweight</option>
                                        <option value="2">2 - Very underweight</option>
                                        <option value="3">3 - Underweight</option>
                                        <option value="4">4 - Slightly underweight</option>
                                        <option value="5">5 - Ideal weight</option>
                                        <option value="6">6 - Slightly overweight</option>
                                        <option value="7">7 - Overweight</option>
                                        <option value="8">8 - Very overweight</option>
                                        <option value="9">9 - Severely overweight</option>
                                    </select>
                                    <div class="error-message" id="body-score-error"></div>
                                </div>

                                <div class="form-group">
                                    <label for="pet-spay-neuter">Spay/Neuter Status</label>
                                    <select id="pet-spay-neuter" name="spay_neuter_status">
                                        <option value="">Select status</option>
                                        <option value="spayed">Spayed</option>
                                        <option value="neutered">Neutered</option>
                                        <option value="intact">Intact</option>
                                        <option value="unknown">Unknown</option>
                                    </select>
                                    <div class="error-message" id="spay-neuter-error"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Step 3: Health and Additional Data -->
                        <div class="form-step" id="step-3">
                            <h3>Health & Additional Information</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="pet-microchip">Microchip ID</label>
                                    <input type="text" id="pet-microchip" name="microchip_id" 
                                           placeholder="Enter microchip number" maxlength="20">
                                    <div class="error-message" id="microchip-error"></div>
                                </div>

                                <div class="form-group full-width">
                                    <label for="pet-personality">Personality & Behavior</label>
                                    <textarea id="pet-personality" name="personality" 
                                              placeholder="Describe your pet's personality, behavior, likes/dislikes..."
                                              rows="3" maxlength="500"></textarea>
                                    <div class="char-count">0/500</div>
                                    <div class="error-message" id="personality-error"></div>
                                </div>

                                <div class="form-group full-width">
                                    <label for="pet-emergency-contact">Emergency Contact</label>
                                    <textarea id="pet-emergency-contact" name="emergency_contact" 
                                              placeholder="Veterinarian contact information or emergency contact details..."
                                              rows="2" maxlength="300"></textarea>
                                    <div class="char-count">0/300</div>
                                    <div class="error-message" id="emergency-contact-error"></div>
                                </div>

                                <!-- Health Conditions Section -->
                                <div class="form-group full-width">
                                    <label>Health Conditions</label>
                                    <div class="health-conditions-section">
                                        <div class="add-condition-form" style="display: none;">
                                            <div class="condition-inputs">
                                                <input type="text" id="condition-name" placeholder="Condition name">
                                                <select id="condition-severity">
                                                    <option value="mild">Mild</option>
                                                    <option value="moderate">Moderate</option>
                                                    <option value="severe">Severe</option>
                                                </select>
                                                <input type="date" id="condition-date" title="Diagnosis date">
                                            </div>
                                            <div class="condition-actions">
                                                <button type="button" class="btn btn-sm btn-primary" onclick="petRegistrationForm.addHealthCondition()">
                                                    <i class="fas fa-plus"></i> Add
                                                </button>
                                                <button type="button" class="btn btn-sm btn-secondary" onclick="petRegistrationForm.cancelAddCondition()">
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                        <button type="button" class="btn btn-sm btn-outline" id="add-condition-btn" onclick="petRegistrationForm.showAddCondition()">
                                            <i class="fas fa-plus"></i> Add Health Condition
                                        </button>
                                        <div class="conditions-list" id="conditions-list"></div>
                                    </div>
                                </div>

                                <!-- Allergies Section -->
                                <div class="form-group full-width">
                                    <label>Known Allergies</label>
                                    <div class="allergies-section">
                                        <div class="add-allergy-form" style="display: none;">
                                            <div class="allergy-inputs">
                                                <input type="text" id="allergy-name" placeholder="Allergen (e.g., chicken, pollen)">
                                                <select id="allergy-severity">
                                                    <option value="mild">Mild</option>
                                                    <option value="moderate">Moderate</option>
                                                    <option value="severe">Severe</option>
                                                </select>
                                                <input type="text" id="allergy-reaction" placeholder="Reaction type">
                                            </div>
                                            <div class="allergy-actions">
                                                <button type="button" class="btn btn-sm btn-primary" onclick="petRegistrationForm.addAllergy()">
                                                    <i class="fas fa-plus"></i> Add
                                                </button>
                                                <button type="button" class="btn btn-sm btn-secondary" onclick="petRegistrationForm.cancelAddAllergy()">
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                        <button type="button" class="btn btn-sm btn-outline" id="add-allergy-btn" onclick="petRegistrationForm.showAddAllergy()">
                                            <i class="fas fa-plus"></i> Add Allergy
                                        </button>
                                        <div class="allergies-list" id="allergies-list"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Form Navigation -->
                        <div class="form-navigation">
                            <button type="button" class="btn btn-secondary" id="prev-btn" onclick="petRegistrationForm.previousStep()" style="display: none;">
                                <i class="fas fa-arrow-left"></i> Previous
                            </button>
                            <div class="nav-spacer"></div>
                            <button type="button" class="btn btn-outline" onclick="petRegistrationForm.saveDraft()">
                                <i class="fas fa-save"></i> Save Draft
                            </button>
                            <button type="button" class="btn btn-primary" id="next-btn" onclick="petRegistrationForm.nextStep()">
                                Next <i class="fas fa-arrow-right"></i>
                            </button>
                            <button type="submit" class="btn btn-success" id="submit-btn" style="display: none;">
                                <i class="fas fa-check"></i> Register Pet
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Loading Overlay -->
                <div class="loading-overlay" id="loading-overlay" style="display: none;">
                    <div class="loading-content">
                        <div class="spinner"></div>
                        <p>Registering your pet...</p>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const form = document.getElementById('pet-registration-form');
        
        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm();
        });

        // Species change - update breed suggestions
        document.getElementById('pet-species').addEventListener('change', (e) => {
            this.updateBreedSuggestions(e.target.value);
            this.validateField('species');
        });

        // Breed input with autocomplete
        document.getElementById('pet-breed').addEventListener('input', (e) => {
            this.filterBreedSuggestions(e.target.value);
        });

        // Birth date change - calculate age
        document.getElementById('pet-birth-date').addEventListener('change', (e) => {
            this.calculateAge(e.target.value);
            this.validateField('birth_date');
        });

        // Weight validation
        document.getElementById('pet-weight').addEventListener('input', (e) => {
            this.validateWeight(e.target.value);
        });

        // Character count for textareas
        document.getElementById('pet-personality').addEventListener('input', (e) => {
            this.updateCharCount(e.target, 500);
        });

        document.getElementById('pet-emergency-contact').addEventListener('input', (e) => {
            this.updateCharCount(e.target, 300);
        });

        // Real-time validation for all fields
        const allFields = ['pet-name', 'pet-species', 'pet-breed', 'pet-weight', 'pet-ideal-weight', 
                          'pet-activity-level', 'pet-birth-date', 'pet-body-score', 'pet-microchip'];
        allFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => {
                    this.validateFieldAdvanced(field.name);
                });
                field.addEventListener('input', () => {
                    this.clearFieldError(field.name);
                    // Debounced validation for better UX
                    clearTimeout(this.validationTimeout);
                    this.validationTimeout = setTimeout(() => {
                        this.validateFieldAdvanced(field.name);
                    }, 500);
                });
            }
        });

        // Auto-save form data
        form.addEventListener('input', () => {
            this.saveFormData();
        });
    }

    updateBreedSuggestions(species) {
        const breedInput = document.getElementById('pet-breed');
        const datalist = document.getElementById('breed-suggestions');
        
        if (species) {
            breedInput.disabled = false;
            breedInput.placeholder = `Start typing to search ${species} breeds...`;
            
            // Use validator's breed suggestions
            const suggestions = this.validator.getBreedSuggestions(species);
            datalist.innerHTML = suggestions
                .map(breed => `<option value="${breed}">`)
                .join('');
                
            // Show weight recommendations
            this.showWeightRecommendations(species, breedInput.value);
        } else {
            breedInput.disabled = true;
            breedInput.placeholder = 'Select species first';
            breedInput.value = '';
            datalist.innerHTML = '';
            this.hideWeightRecommendations();
        }
    }

    filterBreedSuggestions(input) {
        const species = document.getElementById('pet-species').value;
        const datalist = document.getElementById('breed-suggestions');
        
        if (!species) return;
        
        // Use validator's filtered breed suggestions
        const filtered = this.validator.getBreedSuggestions(species, input);
        
        datalist.innerHTML = filtered
            .map(breed => `<option value="${breed}">`)
            .join('');
            
        // Update weight recommendations when breed changes
        this.showWeightRecommendations(species, input);
    }

    calculateAge(birthDate) {
        const ageDisplay = document.getElementById('age-display');
        
        if (!birthDate) {
            ageDisplay.textContent = '';
            return;
        }
        
        const birth = new Date(birthDate);
        const today = new Date();
        const ageInMs = today - birth;
        const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
        
        if (ageInYears < 0) {
            ageDisplay.textContent = 'Birth date cannot be in the future';
            ageDisplay.className = 'age-display error';
        } else if (ageInYears < 1) {
            const ageInMonths = Math.floor(ageInYears * 12);
            ageDisplay.textContent = `Age: ${ageInMonths} month${ageInMonths !== 1 ? 's' : ''} old`;
            ageDisplay.className = 'age-display';
        } else {
            const years = Math.floor(ageInYears);
            ageDisplay.textContent = `Age: ${years} year${years !== 1 ? 's' : ''} old`;
            ageDisplay.className = 'age-display';
        }
    }

    validateWeight(weight) {
        const species = document.getElementById('pet-species').value;
        const weightNum = parseFloat(weight);
        
        if (!weight || isNaN(weightNum)) {
            this.showFieldError('weight', 'Weight is required');
            return false;
        }
        
        if (weightNum <= 0) {
            this.showFieldError('weight', 'Weight must be greater than 0');
            return false;
        }
        
        // Species-specific weight validation
        const weightRanges = {
            dog: { min: 0.5, max: 100 },
            cat: { min: 0.5, max: 15 },
            bird: { min: 0.01, max: 2 },
            rabbit: { min: 0.5, max: 10 },
            other: { min: 0.01, max: 200 }
        };
        
        if (species && weightRanges[species]) {
            const range = weightRanges[species];
            if (weightNum < range.min || weightNum > range.max) {
                this.showFieldError('weight', `Weight should be between ${range.min}kg and ${range.max}kg for ${species}s`);
                return false;
            }
        }
        
        this.clearFieldError('weight');
        return true;
    }

    updateCharCount(textarea, maxLength) {
        const charCount = textarea.parentNode.querySelector('.char-count');
        const currentLength = textarea.value.length;
        charCount.textContent = `${currentLength}/${maxLength}`;
        
        if (currentLength > maxLength * 0.9) {
            charCount.classList.add('warning');
        } else {
            charCount.classList.remove('warning');
        }
    }

    showAddCondition() {
        document.querySelector('.add-condition-form').style.display = 'block';
        document.getElementById('add-condition-btn').style.display = 'none';
        document.getElementById('condition-name').focus();
    }

    cancelAddCondition() {
        document.querySelector('.add-condition-form').style.display = 'none';
        document.getElementById('add-condition-btn').style.display = 'block';
        this.clearConditionForm();
    }

    addHealthCondition() {
        const name = document.getElementById('condition-name').value.trim();
        const severity = document.getElementById('condition-severity').value;
        const date = document.getElementById('condition-date').value;
        
        if (!name) {
            alert('Please enter a condition name');
            return;
        }
        
        const condition = {
            condition_name: name,
            severity: severity,
            diagnosis_date: date || null,
            status: 'active'
        };
        
        this.formData.health_conditions.push(condition);
        this.renderHealthConditions();
        this.cancelAddCondition();
        this.saveFormData();
    }

    renderHealthConditions() {
        const container = document.getElementById('conditions-list');
        
        if (this.formData.health_conditions.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = this.formData.health_conditions.map((condition, index) => `
            <div class="condition-item">
                <div class="condition-info">
                    <span class="condition-name">${condition.condition_name}</span>
                    <span class="severity-badge severity-${condition.severity}">${condition.severity}</span>
                    ${condition.diagnosis_date ? `<span class="condition-date">${condition.diagnosis_date}</span>` : ''}
                </div>
                <button type="button" class="btn btn-sm btn-danger" onclick="petRegistrationForm.removeHealthCondition(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    removeHealthCondition(index) {
        this.formData.health_conditions.splice(index, 1);
        this.renderHealthConditions();
        this.saveFormData();
    }

    clearConditionForm() {
        document.getElementById('condition-name').value = '';
        document.getElementById('condition-severity').value = 'mild';
        document.getElementById('condition-date').value = '';
    }

    showAddAllergy() {
        document.querySelector('.add-allergy-form').style.display = 'block';
        document.getElementById('add-allergy-btn').style.display = 'none';
        document.getElementById('allergy-name').focus();
    }

    cancelAddAllergy() {
        document.querySelector('.add-allergy-form').style.display = 'none';
        document.getElementById('add-allergy-btn').style.display = 'block';
        this.clearAllergyForm();
    }

    addAllergy() {
        const name = document.getElementById('allergy-name').value.trim();
        const severity = document.getElementById('allergy-severity').value;
        const reaction = document.getElementById('allergy-reaction').value.trim();
        
        if (!name) {
            alert('Please enter an allergen name');
            return;
        }
        
        const allergy = {
            allergen: name,
            severity: severity,
            reaction_type: reaction || null
        };
        
        this.formData.allergies.push(allergy);
        this.renderAllergies();
        this.cancelAddAllergy();
        this.saveFormData();
    }

    renderAllergies() {
        const container = document.getElementById('allergies-list');
        
        if (this.formData.allergies.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = this.formData.allergies.map((allergy, index) => `
            <div class="allergy-item">
                <div class="allergy-info">
                    <span class="allergy-name">${allergy.allergen}</span>
                    <span class="severity-badge severity-${allergy.severity}">${allergy.severity}</span>
                    ${allergy.reaction_type ? `<span class="allergy-reaction">${allergy.reaction_type}</span>` : ''}
                </div>
                <button type="button" class="btn btn-sm btn-danger" onclick="petRegistrationForm.removeAllergy(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    removeAllergy(index) {
        this.formData.allergies.splice(index, 1);
        this.renderAllergies();
        this.saveFormData();
    }

    clearAllergyForm() {
        document.getElementById('allergy-name').value = '';
        document.getElementById('allergy-severity').value = 'mild';
        document.getElementById('allergy-reaction').value = '';
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateStepDisplay();
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
        // Update progress indicator
        document.querySelectorAll('.step').forEach((step, index) => {
            step.classList.toggle('active', index + 1 === this.currentStep);
            step.classList.toggle('completed', index + 1 < this.currentStep);
        });
        
        // Update progress bar
        const progressFill = document.querySelector('.progress-fill');
        const progressPercent = (this.currentStep / this.totalSteps) * 100;
        progressFill.style.width = `${progressPercent}%`;
        
        // Show/hide form steps
        document.querySelectorAll('.form-step').forEach((step, index) => {
            step.classList.toggle('active', index + 1 === this.currentStep);
        });
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');
        
        prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        
        if (this.currentStep === this.totalSteps) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
        }
    }

    validateCurrentStep() {
        let isValid = true;
        
        if (this.currentStep === 1) {
            // Validate basic information
            if (!this.validateField('name')) isValid = false;
            if (!this.validateField('species')) isValid = false;
        } else if (this.currentStep === 2) {
            // Validate physical characteristics
            if (!this.validateField('weight')) isValid = false;
            if (!this.validateField('activity_level')) isValid = false;
        }
        // Step 3 has no required fields
        
        return isValid;
    }

    validateField(fieldName) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (!field) return true;
        
        const value = field.value.trim();
        
        // Check if required field is empty
        if (field.required && !value) {
            this.showFieldError(fieldName, `${this.getFieldLabel(fieldName)} is required`);
            return false;
        }
        
        // Field-specific validation
        if (fieldName === 'weight' && value) {
            return this.validateWeight(value);
        }
        
        if (fieldName === 'birth_date' && value) {
            const birthDate = new Date(value);
            const today = new Date();
            if (birthDate > today) {
                this.showFieldError(fieldName, 'Birth date cannot be in the future');
                return false;
            }
        }
        
        this.clearFieldError(fieldName);
        return true;
    }

    validateFieldAdvanced(fieldName) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (!field) return true;
        
        const value = field.value.trim();
        const currentFormData = this.getCurrentFormData();
        
        // Use advanced validator
        const result = this.validator.validateField(fieldName, value, currentFormData);
        
        // Clear previous messages
        this.clearFieldError(fieldName);
        this.clearFieldWarning(fieldName);
        
        // Show errors
        if (!result.isValid && result.errors.length > 0) {
            this.showFieldError(fieldName, result.errors[0]);
            return false;
        }
        
        // Show warnings
        if (result.warnings && result.warnings.length > 0) {
            this.showFieldWarning(fieldName, result.warnings[0]);
        }
        
        return true;
    }

    getCurrentFormData() {
        const formData = {};
        const form = document.getElementById('pet-registration-form');
        const formDataObj = new FormData(form);
        
        for (let [key, value] of formDataObj.entries()) {
            formData[key] = value;
        }
        
        return formData;
    }

    getFieldLabel(fieldName) {
        const labels = {
            name: 'Pet name',
            species: 'Species',
            weight: 'Weight',
            activity_level: 'Activity level',
            birth_date: 'Birth date'
        };
        return labels[fieldName] || fieldName;
    }

    showFieldError(fieldName, message) {
        const errorEl = document.getElementById(`${fieldName}-error`);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
        
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (field) {
            field.classList.add('error');
        }
    }

    clearFieldError(fieldName) {
        const errorEl = document.getElementById(`${fieldName}-error`);
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
        
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (field) {
            field.classList.remove('error');
        }
    }

    showFieldWarning(fieldName, message) {
        // Create warning element if it doesn't exist
        let warningEl = document.getElementById(`${fieldName}-warning`);
        if (!warningEl) {
            warningEl = document.createElement('div');
            warningEl.id = `${fieldName}-warning`;
            warningEl.className = 'warning-message';
            
            const errorEl = document.getElementById(`${fieldName}-error`);
            if (errorEl) {
                errorEl.parentNode.insertBefore(warningEl, errorEl.nextSibling);
            }
        }
        
        if (warningEl) {
            warningEl.textContent = message;
            warningEl.style.display = 'block';
        }
    }

    clearFieldWarning(fieldName) {
        const warningEl = document.getElementById(`${fieldName}-warning`);
        if (warningEl) {
            warningEl.textContent = '';
            warningEl.style.display = 'none';
        }
    }

    showWeightRecommendations(species, breed) {
        const recommendations = this.validator.getWeightRecommendations(species, breed);
        if (!recommendations) return;
        
        // Create or update weight recommendations display
        let recommendationEl = document.getElementById('weight-recommendations');
        if (!recommendationEl) {
            recommendationEl = document.createElement('div');
            recommendationEl.id = 'weight-recommendations';
            recommendationEl.className = 'weight-recommendations';
            
            const weightField = document.getElementById('pet-weight');
            if (weightField) {
                weightField.parentNode.appendChild(recommendationEl);
            }
        }
        
        let content = `<strong>Weight Guidelines:</strong><br>`;
        content += `${species.charAt(0).toUpperCase() + species.slice(1)}: ${recommendations.speciesRange.min}-${recommendations.speciesRange.max}kg`;
        
        if (recommendations.breedRange) {
            content += `<br>${breed}: ${recommendations.breedRange.min}-${recommendations.breedRange.max}kg`;
        }
        
        recommendationEl.innerHTML = content;
        recommendationEl.style.display = 'block';
    }

    hideWeightRecommendations() {
        const recommendationEl = document.getElementById('weight-recommendations');
        if (recommendationEl) {
            recommendationEl.style.display = 'none';
        }
    }

    saveFormData() {
        // Collect current form data
        const formData = new FormData(document.getElementById('pet-registration-form'));
        
        for (let [key, value] of formData.entries()) {
            this.formData[key] = value;
        }
        
        // Save to localStorage
        localStorage.setItem('petRegistrationDraft', JSON.stringify(this.formData));
    }

    loadSavedData() {
        const savedData = localStorage.getItem('petRegistrationDraft');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.formData = { ...this.formData, ...data };
                this.populateForm();
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        }
    }

    populateForm() {
        // Populate form fields with saved data
        Object.keys(this.formData).forEach(key => {
            const field = document.querySelector(`[name="${key}"]`);
            if (field && this.formData[key] !== '' && this.formData[key] !== null) {
                field.value = this.formData[key];
                
                // Trigger change events for dependent fields
                if (key === 'species') {
                    this.updateBreedSuggestions(this.formData[key]);
                }
                if (key === 'birth_date') {
                    this.calculateAge(this.formData[key]);
                }
            }
        });
        
        // Render health conditions and allergies
        this.renderHealthConditions();
        this.renderAllergies();
        
        // Update character counts
        const personalityField = document.getElementById('pet-personality');
        if (personalityField.value) {
            this.updateCharCount(personalityField, 500);
        }
        
        const emergencyField = document.getElementById('pet-emergency-contact');
        if (emergencyField.value) {
            this.updateCharCount(emergencyField, 300);
        }
    }

    saveDraft() {
        this.saveFormData();
        
        // Show confirmation
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        btn.classList.add('btn-success');
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('btn-success');
        }, 2000);
    }

    async submitForm() {
        if (this.isSubmitting) return;
        
        // Final validation
        if (!this.validateCurrentStep()) {
            return;
        }
        
        this.isSubmitting = true;
        this.showLoading();
        
        try {
            // Prepare form data
            const submitData = { ...this.formData };
            
            // Convert numeric fields
            if (submitData.weight) submitData.weight = parseFloat(submitData.weight);
            if (submitData.ideal_weight) submitData.ideal_weight = parseFloat(submitData.ideal_weight);
            if (submitData.body_condition_score) submitData.body_condition_score = parseInt(submitData.body_condition_score);
            
            const response = await fetch('/api/pets.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify(submitData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Clear saved draft
                localStorage.removeItem('petRegistrationDraft');
                
                // Show success message
                this.showSuccess(result.pet);
            } else {
                throw new Error(result.error || 'Failed to register pet');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showError(error.message);
        } finally {
            this.isSubmitting = false;
            this.hideLoading();
        }
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    showSuccess(pet) {
        this.container.innerHTML = `
            <div class="success-container">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>Pet Registered Successfully!</h2>
                <p><strong>${pet.name}</strong> has been added to your pet family.</p>
                <div class="success-actions">
                    <a href="/test-pet-profile.html?id=${pet.id}" class="btn btn-primary">
                        <i class="fas fa-eye"></i> View Profile
                    </a>
                    <a href="/test-pet-list.html" class="btn btn-secondary">
                        <i class="fas fa-list"></i> View All Pets
                    </a>
                    <button class="btn btn-outline" onclick="petRegistrationForm.resetForm()">
                        <i class="fas fa-plus"></i> Add Another Pet
                    </button>
                </div>
            </div>
        `;
    }

    showError(message) {
        alert(`Error: ${message}`);
    }

    resetForm() {
        this.currentStep = 1;
        this.formData = {
            name: '', species: '', breed: '', gender: '', birth_date: '',
            weight: '', ideal_weight: '', activity_level: '', body_condition_score: '', spay_neuter_status: '',
            microchip_id: '', personality: '', emergency_contact: '', health_conditions: [], allergies: []
        };
        localStorage.removeItem('petRegistrationDraft');
        this.init();
    }
}

// Initialize global pet registration form instance
let petRegistrationForm;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('pet-registration-container')) {
        petRegistrationForm = new PetRegistrationFormComponent('pet-registration-container');
    }
});