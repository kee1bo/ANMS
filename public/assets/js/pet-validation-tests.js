// Comprehensive Health Data Validation Tests
class HealthDataValidationTests {
    constructor() {
        this.validator = new HealthDataValidator();
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
    }

    // Run all validation tests
    runAllTests() {
        console.log('🧪 Starting Health Data Validation Tests...');
        
        this.testWeightValidation();
        this.testMedicationValidation();
        this.testHealthRecordValidation();
        this.testBulkDataValidation();
        this.testDateTimeValidation();
        this.testSpeciesSpecificValidation();
        this.testTrendAnalysis();
        this.testDosageCalculations();

        this.generateTestReport();
        return this.testResults;
    }

    // Weight validation tests
    testWeightValidation() {
        console.log('Testing weight validation...');

        // Valid weight entries
        this.runTest('Valid weight entry', () => {
            const data = {
                weight: 25.5,
                recorded_date: '2024-01-15',
                recorded_time: '09:30',
                body_condition_score: 5
            };
            const result = this.validator.validateWeightEntry(data, 'dog');
            return result.isValid && result.errors.length === 0;
        });

        // Invalid weight - too low
        this.runTest('Invalid weight - too low', () => {
            const data = {
                weight: 0,
                recorded_date: '2024-01-15'
            };
            const result = this.validator.validateWeightEntry(data, 'dog');
            return !result.isValid && result.errors.some(e => e.includes('at least'));
        });

        // Invalid weight - too high
        this.runTest('Invalid weight - too high', () => {
            const data = {
                weight: 250,
                recorded_date: '2024-01-15'
            };
            const result = this.validator.validateWeightEntry(data, 'dog');
            return !result.isValid && result.errors.some(e => e.includes('no more than'));
        });

        // Missing required date
        this.runTest('Missing required date', () => {
            const data = {
                weight: 25.5
            };
            const result = this.validator.validateWeightEntry(data, 'dog');
            return !result.isValid && result.errors.some(e => e.includes('date is required'));
        });

        // Invalid body condition score
        this.runTest('Invalid body condition score', () => {
            const data = {
                weight: 25.5,
                recorded_date: '2024-01-15',
                body_condition_score: 10
            };
            const result = this.validator.validateWeightEntry(data, 'dog');
            return !result.isValid && result.errors.some(e => e.includes('body_condition_score'));
        });

        // Species-specific weight warnings
        this.runTest('Species-specific weight warning - cat too heavy', () => {
            const data = {
                weight: 20,
                recorded_date: '2024-01-15'
            };
            const result = this.validator.validateWeightEntry(data, 'cat');
            return result.isValid && result.warnings.some(w => w.includes('unusually high'));
        });

        // Weight trend analysis
        this.runTest('Weight trend analysis - significant change', () => {
            const data = {
                weight: 30,
                recorded_date: '2024-01-15',
                previous_weights: [
                    { weight: 25, date: '2024-01-01' }
                ]
            };
            const result = this.validator.validateWeightEntry(data, 'dog');
            return result.isValid && result.warnings.some(w => w.includes('Significant weight change'));
        });
    }

    // Medication validation tests
    testMedicationValidation() {
        console.log('Testing medication validation...');

        // Valid medication entry
        this.runTest('Valid medication entry', () => {
            const data = {
                medication_name: 'Rimadyl',
                dosage: '25mg',
                frequency: 'twice_daily',
                start_date: '2024-01-15',
                administration_method: 'oral',
                prescribed_by: 'Dr. Smith'
            };
            const result = this.validator.validateMedicationEntry(data, 25);
            return result.isValid && result.errors.length === 0;
        });

        // Missing required fields
        this.runTest('Missing medication name', () => {
            const data = {
                dosage: '25mg',
                frequency: 'twice_daily',
                start_date: '2024-01-15'
            };
            const result = this.validator.validateMedicationEntry(data);
            return !result.isValid && result.errors.some(e => e.includes('Medication name is required'));
        });

        this.runTest('Missing dosage', () => {
            const data = {
                medication_name: 'Rimadyl',
                frequency: 'twice_daily',
                start_date: '2024-01-15'
            };
            const result = this.validator.validateMedicationEntry(data);
            return !result.isValid && result.errors.some(e => e.includes('Dosage is required'));
        });

        // Invalid date range
        this.runTest('End date before start date', () => {
            const data = {
                medication_name: 'Rimadyl',
                dosage: '25mg',
                frequency: 'twice_daily',
                start_date: '2024-01-15',
                end_date: '2024-01-10'
            };
            const result = this.validator.validateMedicationEntry(data);
            return !result.isValid && result.errors.some(e => e.includes('End date must be after start date'));
        });

        // Invalid administration times
        this.runTest('Invalid administration time format', () => {
            const data = {
                medication_name: 'Rimadyl',
                dosage: '25mg',
                frequency: 'twice_daily',
                start_date: '2024-01-15',
                administration_times: ['25:00', '08:30']
            };
            const result = this.validator.validateMedicationEntry(data);
            return !result.isValid && result.errors.some(e => e.includes('Administration time'));
        });

        // Dosage validation with pet weight
        this.runTest('Dosage validation - within range', () => {
            const data = {
                medication_name: 'Rimadyl',
                dosage: '75mg',
                frequency: 'twice_daily',
                start_date: '2024-01-15'
            };
            const result = this.validator.validateMedicationEntry(data, 25); // 3mg/kg - within range
            return result.isValid && result.warnings.length === 0;
        });

        this.runTest('Dosage validation - above range', () => {
            const data = {
                medication_name: 'Rimadyl',
                dosage: '150mg',
                frequency: 'twice_daily',
                start_date: '2024-01-15'
            };
            const result = this.validator.validateMedicationEntry(data, 25); // 6mg/kg - above range
            return result.isValid && result.warnings.some(w => w.includes('above recommended range'));
        });
    }

    // Health record validation tests
    testHealthRecordValidation() {
        console.log('Testing health record validation...');

        // Valid vet visit record
        this.runTest('Valid vet visit record', () => {
            const data = {
                record_type: 'vet_visit',
                recorded_date: '2024-01-15',
                reason: 'Annual checkup',
                veterinarian: 'Dr. Smith',
                diagnosis: 'Healthy',
                treatment: 'None required'
            };
            const result = this.validator.validateHealthRecord(data);
            return result.isValid && result.errors.length === 0;
        });

        // Valid vaccination record
        this.runTest('Valid vaccination record', () => {
            const data = {
                record_type: 'vaccination',
                recorded_date: '2024-01-15',
                vaccine_name: 'Rabies',
                batch_number: 'RB2024001',
                next_due: '2025-01-15'
            };
            const result = this.validator.validateHealthRecord(data);
            return result.isValid && result.errors.length === 0;
        });

        // Missing required fields
        this.runTest('Missing record type', () => {
            const data = {
                recorded_date: '2024-01-15',
                reason: 'Annual checkup'
            };
            const result = this.validator.validateHealthRecord(data);
            return !result.isValid && result.errors.some(e => e.includes('Record type is required'));
        });

        this.runTest('Missing vet visit reason', () => {
            const data = {
                record_type: 'vet_visit',
                recorded_date: '2024-01-15'
            };
            const result = this.validator.validateHealthRecord(data);
            return !result.isValid && result.errors.some(e => e.includes('Visit reason is required'));
        });

        this.runTest('Missing vaccine name', () => {
            const data = {
                record_type: 'vaccination',
                recorded_date: '2024-01-15'
            };
            const result = this.validator.validateHealthRecord(data);
            return !result.isValid && result.errors.some(e => e.includes('Vaccine name is required'));
        });

        // Health note validation
        this.runTest('Health note too short', () => {
            const data = {
                record_type: 'health_note',
                recorded_date: '2024-01-15',
                notes: 'Short'
            };
            const result = this.validator.validateHealthRecord(data);
            return !result.isValid && result.errors.some(e => e.includes('at least 10 characters'));
        });

        // Numeric value validation
        this.runTest('Valid temperature record', () => {
            const data = {
                record_type: 'temperature',
                recorded_date: '2024-01-15',
                numeric_value: 38.5
            };
            const result = this.validator.validateHealthRecord(data);
            return result.isValid && result.errors.length === 0;
        });

        this.runTest('Invalid temperature value', () => {
            const data = {
                record_type: 'temperature',
                recorded_date: '2024-01-15',
                numeric_value: 50
            };
            const result = this.validator.validateHealthRecord(data);
            return !result.isValid && result.errors.some(e => e.includes('temperature'));
        });
    }

    // Bulk data validation tests
    testBulkDataValidation() {
        console.log('Testing bulk data validation...');

        this.runTest('Bulk weight data validation', () => {
            const bulkData = [
                { weight: 25.5, recorded_date: '2024-01-15' },
                { weight: 26.0, recorded_date: '2024-01-16' },
                { weight: 'invalid', recorded_date: '2024-01-17' },
                { weight: 25.8, recorded_date: '2024-01-18' }
            ];
            
            const result = this.validator.validateBulkHealthData(bulkData, 'dog');
            return result.summary.total === 4 && 
                   result.summary.valid_count === 3 && 
                   result.summary.invalid_count === 1;
        });

        this.runTest('Mixed bulk data validation', () => {
            const bulkData = [
                { weight: 25.5, recorded_date: '2024-01-15' },
                { 
                    medication_name: 'Rimadyl', 
                    dosage: '25mg', 
                    frequency: 'twice_daily', 
                    start_date: '2024-01-15' 
                },
                { 
                    record_type: 'vet_visit', 
                    recorded_date: '2024-01-15', 
                    reason: 'Checkup' 
                }
            ];
            
            const result = this.validator.validateBulkHealthData(bulkData, 'dog');
            return result.summary.total === 3 && result.summary.valid_count === 3;
        });
    }

    // Date and time validation tests
    testDateTimeValidation() {
        console.log('Testing date and time validation...');

        // Valid dates
        this.runTest('Valid date format', () => {
            const result = this.validator.validateDate('2024-01-15');
            return result.isValid;
        });

        this.runTest('Valid time format', () => {
            const result = this.validator.validateTime('14:30');
            return result.isValid;
        });

        // Invalid dates
        this.runTest('Invalid date format', () => {
            const result = this.validator.validateDate('invalid-date');
            return !result.isValid && result.errors.some(e => e.includes('Invalid date format'));
        });

        this.runTest('Future date validation', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 5);
            const result = this.validator.validateDate(futureDate.toISOString().split('T')[0]);
            return !result.isValid && result.errors.some(e => e.includes('future'));
        });

        this.runTest('Very old date validation', () => {
            const result = this.validator.validateDate('2010-01-01');
            return !result.isValid && result.errors.some(e => e.includes('10 years in the past'));
        });

        // Invalid times
        this.runTest('Invalid time format - 25 hours', () => {
            const result = this.validator.validateTime('25:00');
            return !result.isValid && result.errors.some(e => e.includes('HH:MM format'));
        });

        this.runTest('Invalid time format - 61 minutes', () => {
            const result = this.validator.validateTime('14:61');
            return !result.isValid && result.errors.some(e => e.includes('HH:MM format'));
        });
    }

    // Species-specific validation tests
    testSpeciesSpecificValidation() {
        console.log('Testing species-specific validation...');

        // Dog weight ranges
        this.runTest('Dog weight - normal range', () => {
            const data = { weight: 25, recorded_date: '2024-01-15' };
            const result = this.validator.validateWeightEntry(data, 'dog');
            return result.isValid && result.warnings.length === 0;
        });

        // Cat weight ranges
        this.runTest('Cat weight - normal range', () => {
            const data = { weight: 4.5, recorded_date: '2024-01-15' };
            const result = this.validator.validateWeightEntry(data, 'cat');
            return result.isValid && result.warnings.length === 0;
        });

        this.runTest('Cat weight - too high warning', () => {
            const data = { weight: 20, recorded_date: '2024-01-15' };
            const result = this.validator.validateWeightEntry(data, 'cat');
            return result.isValid && result.warnings.some(w => w.includes('unusually high'));
        });

        // Rabbit weight ranges
        this.runTest('Rabbit weight - normal range', () => {
            const data = { weight: 2.5, recorded_date: '2024-01-15' };
            const result = this.validator.validateWeightEntry(data, 'rabbit');
            return result.isValid && result.warnings.length === 0;
        });

        // Bird weight ranges
        this.runTest('Bird weight - normal range', () => {
            const data = { weight: 0.5, recorded_date: '2024-01-15' };
            const result = this.validator.validateWeightEntry(data, 'bird');
            return result.isValid && result.warnings.length === 0;
        });
    }

    // Trend analysis tests
    testTrendAnalysis() {
        console.log('Testing trend analysis...');

        this.runTest('Significant weight increase detection', () => {
            const data = {
                weight: 30,
                recorded_date: '2024-01-15',
                previous_weights: [{ weight: 25, date: '2024-01-01' }]
            };
            const result = this.validator.validateWeightEntry(data, 'dog');
            return result.isValid && result.warnings.some(w => w.includes('Significant weight change'));
        });

        this.runTest('Consistent weight loss pattern', () => {
            const data = {
                weight: 23,
                recorded_date: '2024-01-15',
                previous_weights: [
                    { weight: 25, date: '2024-01-01' },
                    { weight: 24, date: '2024-01-08' }
                ]
            };
            const result = this.validator.validateWeightEntry(data, 'dog');
            return result.isValid && result.warnings.some(w => w.includes('weight loss pattern'));
        });

        this.runTest('Normal weight fluctuation', () => {
            const data = {
                weight: 25.2,
                recorded_date: '2024-01-15',
                previous_weights: [{ weight: 25.0, date: '2024-01-01' }]
            };
            const result = this.validator.validateWeightEntry(data, 'dog');
            return result.isValid && result.warnings.length === 0;
        });
    }

    // Dosage calculation tests
    testDosageCalculations() {
        console.log('Testing dosage calculations...');

        this.runTest('Rimadyl dosage - within range', () => {
            const result = this.validator.validateDosage('75mg', 'Rimadyl', 25);
            return result.isValid && result.warnings.length === 0;
        });

        this.runTest('Rimadyl dosage - above range', () => {
            const result = this.validator.validateDosage('125mg', 'Rimadyl', 25);
            return result.isValid && result.warnings.some(w => w.includes('above recommended range'));
        });

        this.runTest('Rimadyl dosage - below range', () => {
            const result = this.validator.validateDosage('25mg', 'Rimadyl', 25);
            return result.isValid && result.warnings.some(w => w.includes('below recommended range'));
        });

        this.runTest('Unknown medication - no validation', () => {
            const result = this.validator.validateDosage('50mg', 'Unknown Medicine', 25);
            return result.isValid && result.warnings.length === 0;
        });

        this.runTest('Invalid dosage format', () => {
            const result = this.validator.validateDosage('invalid dosage', 'Rimadyl', 25);
            return result.isValid && result.warnings.some(w => w.includes('Unable to parse'));
        });
    }

    // Test runner utility
    runTest(testName, testFunction) {
        this.testResults.total++;
        
        try {
            const passed = testFunction();
            if (passed) {
                this.testResults.passed++;
                console.log(`✅ ${testName}`);
                this.testResults.details.push({ name: testName, status: 'PASSED' });
            } else {
                this.testResults.failed++;
                console.log(`❌ ${testName}`);
                this.testResults.details.push({ name: testName, status: 'FAILED', error: 'Test assertion failed' });
            }
        } catch (error) {
            this.testResults.failed++;
            console.log(`❌ ${testName} - Error: ${error.message}`);
            this.testResults.details.push({ name: testName, status: 'ERROR', error: error.message });
        }
    }

    // Generate comprehensive test report
    generateTestReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total_tests: this.testResults.total,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                success_rate: ((this.testResults.passed / this.testResults.total) * 100).toFixed(2) + '%'
            },
            details: this.testResults.details,
            categories: {
                weight_validation: this.testResults.details.filter(t => t.name.toLowerCase().includes('weight')),
                medication_validation: this.testResults.details.filter(t => t.name.toLowerCase().includes('medication')),
                health_record_validation: this.testResults.details.filter(t => t.name.toLowerCase().includes('health record')),
                date_time_validation: this.testResults.details.filter(t => t.name.toLowerCase().includes('date') || t.name.toLowerCase().includes('time')),
                species_validation: this.testResults.details.filter(t => t.name.toLowerCase().includes('species')),
                trend_analysis: this.testResults.details.filter(t => t.name.toLowerCase().includes('trend')),
                dosage_calculations: this.testResults.details.filter(t => t.name.toLowerCase().includes('dosage'))
            }
        };

        console.log('\n📊 Test Report Summary:');
        console.log(`Total Tests: ${report.summary.total_tests}`);
        console.log(`Passed: ${report.summary.passed}`);
        console.log(`Failed: ${report.summary.failed}`);
        console.log(`Success Rate: ${report.summary.success_rate}`);

        if (this.testResults.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.details
                .filter(t => t.status !== 'PASSED')
                .forEach(test => {
                    console.log(`  - ${test.name}: ${test.error || 'Test assertion failed'}`);
                });
        }

        return report;
    }

    // Performance test for bulk validation
    performanceTest(recordCount = 1000) {
        console.log(`\n⚡ Running performance test with ${recordCount} records...`);
        
        // Generate test data
        const testData = [];
        for (let i = 0; i < recordCount; i++) {
            testData.push({
                weight: 20 + Math.random() * 10,
                recorded_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                body_condition_score: Math.floor(Math.random() * 9) + 1
            });
        }

        const startTime = performance.now();
        const result = this.validator.validateBulkHealthData(testData, 'dog');
        const endTime = performance.now();

        const duration = endTime - startTime;
        const recordsPerSecond = (recordCount / (duration / 1000)).toFixed(0);

        console.log(`Performance Results:`);
        console.log(`  - Duration: ${duration.toFixed(2)}ms`);
        console.log(`  - Records/second: ${recordsPerSecond}`);
        console.log(`  - Valid records: ${result.summary.valid_count}/${recordCount}`);
        console.log(`  - Invalid records: ${result.summary.invalid_count}/${recordCount}`);

        return {
            duration,
            recordsPerSecond,
            validationResults: result
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthDataValidationTests;
} else {
    window.HealthDataValidationTests = HealthDataValidationTests;
}