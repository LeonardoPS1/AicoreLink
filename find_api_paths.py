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

API_KEY = "wfztxJ4CyLig_isCIa2g-x7XJVwaAG9HmG1L4CX0Nw4"

# Try different Dokploy API paths
paths = [
    "/api/trpc/application.update",
    "/api/trpc/applicationenv.update",
    "/api/trpc/application.updateEnv", 
    "/api/trpc/application.deploy",
]

for path in paths:
    run(f"""curl -s 'http://127.0.0.1:3001{path}' -H 'x-api-key: {API_KEY}' -H 'Content-Type: application/json' 2>&1 | head -1""")

# Try with the prefix in the key
for path in ["/api/trpc/application.list"]:
    run(f"""curl -s 'http://127.0.0.1:3001{path}' -H 'x-api-key: Pyiakr.wfztxJ4CyLig_isCIa2g-x7XJVwaAG9HmG1L4CX0Nw4' -H 'Content-Type: application/json' 2>&1 | head -1""")

# Try Dokploy docs approach
run("""curl -s 'http://127.0.0.1:3001/api/trpc/application.list' -H 'Content-Type: application/json' -H 'x-api-key: wfztxJ4CyLig_isCIa2g-x7XJVwaAG9HmG1L4CX0Nw4' -d '{}'""")

# Just try to find what the API actually expects
run("""curl -s 'http://127.0.0.1:3001/api' 2>&1 | head -5""")

client.close()
