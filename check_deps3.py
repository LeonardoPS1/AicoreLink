import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Check if bcryptjs exists in the deps node_modules (used in builder)
cmd = "sudo docker exec 9ce18e70d51e sh -c 'find /app -path \"*/node_modules/bcryptjs\" -type d 2>/dev/null'"
print('bcryptjs locations:')
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode())

# Check what external modules the auth route needs
cmd2 = "sudo docker exec 9ce18e70d51e sh -c 'cat /app/.next/server/app/api/auth/...nextauth/route.js 2>/dev/null | head -5'"
print('auth route:')
stdin, stdout, stderr = client.exec_command(cmd2)
print(stdout.read().decode())

# Check if next-auth is available in node_modules
cmd3 = "sudo docker exec 9ce18e70d51e sh -c 'ls /app/node_modules/next-auth 2>/dev/null || echo NOT_FOUND'"
print('next-auth:')
stdin, stdout, stderr = client.exec_command(cmd3)
print(stdout.read().decode())

# Check server.js for how it resolves modules
cmd4 = "sudo docker exec 9ce18e70d51e sh -c 'ls /app/node_modules/ | wc -l'"
print('Total modules in node_modules:')
stdin, stdout, stderr = client.exec_command(cmd4)
print(stdout.read().decode())

# Check container logs for the latest error
cmd5 = "sudo docker service logs aicorelink-aicorelink-b7m7ol --tail 30 2>&1"
stdin, stdout, stderr = client.exec_command(cmd5)
print('Recent container logs:')
print(stdout.read().decode())

client.close()
