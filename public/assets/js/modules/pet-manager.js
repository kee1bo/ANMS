// Pet Management Module
class PetManager extends EventEmitter {
    constructor(apiClient, stateManager) {
        super();
        this.apiClient = apiClient;
        this.stateManager = stateManager;
    }

    async getUserPets() {
        try {
            const response = await this.apiClient.get('/pets');
            const pets = response.data.pets;
            
            this.stateManager.actions.setPets(pets);
            this.emit('petsLoaded', pets);
            
            return pets;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async getPet(petId) {
        try {
            const response = await this.apiClient.get(`/pets/${petId}`);
            const pet = response.data.pet;
            
            this.emit('petLoaded', pet);
            return pet;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async addPet(petData) {
        try {
            // Validate pet data
            this.validatePetData(petData);
            
            const response = await this.apiClient.post('/pets', petData);
            const pet = response.data.pet;
            
            this.stateManager.actions.addPet(pet);
            this.emit('petAdded', pet);
            
            return pet;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async updatePet(petId, updates) {
        try {
            this.validatePetData(updates, false);
            
            const response = await this.apiClient.put(`/pets/${petId}`, updates);
            const pet = response.data.pet;
            
            this.stateManager.actions.updatePet(petId, pet);
            this.emit('petUpdated', pet);
            
            return pet;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async deletePet(petId) {
        try {
            await this.apiClient.delete(`/pets/${petId}`);
            
            const pets = this.stateManager.getState().pets.filter(p => p.id !== petId);
            this.stateManager.actions.setPets(pets);
            this.emit('petDeleted', petId);
            
            return true;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async uploadPhoto(petId, formData) {
        try {
            const response = await this.apiClient.request(`/pets/${petId}/photo`, {
                method: 'POST',
                body: formData,
                headers: {} // Let browser set content-type for FormData
            });
            
            const photoUrl = response.data.photo_url;
            this.stateManager.actions.updatePet(petId, { photo_url: photoUrl });
            this.emit('photoUploaded', { petId, photoUrl });
            
            return photoUrl;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async logWeight(petId, weightData) {
        try {
            const healthData = {
                record_type: 'weight',
                recorded_date: weightData.recorded_date,
                numeric_value: weightData.weight,
                text_value: weightData.notes
            };
            
            const response = await this.apiClient.post(`/pets/${petId}/health`, healthData);
            const record = response.data.record;
            
            this.emit('weightLogged', { petId, record });
            return record;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async scheduleFeed(petId, feedingData) {
        try {
            const healthData = {
                record_type: 'feeding',
                recorded_date: new Date().toISOString().split('T')[0],
                recorded_time: feedingData.meal_time,
                json_data: {
                    food_type: feedingData.food_type,
                    portion_size: feedingData.portion_size,
                    notes: feedingData.feeding_notes
                }
            };
            
            const response = await this.apiClient.post(`/pets/${petId}/health`, healthData);
            const record = response.data.record;
            
            this.emit('feedingScheduled', { petId, record });
            return record;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async recordHealthCheckup(petId, checkupData) {
        try {
            const healthData = {
                record_type: 'vet_visit',
                recorded_date: checkupData.checkup_date,
                json_data: {
                    checkup_type: checkupData.checkup_type,
                    veterinarian: checkupData.veterinarian,
                    health_observations: checkupData.health_observations,
                    treatment_notes: checkupData.treatment_notes
                }
            };
            
            const response = await this.apiClient.post(`/pets/${petId}/health`, healthData);
            const record = response.data.record;
            
            this.emit('healthCheckupRecorded', { petId, record });
            return record;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async logHealthRecord(petId, healthData) {
        try {
            const response = await this.apiClient.post(`/pets/${petId}/health`, healthData);
            const record = response.data.record;
            
            this.emit('healthRecordAdded', { petId, record });
            return record;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async getHealthHistory(petId, dateRange = {}) {
        try {
            const params = new URLSearchParams(dateRange);
            const response = await this.apiClient.get(`/pets/${petId}/health?${params}`);
            const records = response.data.records;
            
            this.emit('healthHistoryLoaded', { petId, records });
            return records;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    validatePetData(data, isNew = true) {
        const errors = [];

        if (isNew && !data.name?.trim()) {
            errors.push('Pet name is required');
        }

        if (isNew && !data.species) {
            errors.push('Pet species is required');
        }

        if (data.current_weight && (isNaN(data.current_weight) || data.current_weight <= 0)) {
            errors.push('Weight must be a positive number');
        }

        if (data.date_of_birth && new Date(data.date_of_birth) > new Date()) {
            errors.push('Birth date cannot be in the future');
        }

        if (data.email && !this.isValidEmail(data.email)) {
            errors.push('Invalid email format');
        }

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Utility methods
    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return null;
        
        const birth = new Date(dateOfBirth);
        const today = new Date();
        const ageInMs = today - birth;
        const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
        
        return Math.floor(ageInYears * 10) / 10; // Round to 1 decimal place
    }

    getLifeStage(pet) {
        const age = this.calculateAge(pet.date_of_birth);
        if (!age) return 'unknown';

        switch (pet.species) {
            case 'dog':
                if (age < 1) return 'puppy';
                if (age < 7) return 'adult';
                return 'senior';
            case 'cat':
                if (age < 1) return 'kitten';
                if (age < 7) return 'adult';
                return 'senior';
            default:
                if (age < 1) return 'young';
                if (age < 5) return 'adult';
                return 'senior';
        }
    }

    formatWeight(weight, unit = 'kg') {
        if (!weight) return 'Not recorded';
        return `${weight} ${unit}`;
    }
}

// Export for module use
window.PetManager = PetManager;