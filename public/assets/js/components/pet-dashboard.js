// Comprehensive Pet Dashboard Modal
(function(){
  async function fetchPet(petId) {
    const res = await fetch(`/api-bridge.php?action=get_pets`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin' 
    });
    if (!res.ok) throw new Error('Failed to fetch pets');
    const json = await res.json();
    if (!json.success || !json.pets) throw new Error(json.error || 'Pets not found');
    const pet = json.pets.find(p => String(p.id) === String(petId));
    if (!pet) throw new Error('Pet not found');
    return pet;
  }

  async function fetchPlan(petId) {
    try {
      const res = await fetch('/api-bridge.php?action=get_nutrition_plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ pet_id: petId })
      });
      const json = await res.json();
      if (!res.ok || !json.success) return null;
      return json.nutrition_plan || null;
    } catch { return null; }
  }

  async function recalculateEngine(petId) {
    const res = await fetch('/api-bridge.php?action=nutrition_engine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ pet_id: petId })
    });
    const json = await res.json().catch(()=>({success:false}));
    if (!res.ok || !json.success) throw new Error(json.error || 'Recalculation failed');
    return true;
  }

  async function ensurePlan(petId) {
    let plan = await fetchPlan(petId);
    const hasMacros = !!(plan && ((plan.daily_protein_grams ?? null) !== null || (plan.macros?.protein_grams ?? null) !== null));
    if (!plan || !hasMacros) {
      try {
        await recalculateEngine(petId);
        plan = await fetchPlan(petId);
      } catch (_) { /* ignore; render whatever exists */ }
    }
    return plan;
  }

  async function fetchHealthRecords(petId) {
    try {
      const res = await fetch('/api-bridge.php?action=health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ pet_id: petId })
      });
      const json = await res.json();
      return (json.success && json.health_records) ? json.health_records : [];
    } catch { return []; }
  }

  function petInfoCard(pet) {
    const age = pet.age ? `${pet.age} years` : 'Age unknown';
    const weight = pet.weight ? `${pet.weight}kg` : 'Weight unknown';
    const activityLevel = pet.activity_level || 'moderate';
    const lifeStage = pet.life_stage || 'adult';
    
    return `
      <div class="dashboard-card pet-info-card">
        <div class="card-header">
          <h3><i class="fas fa-id-card"></i> Pet Profile</h3>
        </div>
        <div class="card-content">
          <div class="pet-avatar-large">
            <i class="fas ${getSpeciesIcon(pet.species)}"></i>
          </div>
          <div class="pet-details-grid">
            <div class="detail-item">
              <span class="detail-label">Species</span>
              <span class="detail-value">${pet.species}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Breed</span>
              <span class="detail-value">${pet.breed || 'Mixed'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Age</span>
              <span class="detail-value">${age}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Weight</span>
              <span class="detail-value">${weight}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Activity Level</span>
              <span class="detail-value activity-${activityLevel}">${activityLevel}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Life Stage</span>
              <span class="detail-value">${lifeStage}</span>
            </div>
          </div>
        </div>
      </div>`;
  }

  function nutritionCard(plan) {
    if (!plan) {
      return `
        <div class="dashboard-card nutrition-card">
          <div class="card-header">
            <h3><i class="fas fa-calculator"></i> Nutrition Plan</h3>
          </div>
          <div class="card-content">
            <div class="empty-state">
              <i class="fas fa-utensils empty-icon"></i>
              <h4>No Nutrition Plan Yet</h4>
              <p>Create a personalized nutrition plan for optimal health</p>
              <button class="btn btn-primary" onclick="openNutritionCalculator()">
                <i class="fas fa-calculator"></i> Calculate Nutrition
              </button>
            </div>
          </div>
        </div>`;
    }

    const calories = plan.daily_calories || plan.calories?.der || 0;
    const protein = plan.daily_protein_grams || plan.macros?.protein_grams || 0;
    const fat = plan.daily_fat_grams || plan.macros?.fat_grams || 0;
    const carbs = plan.daily_carb_grams || plan.macros?.carbohydrate_grams || plan.macros?.carb_grams || 0;

    return `
      <div class="dashboard-card nutrition-card">
        <div class="card-header">
          <h3><i class="fas fa-calculator"></i> Daily Nutrition Plan</h3>
          <div style="display:flex;gap:8px;align-items:center;">
            <button class="btn btn-sm btn-outline" onclick="openNutritionCalculator()">
              <i class="fas fa-sliders-h"></i> Adjust
            </button>
            <button class="btn btn-sm btn-primary" onclick="(async()=>{try{await fetch('/api-bridge.php?action=nutrition_engine',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({pet_id:window.__currentPetId})}); if(window.nutritionPlansPanel) nutritionPlansPanel.refresh(); openPetDashboard(window.__currentPetId);}catch(e){app?.showNotification('Recalculation failed','error')}})()">
              <i class="fas fa-sync-alt"></i> Recalculate
            </button>
          </div>
        </div>
        <div class="card-content">
          <div class="nutrition-summary">
            <div class="calorie-display">
              <div class="calorie-number">${Math.round(calories)}</div>
              <div class="calorie-label">kcal/day</div>
            </div>
            <div class="macro-breakdown">
              <div class="macro-item protein">
                <div class="macro-bar">
                  <div class="macro-fill" style="width: ${Math.min(100, (protein/calories)*400)}%"></div>
                </div>
                <div class="macro-label">
                  <i class="fas fa-drumstick-bite"></i>
                  <span>Protein: ${Math.round(protein)}g</span>
                </div>
              </div>
              <div class="macro-item fat">
                <div class="macro-bar">
                  <div class="macro-fill" style="width: ${Math.min(100, (fat/calories)*900)}%"></div>
                </div>
                <div class="macro-label">
                  <i class="fas fa-tint"></i>
                  <span>Fat: ${Math.round(fat)}g</span>
                </div>
              </div>
              <div class="macro-item carbs">
                <div class="macro-bar">
                  <div class="macro-fill" style="width: ${Math.min(100, (carbs/calories)*400)}%"></div>
                </div>
                <div class="macro-label">
                  <i class="fas fa-seedling"></i>
                  <span>Carbs: ${Math.round(carbs)}g</span>
                </div>
              </div>
            </div>
          </div>
          ${plan.calculation_details?.warnings ? `
            <div class="nutrition-warnings">
              <h4><i class="fas fa-exclamation-triangle"></i> Recommendations</h4>
              <ul>
                ${plan.calculation_details.warnings.map(w => `<li>${w}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>`;
  }

  function mealPlanCard(plan) {
    if (!plan || !plan.feeding_schedule) {
      return `
        <div class="dashboard-card meal-plan-card">
          <div class="card-header">
            <h3><i class="fas fa-calendar-week"></i> Meal Plan</h3>
          </div>
          <div class="card-content">
            <div class="empty-state">
              <i class="fas fa-clock empty-icon"></i>
              <h4>No Meal Plan Yet</h4>
              <p>Create a weekly feeding schedule</p>
              <button class="btn btn-primary" onclick="openMealPlanner()">
                <i class="fas fa-calendar-week"></i> Plan Meals
              </button>
            </div>
          </div>
        </div>`;
    }

    const schedule = Array.isArray(plan.feeding_schedule) ? plan.feeding_schedule : [];
    const mealsPerDay = plan.meals_per_day || schedule.length || 2;
    const caloriesPerMeal = plan.daily_calories ? Math.round(plan.daily_calories / mealsPerDay) : 0;

    return `
      <div class="dashboard-card meal-plan-card">
        <div class="card-header">
          <h3><i class="fas fa-calendar-week"></i> Daily Meal Schedule</h3>
          <button class="btn btn-sm btn-outline" onclick="openMealPlanner()">
            <i class="fas fa-edit"></i> Update Plan
          </button>
        </div>
        <div class="card-content">
          <div class="meal-summary">
            <div class="meal-stat">
              <div class="stat-number">${mealsPerDay}</div>
              <div class="stat-label">meals/day</div>
            </div>
            <div class="meal-stat">
              <div class="stat-number">${caloriesPerMeal}</div>
              <div class="stat-label">kcal/meal</div>
            </div>
          </div>
          <div class="feeding-schedule">
            ${schedule.map((time, index) => `
              <div class="feeding-time">
                <div class="time-badge">${time}</div>
                <div class="meal-details">
                  <span>Meal ${index + 1}</span>
                  <small>${caloriesPerMeal} kcal</small>
                </div>
              </div>
            `).join('')}
          </div>
          ${plan.portion_guidance ? `
            <div class="portion-guidance">
              <h4><i class="fas fa-balance-scale"></i> Portion Guidance</h4>
              <div class="portion-options">
                ${plan.portion_guidance.dry_food ? `
                  <div class="portion-option">
                    <span class="portion-type">Dry Food</span>
                    <span class="portion-amount">${plan.portion_guidance.dry_food}</span>
                  </div>
                ` : ''}
                ${plan.portion_guidance.wet_food ? `
                  <div class="portion-option">
                    <span class="portion-type">Wet Food</span>
                    <span class="portion-amount">${plan.portion_guidance.wet_food}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      </div>`;
  }

  function healthCard(healthRecords) {
    return `
      <div class="dashboard-card health-card">
        <div class="card-header">
          <h3><i class="fas fa-heart"></i> Health Overview</h3>
          <button class="btn btn-sm btn-outline" onclick="logWeight(window.__currentPetId)">
            <i class="fas fa-weight-hanging"></i> Log Weight
          </button>
        </div>
        <div class="card-content">
          ${healthRecords.length > 0 ? `
            <div class="health-summary">
              <div class="recent-records">
                ${healthRecords.slice(0, 3).map(record => `
                  <div class="health-record">
                    <div class="record-type">${record.type}</div>
                    <div class="record-value">${record.value} ${record.unit || ''}</div>
                    <div class="record-date">${new Date(record.recorded_at).toLocaleDateString()}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <div class="empty-state">
              <i class="fas fa-stethoscope empty-icon"></i>
              <h4>No Health Records Yet</h4>
              <p>Start tracking your pet's health metrics</p>
            </div>
          `}
        </div>
      </div>`;
  }

  function getSpeciesIcon(species) {
    const icons = {
      'dog': 'fa-dog',
      'cat': 'fa-cat',
      'bird': 'fa-dove',
      'rabbit': 'fa-rabbit',
      'fish': 'fa-fish'
    };
    return icons[species?.toLowerCase()] || 'fa-paw';
  }

  function header(pet){
    return `
      <div class="modal-header">
        <div class="modal-title">
          <i class="fas ${getSpeciesIcon(pet.species)}"></i>
          <h2>${pet.name}'s Dashboard <small style="font-size:14px;color:#64748b;margin-left:8px">${pet.species}${pet.breed?` · ${pet.breed}`:''}</small></h2>
        </div>
        <button class="modal-close-btn" onclick="app.closeModal()"><i class="fas fa-times"></i></button>
      </div>`;
  }

  function body(pet, plan, healthRecords){
    return `
      <div class="professional-modal-content professional-modal--wide">
        <div class="modal-body-scrollable">
          <div class="dashboard-grid">
            <div class="dashboard-column">
              ${petInfoCard(pet)}
              ${healthCard(healthRecords)}
            </div>
            <div class="dashboard-column">
              ${nutritionCard(plan)}
            </div>
            <div class="dashboard-column">
              ${mealPlanCard(plan)}
            </div>
          </div>
        </div>
      </div>`;
  }

  async function openPetDashboard(petId){
    try {
      const [pet, plan, healthRecords] = await Promise.all([
        fetchPet(petId),
        fetchPlan(petId),
        fetchHealthRecords(petId)
      ]);
      
      window.__currentPetId = petId;
      const modalBody = document.getElementById('modal-body');
      if (!modalBody) return;
      modalBody.innerHTML = header(pet) + body(pet, plan, healthRecords);
      if (window.app) window.app.showModal();
    } catch (e) {
      console.error('Pet dashboard error:', e);
      if (window.app) window.app.showNotification('Unable to open pet dashboard: '+(e.message||'error'), 'error');
    }
  }

  window.openPetDashboard = openPetDashboard;
})();


