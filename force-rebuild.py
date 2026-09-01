import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=30)

def run(cmd, timeout=300):
    print(f'>>> {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    if out: print(out)
    if err: print('STDERR:', err)
    return out

# Clear Docker build cache
print("=== Clearing Docker build cache ===")
run('sudo docker builder prune -af', 120)

# Force service update with no cache
print("=== Forcing service rebuild ===")
run('sudo docker service update --force aicorelink-aicorelink-b7m7ol', 180)

# Wait and check
import time
time.sleep(30)

# Check if routes exist now
out = run('sudo docker ps -q --filter name=aicorelink')
app_container = out.strip().split('\n')[0]
print(f"App container: {app_container}")

run(f'sudo docker exec {app_container} ls -la /app/app/api/auth/callback/ 2>/dev/null || echo "callback dir not found"')
run(f'sudo docker exec {app_container} ls -la /app/app/api/auth/callback/credentials/ 2>/dev/null || echo "credentials dir not found"')
run(f'sudo docker exec {app_container} cat /app/app/api/auth/callback/credentials/route.ts 2>/dev/null | head -5 || echo "route.ts not found"')

client.close()