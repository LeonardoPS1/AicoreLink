import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Find dokploy apps
stdin, stdout, stderr = client.exec_command("ls -la /etc/dokploy/applications/ 2>/dev/null | head -20")
print('Applications:')
print(stdout.read().decode())
print(stderr.read().decode())

# Find the aicorelink service
stdin, stdout, stderr = client.exec_command("docker service ps aicorelink-aicorelink-b7m7ol --format '{{.Node}} {{.CurrentState}}' 2>/dev/null")
print('Service:')
print(stdout.read().decode())
print(stderr.read().decode())

# Check container for the aicorelink app
stdin, stdout, stderr = client.exec_command("sudo docker ps --filter 'name=aicorelink-aicorelink' --format '{{.Names}} {{.Image}} {{.Mounts}}'")
print('Container mounts:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()