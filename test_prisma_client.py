import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.222.207.250', username='ubuntu', password='Cool220479..@', timeout=30)

def run(cmd, timeout=120):
    print(f'>>> {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out: print(out)
    if err: print('STDERR:', err)
    return out

# Test Prisma client from .next build
run("""sudo docker exec fa3f2d72b057 node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findUnique({ where: { email: 'dev@aicore.com' } })
  .then(u => { console.log('User:', u); prisma.\$disconnect(); })
  .catch(e => { console.error('Error:', e.message); prisma.\$disconnect(); });
" 2>&1""")

client.close()