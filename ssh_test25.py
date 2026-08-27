import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Check container logs with encoding handling
cmd = "sudo docker logs aicorelink-aicorelink-b7m7ol.1.cg8jiscasiod61jhalfluk22l --tail 50 2>&1"
stdin, stdout, stderr = client.exec_command(cmd)
output = stdout.read()
errors = stderr.read()

# Handle encoding
try:
    print('Container logs:')
    print(output.decode('utf-8', errors='replace'))
except:
    print(output.decode('latin-1', errors='replace'))

print('Errors:')
print(errors.decode('utf-8', errors='replace'))

client.close()