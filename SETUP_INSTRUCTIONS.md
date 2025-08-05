# 🚀 ANMS Setup Instructions

Complete guide to set up and run the Animal Nutrition Management System (ANMS) locally.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software
- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Git** (for cloning the repository)

### Optional (for development)
- **PHP 8.2+** (if running without Docker)
- **Composer** (PHP dependency manager)
- **Node.js** (for frontend development tools)

## 🔧 Installation Methods

Choose one of the following installation methods:

### Method 1: Docker Setup (Recommended)

This is the easiest and most reliable way to run ANMS.

#### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd anms
```

#### Step 2: Environment Configuration
```bash
# Copy the environment template
cp .env.example .env

# Edit the environment file (optional - defaults work for development)
nano .env  # or use your preferred editor
```

#### Step 3: Start the Application
```bash
# Start all services in the background
docker-compose up -d

# Check if all containers are running
docker-compose ps
```

You should see output similar to:
```
NAME                COMMAND                  SERVICE             STATUS              PORTS
anms_app            "docker-php-entrypoi…"   app                 running             9000/tcp
anms_database       "docker-entrypoint.s…"   database            running             0.0.0.0:3306->3306/tcp, 33060/tcp
anms_phpmyadmin     "/docker-entrypoint.…"   phpmyadmin          running             0.0.0.0:8081->80/tcp
anms_redis          "docker-entrypoint.s…"   redis               running             0.0.0.0:6379->6379/tcp
anms_webserver      "/docker-entrypoint.…"   webserver           running             0.0.0.0:8080->80/tcp
```

#### Step 4: Initialize the Database
```bash
# Run database migrations
docker-compose exec app php database/migrate.php

# Seed the database with sample data
docker-compose exec app php database/seed.php
```

#### Step 5: Test the Installation
```bash
# Test the nutrition calculation engine
docker-compose exec app php test_nutrition_engine.php
```

### Method 2: Local PHP Setup

If you prefer to run PHP locally without Docker:

#### Step 1: Install Dependencies
```bash
# Install PHP dependencies
composer install

# Set up environment
cp .env.example .env
```

#### Step 2: Database Setup
You'll need to set up MySQL and Redis manually:

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE anms_db;
CREATE USER 'anms_user'@'localhost' IDENTIFIED BY 'anms_password';
GRANT ALL PRIVILEGES ON anms_db.* TO 'anms_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Update .env file with your database credentials
```

#### Step 3: Run Migrations
```bash
php database/migrate.php
php database/seed.php
```

#### Step 4: Start the Server
```bash
# Start PHP built-in server
php -S localhost:8080 -t public/
```

## 🌐 Accessing the Application

Once the setup is complete, you can access:

### Main Application
- **URL**: http://localhost:8080
- **Description**: Main ANMS web interface

### Database Management
- **phpMyAdmin**: http://localhost:8081
- **Credentials**: 
  - Username: `anms_user`
  - Password: `anms_password`

### API Endpoints
- **Base URL**: http://localhost:8080/api
- **Documentation**: Available at `/api/docs` (when implemented)

## 🧪 Testing the Installation

### 1. Basic Health Check
```bash
# Check if the web server responds
curl http://localhost:8080

# Check API health (if implemented)
curl http://localhost:8080/api/health
```

### 2. Test Nutrition Engine
```bash
# Run the nutrition calculation test
docker-compose exec app php test_nutrition_engine.php
```

Expected output should show:
- Pet details
- Nutrition requirements calculation
- Feeding schedule generation
- Health condition adjustments

### 3. Database Connection Test
```bash
# Test database connectivity
docker-compose exec app php -r "
try {
    \$pdo = new PDO('mysql:host=database;dbname=anms_db', 'anms_user', 'anms_password');
    echo 'Database connection: SUCCESS\n';
} catch (Exception \$e) {
    echo 'Database connection: FAILED - ' . \$e->getMessage() . '\n';
}
"
```

## 🛠️ Development Setup

### Running Tests
```bash
# Run all tests (when PHPUnit is available)
docker-compose exec app ./vendor/bin/phpunit

# Run specific test file
docker-compose exec app php -l src/Application/Services/NutritionCalculator.php
```

### Code Quality Checks
```bash
# Check PHP syntax
find src/ -name "*.php" -exec php -l {} \;

# Check code style (when available)
docker-compose exec app ./vendor/bin/phpcs --standard=PSR12 src/
```

### Database Operations
```bash
# Reset database
docker-compose exec app php database/migrate.php --reset
docker-compose exec app php database/seed.php

# Create new migration
docker-compose exec app php database/create_migration.php create_new_table
```

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Application
APP_ENV=development          # development, production
APP_DEBUG=true              # Enable debug mode
APP_URL=http://localhost:8080

# Database
DB_HOST=database            # Use 'localhost' for local setup
DB_DATABASE=anms_db
DB_USERNAME=anms_user
DB_PASSWORD=anms_password

# Security
JWT_SECRET=your-secret-key  # Change in production!
BCRYPT_ROUNDS=12           # Password hashing rounds
```

### Docker Configuration

To modify Docker settings, edit `docker-compose.yml`:

```yaml
# Change ports
ports:
  - "8080:80"  # Change 8080 to your preferred port

# Modify database settings
environment:
  MYSQL_DATABASE: your_db_name
  MYSQL_USER: your_username
  MYSQL_PASSWORD: your_password
```

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. "Class Dotenv\Dotenv not found" Error
**Problem**: The application tries to use external dependencies that aren't installed.
**Solution**: This has been fixed! The system now uses a simplified bootstrap that doesn't require external dependencies.

#### 2. Port Already in Use
**Problem**: MySQL (3306) or Redis (6379) ports are already in use by system services.
**Solution**: The Docker configuration automatically uses alternative ports:
- MySQL: 3307 (external) → 3306 (internal)
- Redis: 6380 (external) → 6379 (internal)

```bash
# Check what's using ports
lsof -i :8080  # Web server
lsof -i :8081  # phpMyAdmin
```

#### 3. Database Connection Failed
**Problem**: Application can't connect to database.
**Solution**: 
```bash
# Check if database container is running
docker-compose ps database

# Check database logs
docker-compose logs database

# Restart database service
docker-compose restart database

# Verify .env file has correct settings
grep DB_HOST .env  # Should be "database" not "localhost"
```

#### 4. Web Server Shows 500 Error
**Problem**: PHP application errors.
**Solution**: The system now uses a simplified application that handles errors gracefully.
```bash
# Check application logs
docker-compose logs app

# Check web server logs
docker-compose logs webserver
```

#### 5. Migration/Seeding Fails
**Problem**: Complex migration system fails due to missing dependencies.
**Solution**: Now uses simplified migration scripts that don't require external libraries.
```bash
# Run simple migration
docker-compose exec app php database/simple_migrate.php

# Run simple seeding
docker-compose exec app php database/simple_seed.php
```

### Getting Help

#### Check Logs
```bash
# Application logs
docker-compose logs app

# Web server logs
docker-compose logs webserver

# Database logs
docker-compose logs database

# All logs
docker-compose logs
```

#### Reset Everything
```bash
# Complete reset (WARNING: This will delete all data)
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
docker-compose exec app php database/migrate.php
docker-compose exec app php database/seed.php
```

## 📱 Mobile Testing

To test on mobile devices on your local network:

1. Find your computer's IP address:
   ```bash
   # On Linux/Mac
   ip addr show | grep inet
   
   # On Windows
   ipconfig
   ```

2. Update docker-compose.yml to bind to all interfaces:
   ```yaml
   ports:
     - "0.0.0.0:8080:80"
   ```

3. Access from mobile device:
   ```
   http://YOUR_IP_ADDRESS:8080
   ```

## 🔒 Security Notes

### Development vs Production

**Development (current setup):**
- Debug mode enabled
- Default passwords
- All ports exposed
- No SSL/HTTPS

**For Production:**
- Set `APP_ENV=production`
- Change all default passwords
- Use environment-specific secrets
- Enable SSL/HTTPS
- Restrict database access
- Use proper session security

### Default Credentials

**Database:**
- Username: `anms_user`
- Password: `anms_password`

**phpMyAdmin:**
- Same as database credentials

**⚠️ Change these in production!**

## 📞 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review the logs using the commands above
3. Check the main README.md for additional information
4. Create an issue in the repository with:
   - Your operating system
   - Docker version
   - Error messages
   - Steps to reproduce

## 🎉 Next Steps

Once ANMS is running:

1. **Explore the Interface**: Navigate to http://localhost:8080
2. **Test Features**: Try creating pet profiles and nutrition plans
3. **Review Code**: Examine the source code in `src/`
4. **Run Tests**: Execute the test suite to understand functionality
5. **Contribute**: Check the development roadmap and contribute!

---

**Happy coding! 🐾**