import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding root admin account...');

  const adminEmail = 'admin@medassist.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
     const hashedPassword = await bcrypt.hash('admin123', 10);
     const admin = await prisma.user.create({
       data: {
         name: 'Administrador Mestre',
         email: adminEmail,
         password: hashedPassword,
         role: Role.ADMIN,
       }
     });
     console.log(`✅ Root Admin created! Email: ${admin.email} / Pass: admin123`);
  } else {
     console.log(`ℹ️ Root Admin already exists. Email: ${existingAdmin.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
