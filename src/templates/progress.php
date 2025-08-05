<div class="page-content">
    <div class="page-header">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-3xl font-bold text-gray-900">Health Progress</h2>
                <p class="text-gray-600 mt-2">Track your pets' health journey and achievements</p>
            </div>
            <button class="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                Log Weight
            </button>
        </div>
    </div>

    <!-- Progress Overview -->
    <div class="grid grid-cols-3 gap-6 mb-8">
        <div class="card">
            <div class="card-body">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600">Average Weight</p>
                        <p class="text-3xl font-bold text-primary-600">8.2 kg</p>
                        <p class="text-sm text-gray-500">Across all pets</p>
                    </div>
                    <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600"><path d="m16 16 3-3m-3 3 3 3m-3-3H4m12 0a7 7 0 1 1 0-14h5v4"/></svg>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-body">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600">This Month</p>
                        <p class="text-3xl font-bold text-success-600">+0.3 kg</p>
                        <p class="text-sm text-gray-500">Healthy weight gain</p>
                    </div>
                    <div class="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-success-600"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-body">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600">Goal Progress</p>
                        <p class="text-3xl font-bold text-warning-600">85%</p>
                        <p class="text-sm text-gray-500">Target achievement</p>
                    </div>
                    <div class="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-warning-600"><path d="M22 12c0-6-4-6-6-6H8c-2 0-6 0-6 6"/></svg>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Individual Pet Progress -->
    <div class="grid grid-cols-2 gap-6 mb-8">
        <div class="card">
            <div class="card-header">
                <div class="flex items-center justify-between">
                    <h3 class="card-title">Buddy's Progress</h3>
                    <span class="badge badge-success">On Track</span>
                </div>
            </div>
            <div class="card-body">
                <div class="mb-6">
                    <div class="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Current: 25.2kg</span>
                        <span>Goal: 24.0kg</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div class="bg-primary-600 h-3 rounded-full" style="width: 75%"></div>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Last weigh-in</span>
                        <span class="text-sm font-medium">Dec 20, 2024</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Weight change</span>
                        <span class="text-sm font-medium text-success-600">-0.5kg this month</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Activity level</span>
                        <span class="text-sm font-medium">High</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="flex items-center justify-between">
                    <h3 class="card-title">Whiskers' Progress</h3>
                    <span class="badge badge-warning">Needs Attention</span>
                </div>
            </div>
            <div class="card-body">
                <div class="mb-6">
                    <div class="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Current: 5.8kg</span>
                        <span>Goal: 5.2kg</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div class="bg-warning-600 h-3 rounded-full" style="width: 45%"></div>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Last weigh-in</span>
                        <span class="text-sm font-medium">Dec 18, 2024</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Weight change</span>
                        <span class="text-sm font-medium text-warning-600">+0.2kg this month</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Activity level</span>
                        <span class="text-sm font-medium">Medium</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Weight Chart Section -->
    <div class="card mb-8">
        <div class="card-header">
            <div class="flex items-center justify-between">
                <h3 class="card-title">Weight Tracking Chart</h3>
                <div class="flex gap-2">
                    <button class="btn btn-sm btn-secondary">7D</button>
                    <button class="btn btn-sm btn-primary">30D</button>
                    <button class="btn btn-sm btn-secondary">90D</button>
                </div>
            </div>
        </div>
        <div class="card-body">
            <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div class="text-center">
                    <div class="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                    </div>
                    <p class="text-gray-600">Weight tracking chart would be displayed here</p>
                    <p class="text-sm text-gray-500 mt-1">Interactive chart showing weight trends over time</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Health Milestones -->
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Recent Milestones</h3>
        </div>
        <div class="card-body">
            <div class="space-y-4">
                <div class="flex items-center gap-4 p-4 rounded-lg bg-success-50 border border-success-200">
                    <div class="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-success-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900">Buddy reached ideal weight range!</h4>
                        <p class="text-sm text-gray-600">December 15, 2024 - Lost 2kg in 3 months</p>
                    </div>
                </div>

                <div class="flex items-center gap-4 p-4 rounded-lg bg-primary-50 border border-primary-200">
                    <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900">30-day feeding streak!</h4>
                        <p class="text-sm text-gray-600">December 10, 2024 - Consistent meal timing</p>
                    </div>
                </div>

                <div class="flex items-center gap-4 p-4 rounded-lg bg-secondary-50 border border-secondary-200">
                    <div class="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-secondary-600"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900">Health checkup completed</h4>
                        <p class="text-sm text-gray-600">December 5, 2024 - All pets are healthy</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>