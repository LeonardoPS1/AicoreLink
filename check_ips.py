import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=30)

def run(cmd, timeout=60):
    print(f'>>> {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out: print(out)
    if err: print('STDERR:', err)
    return out

# Get app container IP
run("sudo docker inspect fa3f2d72b057 | grep -A3 'IPAddress' | head -10")

# Get postgres container IP
pg = run('sudo docker ps -q --filter name=aicore-n8nrunnerpostgresollama-a715gi-postgres-1').strip().split()[0]
run(f"sudo docker inspect {pg} | grep -A3 'IPAddress' | head -10")

# Test from postgres container using the gateway IP (172.18.0.1)
run(f"""sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass {pg} psql "postgresql://aicorelink_app:AicoreLink2024!AppPass@172.18.0.1:5432/aicorelink" -c "SELECT 1" 2>&1""")

client.close()