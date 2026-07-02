import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import { BookingStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Verify Nomba Webhook Signature
   */
  verifySignature(signature: string, body: Buffer, secret: string): boolean {
    try {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected),
      );
    } catch (error) {
      this.logger.error('Signature verification failed', error);
      return false;
    }
  }

  /**
   * Main Webhook Handler with Idempotency
   */
  async handleNombaWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<boolean> {
    const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET;

    if (!webhookSecret) {
      this.logger.error('NOMBA_WEBHOOK_SECRET not configured');
      return false;
    }

    if (!this.verifySignature(signature, rawBody, webhookSecret)) {
      this.logger.warn('Invalid Nomba webhook signature');
      return false;
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString());
    } catch (error) {
      this.logger.error('Invalid JSON in webhook payload');
      return false;
    }

    const event = payload.event_type || payload.event;
    const requestId = payload.requestId;

    if (!requestId) {
      this.logger.warn(
        'Webhook missing requestId - skipping idempotency check',
      );
    } else {
      // Idempotency Check
      const existing = await this.prisma.webhookLog.findUnique({
        where: { requestId },
      });

      if (existing) {
        this.logger.log(`Webhook already processed (idempotent): ${requestId}`);
        return true;
      }

      // Create log entry before processing
      await this.prisma.webhookLog.create({
        data: {
          requestId,
          event,
          payload: payload as any,
          status: 'PROCESSING',
        },
      });
    }

    this.logger.log(
      `Processing Nomba webhook: ${event} | RequestID: ${requestId}`,
    );

    try {
      switch (event) {
        case 'payment_success':
          await this.handlePaymentSuccess(payload.data, requestId);
          break;

        case 'payment_failed':
          await this.handlePaymentFailed(payload.data, requestId);
          break;

        case 'payout_success':
          await this.handlePayoutSuccess(payload.data, requestId);
          break;

        case 'payout_failed':
          await this.handlePayoutFailed(payload.data, requestId);
          break;

        case 'payout_refund':
          await this.handlePayoutRefund(payload.data, requestId);
          break;

        case 'payment_reversal':
          await this.handlePaymentReversal(payload.data, requestId);
          break;

        default:
          this.logger.warn(`Unhandled Nomba event: ${event}`);
      }

      // Mark as successful
      if (requestId) {
        await this.prisma.webhookLog.update({
          where: { requestId },
          data: { status: 'SUCCESS' },
        });
      }
    } catch (error) {
      this.logger.error(`Error processing webhook ${requestId}`, error);

      if (requestId) {
        await this.prisma.webhookLog.update({
          where: { requestId },
          data: { status: 'FAILED' },
        });
      }
    }

    return true;
  }

  // ====================== EVENT HANDLERS ======================

  private async handlePaymentSuccess(data: any, requestId?: string) {
    const tx = data.transaction;
    this.logger.log(
      `Payment Success - Amount: ${tx?.transactionAmount}, Ref: ${tx?.transactionId}`,
    );

    if (!tx) return;

    await this.prisma.booking.updateMany({
      where: {
        nombaCheckoutId: tx.transactionId || tx.merchantTxRef || tx.sessionId,
      },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: BookingStatus.CONFIRMED,
      },
    });
  }

  private async handlePaymentFailed(data: any, requestId?: string) {
    const tx = data.transaction;
    this.logger.warn(
      `Payment Failed - Reason: ${tx?.responseCodeMessage || 'Unknown'}`,
    );

    if (!tx) return;

    await this.prisma.booking.updateMany({
      where: { nombaCheckoutId: tx.transactionId },
      data: { paymentStatus: PaymentStatus.FAILED },
    });
  }

  private async handlePayoutSuccess(data: any, requestId?: string) {
    const tx = data.transaction;
    this.logger.log(
      `Payout Success - Amount: ${tx?.transactionAmount}, Ref: ${tx?.transactionId}`,
    );
    // Add your payout logic here (e.g., update wallet, notify user)
  }

  private async handlePayoutFailed(data: any, requestId?: string) {
    const tx = data.transaction;
    this.logger.warn(`Payout Failed - Ref: ${tx?.transactionId}`);
  }

  private async handlePayoutRefund(data: any, requestId?: string) {
    const tx = data.transaction;
    this.logger.log(
      `Payout Refunded - Amount: ${tx?.transactionAmount}, Ref: ${tx?.transactionId}`,
    );
  }

  private async handlePaymentReversal(data: any, requestId?: string) {
    const tx = data.transaction;
    this.logger.warn(`Payment Reversed - Ref: ${tx?.transactionId}`);
  }
}
