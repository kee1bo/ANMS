<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In - PetNutri</title>
    <meta name="description" content="Sign in to your PetNutri account to manage your pet's nutrition and health.">
    <link rel="stylesheet" href="<?php echo rtrim(dirname($_SERVER['SCRIPT_NAME']), '/') . '/'; ?>assets/css/petnutri-professional.css">
</head>
<body class="bg-gradient-to-br from-primary-50 via-white to-secondary-50 min-h-screen">
    <!-- Background Pattern -->
    <div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
    
    <!-- Header -->
    <header class="relative z-10">
        <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex items-center justify-between">
                <!-- Logo -->
                <a href="?" class="flex items-center space-x-3 group">
                    <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-gray-900">PetNutri</h1>
                        <p class="text-xs text-gray-500 -mt-1">Smart Pet Care</p>
                    </div>
                </a>

                <!-- Back to Home -->
                <a href="?" class="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                    ← Back to Home
                </a>
            </div>
        </nav>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div class="max-w-md w-full">
            <!-- Welcome Section -->
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h2>
                <p class="text-gray-600">Sign in to continue managing your pet's health and nutrition.</p>
            </div>

            <!-- Login Form -->
            <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 animate-fade-in-up">
                <!-- Social Login Options -->
                <div class="space-y-3 mb-6">
                    <button class="w-full btn btn-secondary btn-lg flex items-center justify-center gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </button>
                    
                    <button class="w-full btn btn-secondary btn-lg flex items-center justify-center gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Continue with Facebook
                    </button>
                </div>

                <!-- Divider -->
                <div class="relative mb-6">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-300"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-2 bg-white text-gray-500">Or continue with email</span>
                    </div>
                </div>

                <!-- Email/Password Form -->
                <form action="api.php?action=auth" method="POST" class="space-y-6" id="login-form">
                    <input type="hidden" name="login" value="1">
                    <!-- Email Field -->
                    <div class="form-field">
                        <label for="email" class="form-label form-label-required">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            class="form-control form-control-lg"
                            placeholder="Enter your email"
                            autocomplete="email"
                            required
                        >
                        <div class="form-error hidden" id="email-error">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" x2="9" y1="9" y2="15"/>
                                <line x1="9" x2="15" y1="9" y2="15"/>
                            </svg>
                            <span></span>
                        </div>
                    </div>

                    <!-- Password Field -->
                    <div class="form-field">
                        <label for="password" class="form-label form-label-required">Password</label>
                        <div class="input-group">
                            <input
                                type="password"
                                id="password"
                                name="password"
                                class="form-control form-control-lg"
                                placeholder="Enter your password"
                                autocomplete="current-password"
                                required
                            >
                            <button type="button" class="input-group-append" id="toggle-password">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="eye-icon">
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            </button>
                        </div>
                        <div class="form-error hidden" id="password-error">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" x2="9" y1="9" y2="15"/>
                                <line x1="9" x2="15" y1="9" y2="15"/>
                            </svg>
                            <span></span>
                        </div>
                    </div>

                    <!-- Remember Me & Forgot Password -->
                    <div class="flex items-center justify-between">
                        <label class="flex items-center gap-2 text-sm">
                            <input type="checkbox" name="remember" class="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200">
                            <span class="text-gray-700">Remember me</span>
                        </label>
                        <a href="?action=forgot-password" class="text-sm text-primary-600 hover:text-primary-500 font-medium">
                            Forgot password?
                        </a>
                    </div>

                    <!-- Submit Button -->
                    <button type="submit" name="login" class="btn btn-primary btn-lg w-full" id="login-btn">
                        <span id="login-btn-text">Sign In</span>
                        <span id="login-btn-loading" class="hidden">
                            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing in...
                        </span>
                    </button>

                    <!-- Error Messages -->
                    <?php if (isset($_SESSION['login_error'])): ?>
                        <div class="alert alert-error">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="alert-icon">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" x2="9" y1="9" y2="15"/>
                                <line x1="9" x2="15" y1="9" y2="15"/>
                            </svg>
                            <div class="alert-content">
                                <p class="alert-description"><?php echo htmlspecialchars($_SESSION['login_error']); unset($_SESSION['login_error']); ?></p>
                            </div>
                        </div>
                    <?php endif; ?>
                </form>
            </div>

            <!-- Sign Up Link -->
            <div class="text-center mt-8">
                <p class="text-gray-600">
                    Don't have an account? 
                    <a href="?action=register" class="text-primary-600 hover:text-primary-500 font-medium">
                        Sign up for free
                    </a>
                </p>
            </div>

            <!-- Features Preview -->
            <div class="mt-12 text-center">
                <p class="text-gray-500 text-sm mb-4">Trusted by 10,000+ pet parents worldwide</p>
                <div class="flex justify-center space-x-8 text-xs text-gray-400">
                    <div class="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 6 9 17l-5-5"/>
                        </svg>
                        AI-Powered Plans
                    </div>
                    <div class="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 6 9 17l-5-5"/>
                        </svg>
                        Health Tracking
                    </div>
                    <div class="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 6 9 17l-5-5"/>
                        </svg>
                        Expert Support
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Floating Elements -->
    <div class="fixed top-20 left-8 w-16 h-16 bg-primary-100 rounded-full opacity-60 animate-bounce" style="animation-delay: 0s;"></div>
    <div class="fixed top-40 right-12 w-12 h-12 bg-secondary-100 rounded-full opacity-60 animate-bounce" style="animation-delay: 1s;"></div>
    <div class="fixed bottom-32 left-16 w-8 h-8 bg-warning-100 rounded-full opacity-60 animate-bounce" style="animation-delay: 2s;"></div>
    <div class="fixed bottom-20 right-20 w-6 h-6 bg-success-100 rounded-full opacity-60 animate-bounce" style="animation-delay: 0.5s;"></div>

    <script>
        // Form handling
        const loginForm = document.getElementById('login-form');
        const loginBtn = document.getElementById('login-btn');
        const loginBtnText = document.getElementById('login-btn-text');
        const loginBtnLoading = document.getElementById('login-btn-loading');

        // Password toggle
        const togglePassword = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('password');
        const eyeIcon = document.getElementById('eye-icon');

        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            if (type === 'text') {
                eyeIcon.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94l.94.94Z"/>
                    <path d="M12 4c7 0 11 8 11 8a20.93 20.93 0 0 1-2.39 3.11l-.94-.94Z"/>
                    <path d="m2 2 20 20"/>
                `;
            } else {
                eyeIcon.innerHTML = `
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                `;
            }
        });

        // Form validation
        function showError(fieldId, message) {
            const field = document.getElementById(fieldId);
            const error = document.getElementById(fieldId + '-error');
            
            field.classList.add('is-invalid');
            error.classList.remove('hidden');
            error.querySelector('span').textContent = message;
        }

        function hideError(fieldId) {
            const field = document.getElementById(fieldId);
            const error = document.getElementById(fieldId + '-error');
            
            field.classList.remove('is-invalid');
            error.classList.add('hidden');
        }

        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }

        // Real-time validation
        document.getElementById('email').addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                showError('email', 'Please enter a valid email address');
            } else {
                hideError('email');
            }
        });

        document.getElementById('password').addEventListener('blur', function() {
            if (this.value && this.value.length < 6) {
                showError('password', 'Password must be at least 6 characters');
            } else {
                hideError('password');
            }
        });

        // Form submission
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            let hasError = false;

            // Validate email
            if (!email) {
                showError('email', 'Email is required');
                hasError = true;
            } else if (!validateEmail(email)) {
                showError('email', 'Please enter a valid email address');
                hasError = true;
            } else {
                hideError('email');
            }

            // Validate password
            if (!password) {
                showError('password', 'Password is required');
                hasError = true;
            } else if (password.length < 6) {
                showError('password', 'Password must be at least 6 characters');
                hasError = true;
            } else {
                hideError('password');
            }

            if (!hasError) {
                // Show loading state
                loginBtn.disabled = true;
                loginBtnText.classList.add('hidden');
                loginBtnLoading.classList.remove('hidden');

                // Submit form after short delay for UX
                setTimeout(() => {
                    this.submit();
                }, 300);
            }
        });

        // Auto-hide alerts after 5 seconds
        setTimeout(() => {
            const alerts = document.querySelectorAll('.alert');
            alerts.forEach(alert => {
                alert.style.transition = 'opacity 0.3s ease-out';
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300);
            });
        }, 5000);
    </script>

    <style>
        .bg-grid-pattern {
            background-image: url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23000000' fill-opacity='0.1'%3e%3ccircle cx='7' cy='7' r='1'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e");
        }
        
        .animate-bounce {
            animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
            0%, 20%, 53%, 80%, 100% {
                animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
                transform: translate3d(0,0,0);
            }
            40%, 43% {
                animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
                transform: translate3d(0, -30px, 0);
            }
            70% {
                animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
                transform: translate3d(0, -15px, 0);
            }
            90% {
                transform: translate3d(0,-4px,0);
            }
        }
    </style>
</body>
</html>