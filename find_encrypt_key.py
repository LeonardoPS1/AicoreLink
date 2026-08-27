import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

def run(cmd, timeout=30):
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print("STDERR:", err)
    return out

# Find Dokploy encryption key - it's usually in its config or env
run("sudo docker exec dokploy.1.xhodnu00oq09ovhbd6zid3ard printenv | grep -iE 'secret|key|encrypt|auth|token' | head -20")

# Check if there's a config.json or similar
run("sudo docker exec dokploy.1.xhodnu00oq09ovhbd6zid3ard ls /app/config* 2>/dev/null")
run("sudo docker exec dokploy.1.xhodnu00oq09ovhbd6zid3ard ls /data/ 2>/dev/null")

# Check secrets
run("sudo docker secret ls 2>/dev/null | head -10")

# Check for .env or config in the container
run("sudo docker exec dokploy.1.xhodnu00oq09ovhbd6zid3ard cat /app/.env 2>/dev/null")

client.close()
