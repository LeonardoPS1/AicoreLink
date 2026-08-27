import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Get correct container name
cmd = "sudo docker ps --filter 'name=aicorelink-aicorelink-b7m7ol' --format '{{.Names}}'"
stdin, stdout, stderr = client.exec_command(cmd)
container = stdout.read().decode().strip()
print('Container:', container)

if container:
    # Get logs
    cmd2 = f"sudo docker logs {container} --tail 100 2>&1 > /tmp/latest_logs.txt"
    stdin, stdout, stderr = client.exec_command(cmd2)
    
    cmd3 = "cat /tmp/latest_logs.txt"
    stdin, stdout, stderr = client.exec_command(cmd3)
    output = stdout.read()
    errors = stderr.read()
    
    with open(r'D:\OPENCODE\AicoreLink\latest_logs.txt', 'wb') as f:
        f.write(output)
    
    print('First 10000 chars:')
    print(output[:10000].decode('utf-8', errors='replace'))

client.close()