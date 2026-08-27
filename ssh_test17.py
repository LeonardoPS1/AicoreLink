import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Run npm install with sudo, then run seed
cmd = "cd /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code/apps/dashboard && sudo npm install && sudo npx tsx prisma/seed.ts"
stdin, stdout, stderr = client.exec_command(cmd, timeout=180)
print('Output:')
print(stdout.read().decode())
print('Errors:')
print(stderr.read().decode())

client.close()