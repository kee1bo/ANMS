#!/bin/bash

# ANMS Status Check Script
# Quick status check for the Animal Nutrition Management System

echo "🐾 ANMS Status Check"
echo "==================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Docker containers
echo "📦 Docker Containers:"
if docker-compose ps 2>/dev/null | grep -q "Up"; then
    echo -e "${GREEN}✓${NC} Containers are running"
    docker-compose ps
else
    echo -e "${RED}✗${NC} Containers are not running"
    echo "Run: docker-compose up -d"
fi

echo ""

# Check web accessibility
echo "🌐 Web Services:"
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Main application: http://localhost:8080"
else
    echo -e "${RED}✗${NC} Main application not accessible"
fi

if curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} phpMyAdmin: http://localhost:8081"
else
    echo -e "${RED}✗${NC} phpMyAdmin not accessible"
fi

echo ""

# Check database
echo "🗄️ Database:"
if docker-compose exec -T database mysql -u anms_user -panms_password -e "SELECT 1;" &> /dev/null; then
    echo -e "${GREEN}✓${NC} Database connection successful"
    
    # Count tables
    TABLE_COUNT=$(docker-compose exec -T database mysql -u anms_user -panms_password anms_db -e "SHOW TABLES;" 2>/dev/null | wc -l)
    if [ $TABLE_COUNT -gt 1 ]; then
        echo -e "${GREEN}✓${NC} Database has $((TABLE_COUNT-1)) tables"
    else
        echo -e "${YELLOW}⚠${NC} No tables found - run migrations"
    fi
else
    echo -e "${RED}✗${NC} Database connection failed"
fi

echo ""

# Test nutrition engine
echo "🧮 Nutrition Engine:"
if docker-compose exec -T app php test_nutrition_engine.php > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Nutrition calculation engine working"
else
    echo -e "${RED}✗${NC} Nutrition engine test failed"
fi

echo ""

# Show quick stats
echo "📊 Quick Stats:"
echo "Current time: $(date)"
echo "Uptime: $(docker-compose exec -T app uptime 2>/dev/null | cut -d',' -f1 | cut -d' ' -f4- || echo 'N/A')"

echo ""
echo "For detailed troubleshooting, run: ./troubleshoot.sh"