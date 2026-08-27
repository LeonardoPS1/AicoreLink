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

# 1. Find the Dokploy env file - check various locations
run("ls -la /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/")
run("find /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/ -name '*.env*' -o -name 'docker-compose*' 2>/dev/null | head -20")

# 2. Check what Docker image is being used
run("sudo docker service inspect aicorelink-aicorelink-b7m7ol --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}'")

# 3. Check the docker-compose or env used by the service
run("sudo docker inspect $(sudo docker ps -q --filter name=aicorelink-aicorelink-b7m7ol) --format '{{.Config.Env}}' 2>/dev/null | tr ',' '\n' | grep -i next")

# 4. Check if bcryptjs is in the image itself (before standalone)
run("sudo docker exec $(sudo docker ps -q --filter name=aicorelink-aicorelink-b7m7ol) find /app -name 'bcrypt*' 2>/dev/null")

# 5. List all node_modules in the container
run("sudo docker exec $(sudo docker ps -q --filter name=aicorelink-aicorelink-b7m7ol) ls /app/node_modules/")

client.close()
