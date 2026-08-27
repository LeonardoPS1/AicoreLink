import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Try different extension names
for ext in ['uuid-ossp', '"uuid-ossp"', 'uuid_ossp', '"uuid_ossp"']:
    stdin, stdout, stderr = client.exec_command(f"sudo docker exec -e PGPASSWORD=7anlnf0odssgmuwyjchqzdpk aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U reece.schmeler67 -d aicorelink -c \"CREATE EXTENSION IF NOT EXISTS {ext};\"")
    print(f'Extension: {ext}')
    print('Output:', stdout.read().decode())
    print('Errors:', stderr.read().decode())
    print('---')

# Check what extensions are available
stdin, stdout, stderr = client.exec_command('sudo docker exec -e PGPASSWORD=7anlnf0odssgmuwyjchqzdpk aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U reece.schmeler67 -d aicorelink -c "SELECT * FROM pg_available_extensions WHERE name LIKE \'%uuid%\';"')
print('Available uuid extensions:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()