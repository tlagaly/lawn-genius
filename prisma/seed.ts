import { PrismaClient, Prisma } from '@prisma/client';
import { grassSpeciesData } from './seed-data/grass-species';
import { seedUserManagement } from './seed-data/user-management';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function clearData() {
  const tablenames = Prisma.dmmf.datamodel.models
    .map(model => model.dbName || model.name)
    .filter(name => name !== 'User'); // Keep users until last

  console.log('Clearing tables:', tablenames.join(', '));
  
  // Clear all related tables first
  await Promise.all(
    tablenames.map(table =>
      prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`)
    )
  );

  // Finally clear users
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE;');
  
  console.log('✓ All tables cleared');
}

async function main() {
  console.log('Starting seed...');

  try {
    // Clear all existing data
    await clearData();
    
    // Seed user management data first (users are referenced by other models)
    await seedUserManagement(prisma);
    console.log('✓ Seeded user management data');
    
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