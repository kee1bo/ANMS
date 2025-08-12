#!/bin/bash

#=============================================================================
# Animal Nutrition Management System (ANMS) - Setup Script
# Version: 1.0
# Description: Automated setup script for ANMS web application
#=============================================================================

# Configuration
PROJECT_NAME="ANMS"
PROJECT_DIR="/home/ashuran/Desktop/ANMS"
PORT="8080"
MYSQL_DB="anms_db"
MYSQL_USER="anms_user"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${BLUE}===================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}===================================================${NC}"
}

# Check if script is run from correct directory
check_directory() {
    if [ ! -f "public/index.php" ] || [ ! -f "database/schema.sql" ]; then
        log_error "Please run this script from the ANMS project root directory"
        log_error "Expected files: public/index.php, database/schema.sql"
        exit 1
    fi
    log_info "Project directory verified"
}

# Check system requirements
check_requirements() {
    log_header "Checking System Requirements"
    
    # Check PHP
    if ! command -v php &> /dev/null; then
        log_error "PHP is not installed. Please install PHP 8.0 or higher"
        exit 1
    fi
    
    PHP_VERSION=$(php -r "echo PHP_VERSION;")
    log_info "PHP Version: $PHP_VERSION"
    
    # Check required PHP extensions
    REQUIRED_EXTENSIONS=("mysqli" "json")
    for ext in "${REQUIRED_EXTENSIONS[@]}"; do
        if ! php -m | grep -q "^$ext$"; then
            log_error "Required PHP extension '$ext' is not installed"
            exit 1
        else
            log_info "✓ PHP extension '$ext' is available"
        fi
    done
    
    # Check PDO separately (case-insensitive)
    if ! php -m | grep -qi "pdo"; then
        log_error "Required PHP extension 'PDO' is not installed"
        exit 1
    else
        log_info "✓ PHP extension 'PDO' is available"
    fi
    
    # Check session support (built-in, just verify it works)
    if php -r "session_start();" 2>/dev/null; then
        log_info "✓ PHP session support is available"
    else
        log_error "PHP session support is not working"
        exit 1
    fi
    
    # Check MySQL (optional)
    if command -v mysql &> /dev/null; then
        MYSQL_VERSION=$(mysql --version | head -n1)
        log_info "MySQL available: $MYSQL_VERSION"
    else
        log_warn "MySQL not found - application will run in mock data mode"
    fi
    
    log_info "System requirements check completed"
}

# Setup database (if MySQL is available)
setup_database() {
    log_header "Database Setup"
    
    if ! command -v mysql &> /dev/null; then
        log_warn "MySQL not available - skipping database setup"
        log_info "Application will run with mock data (2 sample pets)"
        return 0
    fi
    
    # Test MySQL connection
    if ! mysql -u root -e "SELECT 1" &> /dev/null; then
        log_warn "Cannot connect to MySQL as root - trying without authentication"
        if ! mysql -e "SELECT 1" &> /dev/null; then
            log_warn "MySQL connection failed - application will use mock data"
            return 0
        fi
    fi
    
    log_info "Setting up MySQL database..."
    
    # Create database
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS $MYSQL_DB;" 2>/dev/null
    
    # Create user and grant permissions
    mysql -u root -e "CREATE USER IF NOT EXISTS '$MYSQL_USER'@'localhost' IDENTIFIED BY 'anms_password';" 2>/dev/null
    mysql -u root -e "GRANT ALL PRIVILEGES ON $MYSQL_DB.* TO '$MYSQL_USER'@'localhost';" 2>/dev/null
    mysql -u root -e "FLUSH PRIVILEGES;" 2>/dev/null
    
    # Import schema
    if [ -f "database/schema.sql" ]; then
        mysql -u root $MYSQL_DB < database/schema.sql 2>/dev/null
        log_info "Database schema imported successfully"
    else
        log_error "Database schema file not found"
        return 1
    fi
    
    # Update database connection file
    if [ -f "src/includes/db_connect.php" ]; then
        # Create backup
        cp src/includes/db_connect.php src/includes/db_connect.php.backup
        
        # Update credentials
        sed -i "s/define('DB_USERNAME', 'root');/define('DB_USERNAME', '$MYSQL_USER');/" src/includes/db_connect.php
        sed -i "s/define('DB_PASSWORD', '');/define('DB_PASSWORD', 'anms_password');/" src/includes/db_connect.php
        sed -i "s/define('DB_NAME', 'anms_db');/define('DB_NAME', '$MYSQL_DB');/" src/includes/db_connect.php
        
        log_info "Database connection updated"
    fi
    
    log_info "Database setup completed"
}

# Set file permissions
set_permissions() {
    log_header "Setting File Permissions"
    
    # Set directory permissions
    find . -type d -exec chmod 755 {} \;
    
    # Set file permissions
    find . -type f -name "*.php" -exec chmod 644 {} \;
    find . -type f -name "*.css" -exec chmod 644 {} \;
    find . -type f -name "*.js" -exec chmod 644 {} \;
    find . -type f -name "*.html" -exec chmod 644 {} \;
    
    # Make scripts executable
    chmod +x setup.sh
    chmod +x setup_anms.sh 2>/dev/null || true
    chmod +x reset_anms.sh 2>/dev/null || true
    
    # Secure sensitive files
    chmod 600 src/includes/db_connect.php 2>/dev/null || true
    
    log_info "File permissions set"
}

# Install dependencies (if composer.json exists)
install_dependencies() {
    log_header "Installing Dependencies"
    
    if [ -f "composer.json" ] && command -v composer &> /dev/null; then
        log_info "Installing PHP dependencies with Composer..."
        composer install --no-dev
    else
        log_info "No Composer dependencies found - skipping"
    fi
    
    if [ -f "package.json" ] && command -v npm &> /dev/null; then
        log_info "Installing Node.js dependencies..."
        npm install
    else
        log_info "No Node.js dependencies found - skipping"
    fi
}

# Test application
test_application() {
    log_header "Testing Application"
    
    # Test PHP syntax
    log_info "Checking PHP syntax..."
    if find . -name "*.php" -exec php -l {} \; 2>&1 | grep -q "Parse error"; then
        log_error "PHP syntax errors found"
        return 1
    fi
    log_info "✓ PHP syntax check passed"
    
    # Test database connection
    log_info "Testing database connection..."
    if php -r "
        require 'src/includes/db_connect.php';
        if (defined('USE_MOCK_DATA') && USE_MOCK_DATA) {
            echo 'Mock data mode - OK\n';
        } else {
            echo 'Database connection - OK\n';
        }
    " 2>/dev/null; then
        log_info "✓ Database/mock data test passed"
    else
        log_warn "Database test failed - application will use mock data"
    fi
    
    # Test API endpoints
    log_info "Testing API endpoints..."
    cd public
    php -S localhost:$PORT > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 2
    
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/ | grep -q "200"; then
        log_info "✓ Web server test passed"
    else
        log_error "Web server test failed"
        kill $SERVER_PID 2>/dev/null
        return 1
    fi
    
    kill $SERVER_PID 2>/dev/null
    cd ..
    
    log_info "Application testing completed"
}

# Start the application
start_application() {
    log_header "Starting Application"
    
    # Check if port is available
    if netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
        log_warn "Port $PORT is already in use"
        log_info "Trying to find available port..."
        for port in {8081..8090}; do
            if ! netstat -tuln 2>/dev/null | grep -q ":$port "; then
                PORT=$port
                break
            fi
        done
        log_info "Using port $PORT"
    fi
    
    # Start PHP development server
    log_info "Starting PHP development server on port $PORT..."
    cd public
    
    # Create a simple startup script
    cat > ../start_server.sh << EOF
#!/bin/bash
echo "Starting ANMS on http://localhost:$PORT"
echo "Press Ctrl+C to stop the server"
echo ""
php -S localhost:$PORT
EOF
    chmod +x ../start_server.sh
    
    # Start server in background for testing
    php -S localhost:$PORT > ../server.log 2>&1 &
    SERVER_PID=$!
    sleep 2
    
    # Test if server started successfully
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/ | grep -q "200"; then
        log_info "✓ Server started successfully"
        
        # Stop test server
        kill $SERVER_PID 2>/dev/null
        
        # Start server in foreground
        log_info ""
        log_info "🚀 ANMS Setup Complete! 🚀"
        log_info ""
        log_info "📱 Application URL: http://localhost:$PORT"
        log_info "📧 Login Email: test@example.com"
        log_info "🔑 Login Password: password"
        log_info ""
        log_info "📋 Features Available:"
        log_info "  ✓ Dashboard with pet overview"
        log_info "  ✓ Pet management (2 sample pets: Buddy 🐕 & Whiskers 🐱)"
        log_info "  ✓ Nutrition planning"
        log_info "  ✓ Health tracking"
        log_info "  ✓ Responsive design"
        log_info ""
        log_info "🛑 To stop the server: Press Ctrl+C"
        log_info "🔄 To restart: Run './start_server.sh'"
        log_info ""
        log_info "Starting server now..."
        log_info ""
        
        # Start server
        php -S localhost:$PORT
    else
        log_error "Failed to start server"
        kill $SERVER_PID 2>/dev/null
        return 1
    fi
}

# Create additional helper scripts
create_helper_scripts() {
    log_header "Creating Helper Scripts"
    
    # Create database reset script
    cat > reset_database.sh << 'EOF'
#!/bin/bash
echo "Resetting ANMS database..."
mysql -u root -e "DROP DATABASE IF EXISTS anms_db; CREATE DATABASE anms_db;"
mysql -u root anms_db < database/schema.sql
echo "Database reset complete"
EOF
    chmod +x reset_database.sh
    
    # Create logs viewer script
    cat > view_logs.sh << 'EOF'
#!/bin/bash
echo "=== ANMS Server Logs ==="
if [ -f "server.log" ]; then
    tail -f server.log
else
    echo "No server logs found"
fi
EOF
    chmod +x view_logs.sh
    
    # Create status check script
    cat > check_status.sh << 'EOF'
#!/bin/bash
echo "=== ANMS Status Check ==="
echo "PHP Version: $(php -r 'echo PHP_VERSION;')"
echo "Project Dir: $(pwd)"
echo "Database: $(mysql -u root -e 'SELECT COUNT(*) FROM anms_db.users;' 2>/dev/null || echo 'Not available - using mock data')"
echo "Server Status: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/ 2>/dev/null || echo 'Not running')"
EOF
    chmod +x check_status.sh
    
    log_info "Helper scripts created"
}

# Display final information
display_final_info() {
    log_header "Setup Summary"
    
    echo -e "${GREEN}✅ ANMS Setup Completed Successfully!${NC}"
    echo ""
    echo "📁 Project Location: $(pwd)"
    echo "🌐 Application URL: http://localhost:$PORT"
    echo "📧 Login Email: test@example.com"
    echo "🔑 Login Password: password"
    echo ""
    echo "🎯 Available Features:"
    echo "  • User Authentication & Session Management"
    echo "  • Pet Management (Add, View, Edit pets)"
    echo "  • Dashboard with Statistics"
    echo "  • Nutrition Planning"
    echo "  • Health Progress Tracking"
    echo "  • Educational Content"
    echo "  • Responsive Design (Mobile-friendly)"
    echo ""
    echo "📋 Sample Data Available:"
    echo "  • Buddy 🐕 - Golden Retriever, 3 years, 25.5kg"
    echo "  • Whiskers 🐱 - Persian Cat, 2 years, 4.2kg"
    echo ""
    echo "🛠️ Helper Scripts Created:"
    echo "  • ./start_server.sh - Start the application"
    echo "  • ./reset_database.sh - Reset database"
    echo "  • ./view_logs.sh - View server logs"
    echo "  • ./check_status.sh - Check system status"
    echo ""
    echo "🚀 To start the application: ./start_server.sh"
    echo ""
}

# Main execution
main() {
    log_header "ANMS Setup Script v1.0"
    
    # Run setup steps
    check_directory
    check_requirements
    setup_database
    set_permissions
    install_dependencies
    test_application
    create_helper_scripts
    
    # Display final information
    display_final_info
    
    # Ask if user wants to start the server now
    echo -n "Would you like to start the application now? (y/n): "
    read -r response
    if [[ $response =~ ^[Yy]$ ]]; then
        start_application
    else
        log_info "Setup complete. Run './start_server.sh' to start the application."
    fi
}

# Error handling
set -e
trap 'log_error "Setup failed on line $LINENO"' ERR

# Run main function
main "$@"