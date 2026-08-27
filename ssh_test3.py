import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Create database and users
sql = """
CREATE DATABASE aicorelink;
CREATE ROLE aicorelink_app LOGIN PASSWORD 'AicoreLink2024!AppPass';
CREATE ROLE aicorelink_admin LOGIN PASSWORD 'AicoreLink2024!AdminPass' BYPASSRLS;
GRANT ALL ON DATABASE aicorelink TO aicorelink_app, aicorelink_admin;
\\c aicorelink
GRANT ALL ON SCHEMA public TO aicorelink_app, aicorelink_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO aicorelink_app, aicorelink_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO aicorelink_app, aicorelink_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO aicorelink_app, aicorelink_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO aicorelink_app, aicorelink_admin;
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
"""

stdin, stdout, stderr = client.exec_command(f'sudo docker exec -e PGPASSWORD=7anlnf0odssgmuwyjchqzdpk aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U reece.schmeler67 -c "{sql}"')
print('Output:')
print(stdout.read().decode())
print('Errors:')
print(stderr.read().decode())
client.close()