import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Main User Account
  const mainUser = await prisma.user.upsert({
    where: { email: 'user@lumina.ai' },
    update: {},
    create: {
      email: 'user@lumina.ai',
      name: 'Alex Morgan',
      password: await bcrypt.hash('Password123', 12),
    },
  });
  console.log(`✓ Main user: ${mainUser.email} (password: Password123)`);

  // Admin Account
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lumina.ai' },
    update: {},
    create: {
      email: 'admin@lumina.ai',
      name: 'Admin',
      password: await bcrypt.hash('Admin@2024', 12),
    },
  });
  console.log(`✓ Admin user: ${adminUser.email} (password: Admin@2024)`);

  // Create a chat between them
  const chat = await prisma.chat.create({
    data: {
      name: 'Welcome Chat',
      isGroup: false,
      members: {
        create: [
          { userId: mainUser.id },
          { userId: adminUser.id },
        ],
      },
    },
  });

  // Seed some messages
  await prisma.message.createMany({
    data: [
      { chatId: chat.id, senderId: adminUser.id, content: 'Welcome to Lumina! 🚀' },
      { chatId: chat.id, senderId: mainUser.id, content: 'Thanks! This looks amazing.' },
      { chatId: chat.id, senderId: adminUser.id, content: 'Let me know if you need anything.' },
    ],
  });
  console.log(`✓ Seeded chat with 3 messages`);

  console.log('\n--- Login Credentials ---');
  console.log('Main:  user@lumina.ai / Password123');
  console.log('Admin: admin@lumina.ai / Admin@2024');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
