import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=10)

# Insert the missing tenant_channel for whatsapp_text
cmd = """sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink -c "
INSERT INTO tenant_channels (tenant_id, channel, enabled, config, activated_at)
VALUES ('6a25006a-e0b1-434c-8c2f-a97cf84d7926', 'whatsapp_text', true, '{\"tone\": \"amable\", \"autoReplyEnabled\": true}', NOW())
ON CONFLICT (tenant_id, channel) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  config = EXCLUDED.config,
  activated_at = EXCLUDED.activated_at;
" """
stdin, stdout, stderr = client.exec_command(cmd)
print('Output:')
print(stdout.read().decode())
print('Errors:')
print(stderr.read().decode())

# Verify
cmd2 = "sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass aicore-n8nrunnerpostgresollama-a715gi-postgres-1 psql -U aicorelink_app -d aicorelink -c \"SELECT * FROM tenant_channels;\""
stdin, stdout, stderr = client.exec_command(cmd2)
print('Verify:')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()