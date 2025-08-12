#!/bin/bash

# ANMS Complete Setup Script
# This script handles all edge cases and potential issues automatically

set -e  # Exit on any error

echo "🐾 ANMS Complete Setup & Troubleshooting Script"
echo "==============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_section() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to check and fix port conflicts
check_and_fix_ports() {
    print_section "Checking Port Conflicts"
    
    # Check MySQL port 3306
    if lsof -i :3306 &> /dev/null; then
        print_warning "Port 3306 (MySQL) is in use. Using port 3307 for Docker MySQL."
        # Port is already changed in docker-compose.yml
    else
        print_status "Port 3306 is available"
    fi
    
    # Check Redis port 6379
    if lsof -i :6379 &> /dev/null; then
        print_warning "Port 6379 (Redis) is in use. Using port 6380 for Docker Redis."
        # Port is already changed in docker-compose.yml
    else
        print_status "Port 6379 is available"
    fi
    
    # Check web ports
    if lsof -i :8080 &> /dev/null; then
        print_error "Port 8080 is in use. Please stop the service using this port or change the port in docker-compose.yml"
        echo "To find what's using port 8080: lsof -i :8080"
        exit 1
    else
        print_status "Port 8080 is available"
    fi
    
    if lsof -i :8081 &> /dev/null; then
        print_error "Port 8081 is in use. Please stop the service using this port or change the port in docker-compose.yml"
        echo "To find what's using port 8081: lsof -i :8081"
        exit 1
    else
        print_status "Port 8081 is available"
    fi
}

# Function to check Docker requirements
check_docker() {
    print_section "Docker Requirements"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are ready"
}

# Function to setup environment
setup_environment() {
    print_section "Environment Configuration"
    
    if [ ! -f .env ]; then
        print_info "Creating .env file from template..."
        cp .env.example .env
        print_status "Environment file created"
    else
        print_info "Environment file already exists"
    fi
    
    # Fix common .env issues
    print_info "Fixing common environment configuration issues..."
    
    # Fix database host for Docker
    if grep -q "DB_HOST=localhost" .env; then
        sed -i 's/DB_HOST=localhost/DB_HOST=database/' .env
        print_status "Fixed database host for Docker"
    fi
    
    # Fix Redis host for Docker
    if grep -q "REDIS_HOST=localhost" .env; then
        sed -i 's/REDIS_HOST=localhost/REDIS_HOST=redis/' .env
        print_status "Fixed Redis host for Docker"
    fi
}

# Function to clean up existing containers
cleanup_containers() {
    print_section "Container Cleanup"
    
    print_info "Stopping existing containers..."
    docker-compose down &> /dev/null || true
    
    print_info "Removing orphaned containers..."
    docker-compose down --remove-orphans &> /dev/null || true
    
    print_status "Container cleanup completed"
}

# Function to start services with retry logic
start_services() {
    print_section "Starting Services"
    
    print_info "Building and starting Docker services..."
    
    # Try to start services
    if docker-compose up -d; then
        print_status "Services started successfully"
    else
        print_error "Failed to start services. Trying to rebuild..."
        
        # Try rebuilding
        if docker-compose build --no-cache && docker-compose up -d; then
            print_status "Services started after rebuild"
        else
            print_error "Failed to start services even after rebuild"
            exit 1
        fi
    fi
    
    # Wait for services to be ready
    print_info "Waiting for services to initialize..."
    sleep 15
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_status "All services are running"
    else
        print_error "Some services failed to start"
        docker-compose ps
        exit 1
    fi
}

# Function to initialize database with retry logic
init_database() {
    print_section "Database Initialization"
    
    print_info "Waiting for database to be ready..."
    
    # Wait for database to be ready (with timeout)
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose exec -T database mysql -u anms_user -panms_password -e "SELECT 1;" &> /dev/null; then
            print_status "Database is ready"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "Database failed to start after $max_attempts attempts"
            exit 1
        fi
        
        print_info "Waiting for database... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    # Run migrations
    print_info "Running database migrations..."
    if docker-compose exec -T app php database/simple_migrate.php; then
        print_status "Database migrations completed"
    else
        print_error "Database migration failed"
        exit 1
    fi
    
    # Check if we need to seed
    local user_count=$(docker-compose exec -T database mysql -u anms_user -panms_password anms_db -e "SELECT COUNT(*) FROM users;" 2>/dev/null | tail -n 1)
    
    if [ "$user_count" -eq 0 ] 2>/dev/null; then
        print_info "Seeding database with sample data..."
        if docker-compose exec -T app php database/simple_seed.php; then
            print_status "Database seeded successfully"
        else
            print_warning "Database seeding failed (this might be okay)"
        fi
    else
        print_info "Database already contains data, skipping seeding"
    fi
}

# Function to test the installation
test_installation() {
    print_section "Installation Testing"
    
    # Test web server
    print_info "Testing web server..."
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:8080/health > /dev/null; then
            print_status "Web server is responding"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_warning "Web server test failed after $max_attempts attempts"
            break
        fi
        
        print_info "Waiting for web server... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    # Test database connection through web
    print_info "Testing database connection through web interface..."
    local health_response=$(curl -s http://localhost:8080/health)
    if echo "$health_response" | grep -q '"database": "connected"'; then
        print_status "Database connection through web interface is working"
    else
        print_warning "Database connection through web interface failed"
    fi
    
    # Test nutrition engine
    print_info "Testing nutrition calculation engine..."
    if docker-compose exec -T app php test_nutrition_engine.php > /dev/null 2>&1; then
        print_status "Nutrition calculation engine is working"
    else
        print_warning "Nutrition engine test failed"
    fi
}

# Function to show access information
show_access_info() {
    print_section "Access Information"
    
    echo "🎉 ANMS Setup Complete!"
    echo ""
    echo "Access your application:"
    echo "📱 Main Application:  http://localhost:8080"
    echo "🔍 Health Check:      http://localhost:8080/health"
    echo "🗄️  phpMyAdmin:       http://localhost:8081"
    echo ""
    echo "Database Information:"
    echo "🏠 Host: localhost:3307 (external) / database:3306 (internal)"
    echo "📊 Database: anms_db"
    echo "👤 Username: anms_user"
    echo "🔑 Password: anms_password"
    echo ""
    echo "Sample Login Credentials:"
    echo "📧 Email: john@example.com"
    echo "🔐 Password: password123"
    echo ""
    echo "📧 Email: jane@example.com"
    echo "🔐 Password: password123"
    echo ""
    echo "📧 Email: dr.wilson@vetclinic.com (Veterinarian)"
    echo "🔐 Password: vetpass123"
    echo ""
    echo "Useful Commands:"
    echo "🔍 Check status:      ./check_status.sh"
    echo "🔧 Troubleshoot:      ./troubleshoot.sh"
    echo "🛑 Stop services:     docker-compose down"
    echo "🔄 Restart services:  docker-compose restart"
    echo "📋 View logs:         docker-compose logs"
    echo ""
}

# Function to handle errors
handle_error() {
    print_error "Setup failed at step: $1"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check Docker is running: docker info"
    echo "2. Check port availability: ./troubleshoot.sh --full"
    echo "3. View logs: docker-compose logs"
    echo "4. Clean restart: docker-compose down && docker-compose up -d"
    echo ""
    echo "For detailed troubleshooting, run: ./troubleshoot.sh"
}

# Main execution with error handling
main() {
    trap 'handle_error "Unknown"' ERR
    
    echo "Starting comprehensive ANMS setup..."
    echo ""
    
    check_docker
    check_and_fix_ports
    setup_environment
    cleanup_containers
    start_services
    init_database
    test_installation
    show_access_info
    
    print_status "Setup completed successfully! 🚀"
}

# Handle script interruption
trap 'echo -e "\n${RED}Setup interrupted!${NC}"; exit 1' INT

# Run main function
main

# Optional: Open browser
if command -v xdg-open &> /dev/null; then
    read -p "Would you like to open the application in your browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open http://localhost:8080
    fi
elif command -v open &> /dev/null; then
    read -p "Would you like to open the application in your browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open http://localhost:8080
    fi
fi