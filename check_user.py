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

pg = run('sudo docker ps -q --filter name=aicore-n8nrunnerpostgresollama-a715gi-postgres-1').strip().split()[0]

run(f"""sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass {pg} psql -U aicorelink_app -d aicorelink -c "SELECT u.id, u.email, u.password_hash, tu.tenant_id, tu.role FROM users u LEFT JOIN tenant_users tu ON u.id = tu.user_id WHERE u.email = 'dev@aicore.com';" """)

client.close()