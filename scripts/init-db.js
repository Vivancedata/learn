const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  // First, try to create a simple connection
  const prisma = new PrismaClient();

  try {
    // Try to execute each migration SQL file in order
    const migrationsDir = path.join(__dirname, '../prisma/migrations');
    const migrations = fs.readdirSync(migrationsDir)
      .filter(f => f.startsWith('20'))
      .sort();

    for (const migration of migrations) {
      const sqlFile = path.join(migrationsDir, migration, 'migration.sql');
      if (fs.existsSync(sqlFile)) {
        const sql = fs.readFileSync(sqlFile, 'utf8');
        const statements = sql.split(';').filter(s => s.trim());

        console.log(`Applying migration: ${migration}`);
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await prisma.$executeRawUnsafe(statement);
            } catch (e) {
              // Ignore "table already exists" errors
              if (!e.message.includes('already exists')) {
                console.error(`  Warning: ${e.message.split('\n')[0]}`);
              }
            }
          }
        }
      }
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
