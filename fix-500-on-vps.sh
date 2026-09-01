#!/bin/bash
# Run this on the VPS (51.222.207.250) as root to fix 500 error
# Fixes: runs migrations, applies RLS, seeds data, verifies connection

set -e

echo "=== Fixing 500 error on VPS ==="

# 1. Find the container running the app
APP_CONTAINER=$(docker ps -q --filter name=aicorelink-aicorelink-b7m7ol | head -1)
if [ -z "$APP_CONTAINER" ]; then
  echo "ERROR: App container not found"
  exit 1
fi
echo "App container: $APP_CONTAINER"

# 2. Find the PostgreSQL container
PG_CONTAINER=$(docker ps -q --filter name=postgres | head -1)
if [ -z "$PG_CONTAINER" ]; then
  echo "ERROR: PostgreSQL container not found"
  exit 1
fi
echo "PostgreSQL container: $PG_CONTAINER"

# 3. Run Prisma migrations inside app container
echo "=== Running Prisma migrations ==="
docker exec -e AICORELINK_DATABASE_URL="postgresql://aicorelink_app:AicoreLink2024!AppPass@172.18.0.1:5432/aicorelink" \
  $APP_CONTAINER npx prisma migrate deploy

# 4. Apply RLS policies (copy rls.sql to PG container first)
echo "=== Applying RLS policies ==="
docker cp $APP_CONTAINER:/app/prisma/rls.sql /tmp/rls.sql
docker cp /tmp/rls.sql $PG_CONTAINER:/tmp/rls.sql
docker exec -e PGPASSWORD=AicoreLink2024!AppPass \
  $PG_CONTAINER psql -U aicorelink_app -d aicorelink -f /tmp/rls.sql

# 5. Run seed data
echo "=== Running seed data ==="
docker exec -e AICORELINK_DATABASE_URL="postgresql://aicorelink_app:AicoreLink2024!AppPass@172.18.0.1:5432/aicorelink" \
  $APP_CONTAINER npx tsx prisma/seed.ts

# 6. Verify database connection and data
echo "=== Verifying database ==="
docker exec -e PGPASSWORD=AicoreLink2024!AppPass \
  $PG_CONTAINER psql -U aicorelink_app -d aicorelink -c "
    SELECT 'tenants' as table_name, count(*) FROM tenants
    UNION ALL SELECT 'users', count(*) FROM users
    UNION ALL SELECT 'tenant_users', count(*) FROM tenant_users
    UNION ALL SELECT 'tenant_channels', count(*) FROM tenant_channels;
  "

# 7. Verify user password hash
echo "=== Verifying user ==="
docker exec -e PGPASSWORD=AicoreLink2024!AppPass \
  $PG_CONTAINER psql -U aicorelink_app -d aicorelink -c "
    SELECT email, password_hash IS NOT NULL as has_password FROM users WHERE email = 'dev@aicore.com';
  "

# 8. Verify RLS is enabled
echo "=== Verifying RLS ==="
docker exec -e PGPASSWORD=AicoreLink2024!AppPass \
  $PG_CONTAINER psql -U aicorelink_app -d aicorelink -c "
    SELECT schemaname, tablename, rowsecurity FROM pg_tables 
    WHERE schemaname = 'public' AND rowsecurity = true;
  "

# 9. Restart app container to pick up changes
echo "=== Restarting app container ==="
docker restart $APP_CONTAINER

echo "=== Fix complete ==="
echo "Wait ~30s for container to restart, then test https://aicorelink.aicorebots.com"