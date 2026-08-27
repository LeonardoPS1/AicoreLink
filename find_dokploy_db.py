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

# Find Dokploy's database
run("sudo find /var/lib/dokploy -name '*.db' -o -name '*.sqlite*' 2>/dev/null | head -5")
run("sudo find /etc/dokploy -name '*.db' -o -name '*.sqlite*' 2>/dev/null | head -5")

# Check compose directory
run("sudo ls -la /etc/dokploy/compose/")

# Check if there's a database config
run("sudo find / -maxdepth 4 -name 'dokploy*' -name '*.db' 2>/dev/null | head -5")

# Check dokploy docker container
run("sudo docker ps --format '{{.Names}} {{.Image}}' | grep dokploy")

# Look at the actual docker service env to understand what to update
run("sudo docker service inspect aicorelink-aicorelink-b7m7ol --format '{{json .Spec.TaskTemplate.ContainerSpec}}' 2>/dev/null | python3 -c \"import sys,json; d=json.load(sys.stdin); [print(e) for e in d.get('Env',[])]\"")

client.close()
