const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  try {
    // 1. Crear tenant de prueba
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Clinica Demo',
        slug: 'clinica-demo',
        plan: 'profesional',
        status: 'activo',
      },
    });
    console.log('✅ Tenant creado:', tenant.id, tenant.name);

    // 2. Crear usuario dev_aicore
    const passwordHash = await bcrypt.hash('demo123456', 12);
    const user = await prisma.user.create({
      data: {
        email: 'dev@aicore.com',
        passwordHash,
      },
    });
    console.log('✅ Usuario creado:', user.id, user.email);

    // 3. Vincular usuario al tenant con rol dev_aicore
    const link = await prisma.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: 'dev_aicore',
      },
    });
    console.log('✅ Vinculación tenant-usuario:', link.id);

    // 4. Activar canales por defecto
    const channels = ['whatsapp_text', 'whatsapp_voice', 'email', 'social'];
    for (const ch of channels) {
      await prisma.tenantChannel.create({
        data: {
          tenantId: tenant.id,
          channel: ch,
          enabled: true,
          activatedAt: new Date(),
        },
      });
    }
    console.log('✅ Canales activados');

    console.log('\n🎉 Seed completado!');
    console.log('Login: dev@aicore.com / demo123456');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('ℹ️  Los datos ya existen (unique constraint)');
    } else {
      console.error('❌ Error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

seed();