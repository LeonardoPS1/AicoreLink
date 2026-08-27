import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Get container name
cmd = "sudo docker ps --filter 'name=aicorelink-aicorelink-b7m7ol' --format '{{.Names}}'"
stdin, stdout, stderr = client.exec_command(cmd)
container = stdout.read().decode().strip()

# Check if bcryptjs is in node_modules
cmd2 = f"sudo docker exec {container} ls -la /app/node_modules/ | grep bcrypt"
stdin, stdout, stderr = client.exec_command(cmd2)
print('bcryptjs in node_modules:', stdout.read().decode())

# Install bcryptjs in container
cmd3 = f"sudo docker exec {container} npm install bcryptjs --prefix /app"
stdin, stdout, stderr = client.exec_command(cmd3)
print('Install result:', stdout.read().decode())
print('Install errors:', stderr.read().decode())

# Run fix script
cmd4 = f"sudo docker exec {container} node /app/fix_password.js"
stdin, stdout, stderr = client.exec_command(cmd4)
print('Run result:')
print(stdout.read().decode())
print(stderr.read().decode())

# Verify password hash
cmd5 = """sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink -c "SELECT password_hash FROM users WHERE email = 'dev@aicore.com';" """
stdin, stdout, stderr = client.exec_command(cmd5)
print('Verify:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()