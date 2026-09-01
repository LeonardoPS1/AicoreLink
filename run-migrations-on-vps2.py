import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=30)

def run(cmd, timeout=180):
    print(f'>>> {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print('STDERR:', err)
    return out

# Find containers
print("=== Finding containers ===")
out = run('sudo docker ps -q --filter name=aicorelink')
app_container = out.strip().split('\n')[0]
print(f"App container: {app_container}")

out = run('sudo docker ps -q --filter name=aicore-n8nrunnerpostgresollama-a715gi-postgres-1')
pg_container = out.strip().split('\n')[0]
print(f"Postgres container (Aicore): {pg_container}")

# First, create database and roles as postgres superuser
print("\n=== Creating database and roles ===")
run(f'sudo docker exec {pg_container} psql -U postgres -c "CREATE DATABASE aicorelink;"', 30)
run(f'sudo docker exec {pg_container} psql -U postgres -c "CREATE ROLE aicorelink_app LOGIN PASSWORD \'AicoreLink2024!AppPass\';"', 30)
run(f'sudo docker exec {pg_container} psql -U postgres -c "CREATE ROLE aicorelink_admin LOGIN PASSWORD \'AicoreLink2024!AppPass\' BYPASSRLS;"', 30)
run(f'sudo docker exec {pg_container} psql -U postgres -c "GRANT ALL ON DATABASE aicorelink TO aicorelink_app, aicorelink_admin;"', 30)
run(f'sudo docker exec {pg_container} psql -U postgres -d aicorelink -c "GRANT ALL ON SCHEMA public TO aicorelink_app, aicorelink_admin; GRANT ALL ON ALL TABLES IN SCHEMA public TO aicorelink_app, aicorelink_admin; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO aicorelink_app, aicorelink_admin; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO aicorelink_app, aicorelink_admin; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO aicorelink_app, aicorelink_admin; CREATE EXTENSION IF NOT EXISTS \\"uuid-ossp\\";"', 30)

# 1. Run Prisma migrations using project's prisma (not npx)
print("\n=== Running Prisma migrations ===")
run(f'sudo docker exec -e AICORELINK_DATABASE_URL="postgresql://aicorelink_app:AicoreLink2024!AppPass@172.18.0.1:5432/aicorelink" {app_container} ./node_modules/.bin/prisma migrate deploy', 300)

# 2. Apply RLS policies
print("\n=== Applying RLS policies ===")
run(f'sudo docker cp {app_container}:/app/prisma/rls.sql /tmp/rls.sql')
run(f'sudo docker cp /tmp/rls.sql {pg_container}:/tmp/rls.sql')
run(f'sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass {pg_container} psql -U aicorelink_app -d aicorelink -f /tmp/rls.sql', 60)

# 3. Run seed
print("\n=== Running seed ===")
run(f'sudo docker exec -e AICORELINK_DATABASE_URL="postgresql://aicorelink_app:AicoreLink2024!AppPass@172.18.0.1:5432/aicorelink" {app_container} ./node_modules/.bin/tsx prisma/seed.ts', 120)

# 4. Verify
print("\n=== Verifying database ===")
run(f'sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass {pg_container} psql -U aicorelink_app -d aicorelink -c "SELECT \'tenants\' as t, count(*) FROM tenants UNION ALL SELECT \'users\', count(*) FROM users UNION ALL SELECT \'tenant_users\', count(*) FROM tenant_users UNION ALL SELECT \'tenant_channels\', count(*) FROM tenant_channels;"', 60)

run(f'sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass {pg_container} psql -U aicorelink_app -d aicorelink -c "SELECT email, password_hash IS NOT NULL as has_pwd FROM users WHERE email = \'dev@aicore.com\';"', 60)

run(f'sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass {pg_container} psql -U aicorelink_app -d aicorelink -c "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = \'public\' AND rowsecurity = true;"', 60)

# 5. Restart app
print("\n=== Restarting app container ===")
run(f'sudo docker restart {app_container}')

print("\n=== Done ===")
client.close()