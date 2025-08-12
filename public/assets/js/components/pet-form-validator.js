/**
 * Pet Form Validator
 * Advanced real-time validation system for pet forms
 */
class PetFormValidator {
    constructor() {
        this.validationRules = {
            name: {
                required: true,
                minLength: 2,
                maxLength: 50,
                pattern: /^[a-zA-Z0-9\s\-'\.]+$/,
                message: 'Pet name should contain only letters, numbers, spaces, hyphens, apostrophes, and periods'
            },
            species: {
                required: true,
                allowedValues: ['dog', 'cat', 'bird', 'rabbit', 'other']
            },
            breed: {
                maxLength: 100,
                customValidation: this.validateBreed.bind(this)
            },
            weight: {
                required: true,
                type: 'number',
                min: 0.01,
                max: 200,
                customValidation: this.validateWeight.bind(this)
            },
            ideal_weight: {
                type: 'number',
                min: 0.01,
                max: 200,
                customValidation: this.validateIdealWeight.bind(this)
            },
            activity_level: {
                required: true,
                allowedValues: ['low', 'medium', 'high']
            },
            birth_date: {
                type: 'date',
                customValidation: this.validateBirthDate.bind(this)
            },
            body_condition_score: {
                type: 'number',
                min: 1,
                max: 9
            },
            microchip_id: {
                pattern: /^[0-9A-Fa-f]{15}$/,
                message: 'Microchip ID should be 15 hexadecimal characters'
            },
            personality: {
                maxLength: 500
            },
            emergency_contact: {
                maxLength: 300
            }
        };

        // Species-specific data for validation
        this.speciesData = {
            dog: {
                weightRange: { min: 0.5, max: 100 },
                commonBreeds: [
                    'Golden Retriever', 'Labrador Retriever', 'German Shepherd', 'Bulldog', 'Poodle',
                    'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund', 'Siberian Husky',
                    'Boxer', 'Border Collie', 'Australian Shepherd', 'Cocker Spaniel', 'Chihuahua',
                    'Shih Tzu', 'Boston Terrier', 'Pomeranian', 'Australian Cattle Dog', 'Mastiff'
                ],
                breedWeightRanges: {
                    'Chihuahua': { min: 1.5, max: 3 },
                    'Yorkshire Terrier': { min: 2, max: 3.5 },
                    'Pomeranian': { min: 1.5, max: 3.5 },
                    'Boston Terrier': { min: 4.5, max: 11 },
                    'Beagle': { min: 9, max: 16 },
                    'Cocker Spaniel': { min: 12, max: 16 },
                    'Border Collie': { min: 14, max: 20 },
                    'Australian Shepherd': { min: 16, max: 32 },
                    'Golden Retriever': { min: 25, max: 34 },
                    'Labrador Retriever': { min: 25, max: 36 },
                    'German Shepherd': { min: 22, max: 40 },
                    'Rottweiler': { min: 35, max: 60 },
                    'Mastiff': { min: 54, max: 113 }
                }
            },
            cat: {
                weightRange: { min: 0.5, max: 15 },
                commonBreeds: [
                    'Persian', 'Maine Coon', 'Ragdoll', 'British Shorthair', 'Abyssinian',
                    'Russian Blue', 'Siamese', 'American Shorthair', 'Scottish Fold', 'Sphynx',
                    'Bengal', 'Birman', 'Oriental Shorthair', 'Devon Rex', 'Cornish Rex',
                    'Norwegian Forest Cat', 'Manx', 'Turkish Angora', 'Exotic Shorthair', 'Burmese'
                ],
                breedWeightRanges: {
                    'Siamese': { min: 2.5, max: 4.5 },
                    'Persian': { min: 3, max: 5.5 },
                    'Russian Blue': { min: 3, max: 5.5 },
                    'British Shorthair': { min: 4, max: 8 },
                    'Maine Coon': { min: 4.5, max: 11 },
                    'Ragdoll': { min: 4.5, max: 9 },
                    'Norwegian Forest Cat': { min: 4, max: 9 }
                }
            },
            bird: {
                weightRange: { min: 0.01, max: 2 },
                commonBreeds: [
                    'Budgerigar', 'Cockatiel', 'Canary', 'Lovebird', 'Conure', 'Macaw',
                    'African Grey', 'Cockatoo', 'Finch', 'Parakeet'
                ]
            },
            rabbit: {
                weightRange: { min: 0.5, max: 10 },
                commonBreeds: [
                    'Holland Lop', 'Netherland Dwarf', 'Mini Rex', 'Lionhead', 'Flemish Giant',
                    'English Angora', 'Dutch', 'New Zealand', 'Californian'
                ],
                breedWeightRanges: {
                    'Netherland Dwarf': { min: 0.5, max: 1.1 },
                    'Holland Lop': { min: 1, max: 1.8 },
                    'Mini Rex': { min: 1.5, max: 2 },
                    'Dutch': { min: 1.6, max: 2.5 },
                    'New Zealand': { min: 4, max: 5.5 },
                    'Flemish Giant': { min: 6, max: 10 }
                }
            },
            other: {
                weightRange: { min: 0.01, max: 200 },
                commonBreeds: []
            }
        };

        this.validationMessages = {
            required: 'This field is required',
            minLength: 'Must be at least {min} characters long',
            maxLength: 'Must be no more than {max} characters long',
            min: 'Must be at least {min}',
            max: 'Must be no more than {max}',
            pattern: 'Invalid format',
            email: 'Please enter a valid email address',
            date: 'Please enter a valid date',
            number: 'Please enter a valid number'
        };
    }

    /**
     * Validate a single field
     */
    validateField(fieldName, value, formData = {}) {
        const rules = this.validationRules[fieldName];
        if (!rules) return { isValid: true };

        const errors = [];

        // Required validation
        if (rules.required && (!value || value.toString().trim() === '')) {
            errors.push(this.validationMessages.required);
        }

        // Skip other validations if field is empty and not required
        if (!value || value.toString().trim() === '') {
            return { isValid: errors.length === 0, errors };
        }

        // Type validation
        if (rules.type) {
            const typeValidation = this.validateType(value, rules.type);
            if (!typeValidation.isValid) {
                errors.push(typeValidation.message);
            }
        }

        // Length validation
        if (rules.minLength && value.length < rules.minLength) {
            errors.push(this.validationMessages.minLength.replace('{min}', rules.minLength));
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(this.validationMessages.maxLength.replace('{max}', rules.maxLength));
        }

        // Range validation
        if (rules.min !== undefined && parseFloat(value) < rules.min) {
            errors.push(this.validationMessages.min.replace('{min}', rules.min));
        }

        if (rules.max !== undefined && parseFloat(value) > rules.max) {
            errors.push(this.validationMessages.max.replace('{max}', rules.max));
        }

        // Pattern validation
        if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(rules.message || this.validationMessages.pattern);
        }

        // Allowed values validation
        if (rules.allowedValues && !rules.allowedValues.includes(value)) {
            errors.push(`Must be one of: ${rules.allowedValues.join(', ')}`);
        }

        // Custom validation
        if (rules.customValidation) {
            const customResult = rules.customValidation(value, formData);
            if (!customResult.isValid) {
                errors.push(...customResult.errors);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: this.getFieldWarnings(fieldName, value, formData)
        };
    }

    /**
     * Validate data type
     */
    validateType(value, type) {
        switch (type) {
            case 'number':
                const num = parseFloat(value);
                return {
                    isValid: !isNaN(num) && isFinite(num),
                    message: this.validationMessages.number
                };
            case 'date':
                const date = new Date(value);
                return {
                    isValid: date instanceof Date && !isNaN(date),
                    message: this.validationMessages.date
                };
            case 'email':
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return {
                    isValid: emailPattern.test(value),
                    message: this.validationMessages.email
                };
            default:
                return { isValid: true };
        }
    }

    /**
     * Custom validation for breed field
     */
    validateBreed(breed, formData) {
        const species = formData.species;
        const errors = [];
        const warnings = [];

        if (!species) {
            return { isValid: true, errors, warnings };
        }

        const speciesInfo = this.speciesData[species];
        if (!speciesInfo) {
            return { isValid: true, errors, warnings };
        }

        // Check if breed is in common breeds list
        const commonBreeds = speciesInfo.commonBreeds || [];
        const breedLower = breed.toLowerCase();
        const isCommonBreed = commonBreeds.some(b => b.toLowerCase() === breedLower);

        if (!isCommonBreed && breed !== 'Mixed Breed' && breed !== 'Other') {
            warnings.push(`"${breed}" is not a commonly recognized ${species} breed. Consider selecting from the suggestions or use "Mixed Breed".`);
        }

        return { isValid: true, errors, warnings };
    }

    /**
     * Custom validation for weight field
     */
    validateWeight(weight, formData) {
        const species = formData.species;
        const breed = formData.breed;
        const errors = [];
        const warnings = [];

        const weightNum = parseFloat(weight);
        if (isNaN(weightNum)) {
            return { isValid: true, errors, warnings };
        }

        // Species-based weight validation
        if (species && this.speciesData[species]) {
            const speciesRange = this.speciesData[species].weightRange;
            
            if (weightNum < speciesRange.min) {
                errors.push(`Weight is unusually low for a ${species}. Minimum expected: ${speciesRange.min}kg`);
            } else if (weightNum > speciesRange.max) {
                errors.push(`Weight is unusually high for a ${species}. Maximum expected: ${speciesRange.max}kg`);
            }

            // Breed-specific weight validation
            if (breed && this.speciesData[species].breedWeightRanges) {
                const breedRange = this.speciesData[species].breedWeightRanges[breed];
                if (breedRange) {
                    if (weightNum < breedRange.min * 0.8) {
                        warnings.push(`Weight is below typical range for ${breed} (${breedRange.min}-${breedRange.max}kg)`);
                    } else if (weightNum > breedRange.max * 1.2) {
                        warnings.push(`Weight is above typical range for ${breed} (${breedRange.min}-${breedRange.max}kg)`);
                    }
                }
            }
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    /**
     * Custom validation for ideal weight field
     */
    validateIdealWeight(idealWeight, formData) {
        const currentWeight = parseFloat(formData.weight);
        const idealWeightNum = parseFloat(idealWeight);
        const errors = [];
        const warnings = [];

        if (isNaN(idealWeightNum) || isNaN(currentWeight)) {
            return { isValid: true, errors, warnings };
        }

        const weightDifference = Math.abs(currentWeight - idealWeightNum);
        const percentageDifference = (weightDifference / currentWeight) * 100;

        if (percentageDifference > 50) {
            warnings.push('Large difference between current and ideal weight. Consider consulting a veterinarian.');
        }

        if (idealWeightNum < currentWeight * 0.5) {
            errors.push('Ideal weight seems too low compared to current weight');
        } else if (idealWeightNum > currentWeight * 2) {
            errors.push('Ideal weight seems too high compared to current weight');
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    /**
     * Custom validation for birth date field
     */
    validateBirthDate(birthDate, formData) {
        const errors = [];
        const warnings = [];

        const birth = new Date(birthDate);
        const today = new Date();
        const ageInMs = today - birth;
        const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);

        if (birth > today) {
            errors.push('Birth date cannot be in the future');
        } else if (ageInYears > 30) {
            warnings.push('Age seems unusually high. Please verify the birth date.');
        } else if (ageInYears < 0.01) { // Less than ~4 days old
            warnings.push('Very young pet. Ensure proper veterinary care.');
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    /**
     * Get field-specific warnings
     */
    getFieldWarnings(fieldName, value, formData) {
        const warnings = [];

        // Add contextual warnings based on field combinations
        if (fieldName === 'activity_level' && formData.species) {
            if (formData.species === 'cat' && value === 'high') {
                warnings.push('High activity cats may need extra enrichment and play time');
            } else if (formData.species === 'dog' && value === 'low') {
                warnings.push('Low activity dogs may be prone to weight gain');
            }
        }

        if (fieldName === 'body_condition_score') {
            const score = parseInt(value);
            if (score <= 3) {
                warnings.push('Underweight condition - consider veterinary consultation');
            } else if (score >= 7) {
                warnings.push('Overweight condition - consider diet and exercise plan');
            }
        }

        return warnings;
    }

    /**
     * Validate entire form
     */
    validateForm(formData) {
        const results = {};
        let isFormValid = true;

        Object.keys(this.validationRules).forEach(fieldName => {
            const fieldValue = formData[fieldName];
            const result = this.validateField(fieldName, fieldValue, formData);
            results[fieldName] = result;
            
            if (!result.isValid) {
                isFormValid = false;
            }
        });

        return {
            isValid: isFormValid,
            fields: results,
            summary: this.getValidationSummary(results)
        };
    }

    /**
     * Get validation summary
     */
    getValidationSummary(results) {
        const summary = {
            totalErrors: 0,
            totalWarnings: 0,
            errorFields: [],
            warningFields: []
        };

        Object.keys(results).forEach(fieldName => {
            const result = results[fieldName];
            
            if (result.errors && result.errors.length > 0) {
                summary.totalErrors += result.errors.length;
                summary.errorFields.push(fieldName);
            }
            
            if (result.warnings && result.warnings.length > 0) {
                summary.totalWarnings += result.warnings.length;
                summary.warningFields.push(fieldName);
            }
        });

        return summary;
    }

    /**
     * Get breed suggestions based on species and input
     */
    getBreedSuggestions(species, input = '') {
        if (!species || !this.speciesData[species]) {
            return [];
        }

        const breeds = this.speciesData[species].commonBreeds || [];
        const inputLower = input.toLowerCase();

        if (!input) {
            return breeds.slice(0, 10); // Return first 10 breeds
        }

        // Filter and sort by relevance
        const filtered = breeds.filter(breed => 
            breed.toLowerCase().includes(inputLower)
        );

        // Sort by how early the match appears in the breed name
        filtered.sort((a, b) => {
            const aIndex = a.toLowerCase().indexOf(inputLower);
            const bIndex = b.toLowerCase().indexOf(inputLower);
            return aIndex - bIndex;
        });

        return filtered.slice(0, 10);
    }

    /**
     * Get weight recommendations based on species and breed
     */
    getWeightRecommendations(species, breed) {
        if (!species || !this.speciesData[species]) {
            return null;
        }

        const speciesData = this.speciesData[species];
        let recommendation = {
            species: species,
            speciesRange: speciesData.weightRange,
            breedRange: null
        };

        if (breed && speciesData.breedWeightRanges && speciesData.breedWeightRanges[breed]) {
            recommendation.breedRange = speciesData.breedWeightRanges[breed];
        }

        return recommendation;
    }

    /**
     * Format validation message for display
     */
    formatValidationMessage(fieldName, result) {
        const messages = [];

        if (result.errors && result.errors.length > 0) {
            messages.push({
                type: 'error',
                text: result.errors.join('. ')
            });
        }

        if (result.warnings && result.warnings.length > 0) {
            messages.push({
                type: 'warning',
                text: result.warnings.join('. ')
            });
        }

        return messages;
    }
}

// Export for use in other components
window.PetFormValidator = PetFormValidator;