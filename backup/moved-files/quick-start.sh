#!/bin/bash

# ANMS Quick Start Script
# This script will set up and run the Animal Nutrition Management System

set -e  # Exit on any error

echo "🐾 ANMS Quick Start Setup"
echo "========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is installed
check_docker() {
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
    
    print_status "Docker and Docker Compose are installed"
}

# Check if Docker daemon is running
check_docker_daemon() {
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    print_status "Docker daemon is running"
}

# Setup environment file
setup_environment() {
    if [ ! -f .env ]; then
        print_info "Creating environment configuration..."
        cp .env.example .env
        print_status "Environment file created (.env)"
    else
        print_warning "Environment file already exists"
    fi
}

# Start Docker services
start_services() {
    print_info "Starting Docker services..."
    
    # Stop any existing containers
    docker-compose down &> /dev/null || true
    
    # Start services
    docker-compose up -d
    
    print_status "Docker services started"
    
    # Wait for services to be ready
    print_info "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_status "All services are running"
    else
        print_error "Some services failed to start"
        docker-compose ps
        exit 1
    fi
}

# Initialize database
init_database() {
    print_info "Initializing database..."
    
    # Wait for database to be ready
    print_info "Waiting for database to be ready..."
    sleep 5
    
    # Run migrations
    if docker-compose exec -T app php database/simple_migrate.php; then
        print_status "Database migrations completed"
    else
        print_error "Database migration failed"
        exit 1
    fi
    
    # Seed database
    if docker-compose exec -T app php database/simple_seed.php; then
        print_status "Database seeded with sample data"
    else
        print_warning "Database seeding failed (this might be okay)"
    fi
}

# Test the installation
test_installation() {
    print_info "Testing the installation..."
    
    # Test web server
    if curl -s http://localhost:8080 > /dev/null; then
        print_status "Web server is responding"
    else
        print_warning "Web server test failed (might still be starting up)"
    fi
    
    # Test nutrition engine
    if docker-compose exec -T app php test_nutrition_engine.php > /dev/null 2>&1; then
        print_status "Nutrition calculation engine is working"
    else
        print_warning "Nutrition engine test failed"
    fi
}

# Display access information
show_access_info() {
    echo ""
    echo "🎉 ANMS Setup Complete!"
    echo "======================="
    echo ""
    echo "Access your application:"
    echo "📱 Main Application:  http://localhost:8080"
    echo "🗄️  phpMyAdmin:       http://localhost:8081"
    echo ""
    echo "Database Credentials:"
    echo "👤 Username: anms_user"
    echo "🔑 Password: anms_password"
    echo ""
    echo "Useful Commands:"
    echo "🔍 View logs:         docker-compose logs"
    echo "🛑 Stop services:     docker-compose down"
    echo "🔄 Restart services:  docker-compose restart"
    echo "🧪 Run tests:         docker-compose exec app php test_nutrition_engine.php"
    echo ""
    echo "📖 For detailed instructions, see SETUP_INSTRUCTIONS.md"
    echo ""
}

# Main execution
main() {
    echo "Starting ANMS setup process..."
    echo ""
    
    check_docker
    check_docker_daemon
    setup_environment
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