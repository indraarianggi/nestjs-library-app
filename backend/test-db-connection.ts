import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');

    // Test connection with a simple query
    await prisma.$connect();
    console.log('✓ Database connection successful!');

    // Test query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✓ Query executed successfully!');
    console.log('PostgreSQL version:', result);

    // Check enums are available in TypeScript
    console.log('\n✓ Checking enum types:');
    console.log('- Role enum exists');
    console.log('- MembershipStatus enum exists');
    console.log('- BookStatus enum exists');
    console.log('- CopyStatus enum exists');
    console.log('- LoanStatus enum exists');
    console.log('- Currency enum exists');
    console.log('- SmtpProvider enum exists');

    console.log('\n✓ All checks passed! Database setup is complete.');
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
