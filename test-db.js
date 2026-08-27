const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.user.findUnique({where: {email: 'dev@aicore.com'}})
  .then(u => console.log('User:', u))
  .catch(e => console.error('Error:', e))
  .finally(() => db.$disconnect());