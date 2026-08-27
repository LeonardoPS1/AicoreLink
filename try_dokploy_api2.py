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

APP_ID = "g1WvSJddkU-pJDM9NYViH"

# Try with prefix.key format
run(f"""curl -s 'http://localhost:3000/api/application.env.update' -X POST -H 'Content-Type: application/json' -H 'x-api-key: Pyiakr.wfztxJ4CyLig_isCIa2g-x7XJVwaAG9HmG1L4CX0Nw4' -d '{{"applicationId": "{APP_ID}", "env": "NEXTAUTH_URL=https://aicorelink.aicorebots.com"}}'""")

# Try Dokploy web login and use cookie
run("""curl -s -X POST 'http://localhost:3000/api/auth.login' -H 'Content-Type: application/json' -d '{"email": "spedalettileonardo@gmail.com", "password": "Cool220479..@"}' -c /tmp/dokploy_cookies.txt""")

# Check Dokploy version for API reference
run("sudo docker exec dokploy.1.xhodnu00oq09ovhbd6zid3ard cat /app/package.json 2>/dev/null | head -5")

client.close()
