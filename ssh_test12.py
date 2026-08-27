import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Check the aicorelink app directory
stdin, stdout, stderr = client.exec_command("ls -la /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/")
print('App dir:')
print(stdout.read().decode())
print(stderr.read().decode())

# Check if there's code inside
stdin, stdout, stderr = client.exec_command("ls -la /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code/ 2>/dev/null || echo 'No code dir'")
print('Code dir:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()