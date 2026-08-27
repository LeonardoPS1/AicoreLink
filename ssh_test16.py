import paramiko
import os

# Copy seed.ts to VPS temp location first
local_seed = r"D:\OPENCODE\AicoreLink\apps\dashboard\prisma\seed.ts"
remote_temp = "/tmp/seed.ts"
remote_final = "/etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code/apps/dashboard/prisma/seed.ts"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

sftp = client.open_sftp()
sftp.put(local_seed, remote_temp)
sftp.close()

print("Seed.ts copied to /tmp")

# Move with sudo and run seed
cmd = f"sudo mv {remote_temp} {remote_final} && cd /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code/apps/dashboard && npm install && npx tsx prisma/seed.ts"
stdin, stdout, stderr = client.exec_command(cmd, timeout=180)
print('Output:')
print(stdout.read().decode())
print('Errors:')
print(stderr.read().decode())

client.close()