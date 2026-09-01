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

# Test what host header the app sees
run(f'sudo docker exec {app_container} sh -c "curl -s -H \"Host: aicorelink.aicorebots.com\" http://localhost:3000/api/auth/csrf 2>&1 | head -5"')

# Also check X-Forwarded headers
run(f'sudo docker exec {app_container} sh -c "curl -s -H \"Host: aicorelink.aicorebots.com\" -H \"X-Forwarded-Proto: https\" -H \"X-Forwarded-Host: aicorelink.aicorebots.com\" http://localhost:3000/api/auth/csrf 2>&1 | head -10"')

client.close()