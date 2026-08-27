import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Update user password using heredoc to avoid shell escaping issues
cmd = """sudo docker exec -i -e PGPASSWORD=AicoreLink2024!AppPass aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink << 'EOF'
UPDATE users SET password_hash = '\$2b\$12\$aRW3eP/xJmJc32iUy.sBL./ayEUVAz29MLUeanxNoyLRey1u92Mw6' WHERE email = 'dev@aicore.com';
EOF"""
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