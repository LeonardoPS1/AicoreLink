import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Check current service env vars
cmd = "sudo docker service inspect aicorelink-aicorelink-b7m7ol --format '{{json .Spec.TaskTemplate.ContainerSpec.Env}}' | python3 -m json.tool"
stdin, stdout, stderr = client.exec_command(cmd)
print('Current env vars:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()