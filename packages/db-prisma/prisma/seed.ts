import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.create({
    data: {
      email: 'admin@payflow.com',
      passwordHash,
      role: 'ADMIN',
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          kycStatus: 'APPROVED'
        }
      },
      wallets: {
        create: [
          { currency: 'USD', balance: 100000.00 },
          { currency: 'EUR', balance: 50000.00 }
        ]
      }
    }
  });

  console.log('Created Admin User:', user.email);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
