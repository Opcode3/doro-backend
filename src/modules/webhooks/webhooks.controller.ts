import { Controller, Post, Body, Headers, Req, HttpCode } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import type { Request } from 'express';

@Controller({ path: 'webhooks', version: '1' })
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Post('nomba')
  @HttpCode(200)
  async handleNombaWebhook(
    @Req() req: Request,
    @Headers('nomba-signature') signature: string,
  ) {
    const success = await this.webhooksService.handleNombaWebhook(
      req.body as Buffer, // raw body
      signature,
    );

    return { received: success };
  }
}
