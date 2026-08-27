import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

commands = [
    "CREATE DATABASE aicorelink;",
    "CREATE ROLE aicorelink_app LOGIN PASSWORD 'AicoreLink2024!AppPass';",
    "CREATE ROLE aicorelink_admin LOGIN PASSWORD 'AicoreLink2024!AdminPass' BYPASSRLS;",
    "GRANT ALL ON DATABASE aicorelink TO aicorelink_app, aicorelink_admin;",
]

for cmd in commands:
    stdin, stdout, stderr = client.exec_command(f"sudo docker exec -e PGPASSWORD=7anlnf0odssgmuwyjchqzdpk aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U reece.schmeler67 -d n8n -c \"{cmd}\"")
    print(f'Cmd: {cmd}')
    print('Output:', stdout.read().decode())
    print('Errors:', stderr.read().decode())

# Now in aicorelink database
commands2 = [
    "GRANT ALL ON SCHEMA public TO aicorelink_app, aicorelink_admin;",
    "GRANT ALL ON ALL TABLES IN SCHEMA public TO aicorelink_app, aicorelink_admin;",
    "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO aicorelink_app, aicorelink_admin;",
    "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO aicorelink_app, aicorelink_admin;",
    "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO aicorelink_app, aicorelink_admin;",
    'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
]

for cmd in commands2:
    stdin, stdout, stderr = client.exec_command(f"sudo docker exec -e PGPASSWORD=7anlnf0odssgmuwyjchqzdpk aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U reece.schmeler67 -d aicorelink -c \"{cmd}\"")
    print(f'Cmd: {cmd}')
    print('Output:', stdout.read().decode())
    print('Errors:', stderr.read().decode())

client.close()