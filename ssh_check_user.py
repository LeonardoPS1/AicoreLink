import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Check user in database
cmd = """sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink -c "SELECT email, password_hash FROM users WHERE email = 'dev@aicore.com';" """
stdin, stdout, stderr = client.exec_command(cmd)
print('User:')
print(stdout.read().decode())
print(stderr.read().decode())

# Check tenant link
cmd2 = """sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink -c "SELECT u.email, tu.role, t.slug FROM users u JOIN tenant_users tu ON u.id = tu.user_id JOIN tenants t ON tu.tenant_id = t.id WHERE u.email = 'dev@aicore.com';" """
stdin, stdout, stderr = client.exec_command(cmd2)
print('Tenant link:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()