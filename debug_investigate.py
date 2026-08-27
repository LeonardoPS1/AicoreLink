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

# Get actual running container ID
cid = run(client, "sudo docker ps --filter name=aicorelink --format '{{.ID}}' | head -1").strip()
print(f"Container ID: {cid}")

print("\n" + "=" * 60)
print("1. KEY ENV VARS")
print("=" * 60)
env = run(client, f"sudo docker exec {cid} env | grep -iE 'NEXTAUTH|DATABASE|ENCRYPTION|AICORELINK|NODE_ENV'")
print(env)

print("=" * 60)
print("2. AUTH.TS (first 3000 chars)")
print("=" * 60)
auth = run(client, f"sudo docker exec {cid} cat /app/apps/dashboard/lib/auth.ts")
print(auth[:3000])

print("=" * 60)
print("3. DB SCHEMA TABLES")
print("=" * 60)
print(run(client, """sudo docker exec -e PGPASSWORD='AicoreLink2024!AppPass' aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink -c "\\dt" """))

print("=" * 60)
print("4. TENANT_CHANNELS DATA")
print("=" * 60)
print(run(client, """sudo docker exec -e PGPASSWORD='AicoreLink2024!AppPass' aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink -c "SELECT id, channel, enabled FROM tenant_channels WHERE tenant_id = '6a25006a-e0b1-434c-8c2f-a97cf84d7926';" """))

print("=" * 60)
print("5. TEST LOGIN FROM HOST (curl)")
print("=" * 60)
# Test login from the host machine  
print(run(client, """curl -s -c /tmp/cookies.txt -b /tmp/cookies.txt https://aicorelink.aicorebots.com/api/auth/csrf""", timeout=15))
print()

print("=" * 60)
print("6. CHECK IF bcryptjs IS AVAILABLE IN CONTAINER")
print("=" * 60)
print(run(client, f"sudo docker exec {cid} ls -la /app/apps/dashboard/node_modules/bcryptjs/index.js 2>&1 || echo NOT FOUND"))

print("=" * 60)
print("7. CHECK package.json (production deps only?)")
print("=" * 60)
print(run(client, f"sudo docker exec {cid} cat /app/apps/dashboard/package.json | grep -A2 bcrypt"))

client.close()
