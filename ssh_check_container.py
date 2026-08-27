import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Get container name
cmd = "sudo docker ps --filter 'name=aicorelink-aicorelink-b7m7ol' --format '{{.Names}}'"
stdin, stdout, stderr = client.exec_command(cmd)
container = stdout.read().decode().strip()
print('Container:', container)

# Check container file structure
cmd2 = f"sudo docker exec {container} ls -la /"
stdin, stdout, stderr = client.exec_command(cmd2)
print('Root:', stdout.read().decode())

cmd3 = f"sudo docker exec {container} ls -la /app"
stdin, stdout, stderr = client.exec_command(cmd3)
print('App:', stdout.read().decode())

# Check working directory
cmd4 = f"sudo docker exec {container} pwd"
stdin, stdout, stderr = client.exec_command(cmd4)
print('PWD:', stdout.read().decode())

client.close()