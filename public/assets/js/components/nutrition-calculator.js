/**
 * Nutrition Calculator Component
 * Calculates daily nutrition requirements for pets based on veterinary guidelines
 */
class NutritionCalculator {
    constructor() {
        this.currentPet = null;
        this.nutritionData = null;
        this.init();
    }

    init() {
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Listen for nutrition calculation requests
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="calculate-nutrition"]')) {
                const petId = e.target.dataset.petId;
                this.showNutritionCalculator(petId);
            }
        });
    }

    async loadNutritionInterface() {
        try {
            // Get pets list first
            const petsResponse = await fetch('/api/pets.php');
            const petsData = await petsResponse.json();
            
            if (!petsData.success || !petsData.pets || petsData.pets.length === 0) {
                this.showNoPetsMessage();
                return;
            }

            this.showPetSelector(petsData.pets);
        } catch (error) {
            console.error('Error loading nutrition interface:', error);
            this.showError('Failed to load nutrition calculator');
        }
    }

    showPetSelector(pets) {
        const nutritionPlans = document.getElementById('nutrition-plans');
        if (!nutritionPlans) return;

        nutritionPlans.innerHTML = `
            <div class="nutrition-calculator-container">
                <div class="calculator-header">
                    <h3><i class="fas fa-calculator"></i> Nutrition Calculator</h3>
                    <p>Select a pet to calculate their daily nutrition requirements</p>
                </div>
                
                <div class="pet-selector-grid">
                    ${pets.map(pet => `
                        <div class="pet-selector-card" onclick="nutritionCalculator.calculateForPet(${pet.id})">
                            <div class="pet-avatar">
                                <i class="fas ${this.getPetIcon(pet.species)}"></i>
                            </div>
                            <div class="pet-info">
                                <h4>${pet.name}</h4>
                                <p>${pet.breed || pet.species} • ${pet.age || 'Unknown age'} years</p>
                                <div class="pet-stats">
                                    <span class="stat">
                                        <i class="fas fa-weight"></i>
                                        ${pet.weight || pet.current_weight || 'Unknown'} kg
                                    </span>
                                    <span class="stat">
                                        <i class="fas fa-running"></i>
                                        ${pet.activity_level || 'Medium'}
                                    </span>
                                </div>
                            </div>
                            <div class="calculate-btn">
                                <i class="fas fa-calculator"></i>
                                Calculate
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    async calculateForPet(petId) {
        try {
            // Get pet details
            const response = await fetch(`/api/pets.php?id=${petId}`);
            const data = await response.json();
            
            if (!data.success || !data.pet) {
                throw new Error('Pet not found');
            }

            this.currentPet = data.pet;
            this.showCalculationForm();
        } catch (error) {
            console.error('Error loading pet data:', error);
            this.showError('Failed to load pet information');
        }
    }

    showCalculationForm() {
        const nutritionPlans = document.getElementById('nutrition-plans');
        if (!nutritionPlans) return;

        const pet = this.currentPet;
        
        nutritionPlans.innerHTML = `
            <div class="nutrition-calculator-form">
                <div class="calculator-header">
                    <button class="back-btn" onclick="nutritionCalculator.loadNutritionInterface()">
                        <i class="fas fa-arrow-left"></i> Back to Pet Selection
                    </button>
                    <div class="selected-pet">
                        <div class="pet-avatar">
                            <i class="fas ${this.getPetIcon(pet.species)}"></i>
                        </div>
                        <div class="pet-details">
                            <h3>${pet.name}</h3>
                            <p>${pet.breed || pet.species} • ${pet.age || 'Unknown age'} years</p>
                        </div>
                    </div>
                </div>

                <form id="nutrition-form" class="nutrition-form" aria-label="Nutrition Calculator Form">
                    <div class="form-sections">
                        <!-- Current Information -->
                        <div class="form-section">
                            <h4><i class="fas fa-info-circle"></i> Current Information</h4>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">Current Weight (kg)</label>
                                    <input type="number" name="current_weight" class="form-input" 
                                           value="${pet.weight || pet.current_weight || ''}" 
                                           step="0.1" min="0.1" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Ideal Weight (kg)</label>
                                    <input type="number" name="ideal_weight" class="form-input" 
                                           value="${pet.ideal_weight || ''}" 
                                           step="0.1" min="0.1">
                                    <div class="field-help">Leave blank to use current weight</div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Age (years)</label>
                                    <input type="number" name="age" class="form-input" 
                                           value="${pet.age || ''}" 
                                           step="0.1" min="0.1" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Activity Level</label>
                                    <select name="activity_level" class="form-select" required>
                                        <option value="low" ${pet.activity_level === 'low' ? 'selected' : ''}>Low - Sedentary, minimal exercise</option>
                                        <option value="medium" ${pet.activity_level === 'medium' ? 'selected' : ''}>Medium - Regular walks and play</option>
                                        <option value="high" ${pet.activity_level === 'high' ? 'selected' : ''}>High - Very active, lots of exercise</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Health Factors -->
                        <div class="form-section">
                            <h4><i class="fas fa-heartbeat"></i> Health Factors</h4>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">Body Condition</label>
                                    <select name="body_condition" class="form-select">
                                        <option value="underweight">Underweight (BCS 1-3)</option>
                                        <option value="ideal" selected>Ideal Weight (BCS 4-5)</option>
                                        <option value="overweight">Overweight (BCS 6-7)</option>
                                        <option value="obese">Obese (BCS 8-9)</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Life Stage</label>
                                    <select name="life_stage" class="form-select" required>
                                        <option value="puppy" ${pet.age < 1 ? 'selected' : ''}>Puppy/Kitten (< 1 year)</option>
                                        <option value="adult" ${pet.age >= 1 && pet.age < 7 ? 'selected' : ''}>Adult (1-7 years)</option>
                                        <option value="senior" ${pet.age >= 7 ? 'selected' : ''}>Senior (7+ years)</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Spay/Neuter Status</label>
                                    <select name="spay_neuter" class="form-select">
                                        <option value="intact">Intact</option>
                                        <option value="altered" selected>Spayed/Neutered</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Special Conditions</label>
                                    <select name="special_condition" class="form-select">
                                        <option value="none">None</option>
                                        <option value="pregnant">Pregnant</option>
                                        <option value="lactating">Lactating</option>
                                        <option value="recovering">Recovering from illness</option>
                                        <option value="diabetic">Diabetic</option>
                                        <option value="kidney">Kidney disease</option>
                                        <option value="heart">Heart disease</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Environmental Factors -->
                        <div class="form-section">
                            <h4><i class="fas fa-thermometer-half"></i> Environmental Factors</h4>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">Climate</label>
                                    <select name="climate" class="form-select">
                                        <option value="temperate" selected>Temperate (15-25°C)</option>
                                        <option value="cold">Cold (< 15°C)</option>
                                        <option value="hot">Hot (> 25°C)</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Housing</label>
                                    <select name="housing" class="form-select">
                                        <option value="indoor" selected>Indoor</option>
                                        <option value="outdoor">Outdoor</option>
                                        <option value="mixed">Indoor/Outdoor</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="nutritionCalculator.loadNutritionInterface()">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-calculator"></i> Calculate Nutrition
                        </button>
                    </div>
                </form>

                <!-- Results will be shown here -->
                <div id="nutrition-results" class="nutrition-results" style="display: none;">
                    <div class="results-cta">
                        <button type="button" class="btn btn-primary" id="save-plan-btn">Save Plan</button>
                        <button type="button" class="btn btn-outline" id="open-planner-btn">Open Planner</button>
                    </div>
                </div>
            </div>
        `;

        // Add form submit handler
        document.getElementById('nutrition-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateNutrition(e.target);
        });

        // Wire CTAs after results
        const nutritionPlans = document.getElementById('nutrition-plans');
        nutritionPlans.addEventListener('click', (ev) => {
            if (ev.target && ev.target.id === 'open-planner-btn') {
                if (window.mealPlanner) window.mealPlanner.createMealPlan(this.currentPet?.id);
            }
            if (ev.target && ev.target.id === 'save-plan-btn') {
                // This is saved automatically by API; just notify and refresh panel
                alert('Nutrition plan saved.');
                try { window.nutritionPlansPanel?.refresh(); } catch (_) {}
            }
        }, { once: true });
    }

    calculateNutrition(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Convert to numbers
        data.current_weight = parseFloat(data.current_weight);
        data.ideal_weight = parseFloat(data.ideal_weight) || data.current_weight;
        data.age = parseFloat(data.age);

        // Prefer server-side calculation and auto-save
        this.calculateViaAPI(data).catch(() => {
            // Fallback to local calculation if API fails
            const nutrition = this.performNutritionCalculation(data);
            this.showNutritionResults(nutrition, data);
            
            // Log activity for local calculation too
            this.logNutritionActivity('nutrition_calculated', {
                pet_id: this.currentPet.id,
                pet_name: this.currentPet.name,
                calories: nutrition.der,
                meals_per_day: nutrition.mealsPerDay
            });
            
            // Trigger dashboard update
            this.triggerDashboardUpdate();
        });
    }

    async calculateViaAPI(formValues) {
        const pet = this.currentPet;
        const payload = {
            action: 'calculate_nutrition',
            pet_id: pet.id,
            weight: formValues.ideal_weight || formValues.current_weight,
            species: (pet.species || 'dog').toLowerCase(),
            age: formValues.age,
            activity_level: formValues.activity_level
        };

        const res = await fetch('/api-bridge.php?action=nutrition_calculator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Calculation failed');

        const nutrition = {
            rer: json.calories?.rer,
            der: json.calories?.der,
            protein: Math.round(json.macronutrients?.protein_grams || 0),
            fat: Math.round(json.macronutrients?.fat_grams || 0),
            carbohydrates: Math.round(json.macronutrients?.carbohydrate_grams || 0),
            mealsPerDay: json.meal?.meals_per_day || 2,
            portionSize: Math.round((json.meal?.portion_guidance?.dry_food_cups || 0) * 100)
        };

        this.showNutritionResults(nutrition, formValues);

        // Log activity for dashboard
        this.logNutritionActivity('nutrition_calculated', {
            pet_id: pet.id,
            pet_name: pet.name,
            calories: nutrition.der,
            meals_per_day: nutrition.mealsPerDay
        });

        // Trigger dashboard statistics update
        this.triggerDashboardUpdate();

        // Refresh plan panel to reflect saved calculation
        try { window.nutritionPlansPanel?.refresh(); } catch (_) {}
    }

    performNutritionCalculation(data) {
        const pet = this.currentPet;
        const weight = data.ideal_weight || data.current_weight;
        
        // Base metabolic rate calculation
        let rer; // Resting Energy Requirement
        if (weight <= 2) {
            rer = 70 * Math.pow(weight, 0.75);
        } else {
            rer = (30 * weight) + 70;
        }

        // Activity multipliers
        const activityMultipliers = {
            low: 1.2,
            medium: 1.4,
            high: 1.8
        };

        // Life stage multipliers
        const lifeStageMultipliers = {
            puppy: pet.species === 'dog' ? 2.0 : 2.5,
            adult: 1.0,
            senior: 0.8
        };

        // Special condition multipliers
        const conditionMultipliers = {
            none: 1.0,
            pregnant: 1.5,
            lactating: 2.0,
            recovering: 1.3,
            diabetic: 1.0,
            kidney: 0.9,
            heart: 0.9
        };

        // Body condition multipliers
        const bodyConditionMultipliers = {
            underweight: 1.2,
            ideal: 1.0,
            overweight: 0.8,
            obese: 0.6
        };

        // Spay/neuter multiplier
        const spayNeuterMultiplier = data.spay_neuter === 'altered' ? 0.9 : 1.0;

        // Climate multiplier
        const climateMultipliers = {
            temperate: 1.0,
            cold: 1.1,
            hot: 0.9
        };

        // Calculate daily energy requirement (DER)
        const der = rer * 
                   activityMultipliers[data.activity_level] * 
                   lifeStageMultipliers[data.life_stage] * 
                   conditionMultipliers[data.special_condition] * 
                   bodyConditionMultipliers[data.body_condition] * 
                   spayNeuterMultiplier * 
                   climateMultipliers[data.climate];

        // Calculate macronutrients (approximate percentages for dogs/cats)
        const isCanine = pet.species === 'dog';
        const proteinPercent = isCanine ? 0.18 : 0.26; // 18% for dogs, 26% for cats
        const fatPercent = isCanine ? 0.05 : 0.09;     // 5% for dogs, 9% for cats
        const carbPercent = isCanine ? 0.50 : 0.10;    // 50% for dogs, 10% for cats

        // Calculate grams per day (4 kcal/g for protein and carbs, 9 kcal/g for fat)
        const proteinGrams = (der * proteinPercent) / 4;
        const fatGrams = (der * fatPercent) / 9;
        const carbGrams = (der * carbPercent) / 4;

        // Calculate feeding amounts (assuming average dry food has 350 kcal/100g)
        const dryFoodGrams = (der / 350) * 100;
        const wetFoodGrams = (der / 85) * 100; // Wet food ~85 kcal/100g

        return {
            rer: Math.round(rer),
            der: Math.round(der),
            protein: Math.round(proteinGrams),
            fat: Math.round(fatGrams),
            carbohydrates: Math.round(carbGrams),
            dryFood: Math.round(dryFoodGrams),
            wetFood: Math.round(wetFoodGrams),
            mealsPerDay: data.age < 1 ? 3 : 2,
            portionSize: Math.round(dryFoodGrams / (data.age < 1 ? 3 : 2))
        };
    }

    showNutritionResults(nutrition, inputData) {
        const resultsContainer = document.getElementById('nutrition-results');
        if (!resultsContainer) return;

        // Store nutrition data for saving
        this.nutritionData = {
            ...nutrition,
            inputData: inputData,
            calculatedAt: new Date().toISOString()
        };

        const pet = this.currentPet;
        
        resultsContainer.innerHTML = `
            <div class="nutrition-results-content">
                <div class="results-header">
                    <h3><i class="fas fa-chart-pie"></i> Nutrition Requirements for ${pet.name}</h3>
                    <p>Based on current health status and activity level</p>
                </div>

                <div class="results-grid">
                    <!-- Energy Requirements -->
                    <div class="result-card energy-card">
                        <div class="card-header">
                            <h4><i class="fas fa-bolt"></i> Energy Requirements</h4>
                        </div>
                        <div class="card-content">
                            <div class="energy-breakdown">
                                <div class="energy-item">
                                    <span class="label">Resting Energy (RER)</span>
                                    <span class="value">${nutrition.rer} kcal/day</span>
                                </div>
                                <div class="energy-item primary">
                                    <span class="label">Daily Energy (DER)</span>
                                    <span class="value">${nutrition.der} kcal/day</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Macronutrients -->
                    <div class="result-card macros-card">
                        <div class="card-header">
                            <h4><i class="fas fa-chart-pie"></i> Daily Macronutrients</h4>
                        </div>
                        <div class="card-content">
                            <div class="macros-breakdown">
                                <div class="macro-item protein">
                                    <div class="macro-icon"><i class="fas fa-drumstick-bite"></i></div>
                                    <div class="macro-info">
                                        <span class="macro-name">Protein</span>
                                        <span class="macro-amount">${nutrition.protein}g</span>
                                    </div>
                                </div>
                                <div class="macro-item fat">
                                    <div class="macro-icon"><i class="fas fa-tint"></i></div>
                                    <div class="macro-info">
                                        <span class="macro-name">Fat</span>
                                        <span class="macro-amount">${nutrition.fat}g</span>
                                    </div>
                                </div>
                                <div class="macro-item carbs">
                                    <div class="macro-icon"><i class="fas fa-seedling"></i></div>
                                    <div class="macro-info">
                                        <span class="macro-name">Carbohydrates</span>
                                        <span class="macro-amount">${nutrition.carbohydrates}g</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Feeding Guidelines -->
                    <div class="result-card feeding-card">
                        <div class="card-header">
                            <h4><i class="fas fa-utensils"></i> Feeding Guidelines</h4>
                        </div>
                        <div class="card-content">
                            <div class="feeding-options">
                                <div class="feeding-option">
                                    <div class="option-header">
                                        <i class="fas fa-cookie-bite"></i>
                                        <span>Dry Food</span>
                                    </div>
                                    <div class="option-details">
                                        <div class="amount">${nutrition.dryFood}g/day</div>
                                        <div class="portions">${nutrition.portionSize}g per meal (${nutrition.mealsPerDay} meals)</div>
                                    </div>
                                </div>
                                <div class="feeding-option">
                                    <div class="option-header">
                                        <i class="fas fa-fish"></i>
                                        <span>Wet Food</span>
                                    </div>
                                    <div class="option-details">
                                        <div class="amount">${nutrition.wetFood}g/day</div>
                                        <div class="portions">${Math.round(nutrition.wetFood / nutrition.mealsPerDay)}g per meal (${nutrition.mealsPerDay} meals)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recommendations -->
                    <div class="result-card recommendations-card">
                        <div class="card-header">
                            <h4><i class="fas fa-lightbulb"></i> Recommendations</h4>
                        </div>
                        <div class="card-content">
                            <div class="recommendations-list">
                                ${this.generateRecommendations(inputData, nutrition).map(rec => `
                                    <div class="recommendation-item">
                                        <i class="fas ${rec.icon}"></i>
                                        <span>${rec.text}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="results-actions">
                    <button class="btn btn-outline" onclick="nutritionCalculator.printResults()">
                        <i class="fas fa-print"></i> Print Results
                    </button>
                    <button class="btn btn-outline" onclick="nutritionCalculator.saveResults()">
                        <i class="fas fa-save"></i> Save to Pet Profile
                    </button>
                    <button class="btn btn-primary" onclick="nutritionCalculator.createMealPlan()">
                        <i class="fas fa-calendar-alt"></i> Create Meal Plan
                    </button>
                </div>
            </div>
        `;

        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    generateRecommendations(inputData, nutrition) {
        const recommendations = [];
        const pet = this.currentPet;

        // Age-based recommendations
        if (inputData.life_stage === 'puppy') {
            recommendations.push({
                icon: 'fa-baby',
                text: 'Feed 3 times daily for optimal growth and development'
            });
        } else if (inputData.life_stage === 'senior') {
            recommendations.push({
                icon: 'fa-heart',
                text: 'Consider senior-specific diet with joint support nutrients'
            });
        }

        // Activity level recommendations
        if (inputData.activity_level === 'high') {
            recommendations.push({
                icon: 'fa-running',
                text: 'Provide extra water and consider post-exercise snacks'
            });
        } else if (inputData.activity_level === 'low') {
            recommendations.push({
                icon: 'fa-weight',
                text: 'Monitor weight closely to prevent obesity'
            });
        }

        // Body condition recommendations
        if (inputData.body_condition === 'overweight' || inputData.body_condition === 'obese') {
            recommendations.push({
                icon: 'fa-chart-line',
                text: 'Gradual weight loss recommended - consult your veterinarian'
            });
        } else if (inputData.body_condition === 'underweight') {
            recommendations.push({
                icon: 'fa-arrow-up',
                text: 'Increase caloric intake gradually and monitor progress'
            });
        }

        // Special condition recommendations
        if (inputData.special_condition !== 'none') {
            recommendations.push({
                icon: 'fa-stethoscope',
                text: 'Consult your veterinarian for specialized dietary needs'
            });
        }

        // General recommendations
        recommendations.push({
            icon: 'fa-clock',
            text: 'Feed at consistent times daily to establish routine'
        });

        recommendations.push({
            icon: 'fa-tint',
            text: 'Always provide fresh water - approximately 50-60ml per kg body weight'
        });

        return recommendations;
    }

    getPetIcon(species) {
        const icons = {
            dog: 'fa-dog',
            cat: 'fa-cat',
            bird: 'fa-dove',
            rabbit: 'fa-rabbit',
            other: 'fa-paw'
        };
        return icons[species] || icons.other;
    }

    showNoPetsMessage() {
        const nutritionPlans = document.getElementById('nutrition-plans');
        if (!nutritionPlans) return;

        nutritionPlans.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-paw"></i>
                <h3>No Pets Found</h3>
                <p>You need to add at least one pet before calculating nutrition requirements.</p>
                <button class="btn btn-primary" onclick="app.switchTab('pets')">
                    <i class="fas fa-plus"></i> Add Your First Pet
                </button>
            </div>
        `;
    }

    showError(message) {
        const nutritionPlans = document.getElementById('nutrition-plans');
        if (!nutritionPlans) return;

        nutritionPlans.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="nutritionCalculator.loadNutritionInterface()">
                    <i class="fas fa-refresh"></i> Try Again
                </button>
            </div>
        `;
    }

    printResults() {
        window.print();
    }

    async saveResults() {
        try {
            if (!this.currentPet || !this.nutritionData) {
                throw new Error('No nutrition data to save');
            }
            
            // Save nutrition plan via API
            const response = await fetch('/api-bridge.php?action=nutrition_calculator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                    action: 'save_nutrition_plan',
                    pet_id: this.currentPet.id,
                    nutrition_data: this.nutritionData
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Show success notification
                if (window.app && window.app.showNotification) {
                    window.app.showNotification('Nutrition plan saved successfully!', 'success');
                } else {
                    alert('Nutrition plan saved successfully!');
                }
                
                // Log activity
                this.logNutritionActivity('nutrition_plan_saved', {
                    pet_id: this.currentPet.id,
                    pet_name: this.currentPet.name,
                    calories: this.nutritionData.der,
                    meals_per_day: this.nutritionData.mealsPerDay
                });
                
                // Trigger dashboard update
                this.triggerDashboardUpdate();
                
            } else {
                throw new Error(result.error || 'Failed to save nutrition plan');
            }
            
        } catch (error) {
            console.error('Error saving nutrition results:', error);
            if (window.app && window.app.showNotification) {
                window.app.showNotification('Failed to save nutrition plan: ' + error.message, 'error');
            } else {
                alert('Failed to save nutrition plan: ' + error.message);
            }
        }
    }

    createMealPlan() {
        // Switch to meal planner with current pet
        if (window.mealPlanner) {
            window.mealPlanner.createMealPlan(this.currentPet.id);
            
            // Log activity
            this.logNutritionActivity('meal_plan_created', {
                pet_id: this.currentPet.id,
                pet_name: this.currentPet.name,
                description: `Created meal plan for ${this.currentPet.name}`
            });
        } else {
            alert('Meal planner will be available soon!');
        }
    }
    
    /**
     * Log nutrition-related activity for dashboard
     */
    async logNutritionActivity(type, data) {
        try {
            if (window.app && window.app.logActivity) {
                await window.app.logActivity(type, {
                    description: data.description || this.getActivityDescription(type, data),
                    pet_id: data.pet_id,
                    metadata: {
                        pet_name: data.pet_name,
                        calories: data.calories,
                        meals_per_day: data.meals_per_day,
                        ...data
                    }
                });
            }
        } catch (error) {
            console.warn('Failed to log nutrition activity:', error);
        }
    }
    
    /**
     * Generate activity description based on type and data
     */
    getActivityDescription(type, data) {
        switch (type) {
            case 'nutrition_calculated':
                return `Calculated nutrition requirements for ${data.pet_name} (${data.calories} kcal/day)`;
            case 'nutrition_plan_saved':
                return `Saved nutrition plan for ${data.pet_name}`;
            case 'meal_plan_created':
                return `Created meal plan for ${data.pet_name}`;
            default:
                return `Nutrition activity for ${data.pet_name}`;
        }
    }
    
    /**
     * Trigger dashboard statistics update
     */
    async triggerDashboardUpdate() {
        try {
            // Dispatch event for dashboard components to refresh
            document.dispatchEvent(new CustomEvent('nutritionUpdated', {
                detail: {
                    pet_id: this.currentPet?.id,
                    timestamp: Date.now()
                }
            }));
            
            // If dashboard statistics component is available, refresh it
            if (window.dashboardStatistics && window.dashboardStatistics.refresh) {
                window.dashboardStatistics.refresh();
            }
            
            // If we're on the dashboard, reload dashboard data
            if (window.app && window.app.loadDashboardData) {
                window.app.loadDashboardData();
            }
        } catch (error) {
            console.warn('Failed to trigger dashboard update:', error);
        }
    }
}

// Initialize nutrition calculator
const nutritionCalculator = new NutritionCalculator();

// Make it globally available
window.nutritionCalculator = nutritionCalculator;