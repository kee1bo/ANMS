#!/bin/bash
echo "Starting ANMS on http://localhost:8080"
echo "Press Ctrl+C to stop the server"
echo ""
php -S localhost:8080 -t public/
