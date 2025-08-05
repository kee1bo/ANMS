<?php
// Assuming $_SESSION['user_name'] and $_SESSION['user_id'] are set from auth.php
$user_name = $_SESSION['user_name'] ?? 'Guest';
$user_location = $_SESSION['user_location'] ?? 'San Francisco, CA'; // Placeholder
$member_since = $_SESSION['member_since'] ?? 'March 2024'; // Placeholder

// Get pets data from mock data if available
$pets = [];
$pets_count = 0;
$healthy_pets_count = 0;

if (defined('USE_MOCK_DATA') && USE_MOCK_DATA) {
    require_once __DIR__ . '/../includes/mock_data.php';
    $pets = getMockPets($_SESSION['user_id'] ?? 1);
    $pets_count = count($pets);
    $healthy_pets_count = count(array_filter($pets, function($pet) {
        return $pet['health_status'] === 'Healthy';
    }));
} else {
    // If using real database, we'll let JavaScript handle it
    $pets_count = 0; // This will be updated by JS
}
?>

<div class="page-content">
    <div class="page-header">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-3xl font-bold text-gray-900">My Pet Dashboard</h2>
                <p class="text-gray-600 mt-2">Keep track of your furry family members' health and nutrition</p>
            </div>
            <div class="flex items-center gap-4">
                <button class="btn btn-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                    <span class="badge badge-error">2</span>
                </button>
                <div class="text-right">
                    <p class="text-sm text-gray-600">Welcome back!</p>
                    <p class="text-sm font-medium text-gray-900"><?php echo date('M d, Y'); ?></p>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Welcome Banner -->
    <div class="card mb-8">
        <div class="card-body">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-xl font-bold text-gray-900">Hello, <?php echo $user_name; ?>! 👋</h3>
                    <p class="text-gray-600 mt-2">You have <span id="pets-count" class="font-medium text-primary-600"><?php echo $pets_count; ?></span> beautiful pets in your care</p>
                    <div class="mt-4">
                        <span class="badge badge-success">This week: All pets healthy!</span>
                    </div>
                </div>
                <div class="text-6xl">🐕🐱</div>
            </div>
        </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-3 gap-6 mb-8">
        <div class="card">
            <div class="card-body">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600">My Pets</p>
                        <p class="text-3xl font-bold text-primary-600" id="stats-pets-count"><?php echo $pets_count; ?></p>
                        <p class="text-sm text-gray-500">Furry family members</p>
                    </div>
                    <div class="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-pink-600"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    </div>
                </div>
            </div>
        </div>
        <div class="card">
            <div class="card-body">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600">On Track</p>
                        <p class="text-3xl font-bold text-success-600" id="stats-healthy-pets"><?php echo $healthy_pets_count; ?></p>
                        <p class="text-sm text-gray-500">Pets maintaining healthy weight</p>
                    </div>
                    <div class="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-success-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                    </div>
                </div>
            </div>
        </div>
        <div class="card">
            <div class="card-body">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600">Streak</p>
                        <p class="text-3xl font-bold text-warning-600">12 days</p>
                        <p class="text-sm text-gray-500">Consistent feeding schedule</p>
                    </div>
                    <div class="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-warning-600"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- My Pets Overview -->
    <div class="grid grid-cols-2 gap-6 mb-8">
        <div class="card">
            <div class="card-header">
                <div class="flex items-center justify-between">
                    <h3 class="card-title">My Pets</h3>
                    <button id="add-pet-button-dashboard" class="btn btn-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                        <span>Add Pet</span>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="space-y-4" id="pets-overview-list">
                    <!-- Pet cards loaded from PHP (enhanced by JavaScript) -->
                    <?php if (empty($pets)): ?>
                        <p class="text-gray-500 text-center" id="no-pets-message">No pets added yet. Click 'Add Pet' to get started!</p>
                    <?php else: ?>
                        <?php foreach ($pets as $pet): ?>
                            <div class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors pet-card" data-pet-id="<?php echo $pet['id']; ?>">
                                <div class="text-3xl"><?php echo $pet['photo'] ?? '🐾'; ?></div>
                                <div class="flex-1">
                                    <div class="flex items-center justify-between">
                                        <h4 class="font-semibold text-gray-900"><?php echo htmlspecialchars($pet['name']); ?></h4>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-gray-400"><path d="m9 18 6-6-6-6"/></svg>
                                    </div>
                                    <p class="text-sm text-gray-600"><?php echo htmlspecialchars($pet['breed'] ?? 'Unknown'); ?> • <?php echo $pet['age']; ?> years old</p>
                                    <div class="flex items-center gap-4 mt-2">
                                        <span class="badge <?php 
                                            $status = $pet['health_status'] ?? 'N/A';
                                            if ($status === 'Healthy') echo 'badge-success';
                                            elseif (strpos($status, 'Overweight') !== false) echo 'badge-warning';
                                            else echo 'badge-primary';
                                        ?>">
                                            <?php echo htmlspecialchars($status); ?>
                                        </span>
                                        <span class="text-xs text-gray-500"><?php echo $pet['weight']; ?>kg</span>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Recent Activity</h3>
            </div>
            <div class="card-body">
                <div class="space-y-4">
                    <!-- Activity items will be loaded here by JavaScript or static for now -->
                    <div class="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                        <span class="text-2xl">🍽️</span>
                        <div class="flex-1">
                            <p class="font-medium text-gray-900">Buddy</p>
                            <p class="text-sm text-gray-600">Fed breakfast - 1 cup kibble</p>
                        </div>
                        <span class="text-xs text-gray-500">2 hours ago</span>
                    </div>
                    <div class="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                        <span class="text-2xl">⚖️</span>
                        <div class="flex-1">
                            <p class="font-medium text-gray-900">Whiskers</p>
                            <p class="text-sm text-gray-600">Weight check: 5.8kg</p>
                        </div>
                        <span class="text-xs text-gray-500">Yesterday</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Quick Actions</h3>
        </div>
        <div class="card-body">
            <div class="grid grid-cols-3 gap-4">
                <button onclick="window.location.href='index.php?page=progress'" class="flex flex-col items-center p-6 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors">
                    <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600"><path d="m16 16 3-3m-3 3 3 3m-3-3H4m12 0a7 7 0 1 1 0-14h5v4"/></svg>
                    </div>
                    <h4 class="font-semibold text-gray-900 mb-1">Log Weight</h4>
                    <p class="text-sm text-gray-600 text-center">Record your pet's weight</p>
                </button>
                <button onclick="window.location.href='index.php?page=nutrition'" class="flex flex-col items-center p-6 rounded-xl bg-success-50 hover:bg-success-100 transition-colors">
                    <div class="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-success-600"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </div>
                    <h4 class="font-semibold text-gray-900 mb-1">View Diet Plan</h4>
                    <p class="text-sm text-gray-600 text-center">Check nutrition recommendations</p>
                </button>
                <button onclick="window.location.href='index.php?page=education'" class="flex flex-col items-center p-6 rounded-xl bg-secondary-50 hover:bg-secondary-100 transition-colors">
                    <div class="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-secondary-600"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    </div>
                    <h4 class="font-semibold text-gray-900 mb-1">Pet Care Tips</h4>
                    <p class="text-sm text-gray-600 text-center">Learn about pet nutrition</p>
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Add Pet Modal (hidden by default) -->
<div id="add-pet-modal" class="modal-overlay hidden" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <div>
                <h3 class="modal-title">Add New Family Member</h3>
                <p class="text-gray-600">Tell us about your new pet so we can create the perfect nutrition plan</p>
            </div>
            <button id="close-add-pet-modal" class="text-gray-400 hover:text-gray-600">
                ✕
            </button>
        </div>
        
        <form id="add-pet-form" class="modal-body">
            <div class="space-y-6">
                <!-- Basic Information Section -->
                <div>
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label for="pet-name" class="form-label">Pet's Name *</label>
                            <input
                                type="text"
                                id="pet-name"
                                name="name"
                                class="form-input"
                                placeholder="What's your pet's name?"
                                required
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="pet-species" class="form-label">Species *</label>
                            <select id="pet-species" name="species" class="form-select" required>
                                <option value="">Choose your pet type</option>
                                <option value="Dog">🐕 Dog</option>
                                <option value="Cat">🐱 Cat</option>
                                <option value="Rabbit">🐰 Rabbit</option>
                                <option value="Bird">🐦 Bird</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="pet-breed" class="form-label">Breed</label>
                            <input type="text" id="pet-breed" name="breed" class="form-input" placeholder="e.g., Golden Retriever, Persian Cat">
                        </div>
                        
                        <div class="form-group">
                            <label for="pet-age" class="form-label">Age *</label>
                            <input type="number" id="pet-age" name="age" class="form-input" placeholder="Age in years" min="0" max="30" required>
                        </div>
                    </div>
                </div>

                <!-- Physical Details Section -->
                <div>
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Physical Details</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label for="pet-weight" class="form-label">Current Weight (kg) *</label>
                            <input type="number" step="0.1" id="pet-weight" name="weight" class="form-input" placeholder="Current weight" min="0.1" max="200" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="pet-activity" class="form-label">Activity Level *</label>
                            <select id="pet-activity" name="activity_level" class="form-select" required>
                                <option value="">How active is your pet?</option>
                                <option value="Low">Low - Mostly indoors, minimal exercise</option>
                                <option value="Medium">Medium - Regular walks, some playtime</option>
                                <option value="High">High - Very active, lots of exercise</option>
                            </select>
                        </div>
                        
                        <div class="form-group md:col-span-2">
                            <label for="pet-photo" class="form-label">Pet Avatar (Emoji)</label>
                            <input type="text" id="pet-photo" name="photo" class="form-input" placeholder="e.g., 🐕, 🐱, 🐰, or leave empty for default">
                            <p class="text-xs text-gray-500 mt-1">Choose an emoji to represent your pet</p>
                        </div>
                    </div>
                </div>
                
                <!-- Additional Details Section -->
                <div>
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Additional Details</h4>
                    <div class="form-group">
                        <label for="pet-personality" class="form-label">Personality & Notes</label>
                        <textarea id="pet-personality" name="personality" class="form-textarea" rows="3" placeholder="Tell us about your pet's personality, any health conditions, or special needs..."></textarea>
                        <p class="text-xs text-gray-500 mt-1">This helps us create a better nutrition plan</p>
                    </div>
                </div>
            </div>
        </form>
        
        <div class="modal-footer">
            <button id="cancel-add-pet" type="button" class="btn btn-secondary">Cancel</button>
            <button id="submit-add-pet" type="submit" form="add-pet-form" class="btn btn-primary">Add My Pet</button>
        </div>
    </div>
</div>