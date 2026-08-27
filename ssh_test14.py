import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Check if prisma/seed.ts exists on host
stdin, stdout, stderr = client.exec_command("ls -la /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code/apps/dashboard/prisma/")
print('Prisma dir on host:')
print(stdout.read().decode())
print(stderr.read().decode())

# Check if node_modules exists
stdin, stdout, stderr = client.exec_command("ls -la /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code/apps/dashboard/node_modules/ 2>/dev/null | head -5")
print('Node modules:')
print(stdout.read().decode())
print(stderr.read().decode())

# Check if tsx is available
stdin, stdout, stderr = client.exec_command("which npx && npx --version")
print('Host npx:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()