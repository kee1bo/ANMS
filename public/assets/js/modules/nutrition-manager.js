// Nutrition Management Module
class NutritionManager extends EventEmitter {
    constructor(apiClient, stateManager) {
        super();
        this.apiClient = apiClient;
        this.stateManager = stateManager;
    }

    async generatePlan(petId, preferences = {}) {
        return this.generateNutritionPlan(petId, preferences);
    }

    async savePlan(petId, plan) {
        try {
            const response = await this.apiClient.post(`/pets/${petId}/nutrition-plan/save`, plan);
            const savedPlan = response.data.plan;
            
            // Update state
            const nutritionPlans = { 
                ...this.stateManager.getState().nutritionPlans,
                [petId]: savedPlan 
            };
            this.stateManager.setState({ nutritionPlans });
            
            this.emit('planSaved', { petId, plan: savedPlan });
            return savedPlan;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async generateNutritionPlan(petId, preferences = {}) {
        try {
            const response = await this.apiClient.post(`/pets/${petId}/nutrition-plan`, preferences);
            const plan = response.data.plan;
            
            // Update state with new plan
            const nutritionPlans = { 
                ...this.stateManager.getState().nutritionPlans,
                [petId]: plan 
            };
            this.stateManager.setState({ nutritionPlans });
            
            this.emit('planGenerated', { petId, plan });
            return plan;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async getNutritionPlan(petId) {
        try {
            const response = await this.apiClient.get(`/pets/${petId}/nutrition-plan`);
            const plan = response.data.plan;
            
            this.emit('planLoaded', { petId, plan });
            return plan;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async updateNutritionPlan(petId, planId, updates) {
        try {
            const response = await this.apiClient.put(`/nutrition-plans/${planId}`, updates);
            const plan = response.data.plan;
            
            // Update state
            const nutritionPlans = { 
                ...this.stateManager.getState().nutritionPlans,
                [petId]: plan 
            };
            this.stateManager.setState({ nutritionPlans });
            
            this.emit('planUpdated', { petId, plan });
            return plan;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async getFoodRecommendations(petId, filters = {}) {
        try {
            const params = new URLSearchParams(filters);
            const response = await this.apiClient.get(`/pets/${petId}/food-recommendations?${params}`);
            const recommendations = response.data.recommendations;
            
            this.emit('recommendationsLoaded', { petId, recommendations });
            return recommendations;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async searchFoodItems(query, filters = {}) {
        try {
            const params = new URLSearchParams({ query, ...filters });
            const response = await this.apiClient.get(`/food-items/search?${params}`);
            const foodItems = response.data.food_items;
            
            this.emit('foodItemsLoaded', foodItems);
            return foodItems;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async logFeeding(petId, feedingData) {
        try {
            const response = await this.apiClient.post(`/pets/${petId}/feeding`, feedingData);
            const feeding = response.data.feeding;
            
            this.emit('feedingLogged', { petId, feeding });
            return feeding;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async getFeedingHistory(petId, dateRange = {}) {
        try {
            const params = new URLSearchParams(dateRange);
            const response = await this.apiClient.get(`/pets/${petId}/feeding-history?${params}`);
            const history = response.data.history;
            
            this.emit('feedingHistoryLoaded', { petId, history });
            return history;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    // Nutrition calculation utilities
    calculateDailyCalories(pet) {
        if (!pet.current_weight) return null;

        const weight = parseFloat(pet.current_weight);
        let baseCalories;

        // Basic metabolic rate calculation
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

        // Activity level multiplier
        const activityMultipliers = {
            low: 1.2,
            moderate: 1.6,
            high: 2.0
        };

        const multiplier = activityMultipliers[pet.activity_level] || 1.6;
        return Math.round(baseCalories * multiplier);
    }

    calculatePortionSize(foodItem, targetCalories) {
        if (!foodItem.calories_per_100g || !targetCalories) return null;
        
        const portionGrams = (targetCalories / foodItem.calories_per_100g) * 100;
        return Math.round(portionGrams);
    }

    validateNutritionalBalance(plan) {
        const issues = [];

        // Check protein levels
        if (plan.daily_protein_grams) {
            const proteinPercentage = (plan.daily_protein_grams * 4 / plan.daily_calories) * 100;
            if (proteinPercentage < 18) {
                issues.push('Protein level may be too low');
            }
            if (proteinPercentage > 35) {
                issues.push('Protein level may be too high');
            }
        }

        // Check fat levels
        if (plan.daily_fat_grams) {
            const fatPercentage = (plan.daily_fat_grams * 9 / plan.daily_calories) * 100;
            if (fatPercentage < 5) {
                issues.push('Fat level may be too low');
            }
            if (fatPercentage > 20) {
                issues.push('Fat level may be too high');
            }
        }

        return {
            isBalanced: issues.length === 0,
            issues
        };
    }

    formatNutritionalInfo(plan) {
        if (!plan) return null;

        return {
            calories: `${plan.daily_calories} kcal/day`,
            protein: plan.daily_protein_grams ? `${plan.daily_protein_grams}g` : 'Not specified',
            fat: plan.daily_fat_grams ? `${plan.daily_fat_grams}g` : 'Not specified',
            carbs: plan.daily_carb_grams ? `${plan.daily_carb_grams}g` : 'Not specified',
            fiber: plan.daily_fiber_grams ? `${plan.daily_fiber_grams}g` : 'Not specified',
            mealsPerDay: plan.meals_per_day || 2
        };
    }

    generateMealSchedule(mealsPerDay = 2) {
        const schedules = {
            1: ['08:00'],
            2: ['08:00', '18:00'],
            3: ['08:00', '13:00', '18:00'],
            4: ['07:00', '12:00', '17:00', '21:00']
        };

        return schedules[mealsPerDay] || schedules[2];
    }
}

// Export for module use
window.NutritionManager = NutritionManager;