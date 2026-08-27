import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Apply RLS policies using heredoc
rls_sql = """
DROP POLICY IF EXISTS tenant_isolation ON tenant_channels;
DROP POLICY IF EXISTS tenant_isolation ON channel_credentials;
DROP POLICY IF EXISTS tenant_isolation ON tenant_usage;
DROP POLICY IF EXISTS tenant_isolation ON conversations;
DROP POLICY IF EXISTS tenant_isolation ON messages;

ALTER TABLE tenant_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_channels
  USING (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE channel_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON channel_credentials
  USING (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_usage
  USING (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON conversations
  USING (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON messages
  USING (tenant_id::text = current_setting('app.current_tenant', true));
"""

stdin, stdout, stderr = client.exec_command(f"sudo docker exec -i -e PGPASSWORD=7anlnf0odssgmuwyjchqzdpk aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U reece.schmeler67 -d aicorelink << 'EOF'\n{rls_sql}\nEOF")
print('RLS Output:')
print(stdout.read().decode())
print('RLS Errors:')
print(stderr.read().decode())

# Verify policies
stdin, stdout, stderr = client.exec_command("sudo docker exec -e PGPASSWORD=7anlnf0odssgmuwyjchqzdpk aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U reece.schmeler67 -d aicorelink -c \"\\dp\"")
print('Policies:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()