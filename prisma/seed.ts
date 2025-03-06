import { PrismaClient } from '@prisma/client';
import { grassSpeciesData } from './seed-data/grass-species';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  try {
    // Clear existing data
    await prisma.grassSpecies.deleteMany();
    console.log('Cleared existing grass species data');
    
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