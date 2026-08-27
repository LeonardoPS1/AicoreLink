import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Check if we can connect to the aicorelink database
stdin, stdout, stderr = client.exec_command("sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink -c \"SELECT current_database(), current_user;\"")
print('Test connection:')
print('Output:', stdout.read().decode())
print('Errors:', stderr.read().decode())

# Check tables
stdin, stdout, stderr = client.exec_command("sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink -c \"\\dt\"")
print('Tables:')
print('Output:', stdout.read().decode())
print('Errors:', stderr.read().decode())

client.close()