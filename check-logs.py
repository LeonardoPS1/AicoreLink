import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=30)

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return out, err

# Get app container
out, _ = run('sudo docker ps -q --filter name=aicorelink | head -1')
app_container = out.strip()
print(f'App container: {app_container}')

# Check recent logs - save to file
out, err = run(f'sudo docker logs {app_container} --tail 100 2>&1')
with open('container_logs.txt', 'w', encoding='utf-8') as f:
    f.write(out)
    f.write(err)
print(f"Logs saved to container_logs.txt ({len(out)} chars)")

# Also check for errors in logs
if 'error' in out.lower() or 'Error' in out or 'ERROR' in out:
    print("=== ERRORS FOUND IN LOGS ===")
    for line in out.split('\n'):
        if 'error' in line.lower() or 'Error' in line or 'ERROR' in line or 'exception' in line.lower() or 'Exception' in line or 'traceback' in line.lower():
            print(line)

client.close()