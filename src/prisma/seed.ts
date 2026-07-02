import {
  PrismaClient,
  UserRole,
  BusinessCategory,
  BookingStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Test Customer
  const customer = await prisma.user.upsert({
    where: { phone: '+2348012345678' },
    update: {},
    create: {
      role: UserRole.CUSTOMER,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+2348012345678',
      email: 'john.doe@example.com',
      password: await bcrypt.hash('password123', 10),
    },
  });

  // Create Test Merchant
  const merchant = await prisma.user.upsert({
    where: { phone: '+2348098765432' },
    update: {},
    create: {
      role: UserRole.MERCHANT,
      firstName: 'Adaeze',
      lastName: 'Okafor',
      phone: '+2348098765432',
      email: 'adaeze@salon.com',
      password: await bcrypt.hash('password123', 10),
    },
  });

  // Create Business for Merchant
  const business = await prisma.business.upsert({
    where: { ownerId: merchant.id },
    update: {},
    create: {
      ownerId: merchant.id,
      name: "Adaeze's Beauty Salon",
      category: BusinessCategory.SALON,
      address: '12 Allen Avenue, Ikeja, Lagos',
      location: { lat: 6.5965, lng: 3.342 },
      description: 'Premium unisex salon with professional stylists',
      isVerified: true,
    },
  });

  // Create Services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        businessId: business.id,
        name: 'Hair Cut & Style',
        description: 'Modern haircut and styling',
        duration: 45,
        price: 4500,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business.id,
        name: 'Hair Wash & Treatment',
        description: 'Deep conditioning treatment',
        duration: 60,
        price: 8500,
      },
    }),
  ]);

  console.log('✅ Seed completed successfully!');
  console.log(`Customer ID: ${customer.id}`);
  console.log(`Merchant ID: ${merchant.id}`);
  console.log(`Business ID: ${business.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
