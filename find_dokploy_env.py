import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

def run(cmd, timeout=60):
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print("STDERR:", err)
    return out

# Find Dokploy config for this service
run("find /etc/dokploy -name '*.yml' -o -name '*.yaml' | xargs grep -l 'aicorelink' 2>/dev/null | head -10")
run("find /etc/dokploy -name 'service*' -type f | head -10")
run("find /etc/dokploy -name 'compose*' -type f | head -10")
run("find /etc/dokploy -name 'application*' -type f | head -10")

# Check if there's a database storing env vars  
run("ls /etc/dokploy/")
run("ls /etc/dokploy/docker/ 2>/dev/null")
run("sudo ls /var/lib/dokploy/ 2>/dev/null")

# Check the Docker compose file
run("cat /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code/infra/docker-compose.aicorelink.yml")

client.close()
