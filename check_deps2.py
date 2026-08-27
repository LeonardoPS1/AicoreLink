import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Check what's in the standalone output node_modules (the COPY source)
cmd = "sudo docker exec 9ce18e70d51e sh -c 'find /app -maxdepth 3 -name node_modules -type d 2>/dev/null'"
print('All node_modules dirs:')
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode())

# Check standalone server.js for external requires
cmd2 = "sudo docker exec 9ce18e70d51e head -100 /app/server.js 2>/dev/null"
print('server.js first 100 lines:')
stdin, stdout, stderr = client.exec_command(cmd2)
print(stdout.read().decode())

# Check the .next/standalone/node_modules if it exists
cmd3 = "sudo docker exec 9ce18e70d51e ls /app/.next/standalone/node_modules/ 2>/dev/null || echo 'NOT FOUND'"
print('standalone node_modules:')
stdin, stdout, stderr = client.exec_command(cmd3)
print(stdout.read().decode())

# Check what external modules are referenced in the compiled routes
cmd4 = "sudo docker exec 9ce18e70d51e sh -c 'cat /app/.next/server/app/api/tenants/channels/route.js 2>/dev/null | head -50'"
print('channels route.js first 50 lines:')
stdin, stdout, stderr = client.exec_command(cmd4)
print(stdout.read().decode())

client.close()
