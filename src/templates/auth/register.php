<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up - PetNutri</title>
    <meta name="description" content="Create your PetNutri account and start your pet's journey to better health.">
    <link rel="stylesheet" href="<?php echo rtrim(dirname($_SERVER['SCRIPT_NAME']), '/') . '/'; ?>assets/css/petnutri-professional.css">
</head>
<body class="bg-gradient-to-br from-secondary-50 via-white to-primary-50 min-h-screen">
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

                <!-- Navigation -->
                <div class="flex items-center space-x-4">
                    <a href="?action=login" class="text-gray-600 hover:text-gray-900 font-medium transition-colors">Sign In</a>
                    <a href="?" class="text-gray-600 hover:text-gray-900 font-medium transition-colors">← Back to Home</a>
                </div>
            </div>
        </nav>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div class="max-w-lg w-full">
            <!-- Welcome Section -->
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-gray-900 mb-2">Join PetNutri today</h2>
                <p class="text-gray-600">Start your pet's journey to better health with personalized nutrition plans.</p>
            </div>

            <!-- Register Form -->
            <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 animate-fade-in-up">
                <!-- Social Signup Options -->
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
                        <span class="px-2 bg-white text-gray-500">Or create account with email</span>
                    </div>
                </div>

                <!-- Email/Password Form -->
                <form action="api.php?action=register" method="POST" class="space-y-6" id="register-form">
                    <!-- Name Fields -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-field">
                            <label for="first_name" class="form-label form-label-required">First Name</label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                class="form-control form-control-lg"
                                placeholder="John"
                                autocomplete="given-name"
                                required
                            >
                            <div class="form-error hidden" id="first_name-error">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="15" x2="9" y1="9" y2="15"/>
                                    <line x1="9" x2="15" y1="9" y2="15"/>
                                </svg>
                                <span></span>
                            </div>
                        </div>

                        <div class="form-field">
                            <label for="last_name" class="form-label form-label-required">Last Name</label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                class="form-control form-control-lg"
                                placeholder="Doe"
                                autocomplete="family-name"
                                required
                            >
                            <div class="form-error hidden" id="last_name-error">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="15" x2="9" y1="9" y2="15"/>
                                    <line x1="9" x2="15" y1="9" y2="15"/>
                                </svg>
                                <span></span>
                            </div>
                        </div>
                    </div>

                    <!-- Email Field -->
                    <div class="form-field">
                        <label for="email" class="form-label form-label-required">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            class="form-control form-control-lg"
                            placeholder="john.doe@example.com"
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
                                placeholder="Create a strong password"
                                autocomplete="new-password"
                                required
                            >
                            <button type="button" class="input-group-append" id="toggle-password">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="eye-icon">
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            </button>
                        </div>
                        <div class="form-help">
                            Password must be at least 8 characters with uppercase, lowercase, and numbers.
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

                    <!-- Confirm Password Field -->
                    <div class="form-field">
                        <label for="confirm_password" class="form-label form-label-required">Confirm Password</label>
                        <input
                            type="password"
                            id="confirm_password"
                            name="confirm_password"
                            class="form-control form-control-lg"
                            placeholder="Confirm your password"
                            autocomplete="new-password"
                            required
                        >
                        <div class="form-error hidden" id="confirm_password-error">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" x2="9" y1="9" y2="15"/>
                                <line x1="9" x2="15" y1="9" y2="15"/>
                            </svg>
                            <span></span>
                        </div>
                    </div>

                    <!-- Terms & Privacy -->
                    <div class="form-field">
                        <label class="flex items-start gap-3 text-sm">
                            <input type="checkbox" name="terms" class="mt-1 rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200" required>
                            <span class="text-gray-700">
                                I agree to the 
                                <a href="#" class="text-primary-600 hover:text-primary-500 font-medium">Terms of Service</a> 
                                and 
                                <a href="#" class="text-primary-600 hover:text-primary-500 font-medium">Privacy Policy</a>
                            </span>
                        </label>
                    </div>

                    <!-- Marketing Consent -->
                    <div class="form-field">
                        <label class="flex items-start gap-3 text-sm">
                            <input type="checkbox" name="marketing" class="mt-1 rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200">
                            <span class="text-gray-700">
                                I'd like to receive helpful tips and updates about pet care via email.
                            </span>
                        </label>
                    </div>

                    <!-- Submit Button -->
                    <button type="submit" name="register" class="btn btn-primary btn-lg w-full" id="register-btn">
                        <span id="register-btn-text">Create My Account</span>
                        <span id="register-btn-loading" class="hidden">
                            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating account...
                        </span>
                    </button>

                    <!-- Error Messages -->
                    <?php if (isset($_SESSION['register_error'])): ?>
                        <div class="alert alert-error">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="alert-icon">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" x2="9" y1="9" y2="15"/>
                                <line x1="9" x2="15" y1="9" y2="15"/>
                            </svg>
                            <div class="alert-content">
                                <p class="alert-description"><?php echo htmlspecialchars($_SESSION['register_error']); unset($_SESSION['register_error']); ?></p>
                            </div>
                        </div>
                    <?php endif; ?>
                </form>
            </div>

            <!-- Sign In Link -->
            <div class="text-center mt-8">
                <p class="text-gray-600">
                    Already have an account? 
                    <a href="?action=login" class="text-primary-600 hover:text-primary-500 font-medium">
                        Sign in here
                    </a>
                </p>
            </div>

            <!-- Trust Indicators -->
            <div class="mt-12 text-center">
                <p class="text-gray-500 text-sm mb-4">Trusted by veterinarians and pet experts</p>
                <div class="flex justify-center items-center space-x-6 text-xs text-gray-400">
                    <div class="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                            <circle cx="12" cy="5" r="2"/>
                            <path d="M12 7v4"/>
                        </svg>
                        SOC 2 Compliant
                    </div>
                    <div class="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 12l2 2 4-4"/>
                            <path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z"/>
                        </svg>
                        GDPR Compliant
                    </div>
                    <div class="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 12l2 2 4-4"/>
                            <path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z"/>
                        </svg>
                        256-bit SSL
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Floating Elements -->
    <div class="fixed top-16 right-8 w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full opacity-60 animate-float" style="animation-delay: 0s;"></div>
    <div class="fixed top-32 left-12 w-12 h-12 bg-gradient-to-br from-success-100 to-warning-100 rounded-full opacity-60 animate-float" style="animation-delay: 1s;"></div>
    <div class="fixed bottom-32 right-16 w-8 h-8 bg-gradient-to-br from-warning-100 to-error-100 rounded-full opacity-60 animate-float" style="animation-delay: 2s;"></div>
    <div class="fixed bottom-16 left-20 w-6 h-6 bg-gradient-to-br from-secondary-100 to-primary-100 rounded-full opacity-60 animate-float" style="animation-delay: 0.5s;"></div>

    <script>
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

        // Validation functions
        function showError(fieldId, message) {
            const field = document.getElementById(fieldId);
            const error = document.getElementById(fieldId + '-error');
            
            if (field && error) {
                field.classList.add('is-invalid');
                error.classList.remove('hidden');
                error.querySelector('span').textContent = message;
            }
        }

        function hideError(fieldId) {
            const field = document.getElementById(fieldId);
            const error = document.getElementById(fieldId + '-error');
            
            if (field && error) {
                field.classList.remove('is-invalid');
                error.classList.add('hidden');
            }
        }

        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }

        function validatePassword(password) {
            const minLength = 8;
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumbers = /\d/.test(password);
            
            return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers;
        }

        // Real-time validation
        document.getElementById('first_name').addEventListener('blur', function() {
            if (this.value.trim().length < 2) {
                showError('first_name', 'First name must be at least 2 characters');
            } else {
                hideError('first_name');
            }
        });

        document.getElementById('last_name').addEventListener('blur', function() {
            if (this.value.trim().length < 2) {
                showError('last_name', 'Last name must be at least 2 characters');
            } else {
                hideError('last_name');
            }
        });

        document.getElementById('email').addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                showError('email', 'Please enter a valid email address');
            } else {
                hideError('email');
            }
        });

        document.getElementById('password').addEventListener('blur', function() {
            if (this.value && !validatePassword(this.value)) {
                showError('password', 'Password must be 8+ characters with uppercase, lowercase, and numbers');
            } else {
                hideError('password');
            }
        });

        document.getElementById('confirm_password').addEventListener('blur', function() {
            const password = document.getElementById('password').value;
            if (this.value && this.value !== password) {
                showError('confirm_password', 'Passwords do not match');
            } else {
                hideError('confirm_password');
            }
        });

        // Form submission
        const registerForm = document.getElementById('register-form');
        const registerBtn = document.getElementById('register-btn');
        const registerBtnText = document.getElementById('register-btn-text');
        const registerBtnLoading = document.getElementById('register-btn-loading');

        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const firstName = document.getElementById('first_name').value.trim();
            const lastName = document.getElementById('last_name').value.trim();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            
            let hasError = false;

            // Validate first name
            if (!firstName || firstName.length < 2) {
                showError('first_name', 'First name must be at least 2 characters');
                hasError = true;
            } else {
                hideError('first_name');
            }

            // Validate last name
            if (!lastName || lastName.length < 2) {
                showError('last_name', 'Last name must be at least 2 characters');
                hasError = true;
            } else {
                hideError('last_name');
            }

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
            } else if (!validatePassword(password)) {
                showError('password', 'Password must be 8+ characters with uppercase, lowercase, and numbers');
                hasError = true;
            } else {
                hideError('password');
            }

            // Validate confirm password
            if (!confirmPassword) {
                showError('confirm_password', 'Please confirm your password');
                hasError = true;
            } else if (password !== confirmPassword) {
                showError('confirm_password', 'Passwords do not match');
                hasError = true;
            } else {
                hideError('confirm_password');
            }

            if (!hasError) {
                // Show loading state
                registerBtn.disabled = true;
                registerBtnText.classList.add('hidden');
                registerBtnLoading.classList.remove('hidden');

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
        
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
        }
    </style>
</body>
</html>