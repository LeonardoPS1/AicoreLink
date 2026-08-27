import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Generate correct hash using bcryptjs equivalent (node)
# We'll use the Python hash and update directly
import bcrypt
password = b'dev123456'
hashed = bcrypt.hashpw(password, bcrypt.gensalt(12))
print('New hash:', hashed.decode())

# Update user password
new_hash = hashed.decode()
cmd = f"""sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink -c "UPDATE users SET password_hash = '{new_hash}' WHERE email = 'dev@aicore.com';" """
stdin, stdout, stderr = client.exec_command(cmd)
print('Update result:')
print(stdout.read().decode())
print(stderr.read().decode())

# Verify
cmd2 = """sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink -c "SELECT password_hash FROM users WHERE email = 'dev@aicore.com';" """
stdin, stdout, stderr = client.exec_command(cmd2)
print('Verify:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()