import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=30)

def run(cmd, timeout=180):
    print(f'>>> {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    if out: print(out)
    if err: print('STDERR:', err)
    return out

out = run('sudo docker ps -q --filter name=aicorelink')
app_container = out.strip().split('\n')[0]
print(f"App: {app_container}")

# Re-run seed to reset password to dev123456
run(f'sudo docker exec -e AICORELINK_DATABASE_URL="postgresql://aicorelink_app:AicoreLink2024SecurePass@172.18.0.1:5432/aicorelink" {app_container} npx --yes tsx prisma/seed.ts', 120)

# Verify password hash updated
out = run('sudo docker ps -q --filter name=aicore-n8nrunnerpostgresollama-a715gi-postgres-1')
pg_container = out.strip().split('\n')[0]
run(f'sudo docker exec -e PGPASSWORD=AicoreLink2024SecurePass {pg_container} psql -U aicorelink_app -d aicorelink -c "SELECT email, password_hash FROM users WHERE email = \'dev@aicore.com\';"')

client.close()