import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Install dependencies on host
cmd = "cd /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code/apps/dashboard && sudo npm install"
stdin, stdout, stderr = client.exec_command(cmd, timeout=180)
print('NPM install output:')
print(stdout.read().decode())
print('NPM install errors:')
print(stderr.read().decode())

# Run seed
cmd2 = "cd /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code/apps/dashboard && sudo npx tsx prisma/seed.ts"
stdin, stdout, stderr = client.exec_command(cmd2, timeout=120)
print('Seed output:')
print(stdout.read().decode())
print('Seed errors:')
print(stderr.read().decode())

# Verify password hash
cmd3 = """sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink -c "SELECT password_hash FROM users WHERE email = 'dev@aicore.com';" """
stdin, stdout, stderr = client.exec_command(cmd3)
print('Verify:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()