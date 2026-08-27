import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Wait for service to stabilize
time.sleep(15)

# Get container logs
cmd = "sudo docker logs aicorelink-aicorelink-b7m7ol.1.$(sudo docker ps --filter 'name=aicorelink-aicorelink-b7m7ol' --format '{{.ID}}' | head -1) --tail 100 2>&1 > /tmp/latest_logs.txt"
stdin, stdout, stderr = client.exec_command(cmd)
print('Log capture:', stdout.read().decode(), stderr.read().decode())

# Read the file
cmd2 = "cat /tmp/latest_logs.txt"
stdin, stdout, stderr = client.exec_command(cmd2)
output = stdout.read()
errors = stderr.read()

# Save to local file
with open(r'D:\OPENCODE\AicoreLink\latest_logs.txt', 'wb') as f:
    f.write(output)

print('First 10000 chars:')
print(output[:10000].decode('utf-8', errors='replace'))

client.close()