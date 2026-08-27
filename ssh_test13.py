import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Check if seed.ts exists in the container
stdin, stdout, stderr = client.exec_command("sudo docker exec aicorelink-aicorelink-b7m7ol.1.cg8jiscasiod61jhalfluk22l ls -la /app/apps/dashboard/prisma/ 2>/dev/null")
print('Prisma dir in container:')
print(stdout.read().decode())
print(stderr.read().decode())

# Check if tsx is available
stdin, stdout, stderr = client.exec_command("sudo docker exec aicorelink-aicorelink-b7m7ol.1.cg8jiscasiod61jhalfluk22l which npx 2>/dev/null")
print('npx:')
print(stdout.read().decode())
print(stderr.read().decode())

# Check node version
stdin, stdout, stderr = client.exec_command("sudo docker exec aicorelink-aicorelink-b7m7ol.1.cg8jiscasiod61jhalfluk22l node --version 2>/dev/null")
print('Node:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()