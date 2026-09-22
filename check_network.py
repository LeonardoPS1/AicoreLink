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

# Check network connectivity from app container
run("sudo docker exec fa3f2d72b057 ping -c 2 172.18.0.1 2>&1")
run("sudo docker exec fa3f2d72b057 nc -zv 172.18.0.1 5432 2>&1")

# Check what IP the app container sees for postgres
run("sudo docker inspect fa3f2d72b057 | grep -A5 'NetworkSettings' | head -20")

client.close()