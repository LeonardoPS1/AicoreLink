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

out = run('sudo docker ps -q --filter name=aicorelink')
app_container = out.strip().split('\n')[0]

# Check all auth-related env vars
run(f'sudo docker exec {app_container} printenv | grep -E "NEXTAUTH|AICORELINK"')

# Check host header received by app
run(f'sudo docker exec {app_container} sh -c "echo Host: \$(curl -s -H \"Host: aicorelink.aicorebots.com\" http://localhost:3000/api/auth/csrf 2>&1 | head -5)" 2>&1 || true')

client.close()