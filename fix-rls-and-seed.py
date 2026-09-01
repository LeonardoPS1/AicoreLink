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
out = run('sudo docker ps -q --filter name=aicorelink')
app_container = out.strip().split('\n')[0]
print(f"App container: {app_container}")

out = run('sudo docker ps -q --filter name=aicore-n8nrunnerpostgresollama-a715gi-postgres-1')
pg_container = out.strip().split('\n')[0]
print(f"Postgres container: {pg_container}")

# 1. Run seed using npx (uses project's installed version)
print("\n=== Running seed (enable whatsapp_text channel) ===")
run(f'sudo docker exec -e AICORELINK_DATABASE_URL="postgresql://aicorelink_app:AicoreLink2024!AppPass@172.18.0.1:5432/aicorelink" {app_container} npx --yes tsx prisma/seed.ts', 120)

# 2. Re-apply RLS policies as the table owner (need to find who owns the tables)
print("\n=== Checking table owners ===")
run(f'sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass {pg_container} psql -U aicorelink_app -d aicorelink -c "SELECT schemaname, tablename, tableowner FROM pg_tables WHERE schemaname = \'public\';"', 60)

# 3. Drop and recreate RLS policies properly
print("\n=== Re-applying RLS policies (as table owner) ===")
# First find the owner
owner_out = run(f'sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass {pg_container} psql -U aicorelink_app -d aicorelink -c "SELECT tableowner FROM pg_tables WHERE schemaname = \'public\' AND tablename = \'tenants\';"', 60)
print(f"Owner output: {owner_out}")

# Apply RLS as the correct user - use DO block to handle ownership
run(f'''sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass {pg_container} psql -U aicorelink_app -d aicorelink -c "
DROP POLICY IF EXISTS tenant_isolation ON tenant_channels;
DROP POLICY IF EXISTS tenant_isolation ON channel_credentials;
DROP POLICY IF EXISTS tenant_isolation ON tenant_usage;
DROP POLICY IF EXISTS tenant_isolation ON conversations;
DROP POLICY IF EXISTS tenant_isolation ON messages;

ALTER TABLE tenant_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_channels USING (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE channel_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON channel_credentials USING (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_usage USING (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON conversations USING (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON messages USING (tenant_id::text = current_setting('app.current_tenant', true));
"''', 60)

# 4. Verify tenant_channels now has data
print("\n=== Verifying tenant_channels ===")
run(f'sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass {pg_container} psql -U aicorelink_app -d aicorelink -c "SELECT * FROM tenant_channels;"', 60)

# 5. Verify policies exist
print("\n=== Verifying policies ===")
run(f'sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass {pg_container} psql -U aicorelink_app -d aicorelink -c "SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname = \'public\';"', 60)

# 6. Restart app
print("\n=== Restarting app container ===")
run(f'sudo docker restart {app_container}')

print("\n=== Done ===")
client.close()