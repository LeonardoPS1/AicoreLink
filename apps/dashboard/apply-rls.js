const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyRLS() {
  try {
    // tenant_channels
    await prisma.$executeRaw`ALTER TABLE tenant_channels ENABLE ROW LEVEL SECURITY`;
    console.log('tenant_channels ENABLE ROW LEVEL SECURITY');

    await prisma.$executeRaw`CREATE POLICY tenant_isolation ON tenant_channels USING (tenant_id = current_setting('app.current_tenant', true)::TEXT)`;
    console.log('tenant_channels policy created');

    // channel_credentials
    await prisma.$executeRaw`ALTER TABLE channel_credentials ENABLE ROW LEVEL SECURITY`;
    console.log('channel_credentials ENABLE ROW LEVEL SECURITY');

    await prisma.$executeRaw`CREATE POLICY tenant_isolation ON channel_credentials USING (tenant_id = current_setting('app.current_tenant', true)::TEXT)`;
    console.log('channel_credentials policy created');

    // tenant_usage
    await prisma.$executeRaw`ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY`;
    console.log('tenant_usage ENABLE ROW LEVEL SECURITY');

    await prisma.$executeRaw`CREATE POLICY tenant_isolation ON tenant_usage USING (tenant_id = current_setting('app.current_tenant', true)::TEXT)`;
    console.log('tenant_usage policy created');

    // conversations
    await prisma.$executeRaw`ALTER TABLE conversations ENABLE ROW LEVEL SECURITY`;
    console.log('conversations ENABLE ROW LEVEL SECURITY');

    await prisma.$executeRaw`CREATE POLICY tenant_isolation ON conversations USING (tenant_id = current_setting('app.current_tenant', true)::TEXT)`;
    console.log('conversations policy created');

    // messages
    await prisma.$executeRaw`ALTER TABLE messages ENABLE ROW LEVEL SECURITY`;
    console.log('messages ENABLE ROW LEVEL SECURITY');

    await prisma.$executeRaw`CREATE POLICY tenant_isolation ON messages USING (tenant_id = current_setting('app.current_tenant', true)::TEXT)`;
    console.log('messages policy created');

    console.log('RLS applied successfully!');
  } catch (error) {
    console.error('Error applying RLS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyRLS();