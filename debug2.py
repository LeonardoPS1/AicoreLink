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

PG = """sudo docker exec -e PGPASSWORD='AicoreLink2024!AppPass' aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink"""

print("=" * 60)
print("1. ALL TENANTS")
print("=" * 60)
print(run(client, f"{PG} -c \"SELECT id, slug, name, status FROM tenants;\""))

print("=" * 60)
print("2. ALL USERS")
print("=" * 60)
print(run(client, f"{PG} -c \"SELECT id, email FROM users;\""))

print("=" * 60)
print("3. ALL TENANT_USERS")
print("=" * 60)
print(run(client, f"{PG} -c \"SELECT * FROM tenant_users;\""))

print("=" * 60)
print("4. ALL TENANT_CHANNELS (no filter)")
print("=" * 60)
print(run(client, f"{PG} -c \"SELECT * FROM tenant_channels;\""))

print("=" * 60)
print("5. ALL COST_RATES")
print("=" * 60)
print(run(client, f"{PG} -c \"SELECT * FROM cost_rates;\""))

# Find auth.ts in the container
print("=" * 60)
print("6. FIND AUTH FILES IN CONTAINER")
print("=" * 60)
cid = run(client, "sudo docker ps --filter name=aicorelink --format '{{.ID}}' | head -1").strip()
print(f"Container: {cid}")

# Check the actual structure in /app
print(run(client, f"sudo docker exec {cid} find /app -name 'auth.js' -o -name 'auth.ts' 2>/dev/null | head -20"))

# Check if bcryptjs is in the bundle
print(run(client, f"sudo docker exec {cid} find /app -path '*/bcryptjs*' 2>/dev/null | head -10"))

# Check the .next/server structure
print(run(client, f"sudo docker exec {cid} ls -la /app/.next/server/ 2>/dev/null || echo 'no .next/server'"))

# Check the lib directory structure
print(run(client, f"sudo docker exec {cid} find /app -name 'lib' -type d 2>/dev/null | head -10"))

# Check the full apps/dashboard tree
print(run(client, f"sudo docker exec {cid} find /app -maxdepth 4 -type f -name '*.js' | grep -i auth | head -20"))

client.close()
