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

app = run('sudo docker ps -q --filter name=aicorelink').strip().split()[0]
print(f'App: {app}')

# Get recent logs
run(f'sudo docker logs --tail 100 {app}')

client.close()