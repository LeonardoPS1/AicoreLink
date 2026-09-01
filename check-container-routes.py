import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=30)

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    if out: print(out)
    if err: print('STDERR:', err)
    return out

# Get app container
out = run('sudo docker ps -q --filter name=aicorelink')
app_container = out.strip().split('\n')[0]
print(f"App container: {app_container}")

# Check if manual routes exist in container
run(f'sudo docker exec {app_container} find /app -name "route.ts" -path "*/api/auth/*" 2>/dev/null | head -20')

# Check the callback directory
run(f'sudo docker exec {app_container} ls -la /app/app/api/auth/callback/ 2>/dev/null || echo "callback dir not found"')

run(f'sudo docker exec {app_container} ls -la /app/app/api/auth/callback/credentials/ 2>/dev/null || echo "credentials dir not found"')

run(f'sudo docker exec {app_container} cat /app/app/api/auth/callback/credentials/route.ts 2>/dev/null || echo "route.ts not found"')

client.close()