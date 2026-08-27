import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Check container logs - write to file on VPS then read
cmd = "sudo docker logs aicorelink-aicorelink-b7m7ol.1.cg8jiscasiod61jhalfluk22l --tail 100 2>&1 > /tmp/container_logs.txt"
stdin, stdout, stderr = client.exec_command(cmd)
print('Log capture:', stdout.read().decode(), stderr.read().decode())

# Read the file
cmd2 = "cat /tmp/container_logs.txt"
stdin, stdout, stderr = client.exec_command(cmd2)
output = stdout.read()
errors = stderr.read()

# Save to local file to avoid encoding issues
with open(r'D:\OPENCODE\AicoreLink\container_logs.txt', 'wb') as f:
    f.write(output)

print('Logs saved to file. First 5000 chars:')
print(output[:5000].decode('utf-8', errors='replace'))

client.close()