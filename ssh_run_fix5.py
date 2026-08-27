import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Copy the JS file to /tmp
sftp = client.open_sftp()
sftp.put(r'D:\OPENCODE\AicoreLink\fix_password.js', '/tmp/fix_password.js')
sftp.close()
print('File copied to /tmp')

# Get container name
cmd = "sudo docker ps --filter 'name=aicorelink-aicorelink-b7m7ol' --format '{{.Names}}'"
stdin, stdout, stderr = client.exec_command(cmd)
container = stdout.read().decode().strip()
print('Container:', container)

# Copy file to container
cmd2 = f"sudo docker cp /tmp/fix_password.js {container}:/app/fix_password.js"
stdin, stdout, stderr = client.exec_command(cmd2)
print('Copy result:', stdout.read().decode(), stderr.read().decode())

# Find the correct app path
cmd3 = f"sudo docker exec {container} find / -name 'package.json' -path '*/apps/dashboard/*' 2>/dev/null | head -1"
stdin, stdout, stderr = client.exec_command(cmd3)
app_path = stdout.read().decode().strip()
print('App path:', app_path)

if app_path:
    # Copy to app dir
    app_dir = '/'.join(app_path.split('/')[:-1])
    cmd4 = f"sudo docker cp /tmp/fix_password.js {container}:{app_dir}/fix_password.js"
    stdin, stdout, stderr = client.exec_command(cmd4)
    print('Copy to app dir:', stdout.read().decode(), stderr.read().decode())
    
    # Run it
    cmd5 = f"sudo docker exec {container} sh -c 'cd {app_dir} && node fix_password.js'"
    stdin, stdout, stderr = client.exec_command(cmd5)
    print('Run result:')
    print(stdout.read().decode())
    print(stderr.read().decode())

client.close()