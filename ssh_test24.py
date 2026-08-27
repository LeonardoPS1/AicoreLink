import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Wait a bit for the service to stabilize
time.sleep(10)

# Check service status
cmd = "sudo docker service ps aicorelink-aicorelink-b7m7ol --format '{{.Name}} {{.CurrentState}} {{.Error}}'"
stdin, stdout, stderr = client.exec_command(cmd)
print('Service status:')
print(stdout.read().decode())
print(stderr.read().decode())

# Check container logs
cmd2 = "sudo docker logs aicorelink-aicorelink-b7m7ol.1.cg8jiscasiod61jhalfluk22l --tail 50 2>&1"
stdin, stdout, stderr = client.exec_command(cmd2)
print('Container logs:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()