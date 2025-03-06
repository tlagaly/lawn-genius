import { PrismaClient } from '@prisma/client';
import { grassSpeciesData } from './seed-data/grass-species';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  try {
    // Clear existing data
    await prisma.grassSpecies.deleteMany();
    console.log('Cleared existing grass species data');
    
    // Create test user
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        emailNotifications: true,
        pushNotifications: false,
        notifyFrequency: 'immediate',
      },
    });
    console.log(`Created/Updated test user: ${testUser.email}`);
    
    // Seed grass species
    for (const species of grassSpeciesData) {
      const created = await prisma.grassSpecies.create({
        data: {
          name: species.name,
          scientificName: species.scientificName,
          type: species.type,
          characteristics: species.characteristics,
          idealConditions: species.idealConditions,
          maintenance: species.maintenance,
          commonMixes: species.commonMixes,
          mainImage: species.mainImage,
          images: species.images,
          imageDescriptions: species.imageDescriptions,
        },
      });
      console.log(`Created grass species: ${created.name}`);
    }

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error during seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });