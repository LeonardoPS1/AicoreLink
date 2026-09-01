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
print(f"App: {app_container}")

# Check env vars in container
run(f'sudo docker exec {app_container} printenv | grep -i database')

# Test DB connectivity from container
run(f'sudo docker exec {app_container} nc -zv 172.18.0.1 5432 2>&1')

# Check what the actual DATABASE_URL is in the container
run(f'sudo docker exec {app_container} sh -c "echo \$AICORELINK_DATABASE_URL"')

client.close()