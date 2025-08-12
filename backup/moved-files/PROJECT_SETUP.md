# Animal Nutrition Management System (ANMS) - Complete Setup Guide

A comprehensive web application for managing pet nutrition and health tracking with beautiful UI and full functionality.

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Features Overview](#features-overview)

## 🔧 Prerequisites

Before setting up the project, ensure you have the following installed:

### Required Software
- **PHP 8.0 or higher** with the following extensions:
  - `php-mysqli` (for MySQL database connectivity)
  - `php-pdo` (for database abstraction)
  - `php-json` (for API responses)
  - `php-session` (for user session management)
- **Web Server**: Apache 2.4+ or Nginx 1.18+
- **Database**: MySQL 8.0+ or MariaDB 10.5+
- **Git** (for version control)

### Optional but Recommended
- **Composer** (for dependency management)
- **Node.js** (for frontend build tools)
- **SSL Certificate** (for production HTTPS)

### Quick Check Commands
```bash
# Check PHP version and extensions
php -v
php -m | grep -E "(mysqli|pdo|json)"

# Check MySQL version
mysql --version

# Check web server
apache2 -v  # or nginx -v
```

## 🚀 Installation

### Step 1: Clone the Repository
```bash
# Clone the project
git clone <repository-url> anms-project
cd anms-project

# Or if starting from scratch, create the directory structure
mkdir anms-project && cd anms-project
```

### Step 2: Set Up Directory Structure
```bash
# Create the required directory structure
mkdir -p public/assets/{css,js,images}
mkdir -p src/{api,includes,templates/partials}
mkdir -p database
mkdir -p logs

# Set proper permissions
chmod 755 public/
chmod 644 public/assets/
chmod 600 src/includes/db_connect.php  # Secure database config
```

### Step 3: Project File Structure
Ensure all project files are in place:
```
anms-project/
├── public/
│   ├── index.php           # Main application entry
│   ├── api.php            # API router
│   └── assets/
│       ├── css/style.css  # Custom styles
│       └── js/main.js     # Frontend JavaScript
├── src/
│   ├── api/               # Backend API endpoints
│   │   ├── auth.php
│   │   ├── get_pets.php
│   │   ├── add_pet.php
│   │   └── diet_plan.php
│   ├── includes/          # Shared PHP includes
│   │   ├── db_connect.php
│   │   ├── functions.php
│   │   └── mock_data.php
│   └── templates/         # Page templates
│       ├── dashboard.php
│       ├── pets.php
│       ├── nutrition.php
│       ├── progress.php
│       ├── education.php
│       ├── settings.php
│       ├── login.php
│       └── partials/
│           ├── header.php
│           └── footer.php
├── database/
│   └── schema.sql         # Database schema
├── README.md              # Quick start guide
└── PROJECT_SETUP.md       # This complete setup guide
```

## 🗄️ Database Setup

### Option 1: Quick Setup with Mock Data (Recommended for Development)
The application includes a mock data system that works without database setup:

```bash
# No database required - mock data is automatically used
# Just start the application and it will work with sample pets:
# - Buddy (🐕 Golden Retriever)
# - Whiskers (🐱 Persian Cat)
```

### Option 2: Full MySQL Database Setup

#### Create Database and User
```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create database
CREATE DATABASE anms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user and grant permissions
CREATE USER 'anms_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON anms_db.* TO 'anms_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

#### Import Database Schema
```bash
# Import the database schema
mysql -u anms_user -p anms_db < database/schema.sql

# Or use the automated setup script (if available)
php setup_database.php
```

#### Verify Database Setup
```sql
-- Check if tables were created
mysql -u anms_user -p anms_db -e "SHOW TABLES;"

-- Check sample data
mysql -u anms_user -p anms_db -e "SELECT * FROM users; SELECT * FROM pets;"
```

## ⚙️ Configuration

### Step 1: Configure Database Connection
Edit `src/includes/db_connect.php`:

```php
<?php
// Database configuration
define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'anms_user');           // Your database user
define('DB_PASSWORD', 'your_secure_password'); // Your database password
define('DB_NAME', 'anms_db');
?>
```

### Step 2: Web Server Configuration

#### Apache Configuration (.htaccess)
Create `public/.htaccess`:
```apache
RewriteEngine On

# Redirect all requests to index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"

# Cache static assets
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
    Header set Cache-Control "max-age=31536000, public"
</FilesMatch>
```

#### Nginx Configuration
Create nginx site configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/anms-project/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Security
    location ~ /\. {
        deny all;
    }
}
```

### Step 3: Environment Variables (Optional)
Create `.env` file for sensitive configuration:
```bash
# Database Configuration
DB_HOST=localhost
DB_USER=anms_user
DB_PASS=your_secure_password
DB_NAME=anms_db

# Application Settings
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:8000

# Security
SESSION_LIFETIME=1440
SECURE_COOKIES=false
```

## 🏃‍♂️ Running the Application

### Development Server (Quick Start)
```bash
# Navigate to public directory
cd public

# Start PHP built-in server
php -S localhost:8000

# Or on a different port
php -S localhost:8080
```

### Access the Application
1. Open your browser
2. Navigate to: `http://localhost:8000`
3. Login with default credentials:
   - **Email**: `test@example.com`
   - **Password**: `password`

### Verify Everything Works
After logging in, you should see:
- ✅ Dashboard showing "You have 2 beautiful pets in your care"
- ✅ Pet cards for Buddy (🐕) and Whiskers (🐱)
- ✅ Beautiful blue sidebar navigation
- ✅ All statistics showing correct numbers
- ✅ Responsive design on mobile/tablet

## 🛠️ Development Setup

### Enable Development Mode
```bash
# Enable error reporting in PHP
echo "error_reporting(E_ALL); ini_set('display_errors', 1);" >> src/includes/debug.php

# Add debug mode to environment
echo "APP_DEBUG=true" >> .env
```

### Development Tools
```bash
# Install development dependencies (if using Composer)
composer install --dev

# Set up Git hooks for code quality
git config core.hooksPath .githooks

# Watch for file changes (if using Node.js)
npm install -g nodemon
nodemon --exec "php -S localhost:8000" --watch src/ --ext php
```

### Testing the Application
```bash
# Test login functionality
php test_login.php

# Test API endpoints
curl -X POST http://localhost:8000/api.php?action=auth \
  -d "email=test@example.com&password=password&login=1"

# Test pet data retrieval
curl -b cookies.txt http://localhost:8000/api.php?action=get_pets
```

### Database Testing (If Using MySQL)
```bash
# Test database connection
php -r "
require 'src/includes/db_connect.php';
echo 'Database connection: ' . (isset(\$mysqli) ? 'SUCCESS' : 'FAILED') . PHP_EOL;
"

# Test sample data
mysql -u anms_user -p anms_db -e "
SELECT u.name, COUNT(p.id) as pet_count 
FROM users u 
LEFT JOIN pets p ON u.id = p.user_id 
GROUP BY u.id;
"
```

## 🚢 Production Deployment

### Step 1: Prepare for Production
```bash
# Remove development files
rm test_login.php debug_js.html setup_database.php

# Set secure permissions
chmod 644 src/includes/db_connect.php
chmod 755 public/
find . -type f -name "*.php" -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;

# Create logs directory
mkdir -p logs
chmod 777 logs/
```

### Step 2: Update Configuration for Production
```php
// In src/includes/db_connect.php - disable development features
define('APP_ENV', 'production');
define('APP_DEBUG', false);

// Use environment variables for sensitive data
$db_host = $_ENV['DB_HOST'] ?? 'localhost';
$db_user = $_ENV['DB_USER'] ?? 'anms_user';
$db_pass = $_ENV['DB_PASS'] ?? '';
$db_name = $_ENV['DB_NAME'] ?? 'anms_db';
```

### Step 3: Set Up SSL (Recommended)
```bash
# Using Let's Encrypt with Certbot
sudo certbot --nginx -d your-domain.com

# Or manually configure SSL in your web server
```

### Step 4: Performance Optimization
```php
// Enable PHP OPcache in php.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=4000

// Enable gzip compression in .htaccess
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. "Could not connect to database" Error
```bash
# Check if MySQL is running
sudo systemctl status mysql

# Verify database credentials
mysql -u anms_user -p anms_db -e "SELECT 1;"

# Check PHP MySQL extensions
php -m | grep mysqli

# Solution: The app automatically falls back to mock data if DB unavailable
```

#### 2. Pets Not Showing (Count shows 0)
```bash
# Verify mock data is working
php -r "require 'src/includes/mock_data.php'; var_dump(getMockPets(1));"

# Check if session is working
php -r "session_start(); var_dump(\$_SESSION);"

# Common fix: Clear browser cookies and login again
```

#### 3. CSS/JavaScript Not Loading
```bash
# Check file permissions
ls -la public/assets/

# Verify web server can access files
curl http://localhost:8000/assets/css/style.css
curl http://localhost:8000/assets/js/main.js

# Fix: Ensure correct file paths (no leading slash in includes)
```

#### 4. Login Issues
```bash
# Test authentication directly
php -r "
require 'src/includes/mock_data.php';
var_dump(mockLogin('test@example.com', 'password'));
"

# Check session configuration
php -i | grep session

# Verify login form action points to correct API endpoint
```

#### 5. API Endpoints Not Working
```bash
# Test API router
curl -X GET http://localhost:8000/api.php?action=get_pets

# Check PHP error logs
tail -f /var/log/php_errors.log

# Verify api.php exists in public directory
ls -la public/api.php
```

#### 6. Blank Page or PHP Errors
```bash
# Enable error display
echo "ini_set('display_errors', 1); error_reporting(E_ALL);" > public/debug.php

# Check syntax errors
find . -name "*.php" -exec php -l {} \;

# Check web server error logs
tail -f /var/log/apache2/error.log  # Apache
tail -f /var/log/nginx/error.log    # Nginx
```

### Log Files to Check
```bash
# Application logs (if configured)
tail -f logs/error.log
tail -f logs/access.log

# System logs
tail -f /var/log/apache2/error.log  # Apache
tail -f /var/log/nginx/error.log    # Nginx
tail -f /var/log/mysql/error.log    # MySQL

# PHP logs
tail -f /var/log/php_errors.log
```

### Performance Issues
```bash
# Check PHP memory usage
php -i | grep memory_limit

# Monitor database queries (if using MySQL)
mysql -u root -p -e "SHOW PROCESSLIST;"

# Check disk space
df -h

# Monitor web server performance
top -p $(pgrep -f "php|apache|nginx")
```

## 🎯 Features Overview

### Core Functionality
- **User Authentication**: Secure login/logout with session management
- **Pet Management**: Add, view, and manage pet profiles with photos
- **Dashboard**: Beautiful overview with statistics and quick actions
- **Nutrition Plans**: View and manage pet diet recommendations
- **Health Tracking**: Monitor pet weight and health status
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

### Technical Features
- **Hybrid Rendering**: PHP server-side + JavaScript enhancement for performance
- **Mock Data System**: Works without database for development and testing
- **API Architecture**: RESTful endpoints for data management
- **Security**: Input validation, XSS protection, secure session handling
- **Modern UI**: Tailwind CSS with beautiful animations and transitions
- **Error Handling**: Comprehensive error management and graceful fallbacks

### Pages and Navigation
- **Dashboard**: Pet overview, statistics, quick actions
- **My Pets**: Detailed pet profiles and management
- **Nutrition Plans**: Diet planning and recommendations
- **Health Progress**: Weight tracking and health monitoring
- **Learn & Tips**: Educational content about pet nutrition
- **Account Settings**: User profile and preferences

## 📝 Additional Resources

### Default Login Credentials
- **Email**: `test@example.com`
- **Password**: `password`

### Sample Data (Mock Mode)
The application includes 2 sample pets:
- **Buddy**: 🐕 Golden Retriever, 3 years old, 25.5kg, Medium activity
- **Whiskers**: 🐱 Persian Cat, 2 years old, 4.2kg, Low activity

### API Endpoints
- `GET /api.php?action=get_pets` - Retrieve user's pets
- `POST /api.php?action=add_pet` - Add new pet (demo mode)
- `POST /api.php?action=auth` - User authentication
- `GET /api.php?action=diet_plan` - Get nutrition plans

### Architecture Notes
- **Frontend**: Tailwind CSS + Vanilla JavaScript
- **Backend**: PHP 8+ with session-based authentication
- **Database**: MySQL (optional) with SQLite fallback planned
- **Deployment**: Apache/Nginx + PHP-FPM or built-in PHP server

### File Security
```bash
# Recommended file permissions
find . -type f -name "*.php" -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
chmod 600 src/includes/db_connect.php  # Sensitive config
chmod 777 logs/                        # Log directory
```

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Support and Maintenance
For issues or questions:
1. Check the troubleshooting section above
2. Review application and server logs
3. Test with mock data to isolate database issues
4. Verify all prerequisites are installed correctly
5. Ensure file permissions are set properly

### Development Workflow
```bash
# Daily development routine
cd anms-project
git pull origin main           # Get latest changes
cd public && php -S localhost:8000  # Start dev server
# Make changes, test, commit
git add . && git commit -m "Feature: description"
git push origin main
```

---

**🎉 Congratulations!** Your Animal Nutrition Management System is now set up and ready to use. Enjoy managing your pets' health and nutrition with this beautiful, fully-functional application!

**Next Steps:**
1. Customize the application with your own branding
2. Add more pet species and nutrition data
3. Integrate with external APIs for food databases
4. Add mobile app support
5. Implement advanced reporting features

**Happy Pet Management! 🐕🐱**