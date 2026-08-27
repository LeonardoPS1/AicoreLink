import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Pull latest code and rebuild
cmd = """cd /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code && sudo git config --global --add safe.directory /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code && sudo git fetch origin main && sudo git reset --hard origin/main"""
stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
print('Git output:')
print(stdout.read().decode())
print('Git errors:')
print(stderr.read().decode())

# Install deps and run seed
cmd2 = "cd /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code/apps/dashboard && sudo npm install && sudo npx tsx prisma/seed.ts"
stdin, stdout, stderr = client.exec_command(cmd2, timeout=180)
print('Install & seed output:')
print(stdout.read().decode())
print('Install & seed errors:')
print(stderr.read().decode())

# Verify password hash
cmd3 = """sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink -c "SELECT password_hash FROM users WHERE email = 'dev@aicore.com';" """
stdin, stdout, stderr = client.exec_command(cmd3)
print('Verify:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()