import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NombaService } from './nomba.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [NombaService],
  exports: [NombaService], // Important: Export so other modules can use it
})
export class NombaModule {}
