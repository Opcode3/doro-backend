import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VirtualAccountsService {
  constructor(private prisma: PrismaService) {}

  async createForUser(userId: string, nombaData: any) {
    return this.prisma.virtualAccount.create({
      data: {
        userId,
        nombaAccountRef: nombaData.accountRef,
        bankAccountNumber: nombaData.bankAccountNumber,
        bankAccountName: nombaData.bankAccountName,
        bankName: nombaData.bankName,
        accountHolderId: nombaData.accountHolderId,
        accountName: nombaData.accountName,
        currency: nombaData.currency || 'NGN',
        bvn: nombaData.bvn,
        expired: nombaData.expired || false,
      },
    });
  }

  async findByUserId(userId: string) {
    const va = await this.prisma.virtualAccount.findUnique({
      where: { userId },
      include: {
        user: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

    if (!va) {
      throw new NotFoundException('Virtual account not found');
    }

    return va;
  }

  async findByAccountRef(accountRef: string) {
    return this.prisma.virtualAccount.findUnique({
      where: { nombaAccountRef: accountRef },
    });
  }
}
