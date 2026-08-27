import paramiko
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def run(client, cmd, timeout=15):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode(errors='replace') + stderr.read().decode(errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

cid = run(client, "sudo docker ps --filter name=aicorelink --format '{{.ID}}' | head -1").strip()
print(f"Container: {cid}")

print("=" * 60)
print("1. FIND bcryptjs IN CONTAINER")
print("=" * 60)
print(run(client, f"sudo docker exec {cid} find / -name 'bcrypt*' 2>/dev/null | head -20"))

print("=" * 60)
print("2. FIND auth-related files in .next/server")
print("=" * 60)
print(run(client, f"sudo docker exec {cid} find /app/.next/server -type f -name '*.js' 2>/dev/null | head -30"))

print("=" * 60)
print("3. CHECK .next/standalone structure")
print("=" * 60)
print(run(client, f"sudo docker exec {cid} ls -la /app/.next/standalone/ 2>/dev/null || echo 'no standalone dir'"))
print(run(client, f"sudo docker exec {cid} find /app/.next/standalone -name 'bcrypt*' 2>/dev/null | head -10"))

print("=" * 60)
print("4. CHECK node_modules in container root")
print("=" * 60)
print(run(client, f"sudo docker exec {cid} ls /app/node_modules/ 2>/dev/null | head -30"))
print(run(client, f"sudo docker exec {cid} ls /app/node_modules/bcryptjs 2>/dev/null || echo 'bcryptjs NOT in /app/node_modules'"))

print("=" * 60)
print("5. CHECK the Dockerfile to understand build")
print("=" * 60)
# Check the current dockerfile
print(run(client, f"sudo docker exec {cid} cat /app/Dockerfile 2>/dev/null || echo 'No Dockerfile in container'"))

print("=" * 60)
print("6. DIRECTLY INSERT tenant_channels via SQL")
print("=" * 60)
PG = """sudo docker exec -e PGPASSWORD='AicoreLink2024!AppPass' aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink"""
insert_sql = """INSERT INTO tenant_channels (id, tenant_id, channel, enabled, config, activated_at) VALUES 
  (gen_random_uuid(), '6a25006a-e0b1-434c-8c2f-a97cf84d7926', 'whatsapp_text', true, '{"tone":"amable","autoReplyEnabled":true}', NOW()),
  (gen_random_uuid(), '6a25006a-e0b1-434c-8c2f-a97cf84d7926', 'whatsapp_voice', true, '{}', NOW()),
  (gen_random_uuid(), '6a25006a-e0b1-434c-8c2f-a97cf84d7926', 'email', true, '{}', NOW()),
  (gen_random_uuid(), '6a25006a-e0b1-434c-8c2f-a97cf84d7926', 'social', true, '{}', NOW())
ON CONFLICT DO NOTHING;"""
print(run(client, f"{PG} -c \"{insert_sql}\""))

print("=" * 60)
print("7. VERIFY tenant_channels AFTER INSERT")
print("=" * 60)
print(run(client, f"{PG} -c \"SELECT id, channel, enabled FROM tenant_channels WHERE tenant_id = '6a25006a-e0b1-434c-8c2f-a97cf84d7926';\""))

print("=" * 60)
print("8. CHECK RLS POLICIES ON tenant_channels")
print("=" * 60)
print(run(client, f"{PG} -c \"SELECT schemaname, tablename, policyname, qual FROM pg_policies WHERE tablename = 'tenant_channels';\""))

client.close()
