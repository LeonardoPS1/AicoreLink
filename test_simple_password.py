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

# Check full pg_hba.conf
run("""sudo docker exec 32e0eb68870e cat /var/lib/postgresql/data/pg_hba.conf""")

# Try connecting from app container with a simpler password
# First, change password to one without special chars
run("""sudo docker exec 32e0eb68870e psql -U aicorelink_app -d aicorelink -c "ALTER USER aicorelink_app WITH PASSWORD 'simplepass123';" """)

# Test from postgres container
run("""sudo docker exec -e PGPASSWORD=simplepass123 32e0eb68870e psql -U aicorelink_app -d aicorelink -c "SELECT 1" """)

# Update app container env and restart
# We need to update the DATABASE_URL in Dokploy, but for now let's test with the new password
run("""sudo docker exec fa3f2d72b057 node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://aicorelink_app:simplepass123@172.18.0.1:5432/aicorelink'
    }
  }
});
prisma.user.findUnique({ where: { email: 'dev@aicore.com' } })
  .then(u => { console.log('User:', u); prisma.\$disconnect(); })
  .catch(e => { console.error('Error:', e.message); prisma.\$disconnect(); });
" 2>&1""")

client.close()