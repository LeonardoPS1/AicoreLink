import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Get container name
cmd = "sudo docker ps --filter 'name=aicorelink-aicorelink-b7m7ol' --format '{{.Names}}'"
stdin, stdout, stderr = client.exec_command(cmd)
container = stdout.read().decode().strip()
print('Container:', container)

# Run fix script from /app
cmd2 = f"sudo docker exec {container} node /app/fix_password.js"
stdin, stdout, stderr = client.exec_command(cmd2)
print('Run result:')
print(stdout.read().decode())
print(stderr.read().decode())

# Verify password hash
cmd3 = """sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink -c "SELECT password_hash FROM users WHERE email = 'dev@aicore.com';" """
stdin, stdout, stderr = client.exec_command(cmd3)
print('Verify:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()