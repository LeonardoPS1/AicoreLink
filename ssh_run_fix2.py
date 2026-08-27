import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Copy the JS file to project dir
sftp = client.open_sftp()
sftp.put(r'D:\OPENCODE\AicoreLink\fix_password.js', '/etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code/apps/dashboard/fix_password.js')
sftp.close()

# Run it from project dir
cmd = "cd /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code/apps/dashboard && node fix_password.js"
stdin, stdout, stderr = client.exec_command(cmd)
print('Output:')
print(stdout.read().decode())
print('Errors:')
print(stderr.read().decode())

client.close()