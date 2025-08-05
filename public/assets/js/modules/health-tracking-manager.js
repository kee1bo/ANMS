// Health Tracking Manager - Manages health data and analytics
class HealthTrackingManager {
    constructor(apiClient, stateManager) {
        this.apiClient = apiClient;
        this.stateManager = stateManager;
        this.eventListeners = {};
    }

    // Event system
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }

    // Health Data Management
    async getHealthData(petId, dateRange = '30') {
        try {
            const response = await this.apiClient.get(`/pets/${petId}/health`, {
                date_range: dateRange
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching health data:', error);
            throw new Error('Failed to fetch health data');
        }
    }

    async logWeight(petId, weightData) {
        try {
            const response = await this.apiClient.post(`/pets/${petId}/health/weight`, weightData);
            this.emit('weightLogged', { petId, data: response.data });
            return response.data;
        } catch (error) {
            console.error('Error logging weight:', error);
            throw new Error('Failed to log weight');
        }
    }

    async logVitals(petId, vitalsData) {
        try {
            const response = await this.apiClient.post(`/pets/${petId}/health/vitals`, vitalsData);
            this.emit('vitalsLogged', { petId, data: response.data });
            return response.data;
        } catch (error) {
            console.error('Error logging vitals:', error);
            throw new Error('Failed to log vital signs');
        }
    }

    async logActivity(petId, activityData) {
        try {
            const response = await this.apiClient.post(`/pets/${petId}/health/activity`, activityData);
            this.emit('activityLogged', { petId, data: response.data });
            return response.data;
        } catch (error) {
            console.error('Error logging activity:', error);
            throw new Error('Failed to log activity');
        }
    }

    async addMedication(petId, medicationData) {
        try {
            const response = await this.apiClient.post(`/pets/${petId}/medications`, medicationData);
            this.emit('medicationAdded', { petId, data: response.data });
            return response.data;
        } catch (error) {
            console.error('Error adding medication:', error);
            throw new Error('Failed to add medication');
        }
    }

    async updateMedication(petId, medicationId, medicationData) {
        try {
            const response = await this.apiClient.put(`/pets/${petId}/medications/${medicationId}`, medicationData);
            this.emit('medicationUpdated', { petId, medicationId, data: response.data });
            return response.data;
        } catch (error) {
            console.error('Error updating medication:', error);
            throw new Error('Failed to update medication');
        }
    }

    async logMedicationAdministration(petId, medicationId, administrationData) {
        try {
            const response = await this.apiClient.post(`/pets/${petId}/medications/${medicationId}/administration`, administrationData);
            this.emit('medicationAdministered', { petId, medicationId, data: response.data });
            return response.data;
        } catch (error) {
            console.error('Error logging medication administration:', error);
            throw new Error('Failed to log medication administration');
        }
    }

    async addHealthRecord(petId, recordData) {
        try {
            const response = await this.apiClient.post(`/pets/${petId}/health/records`, recordData);
            this.emit('healthRecordAdded', { petId, data: response.data });
            return response.data;
        } catch (error) {
            console.error('Error adding health record:', error);
            throw new Error('Failed to add health record');
        }
    }

    async getHealthRecords(petId, filters = {}) {
        try {
            const response = await this.apiClient.get(`/pets/${petId}/health/records`, filters);
            return response.data;
        } catch (error) {
            console.error('Error fetching health records:', error);
            throw new Error('Failed to fetch health records');
        }
    }

    async getHealthAlerts(petId) {
        try {
            const response = await this.apiClient.get(`/pets/${petId}/health/alerts`);
            return response.data;
        } catch (error) {
            console.error('Error fetching health alerts:', error);
            throw new Error('Failed to fetch health alerts');
        }
    }

    async dismissHealthAlert(petId, alertId) {
        try {
            const response = await this.apiClient.delete(`/pets/${petId}/health/alerts/${alertId}`);
            this.emit('healthAlertDismissed', { petId, alertId });
            return response.data;
        } catch (error) {
            console.error('Error dismissing health alert:', error);
            throw new Error('Failed to dismiss health alert');
        }
    }

    // Analytics and Reports
    async getWeightTrends(petId, period = '6months') {
        try {
            const response = await this.apiClient.get(`/pets/${petId}/health/weight/trends`, {
                period: period
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching weight trends:', error);
            throw new Error('Failed to fetch weight trends');
        }
    }

    async getVitalsTrends(petId, metric, period = '3months') {
        try {
            const response = await this.apiClient.get(`/pets/${petId}/health/vitals/trends`, {
                metric: metric,
                period: period
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching vitals trends:', error);
            throw new Error('Failed to fetch vitals trends');
        }
    }

    async generateHealthReport(petId, reportType = 'comprehensive', dateRange = '30') {
        try {
            const response = await this.apiClient.post(`/pets/${petId}/health/reports`, {
                type: reportType,
                date_range: dateRange
            });
            return response.data;
        } catch (error) {
            console.error('Error generating health report:', error);
            throw new Error('Failed to generate health report');
        }
    }

    async exportHealthData(petId, format = 'pdf', dateRange = 'all') {
        try {
            const response = await this.apiClient.post(`/pets/${petId}/health/export`, {
                format: format,
                date_range: dateRange
            });
            
            // Handle file download
            if (response.data.download_url) {
                window.open(response.data.download_url, '_blank');
            }
            
            return response.data;
        } catch (error) {
            console.error('Error exporting health data:', error);
            throw new Error('Failed to export health data');
        }
    }

    // Health Goals and Tracking
    async setHealthGoals(petId, goals) {
        try {
            const response = await this.apiClient.post(`/pets/${petId}/health/goals`, goals);
            this.emit('healthGoalsSet', { petId, goals: response.data });
            return response.data;
        } catch (error) {
            console.error('Error setting health goals:', error);
            throw new Error('Failed to set health goals');
        }
    }

    async getHealthGoals(petId) {
        try {
            const response = await this.apiClient.get(`/pets/${petId}/health/goals`);
            return response.data;
        } catch (error) {
            console.error('Error fetching health goals:', error);
            throw new Error('Failed to fetch health goals');
        }
    }

    async updateHealthGoals(petId, goalId, goalData) {
        try {
            const response = await this.apiClient.put(`/pets/${petId}/health/goals/${goalId}`, goalData);
            this.emit('healthGoalUpdated', { petId, goalId, data: response.data });
            return response.data;
        } catch (error) {
            console.error('Error updating health goal:', error);
            throw new Error('Failed to update health goal');
        }
    }

    // Medication Management
    async getMedications(petId) {
        try {
            const response = await this.apiClient.get(`/pets/${petId}/medications`);
            return response.data;
        } catch (error) {
            console.error('Error fetching medications:', error);
            throw new Error('Failed to fetch medications');
        }
    }

    async getMedicationSchedule(petId, dateRange = '7') {
        try {
            const response = await this.apiClient.get(`/pets/${petId}/medications/schedule`, {
                date_range: dateRange
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching medication schedule:', error);
            throw new Error('Failed to fetch medication schedule');
        }
    }

    async getMedicationHistory(petId, medicationId = null, dateRange = '30') {
        try {
            const params = { date_range: dateRange };
            if (medicationId) {
                params.medication_id = medicationId;
            }
            
            const response = await this.apiClient.get(`/pets/${petId}/medications/history`, params);
            return response.data;
        } catch (error) {
            console.error('Error fetching medication history:', error);
            throw new Error('Failed to fetch medication history');
        }
    }

    // Utility Methods
    calculateBMI(pet) {
        if (!pet.current_weight || !pet.ideal_weight) {
            return null;
        }
        
        const currentWeight = parseFloat(pet.current_weight);
        const idealWeight = parseFloat(pet.ideal_weight);
        
        // Simple BMI calculation for pets (weight ratio)
        return (currentWeight / idealWeight) * 100;
    }

    getWeightStatus(pet) {
        const bmi = this.calculateBMI(pet);
        if (!bmi) return 'unknown';
        
        if (bmi < 85) return 'underweight';
        if (bmi > 115) return 'overweight';
        return 'ideal';
    }

    calculateDailyCalorieNeeds(pet) {
        if (!pet.current_weight) return null;
        
        const weight = parseFloat(pet.current_weight);
        let baseCalories;
        
        // Resting Energy Requirement (RER) calculation
        switch (pet.species) {
            case 'dog':
                baseCalories = 70 * Math.pow(weight, 0.75);
                break;
            case 'cat':
                baseCalories = 70 * Math.pow(weight, 0.67);
                break;
            default:
                baseCalories = 70 * Math.pow(weight, 0.75);
        }
        
        // Activity level multipliers
        const activityMultipliers = {
            low: 1.2,
            moderate: 1.6,
            high: 2.0
        };
        
        const multiplier = activityMultipliers[pet.activity_level] || 1.6;
        return Math.round(baseCalories * multiplier);
    }

    isVitalSignNormal(pet, vitalType, value) {
        const normalRanges = {
            dog: {
                temperature: { min: 38.3, max: 39.2 },
                heart_rate: { min: 60, max: 140 },
                respiratory_rate: { min: 10, max: 30 }
            },
            cat: {
                temperature: { min: 38.0, max: 39.2 },
                heart_rate: { min: 140, max: 220 },
                respiratory_rate: { min: 20, max: 30 }
            }
        };
        
        const species = pet.species || 'dog';
        const range = normalRanges[species]?.[vitalType];
        
        if (!range) return null;
        
        return value >= range.min && value <= range.max;
    }

    formatHealthMetric(value, type) {
        if (value === null || value === undefined) return 'N/A';
        
        switch (type) {
            case 'weight':
                return `${parseFloat(value).toFixed(1)} kg`;
            case 'temperature':
                return `${parseFloat(value).toFixed(1)} °C`;
            case 'heart_rate':
            case 'respiratory_rate':
                return `${parseInt(value)} bpm`;
            case 'calories':
                return `${parseInt(value)} kcal`;
            default:
                return value.toString();
        }
    }

    // Mock data generators for development
    generateMockHealthData(petId) {
        return {
            weight: {
                current: 25.5,
                ideal: 24.0,
                trend: 'stable',
                last_weighed: '2024-01-10',
                entries: this.generateMockWeightEntries()
            },
            vitals: {
                temperature: 38.7,
                heart_rate: 85,
                respiratory_rate: 22,
                last_checked: '2024-01-08'
            },
            activity: {
                daily_exercise: '45 minutes',
                last_activity: '2024-01-10',
                progress: 75
            },
            medications: this.generateMockMedications(),
            alerts: this.generateMockHealthAlerts(),
            records: this.generateMockHealthRecords()
        };
    }

    generateMockWeightEntries() {
        const entries = [];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        
        let currentWeight = 25.5;
        for (let i = 0; i < 12; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + (i * 7));
            
            const previousWeight = i > 0 ? entries[i-1].weight : currentWeight;
            currentWeight += (Math.random() - 0.5) * 0.3;
            currentWeight = Math.max(23, Math.min(27, currentWeight));
            
            entries.push({
                date: date.toISOString().split('T')[0],
                weight: Math.round(currentWeight * 10) / 10,
                change: Math.round((currentWeight - previousWeight) * 10) / 10,
                notes: i % 3 === 0 ? 'Regular checkup' : ''
            });
        }
        
        return entries;
    }

    generateMockMedications() {
        return [
            {
                id: 1,
                name: 'Heartgard Plus',
                dosage: '1 tablet',
                frequency: 'once_monthly',
                start_date: '2024-01-01',
                end_date: null,
                status: 'active',
                next_dose: '2024-02-01 08:00'
            },
            {
                id: 2,
                name: 'Glucosamine',
                dosage: '500mg',
                frequency: 'twice_daily',
                start_date: '2023-12-15',
                end_date: null,
                status: 'active',
                next_dose: '2024-01-11 20:00'
            }
        ];
    }

    generateMockHealthAlerts() {
        return [
            {
                id: 1,
                title: 'Vaccination Due',
                message: 'Annual vaccination is due in 2 weeks',
                severity: 'medium',
                created_at: '2024-01-05'
            }
        ];
    }

    generateMockHealthRecords() {
        return [
            {
                id: 1,
                title: 'Annual Checkup',
                type: 'vet_visit',
                date: '2024-01-05',
                provider: 'Dr. Smith - ABC Animal Hospital',
                description: 'Routine annual examination. Overall health is good.',
                has_attachments: false
            },
            {
                id: 2,
                title: 'Rabies Vaccination',
                type: 'vaccination',
                date: '2024-01-05',
                provider: 'Dr. Smith - ABC Animal Hospital',
                description: 'Annual rabies vaccination administered.',
                has_attachments: true
            }
        ];
    }
}