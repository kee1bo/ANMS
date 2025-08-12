// Nutrition Plans Panel
// Orchestrates the Nutrition tab: shows current plan summary, next feed, and CTAs

class NutritionPlansPanel {
  constructor(options = {}) {
    this.root = document.getElementById('nutrition-plans');
    this.getSelectedPetId = options.getSelectedPetId || (() => null);
  }

  async refresh() {
    if (!this.root) return;
    const petId = this.getSelectedPetId();
    if (!petId) {
      this.renderEmptyState();
      return;
    }
    try {
      const res = await fetch('/api-bridge.php?action=get_nutrition_plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ pet_id: petId })
      });
      const json = await res.json();
      if (res.ok && json.success && json.nutrition_plan) {
        this.renderPlan(json.nutrition_plan);
      } else {
        this.renderEmptyState();
      }
    } catch (e) {
      console.warn('Failed to load plan', e);
      this.renderEmptyState();
    }
  }

  renderEmptyState() {
    this.root.innerHTML = `
      <div class="np-panel">
        <div class="np-grid">
          <div class="np-card np-card--feature">
            <div class="np-card-icon"><i class="fas fa-calculator"></i></div>
            <div class="np-card-title">Nutrition Calculator</div>
            <div class="np-card-text">Use the actions above to calculate daily calories and macronutrients.</div>
          </div>
          <div class="np-card np-card--feature">
            <div class="np-card-icon"><i class="fas fa-calendar-alt"></i></div>
            <div class="np-card-title">Meal Planner</div>
            <div class="np-card-text">After calculating requirements, generate a weekly schedule with automatic portions.</div>
          </div>
        </div>
      </div>
    `;
    // Auto-open calculator inline to ensure users can immediately interact
    try {
      setTimeout(async () => {
        if (typeof window.openNutritionCalculator === 'function') {
          await window.openNutritionCalculator();
        }
      }, 50);
    } catch (_) {}
  }

  renderPlan(plan) {
    const macros = {
      protein: plan.daily_protein_grams ?? plan.macros?.protein_grams ?? null,
      fat: plan.daily_fat_grams ?? plan.macros?.fat_grams ?? null,
      carbs: plan.macros?.carbohydrate_grams ?? null
    };
    const schedule = Array.isArray(plan.feeding_schedule) ? plan.feeding_schedule : (plan.calculation_details?.feeding_schedule || []);
    const mealsPerDay = plan.meals_per_day || (schedule?.length || 2);

    this.root.innerHTML = `
      <div class="np-panel">
        <div class="np-grid">
          <div class="np-card">
            <div class="np-card-title">Daily Calories</div>
            <div class="np-kpi">${plan.daily_calories} <span>kcal</span></div>
            <div class="np-badges">
              ${macros.protein ? `<span class="macro-pill macro-pill--protein"><i class="fas fa-drumstick-bite"></i> ${Math.round(macros.protein)}g protein</span>` : ''}
              ${macros.fat ? `<span class="macro-pill macro-pill--fat"><i class="fas fa-tint"></i> ${Math.round(macros.fat)}g fat</span>` : ''}
              ${macros.carbs ? `<span class="macro-pill macro-pill--carb"><i class="fas fa-seedling"></i> ${Math.round(macros.carbs)}g carbs</span>` : ''}
            </div>
          </div>

          <div class="np-card">
            <div class="np-card-title">Feeding Schedule</div>
            ${schedule && schedule.length ? `
              <ul class="np-schedule">
                ${schedule.map(t => `<li class="schedule-item"><i class=\"fas fa-clock\"></i> ${t}</li>`).join('')}
              </ul>
            ` : `<div class="np-card-text">${mealsPerDay} meals per day • schedule not set</div>`}
          </div>
        </div>
      </div>
    `;
  }
}

// Export global instance
window.NutritionPlansPanel = NutritionPlansPanel;


