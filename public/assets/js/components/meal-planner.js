/**
 * Meal Planner Component
 * Simple meal planning interface for pets
 */
class MealPlanner {
    constructor() {
        this.currentPet = null;
        this.mealPlan = {};
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
        // Listen for meal planning requests
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="plan-meals"]')) {
                const petId = e.target.dataset.petId;
                this.createMealPlan(petId);
            }
        });
    }

    async createMealPlan(petId) {
        try {
            // Get pet details if petId provided
            if (petId) {
                const response = await fetch(`/api/pets.php?id=${petId}`);
                const data = await response.json();
                
                if (data.success && data.pet) {
                    this.currentPet = data.pet;
                }
            }

            // Ask backend to generate a meal plan (auto-saves to DB)
            let meal = null;
            try {
                const res = await fetch('/api-bridge.php?action=nutrition_calculator', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ action: 'generate_meal_plan', pet_id: petId || (this.currentPet?.id) })
                });
                const json = await res.json();
                if (res.ok && json.success) {
                    meal = json.meal_plan;
                    this.mealPlan = meal;
                    
                    // Log activity for dashboard
                    this.logMealPlanActivity('meal_plan_created', {
                        pet_id: petId || this.currentPet?.id,
                        pet_name: this.currentPet?.name,
                        meals_per_day: meal?.meals_per_day || 2,
                        meal_schedule: meal?.meal_schedule
                    });
                    
                    // Trigger dashboard statistics update
                    this.triggerDashboardUpdate();
                }
            } catch (_) { /* silent fallback */ }

            this.showMealPlanInterface(meal);

            // Ask the main panel to refresh so schedule appears
            try { window.nutritionPlansPanel?.refresh(); } catch (_) {}
        } catch (error) {
            console.error('Error creating meal plan:', error);
            this.showError('Failed to load meal planner');
        }
    }

    showMealPlanInterface(meal) {
        const nutritionPlans = document.getElementById('nutrition-plans');
        if (!nutritionPlans) return;

        const schedule = meal?.meal_schedule || ['08:00','18:00'];
        const caloriesPerMeal = meal?.calories_per_meal || 0;
        const totalCalories = meal?.total_calories || (caloriesPerMeal * schedule.length);
        const petName = this.currentPet?.name || 'Your Pet';

        nutritionPlans.innerHTML = `
            <div class="meal-planner-container">
                <div class="planner-header">
                    <div class="header-content">
                        <div class="header-text">
                            <h3><i class="fas fa-calendar-alt"></i> Weekly Meal Planner</h3>
                            <p>Plan and schedule meals for ${petName} throughout the week</p>
                        </div>
                        <div class="header-stats">
                            <div class="stat-item">
                                <span class="stat-value">${schedule.length}</span>
                                <span class="stat-label">Meals/Day</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${totalCalories}</span>
                                <span class="stat-label">Total kcal</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="meal-planner-content">
                    <div class="schedule-controls">
                        <div class="control-group">
                            <label for="meals-per-day">Meals per day:</label>
                            <select id="meals-per-day" onchange="mealPlanner.updateMealSchedule(this.value)">
                                <option value="1" ${schedule.length === 1 ? 'selected' : ''}>1 meal</option>
                                <option value="2" ${schedule.length === 2 ? 'selected' : ''}>2 meals</option>
                                <option value="3" ${schedule.length === 3 ? 'selected' : ''}>3 meals</option>
                                <option value="4" ${schedule.length === 4 ? 'selected' : ''}>4 meals</option>
                            </select>
                        </div>
                        <div class="control-group">
                            <button class="btn btn-outline" onclick="mealPlanner.customizeSchedule()">
                                <i class="fas fa-edit"></i> Customize Times
                            </button>
                        </div>
                    </div>
                    
                    <div class="weekly-schedule">
                        ${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day, index) => `
                            <div class="day-column">
                                <div class="day-title">${day.substring(0,3)}</div>
                                <div class="day-date">${this.getDateForDay(index)}</div>
                                ${schedule.map((time, timeIndex) => `
                                    <div class="meal-slot" data-day="${index}" data-time="${timeIndex}">
                                        <div class="meal-time">
                                            <i class="fas fa-clock"></i> 
                                            <span class="time-display">${time}</span>
                                        </div>
                                        <div class="meal-meta">
                                            <span class="calories">~${caloriesPerMeal} kcal</span>
                                            <span class="portion">${meal?.portion_size || 'Standard'} portion</span>
                                        </div>
                                        <div class="meal-actions">
                                            <button class="action-btn" onclick="mealPlanner.logMeal(${index}, '${time}')" title="Mark as fed">
                                                <i class="fas fa-check"></i>
                                            </button>
                                            <button class="action-btn" onclick="mealPlanner.editMeal(${index}, ${timeIndex})" title="Edit meal">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="planner-actions">
                        <button class="btn btn-outline" onclick="mealPlanner.saveMealPlan()">
                            <i class="fas fa-save"></i> Save Plan
                        </button>
                        <button class="btn btn-outline" onclick="mealPlanner.printSchedule()">
                            <i class="fas fa-print"></i> Print Schedule
                        </button>
                        <button class="btn btn-primary" onclick="mealPlanner.setReminders()">
                            <i class="fas fa-bell"></i> Set Reminders
                        </button>
                    </div>
                </div>
                
                <div class="meal-insights">
                    <h4><i class="fas fa-lightbulb"></i> Feeding Tips</h4>
                    <div class="insights-grid">
                        ${this.generateFeedingTips().map(tip => `
                            <div class="insight-item">
                                <i class="fas ${tip.icon}"></i>
                                <span>${tip.text}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Setup event listeners for interactive elements
        this.setupMealPlanListeners();
    }

    showError(message) {
        const nutritionPlans = document.getElementById('nutrition-plans');
        if (!nutritionPlans) return;

        nutritionPlans.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="mealPlanner.createMealPlan()">
                    <i class="fas fa-refresh"></i> Try Again
                </button>
            </div>
        `;
    }
    
    /**
     * Get date for a specific day of the week (0 = Monday)
     */
    getDateForDay(dayIndex) {
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Adjust to make Monday = 0
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + mondayOffset + dayIndex);
        
        return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    /**
     * Generate feeding tips based on pet data
     */
    generateFeedingTips() {
        const tips = [
            {
                icon: 'fa-clock',
                text: 'Feed at consistent times daily to establish routine'
            },
            {
                icon: 'fa-tint',
                text: 'Always provide fresh water with meals'
            },
            {
                icon: 'fa-weight',
                text: 'Monitor portion sizes to maintain healthy weight'
            }
        ];
        
        // Add pet-specific tips
        if (this.currentPet) {
            if (this.currentPet.age < 1) {
                tips.push({
                    icon: 'fa-baby',
                    text: 'Puppies/kittens need more frequent meals for growth'
                });
            } else if (this.currentPet.age > 7) {
                tips.push({
                    icon: 'fa-heart',
                    text: 'Senior pets may benefit from smaller, more frequent meals'
                });
            }
            
            if (this.currentPet.activity_level === 'high') {
                tips.push({
                    icon: 'fa-running',
                    text: 'Active pets may need post-exercise snacks'
                });
            }
        }
        
        return tips.slice(0, 4); // Limit to 4 tips
    }
    
    /**
     * Setup event listeners for meal plan interface
     */
    setupMealPlanListeners() {
        // Add any additional event listeners here
        console.log('Meal plan interface ready');
    }
    
    /**
     * Update meal schedule based on meals per day
     */
    async updateMealSchedule(mealsPerDay) {
        try {
            const petId = this.currentPet?.id;
            if (!petId) return;
            
            // Generate new schedule
            const newSchedule = this.generateMealSchedule(parseInt(mealsPerDay));
            
            // Update the meal plan
            const response = await fetch('/api-bridge.php?action=nutrition_calculator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ 
                    action: 'update_meal_schedule',
                    pet_id: petId,
                    meals_per_day: parseInt(mealsPerDay),
                    meal_schedule: newSchedule
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Update local meal plan
                    this.mealPlan.meals_per_day = parseInt(mealsPerDay);
                    this.mealPlan.meal_schedule = newSchedule;
                    
                    // Re-render interface
                    this.showMealPlanInterface(this.mealPlan);
                    
                    // Log activity
                    this.logMealPlanActivity('meal_schedule_updated', {
                        pet_id: petId,
                        pet_name: this.currentPet.name,
                        meals_per_day: parseInt(mealsPerDay),
                        meal_schedule: newSchedule
                    });
                    
                    // Trigger dashboard update
                    this.triggerDashboardUpdate();
                }
            }
        } catch (error) {
            console.error('Error updating meal schedule:', error);
        }
    }
    
    /**
     * Generate meal schedule based on number of meals
     */
    generateMealSchedule(mealsPerDay) {
        switch (mealsPerDay) {
            case 1:
                return ['08:00'];
            case 2:
                return ['08:00', '18:00'];
            case 3:
                return ['08:00', '13:00', '18:00'];
            case 4:
                return ['07:00', '12:00', '17:00', '21:00'];
            default:
                return ['08:00', '18:00'];
        }
    }
    
    /**
     * Customize meal schedule times
     */
    customizeSchedule() {
        // This would open a modal for customizing meal times
        alert('Schedule customization coming soon!');
    }
    
    /**
     * Log a meal as fed
     */
    async logMeal(dayIndex, time) {
        try {
            const petId = this.currentPet?.id;
            if (!petId) return;
            
            // Log the meal feeding
            const response = await fetch('/api-bridge.php?action=nutrition_calculator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                    action: 'log_meal_fed',
                    pet_id: petId,
                    day_index: dayIndex,
                    meal_time: time,
                    fed_at: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                // Visual feedback
                const mealSlot = document.querySelector(`[data-day="${dayIndex}"][data-time="${time}"]`);
                if (mealSlot) {
                    mealSlot.classList.add('fed');
                    setTimeout(() => mealSlot.classList.remove('fed'), 2000);
                }
                
                // Log activity
                this.logMealPlanActivity('meal_logged', {
                    pet_id: petId,
                    pet_name: this.currentPet.name,
                    meal_time: time,
                    day: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][dayIndex]
                });
                
                // Update dashboard
                this.triggerDashboardUpdate();
            }
        } catch (error) {
            console.error('Error logging meal:', error);
        }
    }
    
    /**
     * Edit a specific meal
     */
    editMeal(dayIndex, timeIndex) {
        alert('Meal editing coming soon!');
    }
    
    /**
     * Save the current meal plan
     */
    async saveMealPlan() {
        try {
            if (!this.mealPlan || !this.currentPet) {
                throw new Error('No meal plan to save');
            }
            
            // The meal plan is already saved when created, but we can update it
            const response = await fetch('/api-bridge.php?action=nutrition_calculator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                    action: 'save_meal_plan',
                    pet_id: this.currentPet.id,
                    meal_plan: this.mealPlan
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Show success notification
                    if (window.app && window.app.showNotification) {
                        window.app.showNotification('Meal plan saved successfully!', 'success');
                    } else {
                        alert('Meal plan saved successfully!');
                    }
                    
                    // Log activity
                    this.logMealPlanActivity('meal_plan_saved', {
                        pet_id: this.currentPet.id,
                        pet_name: this.currentPet.name,
                        meals_per_day: this.mealPlan.meals_per_day
                    });
                }
            }
        } catch (error) {
            console.error('Error saving meal plan:', error);
            if (window.app && window.app.showNotification) {
                window.app.showNotification('Failed to save meal plan: ' + error.message, 'error');
            } else {
                alert('Failed to save meal plan: ' + error.message);
            }
        }
    }
    
    /**
     * Print meal schedule
     */
    printSchedule() {
        window.print();
    }
    
    /**
     * Set meal reminders
     */
    setReminders() {
        alert('Meal reminders feature coming soon!');
    }
    
    /**
     * Log meal plan activity for dashboard
     */
    async logMealPlanActivity(type, data) {
        try {
            if (window.app && window.app.logActivity) {
                await window.app.logActivity(type, {
                    description: data.description || this.getMealActivityDescription(type, data),
                    pet_id: data.pet_id,
                    metadata: {
                        pet_name: data.pet_name,
                        meals_per_day: data.meals_per_day,
                        meal_schedule: data.meal_schedule,
                        meal_time: data.meal_time,
                        day: data.day,
                        ...data
                    }
                });
            }
        } catch (error) {
            console.warn('Failed to log meal plan activity:', error);
        }
    }
    
    /**
     * Generate activity description based on type and data
     */
    getMealActivityDescription(type, data) {
        switch (type) {
            case 'meal_plan_created':
                return `Created meal plan for ${data.pet_name} (${data.meals_per_day} meals/day)`;
            case 'meal_schedule_updated':
                return `Updated meal schedule for ${data.pet_name} to ${data.meals_per_day} meals/day`;
            case 'meal_logged':
                return `Fed ${data.pet_name} at ${data.meal_time} on ${data.day}`;
            case 'meal_plan_saved':
                return `Saved meal plan for ${data.pet_name}`;
            default:
                return `Meal plan activity for ${data.pet_name}`;
        }
    }
    
    /**
     * Trigger dashboard statistics update
     */
    async triggerDashboardUpdate() {
        try {
            // Dispatch event for dashboard components to refresh
            document.dispatchEvent(new CustomEvent('mealPlanUpdated', {
                detail: {
                    pet_id: this.currentPet?.id,
                    meal_plan: this.mealPlan,
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

// Initialize meal planner
const mealPlanner = new MealPlanner();

// Make it globally available
window.mealPlanner = mealPlanner;