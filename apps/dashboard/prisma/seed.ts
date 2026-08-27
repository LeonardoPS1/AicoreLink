import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // 1. Create tenant
  const tenant = await db.tenant.upsert({
    where: { slug: "clinica-demo" },
    update: {},
    create: {
      name: "Clínica Demo",
      slug: "clinica-demo",
      plan: "pro",
      status: "activo",
    },
  });

  // 2. Create dev_aicore user
  const passwordHash = await hash("dev123456", 12);
  const user = await db.user.upsert({
    where: { email: "dev@aicore.com" },
    update: { passwordHash },
    create: {
      email: "dev@aicore.com",
      passwordHash,
    },
  });

  // 3. Link user to tenant as dev_aicore
  await db.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    update: { role: "dev_aicore" },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      role: "dev_aicore",
    },
  });

  // 4. Enable whatsapp_text channel for tenant
  await db.tenantChannel.upsert({
    where: { tenantId_channel: { tenantId: tenant.id, channel: "whatsapp_text" } },
    update: { enabled: true, config: { tone: "amable", autoReplyEnabled: true } },
    create: {
      tenantId: tenant.id,
      channel: "whatsapp_text",
      enabled: true,
      config: { tone: "amable", autoReplyEnabled: true },
    },
  });

  // 5. Add basic cost_rates
  await db.costRate.upsert({
    where: { id: "openrouter-tokens" },
    update: { rate: 0.000001, provider: "openrouter", unit: "token" },
    create: { id: "openrouter-tokens", provider: "openrouter", unit: "token", rate: 0.000001 },
  });
  await db.costRate.upsert({
    where: { id: "meta-messages" },
    update: { rate: 0.005, provider: "meta_cloud_api", unit: "message" },
    create: { id: "meta-messages", provider: "meta_cloud_api", unit: "message", rate: 0.005 },
  });

  console.log("Seed completed:", { tenant: tenant.slug, user: user.email });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());