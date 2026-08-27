import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Try with proper quoting - need to escape for shell
cmd = 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
stdin, stdout, stderr = client.exec_command(f"sudo docker exec -e PGPASSWORD=7anlnf0odssgmuwyjchqzdpk aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U reece.schmeler67 -d aicorelink -c \"{cmd}\"")
print('Output:', stdout.read().decode())
print('Errors:', stderr.read().decode())

# Alternative: use a file
import tempfile
with tempfile.NamedTemporaryFile(mode='w', suffix='.sql', delete=False) as f:
    f.write('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    temp_file = f.name

# Can't easily upload files, try different approach - use psql -f with heredoc
stdin, stdout, stderr = client.exec_command("sudo docker exec -i -e PGPASSWORD=7anlnf0odssgmuwyjchqzdpk aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U reece.schmeler67 -d aicorelink << 'EOF'\nCREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";\nEOF")
print('Output2:', stdout.read().decode())
print('Errors2:', stderr.read().decode())

client.close()