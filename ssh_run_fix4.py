import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Get container name
cmd = "sudo docker ps --filter 'name=aicorelink-aicorelink-b7m7ol' --format '{{.Names}}'"
stdin, stdout, stderr = client.exec_command(cmd)
container = stdout.read().decode().strip()
print('Container:', container)

# Copy file to container and run
cmd2 = f"sudo docker cp /tmp/fix_password.js {container}:/app/apps/dashboard/fix_password.js"
stdin, stdout, stderr = client.exec_command(cmd2)
print('Copy result:', stdout.read().decode(), stderr.read().decode())

cmd3 = f"sudo docker exec {container} sh -c 'cd /app/apps/dashboard && node fix_password.js'"
stdin, stdout, stderr = client.exec_command(cmd3)
print('Run result:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()