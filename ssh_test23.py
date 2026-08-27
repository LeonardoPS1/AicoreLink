import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Update service with all required env vars
# Note: Using --env-add to add new vars, --env-rm to remove old ones
cmd = """
sudo docker service update \
  --env-rm AICORELINK_DATABASE_URL \
  --env-rm NEXTAUTH_SECRET \
  --env-add AICORELINK_DATABASE_URL=postgresql://aicorelink_app:AicoreLink2024!AppPass@172.18.0.1:5432/aicorelink \
  --env-add AICORELINK_NEXTAUTH_SECRET=oxtom1cBtQZ2Y7FeM3wkx7PAFX1zv68RZTvFLHndkd4= \
  --env-add NEXTAUTH_SECRET=oxtom1cBtQZ2Y7FeM3wkx7PAFX1zv68RZTvFLHndkd4= \
  --env-add AICORELINK_NEXTAUTH_URL=https://AicoreLink.aicorebots.com \
  --env-add NEXTAUTH_URL=https://AicoreLink.aicorebots.com \
  --env-add AICORELINK_ENCRYPTION_KEY=pjDg3VhX7xaXfQNNWqk6c5cNVjmQYvqSUhbhjIY88OU= \
  --env-add AICORELINK_OLLAMA_BASE_URL=http://172.18.0.1:11434 \
  --env-add AICORELINK_ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM \
  aicorelink-aicorelink-b7m7ol
"""

stdin, stdout, stderr = client.exec_command(cmd)
print('Output:')
print(stdout.read().decode())
print('Errors:')
print(stderr.read().decode())

# Verify
cmd2 = "sudo docker service inspect aicorelink-aicorelink-b7m7ol --format '{{json .Spec.TaskTemplate.ContainerSpec.Env}}' | python3 -m json.tool"
stdin, stdout, stderr = client.exec_command(cmd2)
print('Updated env vars:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()