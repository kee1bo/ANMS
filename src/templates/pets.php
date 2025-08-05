<?php
// Assuming $_SESSION['user_name'] is set
$user_name = $_SESSION['user_name'] ?? 'Guest';

// Get pets data from mock data if available
$pets = [];
if (defined('USE_MOCK_DATA') && USE_MOCK_DATA) {
    require_once __DIR__ . '/../includes/mock_data.php';
    $pets = getMockPets($_SESSION['user_id'] ?? 1);
}
?>

<div class="content-wrapper">
    <div class="page-header">
        <div class="header-content">
            <div class="header-title">
                <h2>My Pets</h2>
                <p>Manage your beloved companions' profiles and information</p>
            </div>
            <div class="header-actions">
                <button class="notification-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                    <span class="notification-badge">2</span>
                </button>
                <div class="welcome-info">
                    <p>Welcome back!</p>
                    <p><?php echo date('M d, Y'); ?></p>
                </div>
            </div>
        </div>
    </div>
    
    <div class="main-content-area">
        <!-- Search and Add -->
        <div class="card">
            <div class="card-content">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div class="search-bar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search search-icon"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        <input
                            type="text"
                            placeholder="Search your pets..."
                            class="search-input"
                        />
                    </div>
                    <button
                        id="add-pet-button-pets-page"
                        class="btn btn-primary"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M12 5v14M5 12h14"/></svg>
                        <span>Add New Pet</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Pets Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="pets-grid">
            <!-- Pet cards loaded from PHP (enhanced by JavaScript) -->
            <?php if (empty($pets)): ?>
                <p class="text-gray-500 text-center col-span-full" id="no-pets-message-pets-page">No pets added yet. Click 'Add New Pet' to get started!</p>
            <?php else: ?>
                <?php foreach ($pets as $pet): ?>
                    <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden pet-card" data-pet-id="<?php echo $pet['id']; ?>">
                        <div class="p-6">
                            <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center space-x-3">
                                    <span class="text-4xl"><?php echo $pet['photo'] ?? '🐾'; ?></span>
                                    <div>
                                        <h3 class="text-xl font-bold text-gray-900"><?php echo htmlspecialchars($pet['name']); ?></h3>
                                        <p class="text-gray-600"><?php echo htmlspecialchars($pet['breed'] ?? 'Unknown'); ?></p>
                                    </div>
                                </div>
                                <button class="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit-3 w-5 h-5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                </button>
                            </div>
                            
                            <div class="space-y-3 mb-4">
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div class="flex items-center space-x-2">
                                        <span class="text-gray-500">Age:</span>
                                        <span class="font-medium"><?php echo $pet['age']; ?> years</span>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <span class="text-gray-500">Weight:</span>
                                        <span class="font-medium"><?php echo $pet['weight']; ?>kg</span>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <span class="text-gray-500">Activity:</span>
                                        <span class="font-medium"><?php echo $pet['activity_level']; ?></span>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <span class="text-gray-500">Goal:</span>
                                        <span class="font-medium"><?php echo $pet['ideal_weight'] ?? 'N/A'; ?>kg</span>
                                    </div>
                                </div>
                                
                                <div class="bg-gray-50 rounded-lg p-3">
                                    <p class="text-sm text-gray-600">
                                        <span class="font-medium">Personality:</span> <?php echo htmlspecialchars($pet['personality'] ?? 'N/A'); ?>
                                    </p>
                                </div>
                            </div>
                            
                            <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                                <span class="inline-flex px-3 py-1 text-sm font-medium rounded-full <?php 
                                    $status = $pet['health_status'] ?? 'N/A';
                                    if ($status === 'Healthy') echo 'bg-green-100 text-green-800';
                                    elseif (strpos($status, 'Overweight') !== false) echo 'bg-yellow-100 text-yellow-800';
                                    else echo 'bg-blue-100 text-blue-800';
                                ?>">
                                    <?php echo htmlspecialchars($status); ?>
                                </span>
                                <button class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1 view-diet-plan-btn" data-pet-id="<?php echo $pet['id']; ?>">
                                    <span>View Diet Plan</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right w-4 h-4"><path d="m9 18 6-6-6-6"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- Add Pet Modal (hidden by default) -->
<div id="add-pet-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-100">
            <div class="flex items-center justify-between">
                <h3 class="text-xl font-semibold text-gray-900">Add New Family Member</h3>
                <button id="close-add-pet-modal" class="text-gray-400 hover:text-gray-600">
                    ✕
                </button>
            </div>
            <p class="text-gray-600 text-sm mt-1">Tell us about your new pet so we can create the perfect nutrition plan</p>
        </div>
        
        <form id="add-pet-form" class="p-6">
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="pet-name" class="block text-sm font-medium text-gray-700 mb-2">Pet's Name *</label>
                        <input
                            type="text"
                            id="pet-name"
                            name="name"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="What's your pet's name?"
                            required
                        >
                    </div>
                    
                    <div>
                        <label for="pet-species" class="block text-sm font-medium text-gray-700 mb-2">Species *</label>
                        <select id="pet-species" name="species" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            <option value="">Choose your pet type</option>
                            <option value="Dog">Dog 🐕</option>
                            <option value="Cat">Cat 🐱</option>
                            <option value="Rabbit">Rabbit 🐰</option>
                            <option value="Bird">Bird 🐦</option>
                        </select>
                    </div>
                    
                    <div>
                        <label for="pet-breed" class="block text-sm font-medium text-gray-700 mb-2">Breed</label>
                        <input
                            type="text"
                            id="pet-breed"
                            name="breed"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Golden Retriever, Persian Cat"
                        >
                    </div>
                    
                    <div>
                        <label for="pet-age" class="block text-sm font-medium text-gray-700 mb-2">Age *</label>
                        <input
                            type="number"
                            id="pet-age"
                            name="age"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Age in years"
                            required
                        >
                    </div>
                    
                    <div>
                        <label for="pet-weight" class="block text-sm font-medium text-gray-700 mb-2">Current Weight (kg) *</label>
                        <input
                            type="number"
                            step="0.1"
                            id="pet-weight"
                            name="weight"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Current weight"
                            required
                        >
                    </div>
                    
                    <div>
                        <label for="pet-activity" class="block text-sm font-medium text-gray-700 mb-2">Activity Level *</label>
                        <select id="pet-activity" name="activity_level" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            <option value="">How active is your pet?</option>
                            <option value="Low">Low - Mostly indoors, minimal exercise</option>
                            <option value="Medium">Medium - Regular walks, some playtime</option>
                            <option value="High">High - Very active, lots of exercise</option>
                        </select>
                    </div>
                    <div>
                        <label for="pet-photo" class="block text-sm font-medium text-gray-700 mb-2">Pet Photo (Emoji)</label>
                        <input
                            type="text"
                            id="pet-photo"
                            name="photo"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., 🐕, 🐱, 🐰"
                        >
                    </div>
                </div>
                
                <div>
                    <label for="pet-personality" class="block text-sm font-medium text-gray-700 mb-2">Personality & Notes</label>
                    <textarea
                        id="pet-personality"
                        name="personality"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                        placeholder="Tell us about your pet's personality, any health conditions, or special needs..."
                    ></textarea>
                </div>
            </div>
        </form>
        
        <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
            <button
                id="cancel-add-pet"
                type="button"
                class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
                Cancel
            </button>
            <button
                id="submit-add-pet"
                type="submit"
                form="add-pet-form"
                class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Add My Pet
            </button>
        </div>
    </div>
</div>