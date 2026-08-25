const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCostRates() {
  try {
    const rates = [
      { provider: 'openrouter', unit: 'token', rate: 0.0000015 },      // $1.50 por 1M tokens (aprox GLM 4.5)
      { provider: 'openrouter', unit: 'token', rate: 0.000005 },       // $5 por 1M tokens (modelos premium)
      { provider: 'meta_cloud_api', unit: 'message', rate: 0.005 },    // $0.005 por mensaje WhatsApp
      { provider: 'elevenlabs', unit: 'token', rate: 0.00018 },        // $0.18 por 1K chars
      { provider: 'whisper', unit: 'minute', rate: 0.006 },            // $0.006 por minuto de audio
    ];

    for (const r of rates) {
      await prisma.costRate.upsert({
        where: { id: `${r.provider}-${r.unit}` },
        update: { rate: r.rate },
        create: { id: `${r.provider}-${r.unit}`, ...r },
      });
      console.log(`✅ CostRate: ${r.provider} / ${r.unit} = $${r.rate}`);
    }

    console.log('\n🎉 Cost rates seeded!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCostRates();