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

# Test with URL-encoded password
test_url = 'postgresql://aicorelink_app:AicoreLink2024%21AppPass@172.18.0.1:5432/aicorelink'
run(f'sudo docker exec fa3f2d72b057 node -e "console.log(require(\'url\').parse(\'{test_url}\'))"')

client.close()