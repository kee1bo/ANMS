// Enhanced Health Data Validation System
class HealthDataValidator {
    constructor() {
        this.validationRules = {
            weight: {
                min: 0.1,
                max: 200,
                precision: 1,
                required: true
            },
            body_condition_score: {
                min: 1,
                max: 9,
                type: 'integer',
                required: false
            },
            temperature: {
                min: 35.0,
                max: 42.0,
                precision: 1,
                required: false
            },
            heart_rate: {
                min: 40,
                max: 300,
                type: 'integer',
                required: false
            },
            respiratory_rate: {
                min: 8,
                max: 60,
                type: 'integer',
                required: false
            },
            activity_duration: {
                min: 0,
                max: 24,
                precision: 1,
                required: false
            }
        };

        this.speciesSpecificRanges = {
            dog: {
                temperature: { min: 38.3, max: 39.2, unit: '°C' },
                heart_rate: { min: 60, max: 140, unit: 'bpm' },
                respiratory_rate: { min: 10, max: 30, unit: 'breaths/min' },
                weight: { min: 0.5, max: 100, unit: 'kg' }
            },
            cat: {
                temperature: { min: 38.0, max: 39.2, unit: '°C' },
                heart_rate: { min: 140, max: 220, unit: 'bpm' },
                respiratory_rate: { min: 20, max: 30, unit: 'breaths/min' },
                weight: { min: 0.3, max: 15, unit: 'kg' }
            },
            rabbit: {
                temperature: { min: 38.5, max: 40.0, unit: '°C' },
                heart_rate: { min: 180, max: 250, unit: 'bpm' },
                respiratory_rate: { min: 30, max: 60, unit: 'breaths/min' },
                weight: { min: 0.5, max: 8, unit: 'kg' }
            },
            bird: {
                temperature: { min: 40.0, max: 42.0, unit: '°C' },
                heart_rate: { min: 200, max: 500, unit: 'bpm' },
                respiratory_rate: { min: 15, max: 45, unit: 'breaths/min' },
                weight: { min: 0.01, max: 2, unit: 'kg' }
            }
        };
    }

    // Validate weight entry with comprehensive checks
    validateWeightEntry(data, petSpecies = 'dog') {
        const errors = [];
        const warnings = [];
        
        // Basic validation
        const basicValidation = this.validateBasicField(data.weight, 'weight');
        if (!basicValidation.isValid) {
            errors.push(...basicValidation.errors);
        }

        // Species-specific validation
        const speciesRange = this.speciesSpecificRanges[petSpecies]?.weight;
        if (speciesRange && data.weight) {
            if (data.weight < speciesRange.min) {
                warnings.push(`Weight ${data.weight}kg is unusually low for a ${petSpecies} (typical range: ${speciesRange.min}-${speciesRange.max}kg)`);
            } else if (data.weight > speciesRange.max) {
                warnings.push(`Weight ${data.weight}kg is unusually high for a ${petSpecies} (typical range: ${speciesRange.min}-${speciesRange.max}kg)`);
            }
        }

        // Date validation
        if (data.recorded_date) {
            const dateValidation = this.validateDate(data.recorded_date);
            if (!dateValidation.isValid) {
                errors.push(...dateValidation.errors);
            }
        } else {
            errors.push('Recorded date is required');
        }

        // Time validation (optional)
        if (data.recorded_time) {
            const timeValidation = this.validateTime(data.recorded_time);
            if (!timeValidation.isValid) {
                errors.push(...timeValidation.errors);
            }
        }

        // Body condition score validation (if provided)
        if (data.body_condition_score) {
            const bcsValidation = this.validateBasicField(data.body_condition_score, 'body_condition_score');
            if (!bcsValidation.isValid) {
                errors.push(...bcsValidation.errors);
            }
        }

        // Trend analysis validation (if previous weights provided)
        if (data.previous_weights && data.previous_weights.length > 0) {
            const trendValidation = this.validateWeightTrend(data.weight, data.previous_weights);
            warnings.push(...trendValidation.warnings);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            normalizedData: this.normalizeWeightData(data)
        };
    }

    // Validate medication entry with dosage calculations
    validateMedicationEntry(data, petWeight = null) {
        const errors = [];
        const warnings = [];

        // Required fields
        if (!data.medication_name || data.medication_name.trim().length === 0) {
            errors.push('Medication name is required');
        }

        if (!data.dosage || data.dosage.trim().length === 0) {
            errors.push('Dosage is required');
        }

        if (!data.frequency) {
            errors.push('Frequency is required');
        }

        if (!data.start_date) {
            errors.push('Start date is required');
        }

        // Date validation
        if (data.start_date) {
            const startDateValidation = this.validateDate(data.start_date);
            if (!startDateValidation.isValid) {
                errors.push(...startDateValidation.errors);
            }
        }

        if (data.end_date) {
            const endDateValidation = this.validateDate(data.end_date);
            if (!endDateValidation.isValid) {
                errors.push(...endDateValidation.errors);
            }

            // End date should be after start date
            if (data.start_date && data.end_date && new Date(data.end_date) <= new Date(data.start_date)) {
                errors.push('End date must be after start date');
            }
        }

        // Dosage validation and calculation
        if (data.dosage && petWeight) {
            const dosageValidation = this.validateDosage(data.dosage, data.medication_name, petWeight);
            if (!dosageValidation.isValid) {
                warnings.push(...dosageValidation.warnings);
            }
        }

        // Administration times validation
        if (data.administration_times && data.administration_times.length > 0) {
            data.administration_times.forEach((time, index) => {
                const timeValidation = this.validateTime(time);
                if (!timeValidation.isValid) {
                    errors.push(`Administration time ${index + 1}: ${timeValidation.errors.join(', ')}`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            normalizedData: this.normalizeMedicationData(data)
        };
    }

    // Validate health record entry
    validateHealthRecord(data) {
        const errors = [];
        const warnings = [];

        // Required fields
        if (!data.record_type) {
            errors.push('Record type is required');
        }

        if (!data.recorded_date) {
            errors.push('Recorded date is required');
        }

        // Date validation
        if (data.recorded_date) {
            const dateValidation = this.validateDate(data.recorded_date);
            if (!dateValidation.isValid) {
                errors.push(...dateValidation.errors);
            }
        }

        // Type-specific validation
        switch (data.record_type) {
            case 'vet_visit':
                if (!data.reason || data.reason.trim().length === 0) {
                    errors.push('Visit reason is required for vet visits');
                }
                break;
            case 'vaccination':
                if (!data.vaccine_name || data.vaccine_name.trim().length === 0) {
                    errors.push('Vaccine name is required for vaccinations');
                }
                break;
            case 'health_note':
                if (!data.notes || data.notes.trim().length < 10) {
                    errors.push('Health notes must be at least 10 characters long');
                }
                break;
        }

        // Validate numeric values if present
        if (data.numeric_value !== null && data.numeric_value !== undefined) {
            const numericValidation = this.validateNumericValue(data.numeric_value, data.record_type);
            if (!numericValidation.isValid) {
                errors.push(...numericValidation.errors);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            normalizedData: this.normalizeHealthRecordData(data)
        };
    }

    // Bulk data import validation
    validateBulkHealthData(dataArray, petSpecies = 'dog') {
        const results = {
            valid: [],
            invalid: [],
            warnings: [],
            summary: {
                total: dataArray.length,
                valid_count: 0,
                invalid_count: 0,
                warning_count: 0
            }
        };

        dataArray.forEach((data, index) => {
            let validation;
            
            // Determine validation type based on data structure
            if (data.weight !== undefined) {
                validation = this.validateWeightEntry(data, petSpecies);
            } else if (data.medication_name !== undefined) {
                validation = this.validateMedicationEntry(data);
            } else if (data.record_type !== undefined) {
                validation = this.validateHealthRecord(data);
            } else {
                validation = {
                    isValid: false,
                    errors: ['Unknown data type - unable to validate'],
                    warnings: []
                };
            }

            const result = {
                index,
                originalData: data,
                validation
            };

            if (validation.isValid) {
                results.valid.push(result);
                results.summary.valid_count++;
            } else {
                results.invalid.push(result);
                results.summary.invalid_count++;
            }

            if (validation.warnings && validation.warnings.length > 0) {
                results.warnings.push({
                    index,
                    warnings: validation.warnings
                });
                results.summary.warning_count++;
            }
        });

        return results;
    }

    // Basic field validation
    validateBasicField(value, fieldType) {
        const errors = [];
        const rule = this.validationRules[fieldType];

        if (!rule) {
            return { isValid: true, errors: [] };
        }

        // Required check
        if (rule.required && (value === null || value === undefined || value === '')) {
            errors.push(`${fieldType} is required`);
            return { isValid: false, errors };
        }

        // Skip further validation if value is empty and not required
        if (!rule.required && (value === null || value === undefined || value === '')) {
            return { isValid: true, errors: [] };
        }

        // Type validation
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            errors.push(`${fieldType} must be a valid number`);
            return { isValid: false, errors };
        }

        // Range validation
        if (rule.min !== undefined && numValue < rule.min) {
            errors.push(`${fieldType} must be at least ${rule.min}`);
        }

        if (rule.max !== undefined && numValue > rule.max) {
            errors.push(`${fieldType} must be no more than ${rule.max}`);
        }

        // Integer validation
        if (rule.type === 'integer' && !Number.isInteger(numValue)) {
            errors.push(`${fieldType} must be a whole number`);
        }

        // Precision validation
        if (rule.precision !== undefined) {
            const decimalPlaces = (numValue.toString().split('.')[1] || '').length;
            if (decimalPlaces > rule.precision) {
                errors.push(`${fieldType} can have at most ${rule.precision} decimal place${rule.precision === 1 ? '' : 's'}`);
            }
        }

        return { isValid: errors.length === 0, errors };
    }

    // Date validation
    validateDate(dateString) {
        const errors = [];
        const date = new Date(dateString);
        const now = new Date();

        if (isNaN(date.getTime())) {
            errors.push('Invalid date format');
            return { isValid: false, errors };
        }

        // Check if date is not too far in the future
        const maxFutureDate = new Date();
        maxFutureDate.setDate(maxFutureDate.getDate() + 1);
        
        if (date > maxFutureDate) {
            errors.push('Date cannot be more than 1 day in the future');
        }

        // Check if date is not too far in the past (10 years)
        const minPastDate = new Date();
        minPastDate.setFullYear(minPastDate.getFullYear() - 10);
        
        if (date < minPastDate) {
            errors.push('Date cannot be more than 10 years in the past');
        }

        return { isValid: errors.length === 0, errors };
    }

    // Time validation
    validateTime(timeString) {
        const errors = [];
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

        if (!timeRegex.test(timeString)) {
            errors.push('Time must be in HH:MM format (24-hour)');
        }

        return { isValid: errors.length === 0, errors };
    }

    // Weight trend validation
    validateWeightTrend(currentWeight, previousWeights) {
        const warnings = [];
        
        if (previousWeights.length === 0) {
            return { warnings };
        }

        const lastWeight = previousWeights[previousWeights.length - 1].weight;
        const weightChange = currentWeight - lastWeight;
        const percentChange = Math.abs(weightChange / lastWeight) * 100;

        // Significant weight change warning
        if (percentChange > 10) {
            warnings.push(`Significant weight change detected: ${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}kg (${percentChange.toFixed(1)}%) since last measurement`);
        }

        // Rapid weight loss warning
        if (previousWeights.length >= 2) {
            const recentWeights = previousWeights.slice(-2);
            const avgRecentLoss = recentWeights.reduce((sum, w, i) => {
                if (i === 0) return 0;
                return sum + (recentWeights[i-1].weight - w.weight);
            }, 0);

            if (avgRecentLoss > 0.5) {
                warnings.push('Consistent weight loss pattern detected - consider veterinary consultation');
            }
        }

        return { warnings };
    }

    // Dosage validation
    validateDosage(dosageString, medicationName, petWeight) {
        const warnings = [];
        
        // Extract numeric value from dosage string
        const dosageMatch = dosageString.match(/(\d+(?:\.\d+)?)/);
        if (!dosageMatch) {
            return { isValid: true, warnings: ['Unable to parse dosage for validation'] };
        }

        const dosageAmount = parseFloat(dosageMatch[1]);
        const dosagePerKg = dosageAmount / petWeight;

        // Common medication dosage ranges (mg/kg)
        const commonDosageRanges = {
            'rimadyl': { min: 2, max: 4 },
            'metacam': { min: 0.1, max: 0.2 },
            'tramadol': { min: 2, max: 5 },
            'gabapentin': { min: 5, max: 20 },
            'prednisone': { min: 0.5, max: 2 }
        };

        const medName = medicationName.toLowerCase();
        const range = commonDosageRanges[medName];

        if (range) {
            if (dosagePerKg < range.min) {
                warnings.push(`Dosage may be below recommended range for ${medicationName} (${dosagePerKg.toFixed(2)} mg/kg, recommended: ${range.min}-${range.max} mg/kg)`);
            } else if (dosagePerKg > range.max) {
                warnings.push(`Dosage may be above recommended range for ${medicationName} (${dosagePerKg.toFixed(2)} mg/kg, recommended: ${range.min}-${range.max} mg/kg)`);
            }
        }

        return { isValid: true, warnings };
    }

    // Numeric value validation for health records
    validateNumericValue(value, recordType) {
        const errors = [];
        
        switch (recordType) {
            case 'temperature':
                return this.validateBasicField(value, 'temperature');
            case 'heart_rate':
                return this.validateBasicField(value, 'heart_rate');
            case 'respiratory_rate':
                return this.validateBasicField(value, 'respiratory_rate');
            case 'weight':
                return this.validateBasicField(value, 'weight');
            case 'body_condition':
                return this.validateBasicField(value, 'body_condition_score');
            default:
                // Generic numeric validation
                if (isNaN(parseFloat(value))) {
                    errors.push('Numeric value must be a valid number');
                }
        }

        return { isValid: errors.length === 0, errors };
    }

    // Data normalization methods
    normalizeWeightData(data) {
        return {
            weight: parseFloat(data.weight),
            recorded_date: data.recorded_date,
            recorded_time: data.recorded_time || null,
            body_condition_score: data.body_condition_score ? parseInt(data.body_condition_score) : null,
            measurement_method: data.measurement_method || 'home_scale',
            activity_before_weighing: data.activity_before_weighing || null,
            feeding_status: data.feeding_status || null,
            notes: data.health_notes || null,
            set_reminder: data.set_reminder === '1' || data.set_reminder === true
        };
    }

    normalizeMedicationData(data) {
        return {
            medication_name: data.medication_name.trim(),
            dosage: data.dosage.trim(),
            frequency: data.frequency,
            start_date: data.start_date,
            end_date: data.end_date || null,
            administration_method: data.administration_method || 'oral',
            administration_times: data.administration_times || [],
            with_food: data.with_food || null,
            prescribed_by: data.prescribed_by || null,
            prescription_date: data.prescription_date || null,
            purpose: data.purpose || null,
            special_instructions: data.special_instructions || null,
            enable_reminders: data.enable_reminders === '1' || data.enable_reminders === true,
            track_side_effects: data.track_side_effects === '1' || data.track_side_effects === true,
            refill_reminder: data.refill_reminder || null
        };
    }

    normalizeHealthRecordData(data) {
        return {
            record_type: data.record_type,
            recorded_date: data.recorded_date,
            recorded_time: data.recorded_time || null,
            numeric_value: data.numeric_value ? parseFloat(data.numeric_value) : null,
            text_value: data.text_value || data.notes || null,
            json_data: data.json_data || this.buildJsonData(data),
            attachments: data.attachments || null
        };
    }

    buildJsonData(data) {
        const jsonData = {};
        
        // Add type-specific data to JSON
        switch (data.record_type) {
            case 'vet_visit':
                if (data.reason) jsonData.reason = data.reason;
                if (data.veterinarian) jsonData.veterinarian = data.veterinarian;
                if (data.diagnosis) jsonData.diagnosis = data.diagnosis;
                if (data.treatment) jsonData.treatment = data.treatment;
                if (data.next_visit) jsonData.next_visit = data.next_visit;
                break;
            case 'vaccination':
                if (data.vaccine_name) jsonData.vaccine_name = data.vaccine_name;
                if (data.batch_number) jsonData.batch_number = data.batch_number;
                if (data.next_due) jsonData.next_due = data.next_due;
                break;
            case 'medication':
                if (data.medication_name) jsonData.medication_name = data.medication_name;
                if (data.dosage) jsonData.dosage = data.dosage;
                if (data.frequency) jsonData.frequency = data.frequency;
                break;
        }

        return Object.keys(jsonData).length > 0 ? jsonData : null;
    }

    // Generate validation report
    generateValidationReport(validationResults) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total_records: 0,
                valid_records: 0,
                invalid_records: 0,
                warning_records: 0
            },
            details: {
                errors: [],
                warnings: [],
                field_statistics: {}
            }
        };

        if (Array.isArray(validationResults)) {
            // Bulk validation results
            report.summary.total_records = validationResults.length;
            
            validationResults.forEach((result, index) => {
                if (result.validation.isValid) {
                    report.summary.valid_records++;
                } else {
                    report.summary.invalid_records++;
                    report.details.errors.push({
                        record_index: index,
                        errors: result.validation.errors
                    });
                }

                if (result.validation.warnings && result.validation.warnings.length > 0) {
                    report.summary.warning_records++;
                    report.details.warnings.push({
                        record_index: index,
                        warnings: result.validation.warnings
                    });
                }
            });
        } else {
            // Single validation result
            report.summary.total_records = 1;
            
            if (validationResults.isValid) {
                report.summary.valid_records = 1;
            } else {
                report.summary.invalid_records = 1;
                report.details.errors.push({
                    record_index: 0,
                    errors: validationResults.errors
                });
            }

            if (validationResults.warnings && validationResults.warnings.length > 0) {
                report.summary.warning_records = 1;
                report.details.warnings.push({
                    record_index: 0,
                    warnings: validationResults.warnings
                });
            }
        }

        return report;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthDataValidator;
} else {
    window.HealthDataValidator = HealthDataValidator;
}