<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PetNutri - Dashboard</title>
    <!-- Professional Design System -->
    <link rel="stylesheet" href="<?php echo rtrim(dirname($_SERVER['SCRIPT_NAME']), '/') . '/'; ?>assets/css/petnutri-professional.css">
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="flex">
        <!-- Navigation -->
        <div class="bg-gradient-to-b from-blue-600 to-blue-700 text-white h-screen w-64 fixed left-0 top-0 overflow-y-auto shadow-xl sidebar">
            <div class="p-6 sidebar-content">
                <div class="logo">
                    <div class="logo-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    </div>
                    <div class="logo-text">
                        <h1>PetNutri</h1>
                        <p>Your Pet's Health Hub</p>
                    </div>
                </div>

                <nav class="space-y-2 nav-links">
                    <a href="/dashboard" class="nav-link <?php echo (isset($_GET['page']) && $_GET['page'] == 'dashboard') || !isset($_GET['page']) ? 'active' : ''; ?>">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home w-5 h-5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        <span class="font-medium">My Dashboard</span>
                    </a>
                    <a href="/pets" class="nav-link <?php echo (isset($_GET['page']) && $_GET['page'] == 'pets') ? 'active' : ''; ?>">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart w-5 h-5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                        <span class="font-medium">My Pets</span>
                    </a>
                    <a href="/nutrition" class="nav-link <?php echo (isset($_GET['page']) && $_GET['page'] == 'nutrition') ? 'active' : ''; ?>">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity w-5 h-5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                        <span class="font-medium">Nutrition Plans</span>
                    </a>
                    <a href="/progress" class="nav-link <?php echo (isset($_GET['page']) && $_GET['page'] == 'progress') ? 'active' : ''; ?>">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bar-chart-3 w-5 h-5"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                        <span class="font-medium">Health Progress</span>
                    </a>
                    <a href="/education" class="nav-link <?php echo (isset($_GET['page']) && $_GET['page'] == 'education') ? 'active' : ''; ?>">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open w-5 h-5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        <span class="font-medium">Learn & Tips</span>
                    </a>
                    <a href="/settings" class="nav-link <?php echo (isset($_GET['page']) && $_GET['page'] == 'settings') ? 'active' : ''; ?>">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings w-5 h-5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                        <span class="font-medium">Account Settings</span>
                    </a>
                </nav>

                <div class="user-profile">
                    <div class="user-card">
                        <div class="user-info">
                            <div class="user-avatar">
                                <span><?php echo substr($_SESSION['user_name'], 0, 1); ?></span>
                            </div>
                            <div class="user-details">
                                <h3><?php echo $_SESSION['user_name']; ?></h3>
                                <p>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M12 17.5L19 10.2C20.2 8.9 20.2 6.9 19 5.7c-1.2-1.2-3.2-1.2-4.5 0L12 8.2 9.5 5.7c-1.2-1.2-3.2-1.2-4.5 0-1.2 1.2-1.2 3.2 0 4.5L12 17.5z"/><circle cx="12" cy="10" r="3"/></svg>
                                    <?php echo $_SESSION['user_location'] ?? 'Test Location'; ?>
                                </p>
                            </div>
                        </div>
                        <p class="member-since">Member since <?php echo date('M Y', strtotime($_SESSION['member_since'] ?? 'now')); ?></p>
                    </div>
                    <a href="/api.php?action=auth&logout=true" class="sign-out-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="17 17 22 12 17 7"/><line x1="22" x2="10" y1="12" y2="12"/></svg>
                        <span>Sign Out</span>
                    </a>
                </div>
            </div>
        </div>

        <!-- Main Content Area -->
        <div class="ml-64 flex-1 main-content">
