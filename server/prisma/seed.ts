import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting CID-10 seed process...');
  
  // We'll read from a simplified CID-10 JSON file we'll generate next
  const cidsPath = path.join(__dirname, 'cids.json');
  
  if (!fs.existsSync(cidsPath)) {
    console.error(`File not found: ${cidsPath}`);
    return;
  }

  const cidsData = JSON.parse(fs.readFileSync(cidsPath, 'utf8'));
  console.log(`Found ${cidsData.length} CIDs. Inserting into database...`);

  // Use createMany for bulk insert (Sqlite handles chunking internally for Prisma usually, 
  // but to be safe we'll do 500 at a time if the list is huge)
  const chunkSize = 500;
  for (let i = 0; i < cidsData.length; i += chunkSize) {
    const chunk = cidsData.slice(i, i + chunkSize);
    await prisma.cid.createMany({
      data: chunk,
      skipDuplicates: true, // avoid crashing on re-runs
    });
    console.log(`Inserted batch ${i} to ${i + chunk.length}`);
  }

  console.log('CID-10 seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
