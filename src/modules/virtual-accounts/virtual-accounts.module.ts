import { Module } from '@nestjs/common';
import { VirtualAccountsService } from './virtual-accounts.service';
import { VirtualAccountsController } from './virtual-accounts.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [VirtualAccountsController],
  providers: [VirtualAccountsService],
  exports: [VirtualAccountsService],
})
export class VirtualAccountsModule {}
