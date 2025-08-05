/**
 * Nutrition Calculator Component
 * Handles nutrition calculations and meal planning for pets
 */

class NutritionCalculator {
    constructor() {
        this.currentPet = null;
        this.nutritionData = null;
        this.mealPlan = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadNutritionInterface();
    }

    bindEvents() {
        // Calculate nutrition button
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="calculate-nutrition"]')) {
                e.preventDefault();
                const petId = e.target.dataset.petId;
                this.calculateNutrition(petId);
            }
        });

        // Generate meal plan button
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="generate-meal-plan"]')) {
                e.preventDefault();
                this.generateMealPlan();
            }
        });

        // View nutrition details
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="view-nutrition-details"]')) {
                e.preventDefault();
                const petId = e.target.dataset.petId;
                this.showNutritionDetails(petId);
            }
        });

        // Save nutrition plan
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="save-nutrition-plan"]')) {
                e.preventDefault();
                this.saveNutritionPlan();
            }
        });
    }

    loadNutritionInterface() {
        // Add nutrition calculator to the nutrition tab
        const nutritionTab = document.getElementById('nutrition-tab');
        if (nutritionTab) {
            this.renderNutritionInterface(nutritionTab);
        }
    }

    renderNutritionInterface(container) {
        container.innerHTML = `
            <div class="nutrition-calculator">
                <div class="nutrition-header">
                    <h3><i class="fas fa-calculator"></i> Nutrition Calculator</h3>
                    <p>Calculate precise nutritional requirements for your pets based on veterinary guidelines</p>
                </div>

                <div class="nutrition-content">
                    <div class="pet-selector">
                        <h4>Select Pet for Nutrition Analysis</h4>
                        <div id="nutrition-pet-list" class="pet-selection-grid">
                            <div class="loading-state">
                                <i class="fas fa-spinner fa-spin"></i>
                                <p>Loading pets...</p>
                            </div>
                        </div>
                    </div>

                    <div id="nutrition-results" class="nutrition-results" style="display: none;">
                        <!-- Nutrition results will be displayed here -->
                    </div>

                    <div id="meal-plan-section" class="meal-plan-section" style="display: none;">
                        <!-- Meal plan will be displayed here -->
                    </div>
                </div>
            </div>
        `;

        this.loadPetsForNutrition();
    }

    async loadPetsForNutrition() {
        try {
            const response = await fetch('/api-bridge.php?action=get_pets', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success && data.pets) {
                this.renderPetSelection(data.pets);
            } else {
                this.showError('Failed to load pets');
            }
        } catch (error) {
            console.error('Error loading pets:', error);
            this.showError('Error loading pets');
        }
    }

    renderPetSelection(pets) {
        const container = document.getElementById('nutrition-pet-list');
        
        if (pets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-paw"></i>
                    <h4>No pets found</h4>
                    <p>Add a pet first to calculate nutrition requirements</p>
                    <button class="btn btn-primary" onclick="showAddPet()">
                        <i class="fas fa-plus"></i> Add Pet
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = pets.map(pet => `
            <div class="pet-card nutrition-pet-card" data-pet-id="${pet.id}">
                <div class="pet-photo">
                    ${pet.photo || '🐾'}
                </div>
                <div class="pet-info">
                    <h4>${pet.name}</h4>
                    <p>${pet.species} • ${pet.breed || 'Mixed'}</p>
                    <p>${pet.age} years • ${pet.weight}kg</p>
                    <p>Activity: ${pet.activity_level}</p>
                </div>
                <div class="pet-actions">
                    <button class="btn btn-primary btn-sm" 
                            data-action="calculate-nutrition" 
                            data-pet-id="${pet.id}">
                        <i class="fas fa-calculator"></i> Calculate
                    </button>
                </div>
            </div>
        `).join('');
    }

    async calculateNutrition(petId) {
        try {
            // Get pet data
            const petResponse = await fetch(`/api-bridge.php?action=get_pets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pet_id: petId })
            });

            const petData = await petResponse.json();
            if (!petData.success) {
                throw new Error('Failed to load pet data');
            }

            const pet = petData.pet;
            this.currentPet = pet;

            // Show loading state
            this.showLoadingState('Calculating nutrition requirements...');

            // Calculate nutrition
            const nutritionResponse = await fetch('/api-bridge.php?action=nutrition_calculator', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'calculate_nutrition',
                    pet_id: pet.id,
                    weight: parseFloat(pet.weight),
                    species: pet.species.toLowerCase(),
                    age: parseFloat(pet.age),
                    activity_level: pet.activity_level.toLowerCase(),
                    breed: pet.breed
                })
            });

            const nutritionData = await nutritionResponse.json();
            
            if (nutritionData.success) {
                this.nutritionData = nutritionData.data;
                this.displayNutritionResults();
            } else {
                throw new Error(nutritionData.error || 'Failed to calculate nutrition');
            }

        } catch (error) {
            console.error('Error calculating nutrition:', error);
            this.showError('Failed to calculate nutrition: ' + error.message);
        }
    }

    displayNutritionResults() {
        const resultsContainer = document.getElementById('nutrition-results');
        const data = this.nutritionData;
        
        resultsContainer.innerHTML = `
            <div class="nutrition-results-content">
                <div class="results-header">
                    <h4><i class="fas fa-chart-pie"></i> Nutrition Analysis for ${this.currentPet.name}</h4>
                    <div class="pet-summary">
                        <span class="pet-detail">${this.currentPet.species}</span>
                        <span class="pet-detail">${this.currentPet.weight}kg</span>
                        <span class="pet-detail">${this.currentPet.age} years</span>
                        <span class="pet-detail">${this.currentPet.activity_level} activity</span>
                    </div>
                </div>

                <div class="nutrition-cards">
                    <div class="nutrition-card calories-card">
                        <div class="card-icon">
                            <i class="fas fa-fire"></i>
                        </div>
                        <div class="card-content">
                            <h5>Daily Calories</h5>
                            <div class="calorie-breakdown">
                                <div class="main-value">${data.calories.der} kcal/day</div>
                                <div class="sub-values">
                                    <span>RER: ${data.calories.rer} kcal</span>
                                    <span>Method: ${data.calories.calculation_method}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="nutrition-card macros-card">
                        <div class="card-icon">
                            <i class="fas fa-balance-scale"></i>
                        </div>
                        <div class="card-content">
                            <h5>Macronutrients</h5>
                            <div class="macro-breakdown">
                                <div class="macro-item">
                                    <span class="macro-label">Protein</span>
                                    <span class="macro-value">${data.macronutrients.protein_grams}g (${data.macronutrients.protein_percentage}%)</span>
                                </div>
                                <div class="macro-item">
                                    <span class="macro-label">Fat</span>
                                    <span class="macro-value">${data.macronutrients.fat_grams}g (${data.macronutrients.fat_percentage}%)</span>
                                </div>
                                <div class="macro-item">
                                    <span class="macro-label">Carbs</span>
                                    <span class="macro-value">${data.macronutrients.carbohydrate_grams}g (${data.macronutrients.carbohydrate_percentage}%)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="nutrition-card validation-card">
                        <div class="card-icon">
                            <i class="fas fa-check-circle ${data.validation.is_valid ? 'text-success' : 'text-warning'}"></i>
                        </div>
                        <div class="card-content">
                            <h5>Validation</h5>
                            <div class="validation-status">
                                <span class="status ${data.validation.is_valid ? 'valid' : 'warning'}">
                                    ${data.validation.is_valid ? 'All calculations valid' : 'Review recommended'}
                                </span>
                                ${data.validation.warnings.length > 0 ? `
                                    <div class="warnings">
                                        ${data.validation.warnings.map(warning => `
                                            <div class="warning-item">
                                                <i class="fas fa-exclamation-triangle"></i>
                                                ${warning}
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                ${data.validation.recommendations.length > 0 ? `
                    <div class="recommendations-section">
                        <h5><i class="fas fa-lightbulb"></i> Recommendations</h5>
                        <ul class="recommendations-list">
                            ${data.validation.recommendations.map(rec => `
                                <li><i class="fas fa-check"></i> ${rec}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                <div class="results-actions">
                    <button class="btn btn-primary" data-action="generate-meal-plan">
                        <i class="fas fa-utensils"></i> Generate Meal Plan
                    </button>
                    <button class="btn btn-outline" data-action="save-nutrition-plan">
                        <i class="fas fa-save"></i> Save Plan
                    </button>
                    <button class="btn btn-outline" onclick="window.print()">
                        <i class="fas fa-print"></i> Print Results
                    </button>
                </div>
            </div>
        `;

        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    async generateMealPlan() {
        if (!this.nutritionData || !this.currentPet) {
            this.showError('Please calculate nutrition first');
            return;
        }

        try {
            this.showLoadingState('Generating meal plan...');

            const response = await fetch('/api-bridge.php?action=nutrition_calculator', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'generate_meal_plan',
                    pet_data: this.currentPet,
                    nutrition_requirements: this.nutritionData.calories
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.mealPlan = data.data.meal_plan;
                this.displayMealPlan();
            } else {
                throw new Error(data.error || 'Failed to generate meal plan');
            }

        } catch (error) {
            console.error('Error generating meal plan:', error);
            this.showError('Failed to generate meal plan: ' + error.message);
        }
    }

    displayMealPlan() {
        const mealPlanContainer = document.getElementById('meal-plan-section');
        const plan = this.mealPlan;
        
        mealPlanContainer.innerHTML = `
            <div class="meal-plan-content">
                <div class="meal-plan-header">
                    <h4><i class="fas fa-utensils"></i> Meal Plan for ${this.currentPet.name}</h4>
                    <div class="plan-summary">
                        <span>${plan.meals_per_day} meals per day</span>
                        <span>${plan.calories_per_meal} kcal per meal</span>
                        <span>${plan.total_daily_calories} kcal total</span>
                    </div>
                </div>

                <div class="meal-schedule">
                    <h5>Daily Feeding Schedule</h5>
                    <div class="schedule-grid">
                        ${plan.meal_schedule.map((time, index) => `
                            <div class="meal-time-card">
                                <div class="meal-number">Meal ${index + 1}</div>
                                <div class="meal-time">${time}</div>
                                <div class="meal-calories">${plan.calories_per_meal} kcal</div>
                                <div class="portion-guide">
                                    <small>~${plan.portion_guidance.dry_food_cups} cups dry food</small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="feeding-guidelines">
                    <h5>Feeding Guidelines</h5>
                    <div class="guidelines-grid">
                        ${Object.entries(plan.feeding_guidelines).map(([key, value]) => `
                            <div class="guideline-item">
                                <strong>${key.replace('_', ' ').toUpperCase()}:</strong>
                                <span>${value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="portion-guidance-section">
                    <h5>Portion Guidance</h5>
                    <div class="portion-cards">
                        <div class="portion-card">
                            <i class="fas fa-bowl-food"></i>
                            <h6>Dry Food</h6>
                            <span>${plan.portion_guidance.dry_food_cups} cups per meal</span>
                        </div>
                        <div class="portion-card">
                            <i class="fas fa-can-food"></i>
                            <h6>Wet Food</h6>
                            <span>${plan.portion_guidance.wet_food_cans} cans per meal</span>
                        </div>
                    </div>
                    <p class="portion-note">
                        <i class="fas fa-info-circle"></i>
                        ${plan.portion_guidance.note}
                    </p>
                </div>

                <div class="meal-plan-actions">
                    <button class="btn btn-primary" data-action="save-nutrition-plan">
                        <i class="fas fa-save"></i> Save Meal Plan
                    </button>
                    <button class="btn btn-outline" onclick="window.print()">
                        <i class="fas fa-print"></i> Print Meal Plan
                    </button>
                </div>
            </div>
        `;

        mealPlanContainer.style.display = 'block';
        mealPlanContainer.scrollIntoView({ behavior: 'smooth' });
    }

    async saveNutritionPlan() {
        if (!this.nutritionData || !this.currentPet) {
            this.showError('No nutrition data to save');
            return;
        }

        try {
            // The nutrition plan is already saved when calculated
            // This could trigger additional actions like notifications
            this.showSuccess('Nutrition plan saved successfully!');
            
            // Update the pet's nutrition status in the UI
            this.updatePetNutritionStatus(this.currentPet.id);
            
        } catch (error) {
            console.error('Error saving nutrition plan:', error);
            this.showError('Failed to save nutrition plan');
        }
    }

    updatePetNutritionStatus(petId) {
        // Update any pet cards to show they have nutrition plans
        const petCards = document.querySelectorAll(`[data-pet-id="${petId}"]`);
        petCards.forEach(card => {
            const statusIndicator = card.querySelector('.nutrition-status') || document.createElement('div');
            statusIndicator.className = 'nutrition-status';
            statusIndicator.innerHTML = '<i class="fas fa-check-circle text-success"></i> Nutrition Plan Active';
            
            if (!card.querySelector('.nutrition-status')) {
                card.appendChild(statusIndicator);
            }
        });
    }

    showLoadingState(message) {
        const resultsContainer = document.getElementById('nutrition-results');
        resultsContainer.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>${message}</p>
            </div>
        `;
        resultsContainer.style.display = 'block';
    }

    showError(message) {
        const resultsContainer = document.getElementById('nutrition-results');
        resultsContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Error</h4>
                <p>${message}</p>
                <button class="btn btn-outline" onclick="location.reload()">
                    <i class="fas fa-refresh"></i> Try Again
                </button>
            </div>
        `;
        resultsContainer.style.display = 'block';
    }

    showSuccess(message) {
        // Create a temporary success notification
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize nutrition calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('nutrition-tab')) {
        window.nutritionCalculator = new NutritionCalculator();
    }
});