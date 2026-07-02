import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { NombaModule } from './integrations/nomba/nomba.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { ServicesModule } from './modules/services/services.module';
import { VirtualAccountsModule } from './modules/virtual-accounts/virtual-accounts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    NombaModule,
    AuthModule,
    BusinessesModule,
    ServicesModule,
    VirtualAccountsModule,

    // Other modules will be added here
  ],
})
export class AppModule {}
