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

# Get postgres container
pg = run('sudo docker ps -q --filter name=aicore-n8nrunnerpostgresollama-a715gi-postgres-1').strip().split()[0]
print(f'PG: {pg}')

# Update password
run(f"""sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass {pg} psql -U aicorelink_app -d aicorelink -c "UPDATE users SET password_hash = '\$2a\$12\$eg4fznZzcnZ/.OSdPTmimuaaDS2eBO5OFsH7Lz4D0AzYP1kqBE6zC' WHERE email = 'dev@aicore.com';" """)

# Verify
run(f"""sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass {pg} psql -U aicorelink_app -d aicorelink -c "SELECT email, password_hash FROM users WHERE email = 'dev@aicore.com';" """)

client.close()