#!/bin/bash
# Fix PostgreSQL user password for aicorelink_app
# Run on VPS as root or postgres user

set -e

DB_USER="aicorelink_app"
DB_NAME="aicorelink"
NEW_PASSWORD="AicoreLink2024!AppPass"

echo "=== Fixing PostgreSQL user password ==="
echo "User: $DB_USER"
echo "Database: $DB_NAME"
echo "New password: $NEW_PASSWORD"
echo ""

# Check if user exists
echo "Checking if user exists..."
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'")

if [ "$USER_EXISTS" = "1" ]; then
    echo "User $DB_USER exists. Updating password..."
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$NEW_PASSWORD';"
    echo "Password updated successfully."
else
    echo "User $DB_USER does not exist. Creating..."
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$NEW_PASSWORD';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    echo "User created and granted privileges."
fi

# Verify connection
echo ""
echo "=== Verifying connection ==="
export PGPASSWORD="$NEW_PASSWORD"
if psql -h 172.18.0.1 -U "$DB_USER" -d "$DB_NAME" -c "SELECT current_user, current_database();" 2>/dev/null; then
    echo "✓ Connection successful!"
else
    echo "✗ Connection failed!"
    exit 1
fi

echo ""
echo "=== Checking users table ==="
psql -h 172.18.0.1 -U "$DB_USER" -d "$DB_NAME" -c "SELECT email, id FROM users;"

echo ""
echo "Done! Update Dokploy env var AICORELINK_DATABASE_URL to:"
echo "postgresql://aicorelink_app:AicoreLink2024!AppPass@172.18.0.1:5432/aicorelink"