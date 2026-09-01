import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=30)

def run(cmd, timeout=60):
    print(f'>>> {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print('STDERR:', err)

# Query with tenant context set
run("sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass 32e0eb68870e psql -U aicorelink_app -d aicorelink -c \"SET app.current_tenant = '6a25006a-e0b1-434c-8c2f-a97cf84d7926'; SELECT * FROM tenant_channels;\"")

# Also verify conversations, messages work
run("sudo docker exec -e PGPASSWORD=AicoreLink2024!AppPass 32e0eb68870e psql -U aicorelink_app -d aicorelink -c \"SET app.current_tenant = '6a25006a-e0b1-434c-8c2f-a97cf84d7926'; SELECT count(*) FROM conversations;\"")

client.close()