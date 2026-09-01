import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

def run(cmd, timeout=300):
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print("STDERR:", err)
    return out

# Pull and force rebuild
run("cd /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code && sudo git config --global --add safe.directory /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code && sudo git fetch origin main && sudo git reset --hard origin/main")

# Force service update (will rebuild image with new code)
run("sudo docker service update --force aicorelink-aicorelink-b7m7ol", timeout=300)

time.sleep(20)

# Verify
run("sudo docker service ps aicorelink-aicorelink-b7m7ol --format '{{.Name}} {{.CurrentState}} {{.Error}}' | head -2")
run("sudo docker exec $(sudo docker ps -q --filter name=aicorelink-aicorelink-b7m7ol) ls /app/node_modules/bcryptjs/package.json 2>/dev/null && echo 'bcryptjs OK' || echo 'bcryptjs MISSING'")
run("sudo docker exec $(sudo docker ps -q --filter name=aicorelink-aicorelink-b7m7ol) printenv NEXTAUTH_URL")

client.close()