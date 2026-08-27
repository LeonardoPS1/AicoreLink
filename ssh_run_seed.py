import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Run seed.ts again on host - it will update the password
cmd = "cd /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code/apps/dashboard && sudo npx tsx prisma/seed.ts"
stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
print('Seed output:')
print(stdout.read().decode())
print('Seed errors:')
print(stderr.read().decode())

# Verify password hash
cmd2 = """sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink -c "SELECT password_hash FROM users WHERE email = 'dev@aicore.com';" """
stdin, stdout, stderr = client.exec_command(cmd2)
print('Verify:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()