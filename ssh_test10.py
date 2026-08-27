import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Check if the aicorelink dashboard code is available on the VPS
stdin, stdout, stderr = client.exec_command("find /etc/dokploy -name 'aicorelink' -type d 2>/dev/null | head -5")
print('AicoreLink dirs:')
print(stdout.read().decode())
print(stderr.read().decode())

# Check the aicorelink service directory
stdin, stdout, stderr = client.exec_command("ls -la /etc/dokploy/compose/ 2>/dev/null | grep -i aicorelink")
print('Compose dirs:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()