import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Fix DATABASE_URL to use internal hostname and correct credentials
cmd = """
sudo docker service update \
  --env-rm AICORELINK_DATABASE_URL \
  --env-add AICORELINK_DATABASE_URL=postgresql://aicorelink_app:AicoreLink2024!AppPass@172.18.0.1:5432/aicorelink \
  aicorelink-aicorelink-b7m7ol
"""

stdin, stdout, stderr = client.exec_command(cmd)
print('Output:')
print(stdout.read().decode())
print('Errors:')
print(stderr.read().decode())

# Wait and verify
import time
time.sleep(30)

cmd2 = "sudo docker service inspect aicorelink-aicorelink-b7m7ol --format '{{json .Spec.TaskTemplate.ContainerSpec.Env}}' | python3 -m json.tool"
stdin, stdout, stderr = client.exec_command(cmd2)
print('Updated env vars:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()