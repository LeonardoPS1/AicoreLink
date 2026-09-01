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

# 1. Pull latest code and rebuild
run("cd /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code && sudo git config --global --add safe.directory /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code && sudo git fetch origin main && sudo git reset --hard origin/main")

# 2. Force rebuild via Dokploy (this will rebuild the image with the new Dockerfile)
# We need to trigger a deploy. Let me try the deploy API or just force a service update with new image
# Actually, Dokploy watches for git changes if autoDeploy is enabled. Let me check:
run("sudo docker exec dokploy-postgres.1.9atxtpoyt7l7ggm21u76m5vqy psql -U dokploy -d dokploy -c \"SELECT autoDeploy FROM application WHERE name = 'AicoreLink';\"")

# 3. Force a rebuild by deleting the image and letting Dokploy rebuild
run("sudo docker rmi aicorelink-aicorelink-b7m7ol:latest 2>/dev/null || echo 'Image not found'")

# 4. Trigger deploy via Dokploy - try the deploy API
run("""curl -s -X POST 'http://127.0.0.1:3001/api/trpc/application.deploy' -H 'Content-Type: application/json' -H 'x-api-key: wfztxJ4CyLig_isCIa2g-x7XJVwaAG9HmG1L4CX0Nw4' -d '{"applicationId": "g1WvSJddkU-pJDM9NYViH"}' 2>&1 | head -5""")

# 5. Alternative: force service update which will pull new image
run("sudo docker service update --force aicorelink-aicorelink-b7m7ol", timeout=300)

# 6. Wait and verify
time.sleep(20)
run("sudo docker service ps aicorelink-aicorelink-b7m7ol --format '{{.Name}} {{.CurrentState}} {{.Error}}' | head -3")

# 7. Verify bcryptjs and NEXTAUTH_URL
run("sudo docker exec $(sudo docker ps -q --filter name=aicorelink-aicorelink-b7m7ol) ls /app/node_modules/bcryptjs/package.json 2>/dev/null && echo 'bcryptjs OK' || echo 'bcryptjs MISSING'")
run("sudo docker exec $(sudo docker ps -q --filter name=aicorelink-aicorelink-b7m7ol) printenv NEXTAUTH_URL")

client.close()