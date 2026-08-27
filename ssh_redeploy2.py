import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Force redeploy
cmd = "sudo docker service update --force aicorelink-aicorelink-b7m7ol"
stdin, stdout, stderr = client.exec_command(cmd)
print('Redeploy output:')
print(stdout.read().decode())
print('Redeploy errors:')
print(stderr.read().decode())

# Wait for service to stabilize
time.sleep(30)

# Check service status
cmd2 = "sudo docker service ps aicorelink-aicorelink-b7m7ol --format '{{.Name}} {{.CurrentState}} {{.Error}}'"
stdin, stdout, stderr = client.exec_command(cmd2)
print('Service status:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()