import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

def run(cmd, timeout=120):
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print("STDERR:", err)
    return out

# 1. Update NEXTAUTH_URL via docker service update (immediate effect)
run("sudo docker service update --env-add NEXTAUTH_URL=https://aicorelink.aicorebots.com --env-add AICORELINK_NEXTAUTH_URL=https://aicorelink.aicorebots.com aicorelink-aicorelink-b7m7ol", timeout=120)

# 2. Wait for restart
time.sleep(15)

# 3. Verify the env var is updated
run("sudo docker exec $(sudo docker ps -q --filter name=aicorelink-aicorelink-b7m7ol) printenv NEXTAUTH_URL")

# 4. Verify bcryptjs is still there
run("sudo docker exec $(sudo docker ps -q --filter name=aicorelink-aicorelink-b7m7ol) ls /app/node_modules/bcryptjs/package.json 2>/dev/null && echo 'bcryptjs OK' || echo 'bcryptjs MISSING'")

# 5. Verify login works from VPS
run("curl -s -c /tmp/cookies.txt -b /tmp/cookies.txt https://aicorelink.aicorebots.com/api/auth/csrf 2>/dev/null | head -1")

# 6. Get container ID
run("sudo docker ps -q --filter name=aicorelink-aicorelink-b7m7ol")

# 7. Check service status
run("sudo docker service ps aicorelink-aicorelink-b7m7ol --format '{{.Name}} {{.CurrentState}} {{.Error}}' | head -1")

client.close()
