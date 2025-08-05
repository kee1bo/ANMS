/**
 * Enhanced Meal Planner Component
 * Provides drag-and-drop meal planning and food recommendations
 */

class MealPlanner {
    constructor() {
        this.currentPet = null;
        this.mealPlan = null;
        this.foodDatabase = [];
        this.weeklyPlan = {};
        this.nutritionRequirements = null;
        this.dietaryRestrictions = [];
        this.portionCalculator = new PortionCalculator();
        this.init();
    }

    init() {
        this.loadFoodDatabase();
        this.bindEvents();
        this.setupDragAndDrop();
        this.initializePortionCalculator();
    }

    bindEvents() {
        // Create meal plan button
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="create-meal-plan"]')) {
                e.preventDefault();
                const petId = e.target.dataset.petId;
                this.createMealPlan(petId);
            }
        });

        // Save meal plan
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="save-meal-plan"]')) {
                e.preventDefault();
                this.saveMealPlan();
            }
        });

        // Generate recommendations
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="generate-recommendations"]')) {
                e.preventDefault();
                this.generateRecommendations();
            }
        });

        // Calculate portions
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="calculate-portions"]')) {
                e.preventDefault();
                this.showPortionCalculator();
            }
        });

        // Dietary restrictions
        document.addEventListener('change', (e) => {
            if (e.target.matches('[name="dietary-restriction"]')) {
                this.updateDietaryRestrictions();
            }
        });

        // Food search
        document.addEventListener('input', (e) => {
            if (e.target.matches('#food-search')) {
                this.searchFoods(e.target.value);
            }
        });

        // Food filter
        document.addEventListener('change', (e) => {
            if (e.target.matches('#food-filter')) {
                this.filterFoods(e.target.value);
            }
        });
    }

    async loadFoodDatabase() {
        // Load comprehensive food database with enhanced nutritional data
        this.foodDatabase = [
            // Dog foods
            { 
                id: 1, name: 'Premium Dry Dog Food', type: 'dry', species: 'dog', 
                calories_per_cup: 350, protein: 26, fat: 16, carbs: 58,
                ingredients: ['chicken', 'rice', 'vegetables'], 
                allergens: [], life_stage: 'adult', price_per_lb: 3.50,
                brand: 'Premium Pet', rating: 4.5
            },
            { 
                id: 2, name: 'Wet Dog Food (Chicken)', type: 'wet', species: 'dog', 
                calories_per_can: 200, protein: 45, fat: 25, carbs: 30,
                ingredients: ['chicken', 'broth', 'carrots'], 
                allergens: [], life_stage: 'adult', price_per_can: 2.25,
                brand: 'Natural Choice', rating: 4.3
            },
            { 
                id: 3, name: 'Raw Dog Food (Beef)', type: 'raw', species: 'dog', 
                calories_per_oz: 50, protein: 60, fat: 35, carbs: 5,
                ingredients: ['beef', 'organs', 'bone'], 
                allergens: [], life_stage: 'adult', price_per_lb: 8.00,
                brand: 'Raw Nature', rating: 4.7
            },
            { 
                id: 7, name: 'Grain-Free Dog Food', type: 'dry', species: 'dog', 
                calories_per_cup: 380, protein: 30, fat: 18, carbs: 52,
                ingredients: ['salmon', 'sweet_potato', 'peas'], 
                allergens: [], life_stage: 'adult', price_per_lb: 4.20,
                brand: 'Grain Free Plus', rating: 4.4
            },
            { 
                id: 8, name: 'Puppy Growth Formula', type: 'dry', species: 'dog', 
                calories_per_cup: 420, protein: 32, fat: 22, carbs: 46,
                ingredients: ['chicken', 'rice', 'fish_oil'], 
                allergens: [], life_stage: 'puppy', price_per_lb: 4.80,
                brand: 'Puppy Pro', rating: 4.6
            },
            { 
                id: 9, name: 'Senior Dog Formula', type: 'wet', species: 'dog', 
                calories_per_can: 180, protein: 40, fat: 20, carbs: 40,
                ingredients: ['turkey', 'vegetables', 'glucosamine'], 
                allergens: [], life_stage: 'senior', price_per_can: 2.50,
                brand: 'Senior Care', rating: 4.2
            },
            
            // Cat foods
            { 
                id: 4, name: 'Premium Dry Cat Food', type: 'dry', species: 'cat', 
                calories_per_cup: 400, protein: 32, fat: 18, carbs: 50,
                ingredients: ['chicken', 'rice', 'taurine'], 
                allergens: [], life_stage: 'adult', price_per_lb: 4.00,
                brand: 'Feline Premium', rating: 4.4
            },
            { 
                id: 5, name: 'Wet Cat Food (Salmon)', type: 'wet', species: 'cat', 
                calories_per_can: 180, protein: 50, fat: 30, carbs: 20,
                ingredients: ['salmon', 'broth', 'taurine'], 
                allergens: [], life_stage: 'adult', price_per_can: 1.80,
                brand: 'Ocean Fresh', rating: 4.5
            },
            { 
                id: 6, name: 'Freeze-Dried Cat Treats', type: 'treat', species: 'cat', 
                calories_per_piece: 5, protein: 70, fat: 25, carbs: 5,
                ingredients: ['chicken', 'liver'], 
                allergens: [], life_stage: 'adult', price_per_bag: 12.00,
                brand: 'Treat Time', rating: 4.8
            },
            { 
                id: 10, name: 'Kitten Growth Formula', type: 'wet', species: 'cat', 
                calories_per_can: 220, protein: 55, fat: 35, carbs: 10,
                ingredients: ['chicken', 'milk', 'taurine'], 
                allergens: [], life_stage: 'kitten', price_per_can: 2.20,
                brand: 'Kitten Care', rating: 4.7
            },
            { 
                id: 11, name: 'Indoor Cat Formula', type: 'dry', species: 'cat', 
                calories_per_cup: 350, protein: 30, fat: 15, carbs: 55,
                ingredients: ['chicken', 'fiber', 'taurine'], 
                allergens: [], life_stage: 'adult', price_per_lb: 3.80,
                brand: 'Indoor Life', rating: 4.3
            },
            { 
                id: 12, name: 'Hairball Control Formula', type: 'dry', species: 'cat', 
                calories_per_cup: 360, protein: 28, fat: 16, carbs: 56,
                ingredients: ['chicken', 'fiber', 'omega_oils'], 
                allergens: [], life_stage: 'adult', price_per_lb: 4.10,
                brand: 'Hairball Away', rating: 4.1
            }
        ];
    }

    setupDragAndDrop() {
        // Enable drag and drop for meal planning
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('food-item')) {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    foodId: e.target.dataset.foodId,
                    foodName: e.target.dataset.foodName
                }));
            }
        });

        document.addEventListener('dragover', (e) => {
            if (e.target.classList.contains('meal-slot')) {
                e.preventDefault();
                e.target.classList.add('drag-over');
            }
        });

        document.addEventListener('dragleave', (e) => {
            if (e.target.classList.contains('meal-slot')) {
                e.target.classList.remove('drag-over');
            }
        });

        document.addEventListener('drop', (e) => {
            if (e.target.classList.contains('meal-slot')) {
                e.preventDefault();
                e.target.classList.remove('drag-over');
                
                const foodData = JSON.parse(e.dataTransfer.getData('text/plain'));
                this.addFoodToMeal(e.target, foodData);
            }
        });
    }

    async createMealPlan(petId) {
        try {
            // Get pet data first
            const petResponse = await fetch(`/api-bridge.php?action=get_pets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pet_id: petId })
            });

            const petData = await petResponse.json();
            if (!petData.success) throw new Error('Failed to load pet data');

            this.currentPet = petData.pet;
            this.renderMealPlanInterface();

        } catch (error) {
            console.error('Error creating meal plan:', error);
            this.showError('Failed to create meal plan: ' + error.message);
        }
    }

    renderMealPlanInterface() {
        const container = document.getElementById('nutrition-tab');
        
        container.innerHTML = `
            <div class="meal-planner">
                <div class="meal-planner-header">
                    <h3><i class="fas fa-calendar-alt"></i> Weekly Meal Planner for ${this.currentPet.name}</h3>
                    <div class="pet-info-bar">
                        <span>${this.currentPet.species} • ${this.currentPet.weight}kg • ${this.currentPet.activity_level} activity</span>
                    </div>
                </div>

                <div class="meal-planner-controls">
                    <div class="dietary-restrictions">
                        <h4><i class="fas fa-shield-alt"></i> Dietary Restrictions</h4>
                        <div class="restriction-checkboxes">
                            <label><input type="checkbox" name="dietary-restriction" value="grain-free"> Grain-Free</label>
                            <label><input type="checkbox" name="dietary-restriction" value="low-fat"> Low Fat</label>
                            <label><input type="checkbox" name="dietary-restriction" value="high-protein"> High Protein</label>
                            <label><input type="checkbox" name="dietary-restriction" value="weight-management"> Weight Management</label>
                            <label><input type="checkbox" name="dietary-restriction" value="sensitive-stomach"> Sensitive Stomach</label>
                        </div>
                    </div>
                    
                    <div class="nutrition-summary" id="nutrition-summary">
                        <h4><i class="fas fa-chart-pie"></i> Daily Nutrition Target</h4>
                        <div class="nutrition-targets">
                            <div class="target-item">
                                <span class="label">Calories:</span>
                                <span class="value" id="target-calories">-</span>
                            </div>
                            <div class="target-item">
                                <span class="label">Protein:</span>
                                <span class="value" id="target-protein">-</span>
                            </div>
                            <div class="target-item">
                                <span class="label">Fat:</span>
                                <span class="value" id="target-fat">-</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="meal-planner-content">
                    <div class="food-library">
                        <h4><i class="fas fa-database"></i> Food Library</h4>
                        <div class="food-controls">
                            <div class="food-search">
                                <input type="text" id="food-search" placeholder="Search foods..." class="form-input">
                                <i class="fas fa-search"></i>
                            </div>
                            <select id="food-filter" class="form-select">
                                <option value="all">All Foods</option>
                                <option value="dry">Dry Food</option>
                                <option value="wet">Wet Food</option>
                                <option value="raw">Raw Food</option>
                                <option value="treat">Treats</option>
                            </select>
                        </div>
                        <div id="food-list" class="food-list">
                            ${this.renderFoodList()}
                        </div>
                    </div>

                    <div class="weekly-calendar">
                        <h4><i class="fas fa-calendar-week"></i> Weekly Meal Plan</h4>
                        <div class="calendar-controls">
                            <button class="btn btn-sm btn-outline" data-action="generate-recommendations">
                                <i class="fas fa-magic"></i> Auto-Fill Week
                            </button>
                            <button class="btn btn-sm btn-outline" data-action="calculate-portions">
                                <i class="fas fa-calculator"></i> Calculate Portions
                            </button>
                        </div>
                        <div class="calendar-grid">
                            ${this.renderWeeklyCalendar()}
                        </div>
                    </div>
                </div>

                <div class="meal-planner-actions">
                    <button class="btn btn-primary" data-action="save-meal-plan">
                        <i class="fas fa-save"></i> Save Meal Plan
                    </button>
                    <button class="btn btn-success" data-action="export-meal-plan">
                        <i class="fas fa-download"></i> Export Plan
                    </button>
                    <button class="btn btn-info" data-action="share-meal-plan">
                        <i class="fas fa-share"></i> Share with Vet
                    </button>
                </div>
            </div>
        `;
        
        // Load nutrition requirements
        this.loadNutritionRequirements();
    }

    renderFoodList() {
        const speciesFood = this.foodDatabase.filter(food => 
            food.species === this.currentPet.species.toLowerCase()
        );

        return speciesFood.map(food => `
            <div class="food-item" draggable="true" 
                 data-food-id="${food.id}" 
                 data-food-name="${food.name}">
                <div class="food-icon">
                    <i class="fas fa-${this.getFoodIcon(food.type)}"></i>
                </div>
                <div class="food-details">
                    <h5>${food.name}</h5>
                    <p>${food.type} • ${this.getCalorieInfo(food)}</p>
                    <div class="nutrition-mini">
                        P: ${food.protein}% | F: ${food.fat}% | C: ${food.carbs}%
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderWeeklyCalendar() {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const mealTimes = ['Breakfast', 'Lunch', 'Dinner'];

        return days.map(day => `
            <div class="day-column">
                <h5>${day}</h5>
                ${mealTimes.map(meal => `
                    <div class="meal-slot" data-day="${day}" data-meal="${meal}">
                        <div class="meal-header">${meal}</div>
                        <div class="meal-content">
                            <div class="drop-zone">
                                <i class="fas fa-plus"></i>
                                <span>Drop food here</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    addFoodToMeal(mealSlot, foodData) {
        const food = this.foodDatabase.find(f => f.id == foodData.foodId);
        if (!food) return;

        const mealContent = mealSlot.querySelector('.meal-content');
        const day = mealSlot.dataset.day;
        const meal = mealSlot.dataset.meal;

        // Initialize weekly plan structure
        if (!this.weeklyPlan[day]) this.weeklyPlan[day] = {};
        if (!this.weeklyPlan[day][meal]) this.weeklyPlan[day][meal] = [];

        // Add food to plan
        this.weeklyPlan[day][meal].push({
            food: food,
            portion: this.calculateRecommendedPortion(food)
        });

        // Update UI
        this.updateMealSlotDisplay(mealSlot, day, meal);
    }

    updateMealSlotDisplay(mealSlot, day, meal) {
        const mealContent = mealSlot.querySelector('.meal-content');
        const foods = this.weeklyPlan[day][meal] || [];

        if (foods.length === 0) {
            mealContent.innerHTML = `
                <div class="drop-zone">
                    <i class="fas fa-plus"></i>
                    <span>Drop food here</span>
                </div>
            `;
            return;
        }

        mealContent.innerHTML = foods.map((item, index) => `
            <div class="meal-food-item">
                <span class="food-name">${item.food.name}</span>
                <span class="food-portion">${item.portion}</span>
                <button class="remove-food" onclick="this.removeFoodFromMeal('${day}', '${meal}', ${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    calculateRecommendedPortion(food) {
        // Simple portion calculation based on food type
        if (food.type === 'dry') {
            return '0.5 cups';
        } else if (food.type === 'wet') {
            return '0.5 cans';
        } else if (food.type === 'raw') {
            return '3 oz';
        } else {
            return '1 serving';
        }
    }

    searchFoods(query) {
        const filteredFoods = this.foodDatabase.filter(food => 
            food.species === this.currentPet.species.toLowerCase() &&
            food.name.toLowerCase().includes(query.toLowerCase())
        );

        const foodList = document.getElementById('food-list');
        foodList.innerHTML = filteredFoods.map(food => `
            <div class="food-item" draggable="true" 
                 data-food-id="${food.id}" 
                 data-food-name="${food.name}">
                <div class="food-icon">
                    <i class="fas fa-${this.getFoodIcon(food.type)}"></i>
                </div>
                <div class="food-details">
                    <h5>${food.name}</h5>
                    <p>${food.type} • ${this.getCalorieInfo(food)}</p>
                    <div class="nutrition-mini">
                        P: ${food.protein}% | F: ${food.fat}% | C: ${food.carbs}%
                    </div>
                </div>
            </div>
        `).join('');
    }

    getFoodIcon(type) {
        const icons = {
            'dry': 'bowl-food',
            'wet': 'can-food',
            'raw': 'drumstick-bite',
            'treat': 'cookie-bite'
        };
        return icons[type] || 'utensils';
    }

    getCalorieInfo(food) {
        if (food.calories_per_cup) return `${food.calories_per_cup} kcal/cup`;
        if (food.calories_per_can) return `${food.calories_per_can} kcal/can`;
        if (food.calories_per_oz) return `${food.calories_per_oz} kcal/oz`;
        if (food.calories_per_piece) return `${food.calories_per_piece} kcal/piece`;
        return 'Calories vary';
    }

    async saveMealPlan() {
        try {
            // Save meal plan to backend
            const response = await fetch('/api-bridge.php?action=nutrition_calculator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_meal_plan',
                    pet_id: this.currentPet.id,
                    weekly_plan: this.weeklyPlan
                })
            });

            const result = await response.json();
            if (result.success) {
                this.showSuccess('Meal plan saved successfully!');
            } else {
                throw new Error(result.error || 'Failed to save meal plan');
            }

        } catch (error) {
            console.error('Error saving meal plan:', error);
            this.showError('Failed to save meal plan: ' + error.message);
        }
    }

    async loadNutritionRequirements() {
        if (!this.currentPet) return;
        
        try {
            const response = await fetch('/api-bridge.php?action=nutrition_calculator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'calculate_nutrition',
                    weight: this.currentPet.weight,
                    species: this.currentPet.species,
                    age: this.currentPet.age,
                    activity_level: this.currentPet.activity_level
                })
            });

            const result = await response.json();
            if (result.success) {
                this.nutritionRequirements = result.data;
                this.updateNutritionSummary();
            }
        } catch (error) {
            console.error('Failed to load nutrition requirements:', error);
        }
    }

    updateNutritionSummary() {
        if (!this.nutritionRequirements) return;

        const calories = this.nutritionRequirements.calories;
        const macros = this.nutritionRequirements.macronutrients;

        document.getElementById('target-calories').textContent = `${calories.der} kcal`;
        document.getElementById('target-protein').textContent = `${macros.protein_grams}g`;
        document.getElementById('target-fat').textContent = `${macros.fat_grams}g`;
    }

    updateDietaryRestrictions() {
        const checkboxes = document.querySelectorAll('[name="dietary-restriction"]:checked');
        this.dietaryRestrictions = Array.from(checkboxes).map(cb => cb.value);
        this.filterFoods('all'); // Refresh food list with restrictions
    }

    filterFoods(type) {
        const speciesFood = this.foodDatabase.filter(food => {
            if (food.species !== this.currentPet.species.toLowerCase()) return false;
            if (type !== 'all' && food.type !== type) return false;
            
            // Apply dietary restrictions
            if (this.dietaryRestrictions.includes('grain-free') && 
                food.ingredients.some(ing => ['rice', 'wheat', 'corn'].includes(ing))) {
                return false;
            }
            if (this.dietaryRestrictions.includes('low-fat') && food.fat > 15) return false;
            if (this.dietaryRestrictions.includes('high-protein') && food.protein < 30) return false;
            
            return true;
        });

        const foodList = document.getElementById('food-list');
        foodList.innerHTML = this.renderFoodItems(speciesFood);
    }

    renderFoodItems(foods) {
        return foods.map(food => `
            <div class="food-item" draggable="true" 
                 data-food-id="${food.id}" 
                 data-food-name="${food.name}">
                <div class="food-icon">
                    <i class="fas fa-${this.getFoodIcon(food.type)}"></i>
                </div>
                <div class="food-details">
                    <h5>${food.name}</h5>
                    <p>${food.type} • ${this.getCalorieInfo(food)}</p>
                    <div class="nutrition-mini">
                        P: ${food.protein}% | F: ${food.fat}% | C: ${food.carbs}%
                    </div>
                    <div class="food-rating">
                        ${'★'.repeat(Math.floor(food.rating))}${'☆'.repeat(5-Math.floor(food.rating))} ${food.rating}
                    </div>
                </div>
            </div>
        `).join('');
    }

    async generateRecommendations() {
        if (!this.nutritionRequirements) {
            this.showError('Please calculate nutrition requirements first');
            return;
        }

        this.showLoading('Generating meal recommendations...');

        try {
            // Get recommended foods based on pet's needs
            const recommendedFoods = this.getRecommendedFoods();
            
            // Auto-fill the weekly calendar
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const mealTimes = ['Breakfast', 'Lunch', 'Dinner'];
            
            days.forEach(day => {
                if (!this.weeklyPlan[day]) this.weeklyPlan[day] = {};
                
                mealTimes.forEach(meal => {
                    if (!this.weeklyPlan[day][meal]) this.weeklyPlan[day][meal] = [];
                    
                    // Add recommended food if slot is empty
                    if (this.weeklyPlan[day][meal].length === 0) {
                        const recommendedFood = recommendedFoods[Math.floor(Math.random() * recommendedFoods.length)];
                        const portion = this.portionCalculator.calculateOptimalPortion(
                            recommendedFood, 
                            this.currentPet, 
                            this.nutritionRequirements.calories.der / mealTimes.length
                        );
                        
                        this.weeklyPlan[day][meal].push({
                            food: recommendedFood,
                            portion: portion
                        });
                    }
                });
            });

            // Update UI
            this.refreshCalendarDisplay();
            this.hideLoading();
            this.showSuccess('Meal recommendations generated successfully!');

        } catch (error) {
            console.error('Error generating recommendations:', error);
            this.hideLoading();
            this.showError('Failed to generate recommendations');
        }
    }

    getRecommendedFoods() {
        const petAge = this.currentPet.age;
        const petSpecies = this.currentPet.species.toLowerCase();
        
        return this.foodDatabase.filter(food => {
            if (food.species !== petSpecies) return false;
            
            // Life stage matching
            if (petAge < 1 && food.life_stage !== 'puppy' && food.life_stage !== 'kitten') return false;
            if (petAge > 7 && food.life_stage === 'puppy' || food.life_stage === 'kitten') return false;
            
            // Apply dietary restrictions
            if (this.dietaryRestrictions.includes('grain-free') && 
                food.ingredients.some(ing => ['rice', 'wheat', 'corn'].includes(ing))) {
                return false;
            }
            
            // High-rated foods only
            return food.rating >= 4.0;
        }).sort((a, b) => b.rating - a.rating);
    }

    showPortionCalculator() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content portion-calculator-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-calculator"></i> Portion Calculator</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="calculator-form">
                        <div class="form-group">
                            <label>Select Food:</label>
                            <select id="calc-food-select" class="form-select">
                                ${this.foodDatabase
                                    .filter(f => f.species === this.currentPet.species.toLowerCase())
                                    .map(f => `<option value="${f.id}">${f.name}</option>`)
                                    .join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Target Calories per Meal:</label>
                            <input type="number" id="calc-target-calories" class="form-input" 
                                   value="${Math.round(this.nutritionRequirements?.calories.der / 3 || 200)}">
                        </div>
                        <div class="form-group">
                            <label>Feeding Frequency (meals per day):</label>
                            <select id="calc-meal-frequency" class="form-select">
                                <option value="2">2 meals</option>
                                <option value="3" selected>3 meals</option>
                                <option value="4">4 meals</option>
                            </select>
                        </div>
                    </div>
                    <div id="portion-results" class="portion-results"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.calculatePortion()">Calculate</button>
                    <button class="btn btn-outline" onclick="this.closeModal()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Bind events
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.querySelector('.btn-outline').onclick = () => modal.remove();
        modal.querySelector('.btn-primary').onclick = () => this.calculatePortion(modal);
    }

    calculatePortion(modal) {
        const foodId = modal.querySelector('#calc-food-select').value;
        const targetCalories = parseInt(modal.querySelector('#calc-target-calories').value);
        const mealFrequency = parseInt(modal.querySelector('#calc-meal-frequency').value);
        
        const food = this.foodDatabase.find(f => f.id == foodId);
        if (!food) return;
        
        const portion = this.portionCalculator.calculateOptimalPortion(food, this.currentPet, targetCalories);
        const dailyPortion = this.portionCalculator.calculateDailyPortion(food, this.currentPet, mealFrequency);
        
        const resultsDiv = modal.querySelector('#portion-results');
        resultsDiv.innerHTML = `
            <div class="portion-result-card">
                <h4>${food.name}</h4>
                <div class="portion-details">
                    <div class="portion-item">
                        <span class="label">Per Meal:</span>
                        <span class="value">${portion}</span>
                    </div>
                    <div class="portion-item">
                        <span class="label">Daily Total:</span>
                        <span class="value">${dailyPortion}</span>
                    </div>
                    <div class="portion-item">
                        <span class="label">Calories per Meal:</span>
                        <span class="value">${targetCalories} kcal</span>
                    </div>
                </div>
                <div class="portion-tips">
                    <h5>Feeding Tips:</h5>
                    <ul>
                        <li>Measure portions accurately using a kitchen scale</li>
                        <li>Adjust portions based on your pet's body condition</li>
                        <li>Divide daily amount into ${mealFrequency} equal meals</li>
                        <li>Monitor weight and adjust as needed</li>
                    </ul>
                </div>
            </div>
        `;
    }

    refreshCalendarDisplay() {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const mealTimes = ['Breakfast', 'Lunch', 'Dinner'];
        
        days.forEach(day => {
            mealTimes.forEach(meal => {
                const mealSlot = document.querySelector(`[data-day="${day}"][data-meal="${meal}"]`);
                if (mealSlot) {
                    this.updateMealSlotDisplay(mealSlot, day, meal);
                }
            });
        });
    }

    initializePortionCalculator() {
        this.portionCalculator = {
            calculateOptimalPortion: (food, pet, targetCalories) => {
                if (food.calories_per_cup) {
                    const cups = targetCalories / food.calories_per_cup;
                    return `${cups.toFixed(2)} cups`;
                } else if (food.calories_per_can) {
                    const cans = targetCalories / food.calories_per_can;
                    return `${cans.toFixed(2)} cans`;
                } else if (food.calories_per_oz) {
                    const oz = targetCalories / food.calories_per_oz;
                    return `${oz.toFixed(1)} oz`;
                }
                return '1 serving';
            },
            
            calculateDailyPortion: (food, pet, mealFrequency) => {
                const dailyCalories = this.nutritionRequirements?.calories.der || 1000;
                if (food.calories_per_cup) {
                    const cups = dailyCalories / food.calories_per_cup;
                    return `${cups.toFixed(2)} cups`;
                } else if (food.calories_per_can) {
                    const cans = dailyCalories / food.calories_per_can;
                    return `${cans.toFixed(2)} cans`;
                } else if (food.calories_per_oz) {
                    const oz = dailyCalories / food.calories_per_oz;
                    return `${oz.toFixed(1)} oz`;
                }
                return `${mealFrequency} servings`;
            }
        };
    }

    showLoading(message) {
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(loading);
        this.loadingElement = loading;
    }

    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.remove();
            this.loadingElement = null;
        }
    }

    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }
}

// Portion Calculator Class
class PortionCalculator {
    calculateOptimalPortion(food, pet, targetCalories) {
        if (food.calories_per_cup) {
            const cups = targetCalories / food.calories_per_cup;
            return `${cups.toFixed(2)} cups`;
        } else if (food.calories_per_can) {
            const cans = targetCalories / food.calories_per_can;
            return `${cans.toFixed(2)} cans`;
        } else if (food.calories_per_oz) {
            const oz = targetCalories / food.calories_per_oz;
            return `${oz.toFixed(1)} oz`;
        }
        return '1 serving';
    }
    
    calculateDailyPortion(food, pet, mealFrequency, dailyCalories) {
        if (food.calories_per_cup) {
            const cups = dailyCalories / food.calories_per_cup;
            return `${cups.toFixed(2)} cups total`;
        } else if (food.calories_per_can) {
            const cans = dailyCalories / food.calories_per_can;
            return `${cans.toFixed(2)} cans total`;
        } else if (food.calories_per_oz) {
            const oz = dailyCalories / food.calories_per_oz;
            return `${oz.toFixed(1)} oz total`;
        }
        return `${mealFrequency} servings total`;
    }
}

// Initialize meal planner
document.addEventListener('DOMContentLoaded', () => {
    window.mealPlanner = new MealPlanner();
});