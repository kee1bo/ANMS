#!/bin/bash

# --- Configuration ---
DB_NAME="anms_db"

log_info() {
    echo -e "\e[32m[INFO]\e[0m $1"
}

log_error() {
    echo -e "\e[31m[ERROR]\e[0m $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "Please run this script with sudo: sudo ./reset_anms.sh"
        exit 1
    fi
}

reset_database() {
    log_info "Resetting MySQL database..."

    read -s -p "Enter the MySQL root password: " MYSQL_ROOT_PASSWORD
    echo

    mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<MYSQL_SCRIPT
DROP DATABASE IF EXISTS \`$DB_NAME\`;
FLUSH PRIVILEGES;
MYSQL_SCRIPT

    if [ $? -ne 0 ]; then
        log_error "Failed to drop database. Please check MySQL server status and root password."
        exit 1
    fi
    log_info "Database '$DB_NAME' dropped successfully."
}

# --- Main Script Execution ---

check_root
reset_database

log_info "Running setup_anms.sh to reconfigure..."
./setup_anms.sh

log_info "Database reset and setup complete!"

