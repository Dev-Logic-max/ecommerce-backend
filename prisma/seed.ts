import { PrismaClient } from "@prisma/client";
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Seed roles (only if they don't exist)
  await prisma.role.createMany({
    data: [
      { name: 'Developer' },
      { name: 'PlatformAdmin' },
      { name: 'OperationsAdmin' },
      { name: 'Retailer' },
      { name: 'Merchant' },
      { name: 'Supplier' },
      { name: 'Courier' },
      { name: 'Customer' },
    ],
    skipDuplicates: true, // Prevents duplicate roles
  });

  // Seed default Developer user
  // await prisma.user.create({
  //   data: {
  //     username: 'developer',
  //     email: 'dev@admin.com',
  //     password: 'Admin', // Replace with hashed password (use bcrypt later)
  //     role: { connect: { name: 'Developer' } },
  //     profile: {
  //       create: {
  //         name: 'Developer Admin',
  //         address: '123 Dev Street',
  //         city: 'Tech City',
  //         country: 'Techland',
  //       },
  //     },
  //   },
  // });

  // Fetch Developer role
  const developerRole = await prisma.role.findUnique({ where: { name: 'Developer' } });
  if (!developerRole) {
    throw new Error('Developer role not found');
  }

  // Hash the password for the developer user
  const hashedPassword = await bcrypt.hash('Admin', 10);

  await prisma.user.upsert({
    where: { username: 'developer' },
    update: {
      email: 'dev@example.com',
      phone: '1234567890',
      password: hashedPassword,
    },
    create: {
      username: 'developer',
      email: 'dev@example.com',
      phone: '1234567890',
      password: hashedPassword,
      role: { connect: { id: developerRole.id } },
      profile: {
        create: {
          name: 'Developer Admin',
          address: '123 Dev Street',
          city: 'Tech City',
          country: 'Techland',
        },
      },
    },
  });
}

main()
  .then(() => {
    console.log("✅ Seeding complete");
  })
  .catch((e) => {
    console.error("❌ Seeding error:", e);
  })
  .finally(async () => await prisma.$disconnect());