#!/bin/bash

# ANMS Troubleshooting Script
# This script helps diagnose common issues with the ANMS setup

set -e

echo "🔧 ANMS Troubleshooting Tool"
echo "============================"
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

# Check system requirements
check_system() {
    print_section "System Requirements"
    
    # Check Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_status "Docker: $DOCKER_VERSION"
    else
        print_error "Docker is not installed"
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version)
        print_status "Docker Compose: $COMPOSE_VERSION"
    else
        print_error "Docker Compose is not installed"
    fi
    
    # Check Docker daemon
    if docker info &> /dev/null; then
        print_status "Docker daemon is running"
    else
        print_error "Docker daemon is not running"
    fi
}

# Check port availability
check_ports() {
    print_section "Port Availability"
    
    PORTS=(8080 8081 3306 6379)
    
    for port in "${PORTS[@]}"; do
        if lsof -i :$port &> /dev/null; then
            PROCESS=$(lsof -i :$port | tail -n 1 | awk '{print $1}')
            print_warning "Port $port is in use by: $PROCESS"
        else
            print_status "Port $port is available"
        fi
    done
}

# Check Docker containers
check_containers() {
    print_section "Docker Containers Status"
    
    if docker-compose ps &> /dev/null; then
        echo "Container Status:"
        docker-compose ps
        echo ""
        
        # Check individual containers
        CONTAINERS=("anms_app" "anms_webserver" "anms_database" "anms_redis" "anms_phpmyadmin")
        
        for container in "${CONTAINERS[@]}"; do
            if docker ps | grep -q $container; then
                print_status "$container is running"
            else
                print_error "$container is not running"
            fi
        done
    else
        print_warning "No Docker Compose services found"
    fi
}

# Check network connectivity
check_connectivity() {
    print_section "Network Connectivity"
    
    # Check web server
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        print_status "Web server (port 8080) is accessible"
    else
        print_error "Web server (port 8080) is not accessible"
    fi
    
    # Check phpMyAdmin
    if curl -s http://localhost:8081 > /dev/null 2>&1; then
        print_status "phpMyAdmin (port 8081) is accessible"
    else
        print_error "phpMyAdmin (port 8081) is not accessible"
    fi
}

# Check database connectivity
check_database() {
    print_section "Database Connectivity"
    
    if docker-compose exec -T database mysql -u anms_user -panms_password -e "SELECT 1;" &> /dev/null; then
        print_status "Database connection successful"
        
        # Check if tables exist
        TABLE_COUNT=$(docker-compose exec -T database mysql -u anms_user -panms_password anms_db -e "SHOW TABLES;" 2>/dev/null | wc -l)
        if [ $TABLE_COUNT -gt 1 ]; then
            print_status "Database tables exist ($((TABLE_COUNT-1)) tables)"
        else
            print_warning "No database tables found - run migrations"
        fi
    else
        print_error "Database connection failed"
    fi
}

# Check file permissions
check_permissions() {
    print_section "File Permissions"
    
    # Check if files are readable
    if [ -r .env ]; then
        print_status ".env file is readable"
    else
        print_warning ".env file is not readable or doesn't exist"
    fi
    
    if [ -r docker-compose.yml ]; then
        print_status "docker-compose.yml is readable"
    else
        print_error "docker-compose.yml is not readable"
    fi
    
    # Check storage directory
    if [ -d storage ]; then
        if [ -w storage ]; then
            print_status "Storage directory is writable"
        else
            print_warning "Storage directory is not writable"
        fi
    else
        print_info "Storage directory doesn't exist (this might be okay)"
    fi
}

# Show logs
show_logs() {
    print_section "Recent Logs"
    
    echo "Last 10 lines from each service:"
    echo ""
    
    SERVICES=("app" "webserver" "database" "redis")
    
    for service in "${SERVICES[@]}"; do
        echo -e "${BLUE}--- $service logs ---${NC}"
        docker-compose logs --tail=5 $service 2>/dev/null || echo "No logs available for $service"
        echo ""
    done
}

# Suggest fixes
suggest_fixes() {
    print_section "Common Fixes"
    
    echo "If you're experiencing issues, try these commands:"
    echo ""
    echo "🔄 Restart all services:"
    echo "   docker-compose restart"
    echo ""
    echo "🛑 Stop and start fresh:"
    echo "   docker-compose down"
    echo "   docker-compose up -d"
    echo ""
    echo "🔨 Rebuild containers:"
    echo "   docker-compose down"
    echo "   docker-compose build --no-cache"
    echo "   docker-compose up -d"
    echo ""
    echo "🗄️ Reset database:"
    echo "   docker-compose exec app php database/migrate.php"
    echo "   docker-compose exec app php database/seed.php"
    echo ""
    echo "🧹 Clean up Docker:"
    echo "   docker system prune -f"
    echo "   docker volume prune -f"
    echo ""
    echo "📋 Check detailed logs:"
    echo "   docker-compose logs [service_name]"
    echo ""
}

# Interactive menu
show_menu() {
    echo ""
    echo "What would you like to do?"
    echo "1) Run full diagnostic"
    echo "2) Check system requirements only"
    echo "3) Check containers status only"
    echo "4) Show recent logs"
    echo "5) Test connectivity"
    echo "6) Show common fixes"
    echo "7) Exit"
    echo ""
    read -p "Enter your choice (1-7): " choice
    
    case $choice in
        1)
            check_system
            check_ports
            check_containers
            check_connectivity
            check_database
            check_permissions
            suggest_fixes
            ;;
        2)
            check_system
            ;;
        3)
            check_containers
            ;;
        4)
            show_logs
            ;;
        5)
            check_connectivity
            check_database
            ;;
        6)
            suggest_fixes
            ;;
        7)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please try again."
            show_menu
            ;;
    esac
}

# Main execution
main() {
    if [ $# -eq 0 ]; then
        # Interactive mode
        show_menu
    else
        # Command line mode
        case $1 in
            --full)
                check_system
                check_ports
                check_containers
                check_connectivity
                check_database
                check_permissions
                ;;
            --system)
                check_system
                ;;
            --containers)
                check_containers
                ;;
            --logs)
                show_logs
                ;;
            --connectivity)
                check_connectivity
                check_database
                ;;
            --fixes)
                suggest_fixes
                ;;
            *)
                echo "Usage: $0 [--full|--system|--containers|--logs|--connectivity|--fixes]"
                echo "Run without arguments for interactive mode"
                ;;
        esac
    fi
}

# Run main function
main "$@"