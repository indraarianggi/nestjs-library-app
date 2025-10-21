import { Module } from '@nestjs/common';
import { LoansController } from './loans.controller';
import { MyLoansController } from './my-loans.controller';
import { LoansService } from './loans.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LoansController, MyLoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}
