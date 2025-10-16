import {
  PrismaClient,
  Role,
  MembershipStatus,
  BookStatus,
  CopyStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Starting database seeding...');

  // ============================================================
  // 1. SEED SETTINGS (Singleton)
  // ============================================================
  console.log('📋 Seeding settings...');
  const existingSettings = await prisma.setting.findFirst();

  if (!existingSettings) {
    await prisma.setting.create({
      data: {
        approvalsRequired: false, // Auto-approve loans for easier testing
        loanDays: 14,
        renewalDays: 7,
        renewalMinDaysBeforeDue: 1,
        maxRenewals: 1,
        overdueFeePerDay: 1000, // IDR 1,000 per day
        overdueFeeCapPerLoan: 100000, // IDR 100,000 max
        currency: 'IDR',
        maxConcurrentLoans: 5,
        notificationsEnabled: true,
        dueSoonDays: 3,
        dueDateNotificationsEnabled: true,
        fromEmail: 'admin-library@mail.com',
        smtpProvider: 'MAILTRAP',
        sendHourUTC: 8,
        timeZone: 'UTC',
      },
    });
    console.log('✅ Settings created');
  } else {
    console.log('⏭️  Settings already exist, skipping');
  }

  // ============================================================
  // 2. SEED ADMIN USER
  // ============================================================
  console.log('👤 Seeding admin user...');
  const adminEmail = 'admin@library.com';
  const adminPassword = 'Admin@123';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedAdminPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedAdminPassword,
        role: Role.ADMIN,
        isActive: true,
      },
    });
    console.log(`✅ Admin user created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log('⏭️  Admin user already exists, skipping');
  }

  // ============================================================
  // 3. SEED MEMBER USER WITH PROFILE
  // ============================================================
  console.log('👥 Seeding member user...');
  const memberEmail = 'member@example.com';
  const memberPassword = 'Member@123';

  const existingMember = await prisma.user.findUnique({
    where: { email: memberEmail },
    include: { memberProfile: true },
  });

  if (!existingMember) {
    const hashedMemberPassword = await bcrypt.hash(memberPassword, SALT_ROUNDS);
    await prisma.user.create({
      data: {
        email: memberEmail,
        passwordHash: hashedMemberPassword,
        role: Role.MEMBER,
        isActive: true,
        memberProfile: {
          create: {
            firstName: 'John',
            lastName: 'Doe',
            phone: '+628123456789',
            address: 'Jl. Contoh No. 123, Jakarta',
            status: MembershipStatus.ACTIVE,
          },
        },
      },
    });
    console.log(`✅ Member user created: ${memberEmail} / ${memberPassword}`);
  } else {
    console.log('⏭️  Member user already exists, skipping');
  }

  // ============================================================
  // 4. SEED AUTHORS
  // ============================================================
  console.log('✍️  Seeding authors...');
  const authorsData = [
    {
      name: 'J.K. Rowling',
      bio: 'British author, best known for the Harry Potter series',
    },
    {
      name: 'George R.R. Martin',
      bio: 'American novelist and short story writer, author of A Song of Ice and Fire',
    },
    {
      name: 'Yuval Noah Harari',
      bio: 'Israeli public intellectual, historian, and professor',
    },
    {
      name: 'Pramoedya Ananta Toer',
      bio: 'Indonesian author of novels, short stories, essays, and chronicles',
    },
    {
      name: 'Andrea Hirata',
      bio: 'Indonesian author best known for Laskar Pelangi',
    },
    {
      name: 'Dan Brown',
      bio: 'American author best known for his thriller novels',
    },
    {
      name: 'Tere Liye',
      bio: 'Indonesian author known for his fantasy and adventure novels',
    },
    {
      name: 'Agatha Christie',
      bio: 'English writer known for her detective novels',
    },
    {
      name: 'Haruki Murakami',
      bio: 'Japanese writer known for his surreal fiction',
    },
    {
      name: 'Paulo Coelho',
      bio: 'Brazilian lyricist and novelist, best known for The Alchemist',
    },
  ];

  const authorMap: Record<string, string> = {};

  for (const author of authorsData) {
    const existing = await prisma.author.findUnique({
      where: { name: author.name },
    });

    if (!existing) {
      const created = await prisma.author.create({ data: author });
      authorMap[author.name] = created.id;
      console.log(`  ✅ Created author: ${author.name}`);
    } else {
      authorMap[author.name] = existing.id;
      console.log(`  ⏭️  Author already exists: ${author.name}`);
    }
  }

  // ============================================================
  // 5. SEED CATEGORIES
  // ============================================================
  console.log('📚 Seeding categories...');
  const categoriesData = [
    { name: 'Fantasy', description: 'Magical and fantastical stories' },
    {
      name: 'Science Fiction',
      description: 'Futuristic and scientific themes',
    },
    { name: 'Mystery', description: 'Detective and suspense novels' },
    {
      name: 'Historical Fiction',
      description: 'Stories set in historical periods',
    },
    { name: 'Non-Fiction', description: 'Educational and factual books' },
    { name: 'Biography', description: 'Life stories of notable people' },
    { name: 'Philosophy', description: 'Philosophical works and thoughts' },
    { name: 'Adventure', description: 'Action-packed and thrilling stories' },
    { name: 'Romance', description: 'Love and relationship stories' },
    {
      name: 'Indonesian Literature',
      description: 'Works by Indonesian authors',
    },
  ];

  const categoryMap: Record<string, string> = {};

  for (const category of categoriesData) {
    const existing = await prisma.category.findUnique({
      where: { name: category.name },
    });

    if (!existing) {
      const created = await prisma.category.create({ data: category });
      categoryMap[category.name] = created.id;
      console.log(`  ✅ Created category: ${category.name}`);
    } else {
      categoryMap[category.name] = existing.id;
      console.log(`  ⏭️  Category already exists: ${category.name}`);
    }
  }

  // ============================================================
  // 6. SEED BOOKS WITH AUTHORS AND CATEGORIES
  // ============================================================
  console.log('📖 Seeding books...');
  const booksData = [
    {
      title: "Harry Potter and the Philosopher's Stone",
      subtitle: 'Book 1 of the Harry Potter Series',
      description:
        'A young wizard begins his magical journey at Hogwarts School of Witchcraft and Wizardry.',
      isbn: '978-0-7475-3269-9',
      publicationYear: 1997,
      language: 'English',
      coverImageUrl:
        'https://covers.openlibrary.org/b/isbn/9780747532699-L.jpg',
      authors: ['J.K. Rowling'],
      categories: ['Fantasy', 'Adventure'],
      copiesCount: 5,
    },
    {
      title: 'A Game of Thrones',
      subtitle: 'Book 1 of A Song of Ice and Fire',
      description:
        'Political intrigue and fantasy in the Seven Kingdoms of Westeros.',
      isbn: '978-0-553-10354-0',
      publicationYear: 1996,
      language: 'English',
      coverImageUrl:
        'https://covers.openlibrary.org/b/isbn/9780553103540-L.jpg',
      authors: ['George R.R. Martin'],
      categories: ['Fantasy', 'Adventure'],
      copiesCount: 3,
    },
    {
      title: 'Sapiens: A Brief History of Humankind',
      subtitle: null,
      description:
        'Explores the history of humanity from the Stone Age to the modern age.',
      isbn: '978-0-062-31609-7',
      publicationYear: 2011,
      language: 'English',
      coverImageUrl:
        'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg',
      authors: ['Yuval Noah Harari'],
      categories: ['Non-Fiction', 'Philosophy'],
      copiesCount: 4,
    },
    {
      title: 'Bumi Manusia',
      subtitle: 'Tetralogi Buru #1',
      description:
        'A story of Minke, a native youth and part of the Javanese elite.',
      isbn: '978-979-461-228-4',
      publicationYear: 1980,
      language: 'Indonesian',
      coverImageUrl: null,
      authors: ['Pramoedya Ananta Toer'],
      categories: ['Historical Fiction', 'Indonesian Literature'],
      copiesCount: 4,
    },
    {
      title: 'Laskar Pelangi',
      subtitle: null,
      description:
        'The inspiring story of ten schoolchildren and two teachers in a poor village.',
      isbn: '978-979-22-3896-4',
      publicationYear: 2005,
      language: 'Indonesian',
      coverImageUrl: null,
      authors: ['Andrea Hirata'],
      categories: ['Indonesian Literature', 'Biography'],
      copiesCount: 5,
    },
    {
      title: 'The Da Vinci Code',
      subtitle: null,
      description:
        'A murder in the Louvre Museum leads to a trail of clues hidden in art.',
      isbn: '978-0-385-50420-1',
      publicationYear: 2003,
      language: 'English',
      coverImageUrl:
        'https://covers.openlibrary.org/b/isbn/9780385504201-L.jpg',
      authors: ['Dan Brown'],
      categories: ['Mystery', 'Adventure'],
      copiesCount: 3,
    },
    {
      title: 'Pulang',
      subtitle: null,
      description:
        'A story about a man who returns home after years of wandering.',
      isbn: '978-602-03-0416-2',
      publicationYear: 2015,
      language: 'Indonesian',
      coverImageUrl: null,
      authors: ['Tere Liye'],
      categories: ['Indonesian Literature', 'Adventure'],
      copiesCount: 4,
    },
    {
      title: 'Murder on the Orient Express',
      subtitle: 'A Hercule Poirot Mystery',
      description:
        'Detective Hercule Poirot investigates a murder aboard a luxurious train.',
      isbn: '978-0-062-07348-5',
      publicationYear: 1934,
      language: 'English',
      coverImageUrl:
        'https://covers.openlibrary.org/b/isbn/9780062073488-L.jpg',
      authors: ['Agatha Christie'],
      categories: ['Mystery'],
      copiesCount: 3,
    },
    {
      title: 'Norwegian Wood',
      subtitle: null,
      description:
        'A nostalgic story of loss and burgeoning sexuality in 1960s Tokyo.',
      isbn: '978-0-375-70461-8',
      publicationYear: 1987,
      language: 'English',
      coverImageUrl:
        'https://covers.openlibrary.org/b/isbn/9780375704611-L.jpg',
      authors: ['Haruki Murakami'],
      categories: ['Romance', 'Historical Fiction'],
      copiesCount: 2,
    },
    {
      title: 'The Alchemist',
      subtitle: null,
      description:
        'A shepherd boy embarks on a journey to realize his personal legend.',
      isbn: '978-0-061-12241-5',
      publicationYear: 1988,
      language: 'English',
      coverImageUrl:
        'https://covers.openlibrary.org/b/isbn/9780061122415-L.jpg',
      authors: ['Paulo Coelho'],
      categories: ['Philosophy', 'Adventure'],
      copiesCount: 4,
    },
    {
      title: 'Harry Potter and the Chamber of Secrets',
      subtitle: 'Book 2 of the Harry Potter Series',
      description:
        'Harry returns to Hogwarts and discovers a mysterious chamber has been opened.',
      isbn: '978-0-439-06486-3',
      publicationYear: 1998,
      language: 'English',
      coverImageUrl:
        'https://covers.openlibrary.org/b/isbn/9780439064873-L.jpg',
      authors: ['J.K. Rowling'],
      categories: ['Fantasy', 'Adventure'],
      copiesCount: 5,
    },
    {
      title: 'A Clash of Kings',
      subtitle: 'Book 2 of A Song of Ice and Fire',
      description: 'The War of the Five Kings escalates in Westeros.',
      isbn: '978-0-553-10803-3',
      publicationYear: 1999,
      language: 'English',
      coverImageUrl:
        'https://covers.openlibrary.org/b/isbn/9780553108033-L.jpg',
      authors: ['George R.R. Martin'],
      categories: ['Fantasy', 'Adventure'],
      copiesCount: 3,
    },
    {
      title: 'Homo Deus: A Brief History of Tomorrow',
      subtitle: null,
      description:
        'Explores the future of humanity and what may replace Homo sapiens.',
      isbn: '978-1-910-70183-2',
      publicationYear: 2015,
      language: 'English',
      coverImageUrl:
        'https://covers.openlibrary.org/b/isbn/9781910701836-L.jpg',
      authors: ['Yuval Noah Harari'],
      categories: ['Non-Fiction', 'Philosophy'],
      copiesCount: 3,
    },
    {
      title: 'Anak Semua Bangsa',
      subtitle: 'Tetralogi Buru #2',
      description: 'The second book in the Buru Quartet series.',
      isbn: '978-979-461-229-1',
      publicationYear: 1980,
      language: 'Indonesian',
      coverImageUrl: null,
      authors: ['Pramoedya Ananta Toer'],
      categories: ['Historical Fiction', 'Indonesian Literature'],
      copiesCount: 3,
    },
    {
      title: 'Sang Pemimpi',
      subtitle: 'The Dreamer Trilogy #2',
      description:
        'The story continues with dreams and aspirations of young students.',
      isbn: '978-979-22-4280-0',
      publicationYear: 2006,
      language: 'Indonesian',
      coverImageUrl: null,
      authors: ['Andrea Hirata'],
      categories: ['Indonesian Literature', 'Biography'],
      copiesCount: 4,
    },
    {
      title: 'Angels & Demons',
      subtitle: null,
      description:
        'Robert Langdon races to prevent a terrorist act at the Vatican.',
      isbn: '978-0-671-02735-7',
      publicationYear: 2000,
      language: 'English',
      coverImageUrl:
        'https://covers.openlibrary.org/b/isbn/9780671027360-L.jpg',
      authors: ['Dan Brown'],
      categories: ['Mystery', 'Adventure'],
      copiesCount: 3,
    },
    {
      title: 'Hujan',
      subtitle: null,
      description: 'A tale of love, hope, and redemption in a small town.',
      isbn: '978-602-06-0062-7',
      publicationYear: 2016,
      language: 'Indonesian',
      coverImageUrl: null,
      authors: ['Tere Liye'],
      categories: ['Indonesian Literature', 'Romance'],
      copiesCount: 3,
    },
    {
      title: 'And Then There Were None',
      subtitle: null,
      description:
        'Ten strangers are invited to an island, where they are murdered one by one.',
      isbn: '978-0-062-07349-2',
      publicationYear: 1939,
      language: 'English',
      coverImageUrl:
        'https://covers.openlibrary.org/b/isbn/9780062073495-L.jpg',
      authors: ['Agatha Christie'],
      categories: ['Mystery'],
      copiesCount: 2,
    },
    {
      title: 'Kafka on the Shore',
      subtitle: null,
      description:
        'A surreal and metaphysical tale of a teenage runaway and an aging simpleton.',
      isbn: '978-1-400-07927-6',
      publicationYear: 2002,
      language: 'English',
      coverImageUrl:
        'https://covers.openlibrary.org/b/isbn/9781400079278-L.jpg',
      authors: ['Haruki Murakami'],
      categories: ['Fantasy', 'Philosophy'],
      copiesCount: 2,
    },
    {
      title: 'Eleven Minutes',
      subtitle: null,
      description:
        "A young Brazilian woman's journey of self-discovery through love.",
      isbn: '978-0-060-58927-0',
      publicationYear: 2003,
      language: 'English',
      coverImageUrl:
        'https://covers.openlibrary.org/b/isbn/9780060589271-L.jpg',
      authors: ['Paulo Coelho'],
      categories: ['Romance', 'Philosophy'],
      copiesCount: 3,
    },
    {
      title: 'Harry Potter and the Prisoner of Azkaban',
      subtitle: 'Book 3 of the Harry Potter Series',
      description:
        "Harry learns about his parents' past and confronts a dangerous escaped convict.",
      isbn: '978-0-439-13635-8',
      publicationYear: 1999,
      language: 'English',
      coverImageUrl:
        'https://covers.openlibrary.org/b/isbn/9780439136358-L.jpg',
      authors: ['J.K. Rowling'],
      categories: ['Fantasy', 'Adventure'],
      copiesCount: 4,
    },
    {
      title: 'A Storm of Swords',
      subtitle: 'Book 3 of A Song of Ice and Fire',
      description:
        'The war in Westeros reaches new heights as winter approaches.',
      isbn: '978-0-553-10663-3',
      publicationYear: 2000,
      language: 'English',
      coverImageUrl:
        'https://covers.openlibrary.org/b/isbn/9780553106633-L.jpg',
      authors: ['George R.R. Martin'],
      categories: ['Fantasy', 'Adventure'],
      copiesCount: 3,
    },
    {
      title: '21 Lessons for the 21st Century',
      subtitle: null,
      description: 'Explores the present and immediate future of humankind.',
      isbn: '978-1-787-33003-6',
      publicationYear: 2018,
      language: 'English',
      coverImageUrl:
        'https://covers.openlibrary.org/b/isbn/9781787330030-L.jpg',
      authors: ['Yuval Noah Harari'],
      categories: ['Non-Fiction', 'Philosophy'],
      copiesCount: 3,
    },
    {
      title: 'Jejak Langkah',
      subtitle: 'Tetralogi Buru #3',
      description: 'The third book in the Buru Quartet series.',
      isbn: '978-979-461-230-7',
      publicationYear: 1985,
      language: 'Indonesian',
      coverImageUrl: null,
      authors: ['Pramoedya Ananta Toer'],
      categories: ['Historical Fiction', 'Indonesian Literature'],
      copiesCount: 3,
    },
    {
      title: 'Edensor',
      subtitle: 'The Dreamer Trilogy #3',
      description: 'The concluding story of the Laskar Pelangi trilogy.',
      isbn: '978-979-22-4281-7',
      publicationYear: 2007,
      language: 'Indonesian',
      coverImageUrl: null,
      authors: ['Andrea Hirata'],
      categories: ['Indonesian Literature', 'Biography'],
      copiesCount: 3,
    },
  ];

  for (const bookData of booksData) {
    const existing = await prisma.book.findUnique({
      where: { isbn: bookData.isbn },
    });

    if (!existing) {
      // Create book with authors and categories
      const book = await prisma.book.create({
        data: {
          title: bookData.title,
          subtitle: bookData.subtitle,
          description: bookData.description,
          isbn: bookData.isbn,
          publicationYear: bookData.publicationYear,
          language: bookData.language,
          coverImageUrl: bookData.coverImageUrl,
          status: BookStatus.ACTIVE,
          bookAuthors: {
            create: bookData.authors.map((authorName) => ({
              authorId: authorMap[authorName],
            })),
          },
          bookCategories: {
            create: bookData.categories.map((categoryName) => ({
              categoryId: categoryMap[categoryName],
            })),
          },
        },
      });

      // Create book copies
      const isbnWithoutDashes = bookData.isbn.replace(/-/g, '');
      const copies = [];

      for (let i = 1; i <= bookData.copiesCount; i++) {
        const code = `${isbnWithoutDashes}-${String(i).padStart(4, '0')}`;
        copies.push({
          bookId: book.id,
          code,
          status: CopyStatus.AVAILABLE,
          locationCode: 'SHELF-A',
        });
      }

      await prisma.bookCopy.createMany({
        data: copies,
      });

      console.log(
        `  ✅ Created book: ${bookData.title} (${bookData.copiesCount} copies)`,
      );
    } else {
      console.log(`  ⏭️  Book already exists: ${bookData.title}`);
    }
  }

  console.log('\n✨ Database seeding completed successfully!');
  console.log('\n📝 Default Credentials:');
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`   Member: ${memberEmail} / ${memberPassword}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
