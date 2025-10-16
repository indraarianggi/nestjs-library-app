import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './src/prisma/prisma.module';
import { PrismaService } from './src/prisma/prisma.service';

async function testPrismaService() {
  console.log('🧪 Testing PrismaService integration...\n');

  try {
    // Create a testing module with PrismaModule
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        PrismaModule,
      ],
    }).compile();

    // Get PrismaService instance
    const prismaService = moduleRef.get<PrismaService>(PrismaService);
    console.log('✅ PrismaService successfully injected');

    // Initialize the service
    await prismaService.onModuleInit();
    console.log('✅ Database connection established');

    // Test 1: Query settings
    console.log('\n📋 Test 1: Query settings...');
    const settings = await prismaService.setting.findFirst();
    if (settings) {
      console.log('✅ Settings found:', {
        loanDays: settings.loanDays,
        maxConcurrentLoans: settings.maxConcurrentLoans,
        currency: settings.currency,
      });
    } else {
      console.log('⚠️  No settings found (run seed script)');
    }

    // Test 2: Count users
    console.log('\n👥 Test 2: Count users...');
    const userCount = await prismaService.user.count();
    console.log(`✅ Found ${userCount} users in database`);

    // Test 3: Count authors
    console.log('\n✍️  Test 3: Count authors...');
    const authorCount = await prismaService.author.count();
    console.log(`✅ Found ${authorCount} authors in database`);

    // Test 4: Count books
    console.log('\n📚 Test 4: Count books...');
    const bookCount = await prismaService.book.count();
    console.log(`✅ Found ${bookCount} books in database`);

    // Test 5: Count book copies
    console.log('\n📖 Test 5: Count book copies...');
    const copyCount = await prismaService.bookCopy.count();
    console.log(`✅ Found ${copyCount} book copies in database`);

    // Test 6: Get a sample book with relations
    console.log('\n🔍 Test 6: Query book with relations...');
    const sampleBook = await prismaService.book.findFirst({
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
        bookCopies: true,
      },
    });

    if (sampleBook) {
      console.log('✅ Sample book found:');
      console.log(`   Title: ${sampleBook.title}`);
      console.log(`   ISBN: ${sampleBook.isbn}`);
      console.log(`   Authors: ${sampleBook.bookAuthors.map(ba => ba.author.name).join(', ')}`);
      console.log(`   Categories: ${sampleBook.bookCategories.map(bc => bc.category.name).join(', ')}`);
      console.log(`   Copies: ${sampleBook.bookCopies.length}`);
    } else {
      console.log('⚠️  No books found (run seed script)');
    }

    // Disconnect
    await prismaService.onModuleDestroy();
    console.log('\n✅ Database connection closed');

    console.log('\n✨ All PrismaService integration tests passed!');
  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    process.exit(1);
  }
}

testPrismaService()
  .then(() => {
    console.log('\n🎉 Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
