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

# 1. Find Dokploy's database in the postgres container
run("sudo docker exec dokploy-postgres.1.9atxtpoyt7l7ggm21u76m5vqy psql -U dokploy -d dokploy -c '\\dt' 2>/dev/null || sudo docker exec $(sudo docker ps -q --filter 'ancestor=postgres:16') psql -U dokploy -d dokploy -c '\\dt' 2>/dev/null")

# 2. Find the table with env vars
run("sudo docker exec dokploy-postgres.1.9atxtpoyt7l7ggm21u76m5vqy psql -U dokploy -d dokploy -c \"SELECT table_name FROM information_schema.tables WHERE table_schema='public';\" 2>/dev/null")

# 3. Find the application record for aicorelink
run("sudo docker exec dokploy-postgres.1.9atxtpoyt7l7ggm21u76m5vqy psql -U dokploy -d dokploy -c \"SELECT applicationId, name FROM application WHERE name LIKE '%aicorelink%';\" 2>/dev/null")

client.close()
