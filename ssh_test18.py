import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Verify seed data
cmd = "sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink -c \"SELECT * FROM tenants; SELECT * FROM users; SELECT * FROM tenant_users; SELECT * FROM tenant_channels; SELECT * FROM cost_rates;\""
stdin, stdout, stderr = client.exec_command(cmd)
print('Output:')
print(stdout.read().decode())
print('Errors:')
print(stderr.read().decode())

client.close()