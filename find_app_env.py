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

DB = "sudo docker exec dokploy-postgres.1.9atxtpoyt7l7ggm21u76m5vqy psql -U dokploy -d dokploy"

# Check application columns
run(f"{DB} -c \"\\d application\"")

# Check environment table  
run(f"{DB} -c \"\\d environment\"")

# List all apps
run(f"{DB} -c \"SELECT * FROM application;\"")

# List environments
run(f"{DB} -c \"SELECT * FROM environment LIMIT 20;\"")

client.close()
