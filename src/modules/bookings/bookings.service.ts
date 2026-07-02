import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NombaService } from '../../integrations/nomba/nomba.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private nombaService: NombaService,
  ) {}

  async create(customerId: string, dto: CreateBookingDto) {
    // Validate service and get business
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
      include: { business: true },
    });

    if (!service || !service.isActive) {
      throw new NotFoundException('Service not found or unavailable');
    }

    const bookingTime = new Date(dto.scheduledAt);
    if (bookingTime < new Date()) {
      throw new BadRequestException('Booking date cannot be in the past');
    }

    // Create Nomba Checkout
    let checkoutResponse;
    try {
      checkoutResponse = await this.nombaService.post('/checkout/orders', {
        amount: Number(dto.totalAmount),
        reference: `doro_booking_${Date.now()}`,
        description: `Booking for ${service.name}`,
        customer: {
          name: 'Doro Customer', // You can fetch real customer name
        },
      });
    } catch (error) {
      throw new BadRequestException('Payment initialization failed');
    }

    // Create Booking
    const booking = await this.prisma.booking.create({
      data: {
        customerId,
        businessId: service.businessId,
        serviceId: dto.serviceId,
        scheduledAt: bookingTime,
        totalAmount: dto.totalAmount,
        nombaCheckoutId: checkoutResponse.data?.id || checkoutResponse.id,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
      include: {
        service: true,
        business: { select: { name: true } },
      },
    });

    return {
      booking,
      checkout: checkoutResponse.data || checkoutResponse,
      checkoutUrl: checkoutResponse.data?.checkoutUrl, // Adjust based on actual Nomba response
    };
  }

  async findMyBookings(customerId: string) {
    return this.prisma.booking.findMany({
      where: { customerId },
      include: {
        service: true,
        business: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBusinessBookings(businessOwnerId: string) {
    return this.prisma.booking.findMany({
      where: {
        business: { ownerId: businessOwnerId },
      },
      include: {
        customer: { select: { firstName: true, lastName: true, phone: true } },
        service: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    bookingId: string,
    businessOwnerId: string,
    dto: UpdateBookingStatusDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { business: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.business.ownerId !== businessOwnerId) {
      throw new ForbiddenException(
        'You can only update bookings for your business',
      );
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: dto.status },
    });
  }

  async cancelBooking(
    bookingId: string,
    customerId: string,
    dto?: CancelBookingDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== customerId) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      throw new BadRequestException(
        `Booking cannot be cancelled. Current status: ${booking.status}`,
      );
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        // You can store reason in a separate field if you add it to schema
      },
      include: {
        service: true,
        business: true,
      },
    });
  }
}
