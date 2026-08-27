import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Use node to generate bcrypt hash and update DB
cmd = """cd /etc/dokploy/applications/aicorelink-aicorelink-b7m7ol/code/apps/dashboard && node -e "
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('dev123456', 12);
console.log('Hash:', hash);

const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.AICORELINK_DATABASE_URL || 'postgresql://aicorelink_app:AicoreLink2024!AppPass@172.18.0.1:5432/aicorelink'
});
client.connect().then(() => {
  return client.query(\"UPDATE users SET password_hash = \$1 WHERE email = 'dev@aicore.com'\", [hash]);
}).then(result => {
  console.log('Updated:', result.rowCount);
  return client.end();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
" """
stdin, stdout, stderr = client.exec_command(cmd)
print('Output:')
print(stdout.read().decode())
print('Errors:')
print(stderr.read().decode())

# Verify
cmd2 = """sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink -c "SELECT password_hash FROM users WHERE email = 'dev@aicore.com';" """
stdin, stdout, stderr = client.exec_command(cmd2)
print('Verify:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()