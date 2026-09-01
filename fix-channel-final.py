import paramiko
import json
import base64

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=30)

def run(cmd, timeout=180):
    print(f'>>> {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print('STDERR:', err)
    return out

out = run('sudo docker ps -q --filter name=aicore-n8nrunnerpostgresollama-a715gi-postgres-1')
pg_container = out.strip().split('\n')[0]
print(f"Postgres container: {pg_container}")

tenant_id = "6a25006a-e0b1-434c-8c2f-a97cf84d7926"

# Insert channel with explicit id using gen_random_uuid()
config = {
    "tone": "amable", "businessHours": "09:00-18:00", "knowledgeBase": "",
    "autoReplyEnabled": True, "preferLocalAi": False, "maxTokensResponse": 500,
    "escalationKeywords": ["humano", "persona", "agente", "reclamo", "queja"],
    "escalationNotify": "none", "escalationMessage": "Un agente humano se pondra en contacto contigo en breve.",
    "voiceReplyEnabled": False, "voiceId": "21m00Tcm4TlvDq8ikWAM"
}
config_json = json.dumps(config)

sql = f"""
BEGIN;
SET LOCAL app.current_tenant = '{tenant_id}';
INSERT INTO tenant_channels (id, tenant_id, channel, enabled, config, descripcion, activated_at)
VALUES (gen_random_uuid(), '{tenant_id}', 'whatsapp_text', true, '{config_json}'::jsonb, 'Canal WhatsApp texto', NOW())
ON CONFLICT (tenant_id, channel) DO UPDATE SET enabled = true, config = EXCLUDED.config, descripcion = EXCLUDED.descripcion, activated_at = NOW();
COMMIT;
"""

sql_b64 = base64.b64encode(sql.encode()).decode()
run(f'echo {sql_b64} | base64 -d > /tmp/insert_channel.sql', 10)
run(f'sudo docker cp /tmp/insert_channel.sql {pg_container}:/tmp/insert_channel.sql', 10)
run(f'sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass {pg_container} psql -U aicorelink_app -d aicorelink -f /tmp/insert_channel.sql', 60)

# Verify
run(f'sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass {pg_container} psql -U aicorelink_app -d aicorelink -c "SELECT * FROM tenant_channels;"', 60)

# Restart app container
out = run('sudo docker ps -q --filter name=aicorelink')
app_container = out.strip().split('\n')[0]
print(f"Restarting app container: {app_container}")
run(f'sudo docker restart {app_container}')

print("\n=== Done ===")
client.close()