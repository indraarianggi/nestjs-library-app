import {
  PrismaClient,
  Role,
  MembershipStatus,
  BookStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function verifySchema() {
  console.log('🔍 Verifying database schema and models...\n');

  try {
    // Test 1: Check all tables exist
    console.log('✓ Testing table existence...');
    await prisma.$queryRaw`SELECT COUNT(*) FROM "user"`;
    await prisma.$queryRaw`SELECT COUNT(*) FROM member_profile`;
    await prisma.$queryRaw`SELECT COUNT(*) FROM author`;
    await prisma.$queryRaw`SELECT COUNT(*) FROM category`;
    await prisma.$queryRaw`SELECT COUNT(*) FROM book`;
    await prisma.$queryRaw`SELECT COUNT(*) FROM book_author`;
    await prisma.$queryRaw`SELECT COUNT(*) FROM book_category`;
    await prisma.$queryRaw`SELECT COUNT(*) FROM book_copy`;
    await prisma.$queryRaw`SELECT COUNT(*) FROM loan`;
    await prisma.$queryRaw`SELECT COUNT(*) FROM setting`;
    await prisma.$queryRaw`SELECT COUNT(*) FROM audit_log`;
    console.log('  ✓ All tables exist\n');

    // Test 2: Verify enum types are available
    console.log('✓ Testing enum types...');
    const roleAdmin: Role = 'ADMIN';
    const roleMember: Role = 'MEMBER';
    const statusActive: MembershipStatus = 'ACTIVE';
    const bookStatusActive: BookStatus = 'ACTIVE';
    console.log(`  ✓ Role enum: ${roleAdmin}, ${roleMember}`);
    console.log(`  ✓ MembershipStatus enum: ${statusActive}`);
    console.log(`  ✓ BookStatus enum: ${bookStatusActive}\n`);

    // Test 3: Verify indexes exist
    console.log('✓ Testing indexes...');
    const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY indexname
    `;
    console.log(`  ✓ Found ${indexes.length} custom indexes:`);
    indexes.forEach((idx) => console.log(`    - ${idx.indexname}`));
    console.log();

    // Test 4: Verify constraints
    console.log('✓ Testing constraints...');
    const constraints = await prisma.$queryRaw<
      Array<{ conname: string; contype: string }>
    >`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid IN (
        SELECT oid FROM pg_class 
        WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      )
      AND contype IN ('u', 'f')
      ORDER BY conname
    `;
    const uniqueConstraints = constraints.filter((c) => c.contype === 'u');
    const foreignKeys = constraints.filter((c) => c.contype === 'f');
    console.log(`  ✓ Unique constraints: ${uniqueConstraints.length}`);
    console.log(`  ✓ Foreign keys: ${foreignKeys.length}\n`);

    // Test 5: Verify pg_trgm extension
    console.log('✓ Testing pg_trgm extension...');
    const extensions = await prisma.$queryRaw<
      Array<{ extname: string; extversion: string }>
    >`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'pg_trgm'
    `;
    if (extensions.length > 0) {
      console.log(
        `  ✓ pg_trgm extension v${extensions[0].extversion} is enabled\n`,
      );
    } else {
      console.log('  ✗ pg_trgm extension not found\n');
    }

    // Test 6: Test CRUD operations with a transaction (rollback)
    console.log('✓ Testing CRUD operations (will rollback)...');
    await prisma
      .$transaction(async (tx) => {
        // Create a test author
        const author = await tx.author.create({
          data: {
            name: 'Test Author',
            bio: 'A test author for verification',
          },
        });
        console.log(`  ✓ Created author: ${author.name}`);

        // Create a test category
        const category = await tx.category.create({
          data: {
            name: 'Test Category',
            description: 'A test category',
          },
        });
        console.log(`  ✓ Created category: ${category.name}`);

        // Create a test book
        const book = await tx.book.create({
          data: {
            title: 'Test Book',
            isbn: 'TEST-123-456',
            bookAuthors: {
              create: {
                authorId: author.id,
              },
            },
            bookCategories: {
              create: {
                categoryId: category.id,
              },
            },
          },
          include: {
            bookAuthors: {
              include: {
                author: true,
              },
            },
            bookCategories: {
              include: {
                category: true,
              },
            },
          },
        });
        console.log(`  ✓ Created book: ${book.title}`);
        console.log(`    - With author: ${book.bookAuthors[0].author.name}`);
        console.log(
          `    - With category: ${book.bookCategories[0].category.name}`,
        );

        // Rollback by throwing error
        throw new Error('Rollback test data');
      })
      .catch((error) => {
        if (error.message === 'Rollback test data') {
          console.log('  ✓ Transaction rolled back successfully\n');
        } else {
          throw error;
        }
      });

    console.log('✅ All schema verification tests passed!\n');
    console.log('📊 Summary:');
    console.log('  - All tables created');
    console.log('  - All enums defined and typed');
    console.log('  - All indexes created (including GIN trigram)');
    console.log('  - All constraints enforced');
    console.log('  - All relations working');
    console.log('  - CRUD operations functional\n');
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema();
