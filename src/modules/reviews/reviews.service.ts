import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(customerId: string, bookingId: string, dto: CreateReviewDto) {
    // Verify booking exists and belongs to customer + is completed
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { business: true, review: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== customerId) {
      throw new ForbiddenException('You can only review your own bookings');
    }
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('You can only review completed bookings');
    }
    if (booking.review) {
      throw new BadRequestException('You have already reviewed this booking');
    }

    return this.prisma.review.create({
      data: {
        bookingId,
        customerId,
        businessId: booking.businessId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async findByBusiness(businessId: string) {
    return this.prisma.review.findMany({
      where: { businessId },
      include: {
        customer: { select: { firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBusinessAverageRating(businessId: string) {
    const result = await this.prisma.review.aggregate({
      where: { businessId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      averageRating: result._avg.rating
        ? Number(result._avg.rating.toFixed(1))
        : 0,
      totalReviews: result._count.rating,
    };
  }
}
