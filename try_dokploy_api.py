import paramiko
import time

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

API_KEY = "wfztxJ4CyLig_isCIa2g-x7XJVwaAG9HmG1L4CX0Nw4"
APP_ID = "g1WvSJddkU-pJDM9NYViH"

# Try different API auth methods
# Method 1: Bearer token
run(f"""curl -s -X POST 'http://localhost:3000/api/application.env.update' -H 'Content-Type: application/json' -H 'Authorization: Bearer {API_KEY}' -d '{{"applicationId": "{APP_ID}", "env": "NEXTAUTH_URL=https://aicorelink.aicorebots.com"}}'""")

# Method 2: Cookie-based (need to login first)
# Try to use the session token approach

# Method 3: Check if there's a different port or URL for the API
run("sudo docker service ls --format '{{.Name}} {{.Ports}}' | grep dokploy")

# Method 4: Try the internal API with different endpoint paths
run(f"""curl -s 'http://localhost:3000/api/application.list' -H 'x-api-key: {API_KEY}' | head -200""")

# Method 5: Try /api/ instead of /api/
run(f"""curl -s 'http://localhost:3000/api/applications' -H 'x-api-key: {API_KEY}' | head -200""")

# Method 6: Check Dokploy API docs for correct auth header
run("sudo docker exec dokploy.1.xhodnu00oq09ovhbd6zid3ard find /app -name 'auth*' -type f 2>/dev/null | head -10")

client.close()
