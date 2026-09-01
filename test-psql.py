import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=30)

def run(cmd, timeout=60):
    print(f'>>> {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    if out: print(out)
    if err: print('STDERR:', err)
    return out

out = run('sudo docker ps -q --filter name=aicorelink')
app_container = out.strip().split('\n')[0]

# Test psql from app container
run(f'sudo docker exec -e PGPASSWORD="AicoreLink2024!AppPass" {app_container} psql -h 172.18.0.1 -U aicorelink_app -d aicorelink -c "SELECT 1;" 2>&1')

# Also check pg_hba.conf in postgres container
out = run('sudo docker ps -q --filter name=aicore-n8nrunnerpostgresollama-a715gi-postgres-1')
pg_container = out.strip().split('\n')[0]
run(f'sudo docker exec {pg_container} cat /var/lib/postgresql/data/pg_hba.conf 2>/dev/null || sudo docker exec {pg_container} cat /etc/postgresql/*/main/pg_hba.conf 2>/dev/null || echo "pg_hba.conf not found in standard locations"')

client.close()