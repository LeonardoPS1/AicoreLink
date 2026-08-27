import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Check Docker containers
stdin, stdout, stderr = client.exec_command('sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"')
print('Containers:')
print(stdout.read().decode())
print(stderr.read().decode())
client.close()