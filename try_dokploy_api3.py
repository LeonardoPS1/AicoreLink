import paramiko
import json

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

DB = "sudo docker exec dokploy-postgres.1.9atxtpoyt7l7ggm21u76m5vqy psql -U dokploy -d dokploy"

# Check the domain table structure
run(f"{DB} -c \"\\d domain\"")

# Check if there's a Traefik dynamic config for AicoreLink
run("cat /etc/dokploy/traefik/dynamic/aicorelink-aicorelink-b7m7ol.yml")

# Check the Dokploy Traefik routing - find the Traefik port
run("sudo docker service inspect dokploy --format '{{range .Endpoint.Ports}}{{.PublishedPort}}->{{.TargetPort}} {{end}}'")

# Try to login to Dokploy via the Traefik route
run("""curl -s -X POST 'http://127.0.0.1:3001/api/auth.login' -H 'Content-Type: application/json' -d '{"email": "spedalettileonardo@gmail.com", "password": "Cool220479..@"}' -c /tmp/dokploy_cookies.txt -v 2>&1 | tail -5""")

# Check Traefik routing for Dokploy
run("sudo docker service inspect dokploy --format '{{json .Endpoint}}' | python3 -c \"import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2))\"")

client.close()
