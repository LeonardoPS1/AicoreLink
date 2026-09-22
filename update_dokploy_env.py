import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=30)

def run(cmd, timeout=60):
    print(f'>>> {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out: print(out)
    if err: print('STDERR:', err)
    return out

# Update the database password for aicorelink_app user to one without special chars
# Using a secure password without ! @ # $ % etc.
new_db_password = "AicoreLink2024SecurePass"
run(f"""sudo docker exec 32e0eb68870e psql -U aicorelink_app -d aicorelink -c "ALTER USER aicorelink_app WITH PASSWORD '{new_db_password}';" """)

# Test from postgres container
run(f"""sudo docker exec -e PGPASSWORD={new_db_password} 32e0eb68870e psql -U aicorelink_app -d aicorelink -c "SELECT 1" """)

# Test from app container
run(f"""sudo docker exec fa3f2d72b057 node -e "
const {{ PrismaClient }} = require('@prisma/client');
const prisma = new PrismaClient({{
  datasources: {{
    db: {{
      url: 'postgresql://aicorelink_app:{new_db_password}@172.18.0.1:5432/aicorelink'
    }}
  }}
}});
prisma.user.findUnique({{ where: {{ email: 'dev@aicore.com' }} }})
  .then(u => {{ console.log('User:', u); prisma.\$disconnect(); }})
  .catch(e => {{ console.error('Error:', e.message); prisma.\$disconnect(); }});
" 2>&1""")

print(f"\nNew DATABASE_URL: postgresql://aicorelink_app:{new_db_password}@172.18.0.1:5432/aicorelink")
print("Update this in Dokploy UI: https://dokploy.aicorebots.com")

client.close()