import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { RawBodyMiddleware } from '../../common/middleware/raw-body.middleware';

@Module({
  imports: [PrismaModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RawBodyMiddleware).forRoutes('v1/webhooks/nomba');
  }
}
