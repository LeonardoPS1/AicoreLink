import paramiko
import json

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

# Get the current encrypted env for AicoreLink app
run(f"{DB} -c \"SELECT env FROM application WHERE name = 'AicoreLink';\"")

# Check if there's a domain table entry
run(f"{DB} -c \"SELECT * FROM domain WHERE applicationId = 'g1WvSJddkU-pJDM9NYViH';\"")

# Check the Dokploy API - find the auth mechanism
run("sudo docker exec dokploy.1.xhodnu00oq09ovhbd6zid3ard printenv | grep -i api 2>/dev/null | head -5")
run("sudo docker exec dokploy.1.xhodnu00oq09ovhbd6zid3ard printenv | grep -i secret 2>/dev/null | head -5")
run("sudo docker exec dokploy.1.xhodnu00oq09ovhbd6zid3ard printenv | grep -i token 2>/dev/null | head -5")

# Check for API keys
run(f"{DB} -c \"SELECT * FROM apikey LIMIT 5;\"")

# Check for auth tokens/sessions
run(f"{DB} -c \"SELECT * FROM user LIMIT 5;\"")

client.close()
