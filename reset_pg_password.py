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

# Try to reset password using a superuser
# Check for superusers
run("""sudo docker exec 32e0eb68870e psql -U "reece.schmeler67" -c "SELECT rolname, rolsuper FROM pg_authid WHERE rolsuper = true;" """)

# Reset password for aicorelink_app
run("""sudo docker exec 32e0eb68870e psql -U "reece.schmeler67" -c "ALTER USER aicorelink_app WITH PASSWORD 'AicoreLink2024!AppPass';" """)

# Test connection again
run("""sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass 32e0eb68870e psql -U aicorelink_app -d aicorelink -c "SELECT 1" """)

client.close()