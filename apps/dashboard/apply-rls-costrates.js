const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyRLS() {
  try {
    await prisma.$executeRaw`ALTER TABLE cost_rates ENABLE ROW LEVEL SECURITY`;
    console.log('cost_rates ENABLE ROW LEVEL SECURITY');
    
    await prisma.$executeRaw`CREATE POLICY tenant_isolation ON cost_rates USING (true)`;
    console.log('cost_rates policy created (global read)');
    
    console.log('RLS applied successfully!');
  } catch (error) {
    console.error('Error applying RLS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyRLS();