// Enhanced Pet Profile Validation System
class PetProfileValidator {
    constructor() {
        this.speciesData = {
            dog: {
                breeds: [
                    'Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'Bulldog', 'Poodle',
                    'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund', 'Siberian Husky',
                    'Boxer', 'Border Collie', 'Australian Shepherd', 'Chihuahua', 'Shih Tzu',
                    'Boston Terrier', 'Pomeranian', 'Australian Cattle Dog', 'Cocker Spaniel',
                    'Mixed Breed', 'Other'
                ],
                weightRange: { min: 0.5, max: 100 },
                lifespanRange: { min: 0, max: 20 },
                bodyConditionScoreRange: { min: 1, max: 9 },
                commonHealthConditions: [
                    'Hip Dysplasia', 'Elbow Dysplasia', 'Heart Disease', 'Diabetes',
                    'Arthritis', 'Allergies', 'Skin Conditions', 'Eye Problems',
                    'Dental Disease', 'Obesity', 'Cancer', 'Kidney Disease'
                ],
                commonAllergies: [
                    'Chicken', 'Beef', 'Dairy', 'Wheat', 'Corn', 'Soy',
                    'Eggs', 'Fish', 'Lamb', 'Pork', 'Environmental Allergens'
                ]
            },
            cat: {
                breeds: [
                    'Persian', 'Maine Coon', 'British Shorthair', 'Ragdoll', 'Bengal',
                    'Abyssinian', 'Birman', 'Oriental Shorthair', 'Siamese', 'American Shorthair',
                    'Scottish Fold', 'Sphynx', 'Russian Blue', 'Munchkin', 'Norwegian Forest Cat',
                    'Exotic Shorthair', 'Devon Rex', 'Cornish Rex', 'Turkish Angora',
                    'Mixed Breed', 'Other'
                ],
                weightRange: { min: 1, max: 15 },
                lifespanRange: { min: 0, max: 25 },
                bodyConditionScoreRange: { min: 1, max: 9 },
                commonHealthConditions: [
                    'Kidney Disease', 'Diabetes', 'Hyperthyroidism', 'Heart Disease',
                    'Dental Disease', 'Arthritis', 'Urinary Tract Disease', 'Cancer',
                    'Respiratory Issues', 'Skin Conditions', 'Eye Problems', 'Obesity'
                ],
                commonAllergies: [
                    'Fish', 'Chicken', 'Beef', 'Dairy', 'Grains', 'Eggs',
                    'Environmental Allergens', 'Flea Allergies', 'Food Additives'
                ]
            },
            rabbit: {
                breeds: [
                    'Holland Lop', 'Netherland Dwarf', 'Mini Rex', 'Lionhead', 'Dutch',
                    'Flemish Giant', 'English Angora', 'New Zealand', 'Californian',
                    'Mixed Breed', 'Other'
                ],
                weightRange: { min: 0.5, max: 10 },
                lifespanRange: { min: 0, max: 12 },
                bodyConditionScoreRange: { min: 1, max: 5 },
                commonHealthConditions: [
                    'Dental Problems', 'GI Stasis', 'Respiratory Issues', 'Parasites',
                    'Urinary Sludge', 'Arthritis', 'Cancer', 'Eye Problems'
                ],
                commonAllergies: [
                    'Certain Vegetables', 'Fruits', 'Pellet Ingredients', 'Hay Types'
                ]
            },
            bird: {
                breeds: [
                    'Budgerigar', 'Cockatiel', 'Canary', 'Lovebird', 'Conure',
                    'African Grey', 'Macaw', 'Cockatoo', 'Finch', 'Parakeet',
                    'Other'
                ],
                weightRange: { min: 0.01, max: 2 },
                lifespanRange: { min: 0, max: 80 },
                bodyConditionScoreRange: { min: 1, max: 5 },
                commonHealthConditions: [
                    'Respiratory Issues', 'Feather Plucking', 'Nutritional Deficiencies',
                    'Parasites', 'Egg Binding', 'Liver Disease', 'Kidney Disease'
                ],
                commonAllergies: [
                    'Certain Seeds', 'Food Additives', 'Environmental Toxins'
                ]
            },
            other: {
                breeds: ['Various', 'Unknown'],
                weightRange: { min: 0.01, max: 50 },
                lifespanRange: { min: 0, max: 30 },
                bodyConditionScoreRange: { min: 1, max: 9 },
                commonHealthConditions: [
                    'Species-specific conditions', 'Nutritional issues', 'Parasites'
                ],
                commonAllergies: ['Various allergens']
            }
        };

        this.validationRules = {
            name: [
                { rule: 'required', message: 'Pet name is required' },
                { rule: 'minLength', params: [2], message: 'Pet name must be at least 2 characters' },
                { rule: 'maxLength', params: [50], message: 'Pet name must be no more than 50 characters' },
                { rule: 'pattern', params: [/^[a-zA-Z0-9\s\-'\.]+$/], message: 'Pet name contains invalid characters' }
            ],
            species: [
                { rule: 'required', message: 'Species is required' },
                { rule: 'enum', params: [['dog', 'cat', 'rabbit', 'bird', 'other']], message: 'Invalid species selected' }
            ],
            breed: [
                { rule: 'maxLength', params: [100], message: 'Breed name must be no more than 100 characters' }
            ],
            date_of_birth: [
                { rule: 'date', message: 'Invalid date format' },
                { rule: 'pastDate', message: 'Birth date cannot be in the future' },
                { rule: 'reasonableAge', message: 'Birth date seems unrealistic for this species' }
            ],
            gender: [
                { rule: 'enum', params: [['male', 'female', 'unknown']], message: 'Invalid gender selected' }
            ],
            current_weight: [
                { rule: 'number', message: 'Weight must be a valid number' },
                { rule: 'positive', message: 'Weight must be positive' },
                { rule: 'speciesWeightRange', message: 'Weight is outside normal range for this species' }
            ],
            ideal_weight: [
                { rule: 'number', message: 'Ideal weight must be a valid number' },
                { rule: 'positive', message: 'Ideal weight must be positive' },
                { rule: 'speciesWeightRange', message: 'Ideal weight is outside normal range for this species' }
            ],
            activity_level: [
                { rule: 'enum', params: [['low', 'moderate', 'high']], message: 'Invalid activity level selected' }
            ],
            body_condition_score: [
                { rule: 'number', message: 'Body condition score must be a number' },
                { rule: 'speciesBCSRange', message: 'Body condition score is outside valid range for this species' }
            ],
            microchip_id: [
                { rule: 'pattern', params: [/^[0-9A-Fa-f]{15}$/], message: 'Microchip ID must be 15 alphanumeric characters' }
            ]
        };

        this.setupCustomValidationRules();
    }

    setupCustomValidationRules() {
        // Add custom validation rules
        this.addValidationRule('pattern', (value, pattern) => {
            return !value || pattern.test(value);
        });

        this.addValidationRule('enum', (value, validValues) => {
            return !value || validValues.includes(value);
        });

        this.addValidationRule('reasonableAge', (value, species) => {
            if (!value || !species) return true;
            
            const birthDate = new Date(value);
            const today = new Date();
            const ageInYears = (today - birthDate) / (1000 * 60 * 60 * 24 * 365.25);
            
            const speciesData = this.speciesData[species];
            if (!speciesData) return true;
            
            return ageInYears >= 0 && ageInYears <= speciesData.lifespanRange.max;
        });

        this.addValidationRule('speciesWeightRange', (value, species) => {
            if (!value || !species) return true;
            
            const weight = parseFloat(value);
            const speciesData = this.speciesData[species];
            if (!speciesData) return true;
            
            return weight >= speciesData.weightRange.min && weight <= speciesData.weightRange.max;
        });

        this.addValidationRule('speciesBCSRange', (value, species) => {
            if (!value || !species) return true;
            
            const bcs = parseInt(value);
            const speciesData = this.speciesData[species];
            if (!speciesData) return true;
            
            return bcs >= speciesData.bodyConditionScoreRange.min && bcs <= speciesData.bodyConditionScoreRange.max;
        });

        this.addValidationRule('weightConsistency', (currentWeight, idealWeight) => {
            if (!currentWeight || !idealWeight) return true;
            
            const current = parseFloat(currentWeight);
            const ideal = parseFloat(idealWeight);
            
            // Allow up to 50% difference between current and ideal weight
            return Math.abs(current - ideal) / ideal <= 0.5;
        });
    }

    addValidationRule(name, validator) {
        if (!this.customRules) {
            this.customRules = new Map();
        }
        this.customRules.set(name, validator);
    }

    validateField(fieldName, value, context = {}) {
        const rules = this.validationRules[fieldName];
        if (!rules) return { isValid: true, errors: [] };

        const errors = [];

        for (const rule of rules) {
            const ruleName = rule.rule;
            const params = rule.params || [];
            const message = rule.message;

            let isValid = false;

            // Check custom rules first
            if (this.customRules && this.customRules.has(ruleName)) {
                const validator = this.customRules.get(ruleName);
                isValid = validator(value, ...params, context.species);
            } else {
                // Use built-in validation rules
                isValid = this.executeBuiltInRule(ruleName, value, params);
            }

            if (!isValid) {
                errors.push(message);
            }
        }

        return { isValid: errors.length === 0, errors };
    }

    executeBuiltInRule(ruleName, value, params) {
        switch (ruleName) {
            case 'required':
                return value !== null && value !== undefined && String(value).trim() !== '';
            case 'minLength':
                return !value || String(value).length >= params[0];
            case 'maxLength':
                return !value || String(value).length <= params[0];
            case 'number':
                return !value || !isNaN(Number(value));
            case 'positive':
                return !value || Number(value) > 0;
            case 'date':
                return !value || !isNaN(Date.parse(value));
            case 'pastDate':
                return !value || new Date(value) <= new Date();
            default:
                return true;
        }
    }

    validatePetProfile(petData) {
        const results = {};
        let isValid = true;

        // Validate each field
        for (const [fieldName, value] of Object.entries(petData)) {
            const result = this.validateField(fieldName, value, petData);
            results[fieldName] = result;
            if (!result.isValid) {
                isValid = false;
            }
        }

        // Cross-field validations
        const crossFieldResults = this.validateCrossFields(petData);
        Object.assign(results, crossFieldResults);
        if (Object.values(crossFieldResults).some(r => !r.isValid)) {
            isValid = false;
        }

        return { isValid, results };
    }

    validateCrossFields(petData) {
        const results = {};

        // Validate weight consistency
        if (petData.current_weight && petData.ideal_weight) {
            const isConsistent = this.customRules.get('weightConsistency')(
                petData.current_weight, 
                petData.ideal_weight
            );
            
            if (!isConsistent) {
                results.weight_consistency = {
                    isValid: false,
                    errors: ['Current weight and ideal weight seem inconsistent']
                };
            }
        }

        // Validate breed for species
        if (petData.species && petData.breed) {
            const speciesData = this.speciesData[petData.species];
            if (speciesData && !speciesData.breeds.includes(petData.breed) && petData.breed !== 'Other') {
                results.breed_species_match = {
                    isValid: false,
                    errors: ['Selected breed is not typical for this species']
                };
            }
        }

        return results;
    }

    getSpeciesData(species) {
        return this.speciesData[species] || this.speciesData.other;
    }

    getBreedsForSpecies(species) {
        const speciesData = this.getSpeciesData(species);
        return speciesData.breeds;
    }

    getHealthConditionsForSpecies(species) {
        const speciesData = this.getSpeciesData(species);
        return speciesData.commonHealthConditions;
    }

    getAllergiesForSpecies(species) {
        const speciesData = this.getSpeciesData(species);
        return speciesData.commonAllergies;
    }

    getWeightRangeForSpecies(species) {
        const speciesData = this.getSpeciesData(species);
        return speciesData.weightRange;
    }

    getBCSRangeForSpecies(species) {
        const speciesData = this.getSpeciesData(species);
        return speciesData.bodyConditionScoreRange;
    }

    generateValidationSummary(validationResults) {
        const summary = {
            totalFields: Object.keys(validationResults.results).length,
            validFields: 0,
            invalidFields: 0,
            errors: [],
            warnings: []
        };

        for (const [fieldName, result] of Object.entries(validationResults.results)) {
            if (result.isValid) {
                summary.validFields++;
            } else {
                summary.invalidFields++;
                result.errors.forEach(error => {
                    summary.errors.push({ field: fieldName, message: error });
                });
            }
        }

        return summary;
    }
}

// Export for module use
window.PetProfileValidator = PetProfileValidator;