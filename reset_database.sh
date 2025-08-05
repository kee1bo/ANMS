#!/bin/bash
echo "Resetting ANMS database..."
mysql -u root -e "DROP DATABASE IF EXISTS anms_db; CREATE DATABASE anms_db;"
mysql -u root anms_db < database/schema.sql
echo "Database reset complete"
