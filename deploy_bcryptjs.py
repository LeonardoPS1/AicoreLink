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

# 1. Pull latest code
run("cd /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code && sudo git config --global --add safe.directory /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code && sudo git fetch origin main && sudo git reset --hard origin/main")

# 2. Fix NEXTAUTH_URL to lowercase in Dokploy env file
# Find the env file for the service
env_file = "/etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/.env"
run(f"sudo cat {env_file}")

# Replace NEXTAUTH_URL with lowercase
run(f"sudo sed -i 's|NEXTAUTH_URL=https://AicoreLink.aicorebots.com|NEXTAUTH_URL=https://aicorelink.aicorebots.com|g' {env_file}")
run(f"sudo cat {env_file}")

# 3. Force rebuild and redeploy
run("sudo docker service update --force aicorelink-aicorelink-b7m7ol", timeout=300)

# 4. Wait for service to stabilize
time.sleep(20)

# 5. Check service is running
run("sudo docker service ps aicorelink-aicorelink-b7m7ol --format '{{.Name}} {{.CurrentState}} {{.Error}}' | head -3")

# 6. Verify bcryptjs exists in container
run("sudo docker exec $(sudo docker ps -q --filter name=aicorelink-aicorelink-b7m7ol) ls /app/node_modules/bcryptjs/index.js 2>/dev/null || echo 'bcryptjs NOT found'")

# 7. Verify NEXTAUTH_URL is lowercase
run("sudo docker exec $(sudo docker ps -q --filter name=aicorelink-aicorelink-b7m7ol) printenv NEXTAUTH_URL")

# 8. Verify login works - test the auth API
run("curl -s -o /dev/null -w '%{http_code}' https://aicorelink.aicorebots.com/api/auth/csrf")

client.close()
