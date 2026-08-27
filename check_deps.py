import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Check what's in node_modules in the container
cmd = "sudo docker exec 9ce18e70d51e ls /app/node_modules/"
stdin, stdout, stderr = client.exec_command(cmd)
print('node_modules contents:')
print(stdout.read().decode())

# Check for key runtime deps
cmd2 = "sudo docker exec 9ce18e70d51e sh -c 'ls /app/node_modules/ | grep -E \"^(zod|next-auth|bcrypt|jose|nodemailer)\"'"
stdin, stdout, stderr = client.exec_command(cmd2)
print('Key runtime deps:')
print(stdout.read().decode())

# Check .next/server for external deps
cmd3 = "sudo docker exec 9ce18e70d51e sh -c 'grep -roh \"node_modules/[a-z@/.-]*/\" /app/.next/server/ 2>/dev/null | sort -u | head -40'"
stdin, stdout, stderr = client.exec_command(cmd3)
print('Modules referenced in .next/server:')
print(stdout.read().decode())

client.close()
