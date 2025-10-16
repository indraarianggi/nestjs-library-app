import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');

    // Enable query logging in development mode
    const logConfig =
      nodeEnv === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'];

    super({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      log: logConfig as any,
      errorFormat: 'pretty',
    });
  }

  /**
   * Connect to the database when the module initializes
   */
  async onModuleInit() {
    try {
      this.logger.log('Connecting to database...');
      await this.$connect();
      this.logger.log('✅ Successfully connected to database');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw error;
    }
  }

  /**
   * Disconnect from the database when the module is destroyed
   */
  async onModuleDestroy() {
    try {
      this.logger.log('Disconnecting from database...');
      await this.$disconnect();
      this.logger.log('✅ Successfully disconnected from database');
    } catch (error) {
      this.logger.error('❌ Failed to disconnect from database', error);
      throw error;
    }
  }

  /**
   * Enable shutdown hooks for graceful application termination
   * This ensures the database connection is properly closed when the app shuts down
   *
   * Note: Since Prisma 5.0.0, the 'beforeExit' hook is only for binary engine.
   * We rely on onModuleDestroy() for cleanup instead.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async enableShutdownHooks(app: any) {
    // Register process-level shutdown handlers
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.on('SIGINT', async () => {
      this.logger.log('Received SIGINT signal');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await app.close();
    });

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.on('SIGTERM', async () => {
      this.logger.log('Received SIGTERM signal');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await app.close();
    });
  }

  /**
   * Clean the database (useful for testing)
   * WARNING: This will delete all data!
   */
  async cleanDatabase() {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new Error('Cannot clean database in production environment');
    }

    this.logger.warn('🧹 Cleaning database...');

    // Delete in correct order to respect foreign key constraints
    const tablenames = [
      'audit_log',
      'loan',
      'book_copy',
      'book_category',
      'book_author',
      'book',
      'category',
      'author',
      'member_profile',
      'user',
      'setting',
    ];

    for (const tablename of tablenames) {
      try {
        await this.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
      } catch (error) {
        this.logger.error(`Failed to truncate ${tablename}:`, error);
      }
    }

    this.logger.log('✅ Database cleaned');
  }
}
