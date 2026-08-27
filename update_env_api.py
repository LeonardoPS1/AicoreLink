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

API_KEY = "wfztxJ4CyLig_isCIa2g-x7XJVwaAG9HmG1L4CX0Nw4"
APP_ID = "g1WvSJddkU-pJDM9NYViH"

# Try Dokploy API - update env vars for AicoreLink
# The Dokploy API endpoint for updating app env
run(f"""curl -s -X POST 'http://localhost:3000/api/application.env.update' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: {API_KEY}' \
  -d '{{"applicationId": "{APP_ID}", "env": "AICORELINK_DATABASE_URL=postgresql://reece.schmeler67:7anlnf0odssgmuwyjchqzdpk@51.222.207.250:5432/aicorelink\\nAICORELINK_NEXTAUTH_SECRET=oxtom1cBtQZ2Y7FeM3wkx7PAFX1zv68RZTvFLHndkd4=\\nNEXTAUTH_SECRET=oxtom1cBtQZ2Y7FeM3wkx7PAFX1zv68RZTvFLHndkd4=\\nAICORELINK_NEXTAUTH_URL=https://aicorelink.aicorebots.com\\nNEXTAUTH_URL=https://aicorelink.aicorebots.com"}}'""")

client.close()
