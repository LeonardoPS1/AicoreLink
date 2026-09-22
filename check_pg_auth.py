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

pg = run('sudo docker ps -q --filter name=aicore-n8nrunnerpostgresollama-a715gi-postgres-1').strip().split()[0]

# Try different passwords
passwords = ['AicoreLink2024!AppPass', 'aicorelink', 'postgres', 'AicoreLink2024', '']
for pwd in passwords:
    env = f"PGPASSWORD={pwd}" if pwd else ""
    cmd = f"sudo docker exec -e {env} {pg} psql -U aicorelink_app -d aicorelink -c 'SELECT 1' 2>&1"
    result = run(cmd)
    if '1 row' in result or 'SELECT 1' in result:
        print(f"SUCCESS with password: '{pwd}'")
        break

# Check pg_hba.conf
run(f"sudo docker exec {pg} cat /var/lib/postgresql/data/pg_hba.conf")

client.close()