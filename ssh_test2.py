import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Connect to PostgreSQL and create database + users
# The superuser is reece.schmeler67 based on ACCESS.md
# Need to find the password - check the postgres container env

# First, check the postgres container for env vars
stdin, stdout, stderr = client.exec_command('sudo docker exec aicore-n8nrunnerpostgresollama-a715gi-postgres-1 env | grep POSTGRES')
print('Postgres env:')
print(stdout.read().decode())
print(stderr.read().decode())
client.close()