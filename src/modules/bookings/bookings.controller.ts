import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CancelBookingDto } from './dto/cancel-booking.dto';

@Controller({ path: 'bookings', version: '1' })
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMyBookings(@Req() req) {
    return this.bookingsService.findMyBookings(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Get('business')
  findBusinessBookings(@Req() req) {
    return this.bookingsService.findBusinessBookings(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Patch(':id/status')
  updateStatus(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancelBooking(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(id, req.user.userId, dto);
  }
}
